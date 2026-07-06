const DocumentPdfRepository = {
    colecao: "orcamentos_emitidos",
    chaveLocalPadrao: "vidracaria_documentos_pdf",
    chaveHistoricoPadrao: "vidracaria_historico_orcamentos",

    async salvar(documentoOuRegistro = {}, opcoes = {}) {
        const registro = this.normalizarRegistro(documentoOuRegistro, opcoes);

        if (!registro) {
            return {
                sucesso: false,
                registro: null,
                fonte: "indisponivel",
                erros: ["Documento PDF invalido para salvar."]
            };
        }

        this.salvarLocal(registro);

        if (!this.firestoreDisponivel()) {
            return {
                sucesso: true,
                registro,
                fonte: "local",
                offline: true,
                erros: []
            };
        }

        try {
            await db.collection(this.colecao)
                .doc(registro.id)
                .set({
                    ...registro,
                    atualizadoEmISO: new Date().toISOString()
                }, { merge: true });

            return {
                sucesso: true,
                registro,
                fonte: "firestore",
                offline: false,
                erros: []
            };
        } catch (erro) {
            console.error("Erro ao salvar documento PDF no Firestore:", erro);
            return {
                sucesso: true,
                registro,
                fonte: "local",
                offline: true,
                erros: [erro.message || "Documento salvo localmente."]
            };
        }
    },

    async buscar(filtros = {}) {
        const filtrosNormalizados = this.normalizarFiltros(filtros);

        if (this.firestoreDisponivel()) {
            const remoto = await this.buscarFirestore(filtrosNormalizados);

            if (remoto.sucesso) {
                const registros = this.filtrarRegistros(remoto.registros, filtrosNormalizados);
                registros.forEach(registro => this.salvarLocal(registro));

                return {
                    sucesso: true,
                    registros,
                    fonte: "firestore",
                    filtros: filtrosNormalizados,
                    erros: []
                };
            }
        }

        const locais = this.filtrarRegistros(this.listarLocal(), filtrosNormalizados);

        return {
            sucesso: true,
            registros: locais,
            fonte: "local",
            filtros: filtrosNormalizados,
            erros: []
        };
    },

    async buscarFirestore(filtros = {}) {
        try {
            if (filtros.numero) {
                const direto = await db.collection(this.colecao).doc(this.idDocumento(filtros.numero)).get();
                const registrosDiretos = direto.exists ? [this.normalizarRegistro({ ...direto.data(), id: direto.id })] : [];

                if (registrosDiretos.length) {
                    return {
                        sucesso: true,
                        registros: registrosDiretos,
                        erros: []
                    };
                }

                const consultaNumero = await db.collection(this.colecao)
                    .where("numero", "==", filtros.numero)
                    .limit(20)
                    .get();

                return {
                    sucesso: true,
                    registros: this.normalizarSnapshot(consultaNumero),
                    erros: []
                };
            }

            if (filtros.data) {
                const consultaData = await db.collection(this.colecao)
                    .where("dataEmissao", "==", filtros.data)
                    .limit(40)
                    .get();

                return {
                    sucesso: true,
                    registros: this.normalizarSnapshot(consultaData),
                    erros: []
                };
            }

            if (filtros.clienteBusca) {
                const fim = `${filtros.clienteBusca}\uf8ff`;
                const consultaCliente = await db.collection(this.colecao)
                    .where("clienteNomeBusca", ">=", filtros.clienteBusca)
                    .where("clienteNomeBusca", "<=", fim)
                    .limit(40)
                    .get();

                return {
                    sucesso: true,
                    registros: this.normalizarSnapshot(consultaCliente),
                    erros: []
                };
            }

            const recentes = await db.collection(this.colecao)
                .orderBy("dataEmissao", "desc")
                .limit(40)
                .get();

            return {
                sucesso: true,
                registros: this.normalizarSnapshot(recentes),
                erros: []
            };
        } catch (erro) {
            console.error("Erro ao buscar documentos PDF no Firestore:", erro);
            return {
                sucesso: false,
                registros: [],
                erros: [erro.message || "Nao foi possivel buscar no Firestore."]
            };
        }
    },

    normalizarSnapshot(snapshot) {
        if (!snapshot || !snapshot.docs) {
            return [];
        }

        return snapshot.docs
            .map(doc => this.normalizarRegistro({ ...doc.data(), id: doc.id }))
            .filter(Boolean);
    },

    salvarLocal(registro = {}) {
        const normalizado = this.normalizarRegistro(registro);

        if (!normalizado || typeof Storage === "undefined") {
            return false;
        }

        const chaves = this.chavesLocais();
        const lista = this.mesclarLista(Storage.carregar(chaves.principal, []), normalizado);
        Storage.salvar(chaves.principal, lista);

        const historico = this.mesclarLista(Storage.carregar(chaves.historico, []), normalizado);
        Storage.salvar(chaves.historico, historico);

        return true;
    },

    listarLocal() {
        if (typeof Storage === "undefined") {
            return [];
        }

        const chaves = this.chavesLocais();
        const principal = Storage.carregar(chaves.principal, []) || [];
        const historico = Storage.carregar(chaves.historico, []) || [];

        return this.mesclarListas(principal, historico)
            .map(registro => this.normalizarRegistro(registro))
            .filter(Boolean);
    },

    filtrarRegistros(registros = [], filtros = {}) {
        const unicos = this.mesclarListas(registros);

        return unicos
            .filter(registro => {
                if (filtros.numero && String(registro.numero || "") !== filtros.numero) {
                    return false;
                }

                if (filtros.data && registro.dataEmissao !== filtros.data) {
                    return false;
                }

                if (filtros.clienteBusca && !String(registro.clienteNomeBusca || "").includes(filtros.clienteBusca)) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => String(b.dataEmissao || "").localeCompare(String(a.dataEmissao || "")));
    },

    obterDocumento(registro = {}) {
        const normalizado = this.normalizarRegistro(registro);

        if (!normalizado) {
            return null;
        }

        if (normalizado.documento && normalizado.documento.tipo === "DOCUMENTO_COMERCIAL") {
            return normalizado.documento;
        }

        if (typeof DocumentModel !== "undefined" && typeof DocumentModel.criar === "function") {
            return this.criarDocumentoLegado(normalizado);
        }

        return normalizado.documento || null;
    },

    criarDocumentoLegado(registro = {}) {
        const cliente = registro.cliente || {};
        const obra = registro.obra || {};
        const totaisOrigem = registro.totais || {};
        const pagamento = registro.pagamento || {};
        const itens = Array.isArray(registro.itens) ? registro.itens : [];
        const totalGeral = this.primeiroNumero(totaisOrigem, ["totalGeral", "totalFinal", "total"], 0);

        const dadosDocumento = {
            empresa: registro.empresa || {},
            cliente,
            projeto: {
                id: registro.numero,
                numero: registro.numero,
                nome: registro.projetoNome || `Orcamento ${registro.numero || ""}`.trim(),
                endereco: obra.endereco || cliente.endereco || ""
            },
            servico: {
                id: "orcamento-legado",
                nome: this.descreverServicoLegado(itens),
                tipoCalculo: "orcamento_itens"
            },
            produtos: itens,
            totais: {
                subtotal: this.primeiroNumero(totaisOrigem, ["subtotal"], totalGeral),
                desconto: this.primeiroNumero(totaisOrigem, ["descontoTotal", "desconto"], 0),
                acrescimo: this.primeiroNumero(totaisOrigem, ["acrescimo"], 0),
                totalGeral,
                areaTotalM2: this.primeiroNumero(totaisOrigem, ["areaTotalM2", "areaTotal"], 0),
                moeda: "BRL"
            },
            observacoes: {
                livre: typeof registro.observacoes === "string" ? registro.observacoes : ""
            },
            condicoesComerciais: {
                formaPagamento: pagamento.forma || "",
                formaPagamentoComplemento: pagamento.observacoes || ""
            },
            validade: {
                data: registro.datas?.validade || "",
                descricao: registro.datas?.validade ? `Valido ate ${registro.datas.validade}` : ""
            },
            metadados: {
                origem: "NOVO_ORCAMENTO",
                status: "PREPARADO",
                criadoEm: registro.criadoEmISO || registro.dataEmissao,
                atualizadoEm: registro.atualizadoEmISO || registro.criadoEmISO || "",
                geradoEm: registro.criadoEmISO || registro.dataEmissao || new Date().toISOString()
            }
        };

        if (typeof DocumentBuilder !== "undefined" && typeof DocumentBuilder.montarDocumento === "function") {
            return DocumentBuilder.montarDocumento(dadosDocumento);
        }

        return DocumentModel.criar(dadosDocumento);
    },

    normalizarRegistro(entrada = {}, opcoes = {}) {
        if (!entrada || typeof entrada !== "object") {
            return null;
        }

        const documento = this.normalizarDocumento(entrada.documento || entrada.documentoComercial || (entrada.tipo === "DOCUMENTO_COMERCIAL" ? entrada : null));
        const dadosDocumento = documento?.dados || {};
        const cliente = entrada.cliente || dadosDocumento.cliente || {};
        const projeto = entrada.projeto || dadosDocumento.projeto || {};
        const metadados = dadosDocumento.metadados || documento?.metadados || entrada.metadados || {};
        const numero = this.texto(
            opcoes.numero
            || entrada.numero
            || metadados.numeroOrcamento
            || metadados.orcamentoNumero
            || projeto.numero
            || projeto.id
            || entrada.id
        );
        const dataEmissao = this.normalizarData(
            opcoes.dataEmissao
            || entrada.dataEmissao
            || entrada.criadoEmISO
            || entrada.criadoEm
            || metadados.geradoEm
            || metadados.criadoEm
            || entrada.datas?.criacao
        );
        const clienteNome = this.texto(opcoes.clienteNome || entrada.clienteNome || cliente.nome || entrada.nomeCliente);
        const id = this.idDocumento(opcoes.id || numero || entrada.id || `${clienteNome}-${dataEmissao}-${projeto.nome || projeto.numero || ""}`);
        const nomeArquivo = this.texto(
            opcoes.nomeArquivo
            || entrada.nomeArquivo
            || (typeof PdfAdapter !== "undefined" && documento ? PdfAdapter.montarNomeArquivo(documento) : "")
            || this.montarNomeArquivo(numero || id)
        );

        return {
            ...entrada,
            id,
            numero,
            cliente,
            clienteNome,
            clienteNomeBusca: this.normalizarBusca(clienteNome),
            dataEmissao,
            nomeArquivo,
            documento,
            pdfArmazenado: false,
            armazenamento: "documento_regeneravel",
            schemaVersion: 2,
            origem: opcoes.origem || entrada.origem || metadados.origem || "DOCUMENTO_COMERCIAL",
            criadoEmISO: entrada.criadoEmISO || metadados.geradoEm || metadados.criadoEm || new Date().toISOString(),
            atualizadoEmISO: new Date().toISOString()
        };
    },

    normalizarDocumento(documento = null) {
        if (!documento || typeof documento !== "object") {
            return null;
        }

        if (documento.tipo === "DOCUMENTO_COMERCIAL") {
            if (documento.dados && documento.secoes) {
                return documento;
            }

            if (typeof DocumentBuilder !== "undefined" && typeof DocumentBuilder.montarDocumento === "function") {
                return DocumentBuilder.montarDocumento(documento.dados || documento);
            }

            return documento;
        }

        if (documento.documento && documento.documento.tipo === "DOCUMENTO_COMERCIAL") {
            return documento.documento;
        }

        return null;
    },

    normalizarFiltros(filtros = {}) {
        const numero = this.texto(filtros.numero || filtros.numeroOrcamento).replace(/\s+/g, "");
        const data = this.normalizarData(filtros.data || filtros.dataEmissao || filtros.criadoEm);
        const cliente = this.texto(filtros.cliente || filtros.clienteNome);

        return {
            numero,
            data,
            cliente,
            clienteBusca: this.normalizarBusca(cliente)
        };
    },

    mesclarLista(lista = [], registro = {}) {
        return this.mesclarListas(lista, [registro]);
    },

    mesclarListas(...listas) {
        const mapa = new Map();

        listas.flat().forEach(item => {
            const registro = this.normalizarRegistro(item);

            if (!registro) {
                return;
            }

            const chave = registro.numero || registro.id;
            mapa.set(chave, {
                ...(mapa.get(chave) || {}),
                ...registro
            });
        });

        return Array.from(mapa.values());
    },

    chavesLocais() {
        const storage = typeof Config !== "undefined" ? Config.storage || {} : {};

        return {
            principal: storage.documentosPdf || this.chaveLocalPadrao,
            historico: storage.historicoOrcamentos || this.chaveHistoricoPadrao
        };
    },

    firestoreDisponivel() {
        return typeof db !== "undefined"
            && !!db
            && (typeof navigator === "undefined" || navigator.onLine !== false);
    },

    idDocumento(valor) {
        const texto = this.texto(valor) || `pdf_${Date.now()}`;
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 120) || `pdf_${Date.now()}`;
    },

    montarNomeArquivo(numero) {
        return `RK-Vidracaria-${this.nomeArquivoSeguro(numero)}.pdf`;
    },

    nomeArquivoSeguro(valor) {
        return this.texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "") || "documento";
    },

    normalizarBusca(valor) {
        return this.texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    },

    normalizarData(valor) {
        if (!valor) {
            return "";
        }

        const texto = String(valor).trim();

        if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
            return texto;
        }

        const data = new Date(texto);

        if (Number.isNaN(data.getTime())) {
            return "";
        }

        return data.toISOString().slice(0, 10);
    },

    descreverServicoLegado(itens = []) {
        const primeiro = Array.isArray(itens) ? itens.find(Boolean) || {} : {};
        return primeiro.categoria || primeiro.tipoVidro || primeiro.descricao || "Orcamento de vidracaria";
    },

    primeiroNumero(objeto = {}, chaves = [], padrao = 0) {
        const chave = chaves.find(nome => objeto[nome] !== undefined && objeto[nome] !== null && objeto[nome] !== "");

        if (!chave) {
            return padrao;
        }

        const numero = Number(String(objeto[chave]).replace(",", "."));
        return Number.isFinite(numero) ? numero : padrao;
    },

    texto(valor) {
        return String(valor === undefined || valor === null ? "" : valor).trim();
    }
};
