const DocumentPdfRepository = {
    colecao: "orcamentos_emitidos",

    async salvar(documentoOuRegistro = {}, opcoes = {}) {
        const registroBase = this.normalizarRegistro(documentoOuRegistro, opcoes);

        if (!registroBase) {
            return {
                sucesso: false,
                registro: null,
                fonte: "firestore",
                erros: ["Documento PDF invalido para salvar."]
            };
        }

        const registro = typeof OrcamentoAprovacaoModel !== "undefined"
            ? OrcamentoAprovacaoModel.normalizarRegistro({ ...registroBase, status: registroBase.status || "emitido" })
            : registroBase;

        if (!this.firestoreDisponivel()) {
            return {
                sucesso: false,
                registro,
                fonte: "firestore",
                offline: true,
                erros: ["Firestore indisponivel."]
            };
        }

        try {
            if (typeof OrcamentoAprovacaoService !== "undefined" && typeof OrcamentoAprovacaoService.registrarEmissao === "function") {
                const resultadoComercial = await OrcamentoAprovacaoService.registrarEmissao(registro, {
                    origem: opcoes.origem || "DOCUMENTO_COMERCIAL"
                });
                return {
                    sucesso: resultadoComercial.sucesso,
                    registro: resultadoComercial.registro || registro,
                    fonte: "firestore",
                    offline: false,
                    erros: resultadoComercial.erros || []
                };
            }

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
                sucesso: false,
                registro,
                fonte: "firestore",
                offline: true,
                erros: [erro.message || "Nao foi possivel salvar no Firestore."]
            };
        }
    },

    async buscar(filtros = {}) {
        const filtrosNormalizados = this.normalizarFiltros(filtros);
        if (!this.firestoreDisponivel()) {
            return { sucesso: false, registros: [], fonte: "firestore", filtros: filtrosNormalizados, erros: ["Firestore indisponivel."] };
        }
        const remoto = await this.buscarFirestore(filtrosNormalizados);
        return {
            sucesso: remoto.sucesso,
            registros: this.filtrarRegistros(remoto.registros, filtrosNormalizados),
            fonte: "firestore",
            filtros: filtrosNormalizados,
            erros: remoto.erros || []
        };
    },

    async cancelar(registro = {}, opcoes = {}) {
        const id = registro.orcamentoId || registro.orcamento_id || registro.id || registro.numero;
        if (!id) throw new Error("Orcamento sem identificador para cancelamento.");
        if (!this.firestoreDisponivel()) throw new Error("Firestore indisponivel.");
        if (typeof OrcamentoAprovacaoService === "undefined" || typeof OrcamentoAprovacaoService.cancelar !== "function") {
            throw new Error("Servico comercial indisponivel para cancelar o orcamento.");
        }

        const resultado = await OrcamentoAprovacaoService.cancelar(id, {
            confirmado: true,
            observacao: opcoes.observacao || "Orcamento cancelado pelo arquivo comercial."
        });
        if (!resultado?.sucesso) {
            throw new Error(resultado?.erros?.join(" ") || "Nao foi possivel cancelar o orcamento.");
        }
        return resultado.registro;
    },

    async excluir(registro = {}, opcoes = {}) {
        return this.cancelar(registro, opcoes);
    },

    async buscarFirestore(filtros = {}) {
        try {
            if (filtros.clienteId) {
                const consultaClienteId = await db.collection(this.colecao)
                    .where("clienteId", "==", filtros.clienteId)
                    .limit(40)
                    .get();
                if (consultaClienteId.docs?.length) {
                    return {
                        sucesso: true,
                        registros: this.normalizarSnapshot(consultaClienteId),
                        erros: []
                    };
                }
            }

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

            let recentesOrdenados = [];
            try {
                const recentes = await db.collection(this.colecao)
                    .orderBy("dataEmissao", "desc")
                    .limit(40)
                    .get();
                recentesOrdenados = this.normalizarSnapshot(recentes);
            } catch (erroOrdenacao) {
                console.warn("Orcamentos antigos sem data ordenavel; usando leitura compativel.", erroOrdenacao);
            }
            const compativeis = await db.collection(this.colecao).limit(40).get();

            return {
                sucesso: true,
                registros: this.mesclarListas(recentesOrdenados, this.normalizarSnapshot(compativeis)),
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

                if (filtros.clienteId && String(registro.clienteId || registro.vinculos?.clienteId || "") !== filtros.clienteId) {
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
        const cliente = this.primeiroObjeto(entrada.cliente, entrada.registro?.cliente, dadosDocumento.cliente);
        const projeto = this.primeiroObjeto(entrada.projeto, entrada.registro?.projeto, dadosDocumento.projeto);
        const metadados = dadosDocumento.metadados || documento?.metadados || entrada.metadados || {};
        const numero = this.texto(
            opcoes.numero
            || entrada.numero
            || entrada.numero_orcamento
            || entrada.numeroOrcamento
            || entrada.registro?.numero
            || entrada.registro?.numero_orcamento
            || metadados.numeroOrcamento
            || metadados.orcamentoNumero
            || projeto.numero
            || projeto.id
            || entrada.id
        );
        const dataEmissao = this.normalizarData(
            opcoes.dataEmissao
            || entrada.dataEmissao
            || entrada.data_orcamento
            || entrada.registro?.dataEmissao
            || entrada.registro?.data_orcamento
            || entrada.criadoEmISO
            || entrada.criadoEm
            || metadados.geradoEm
            || metadados.criadoEm
            || entrada.datas?.criacao
        );
        const clienteNome = this.texto(opcoes.clienteNome || entrada.clienteNome || entrada.cliente_nome || cliente.nome || entrada.nomeCliente || entrada.registro?.clienteNome);
        const id = this.idDocumento(opcoes.id || numero || entrada.id || `${clienteNome}-${dataEmissao}-${projeto.nome || projeto.numero || ""}`);
        const nomeArquivo = this.texto(
            opcoes.nomeArquivo
            || entrada.nomeArquivo
            || (typeof PdfAdapter !== "undefined" && documento ? PdfAdapter.montarNomeArquivo(documento) : "")
            || this.montarNomeArquivo(numero || id)
        );

        const criadoEmISO = entrada.criadoEmISO
            || entrada.criado_em
            || metadados.geradoEm
            || metadados.criadoEm
            || (dataEmissao ? `${dataEmissao}T00:00:00.000Z` : "");
        const atualizadoEmISO = entrada.atualizadoEmISO
            || entrada.atualizado_em
            || metadados.atualizadoEm
            || criadoEmISO;
        const registro = {
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
            schemaVersion: Math.max(3, Number.parseInt(entrada.schemaVersion, 10) || 0),
            origem: opcoes.origem || entrada.origem || metadados.origem || "DOCUMENTO_COMERCIAL",
            criadoEmISO,
            atualizadoEmISO
        };

        return typeof OrcamentoAprovacaoModel !== "undefined"
            ? OrcamentoAprovacaoModel.normalizarRegistro(registro)
            : registro;
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

    primeiroObjeto(...valores) {
        return valores.find(valor => valor && typeof valor === "object" && Object.keys(valor).length) || {};
    },

    normalizarFiltros(filtros = {}) {
        const numero = this.texto(filtros.numero || filtros.numeroOrcamento).replace(/\s+/g, "");
        const data = this.normalizarData(filtros.data || filtros.dataEmissao || filtros.criadoEm);
        const cliente = this.texto(filtros.cliente || filtros.clienteNome);

        return {
            numero,
            data,
            cliente,
            clienteBusca: this.normalizarBusca(cliente),
            clienteId: this.texto(filtros.clienteId || filtros.cliente_id)
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

    firestoreDisponivel() {
        return typeof db !== "undefined"
            && !!db;
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
