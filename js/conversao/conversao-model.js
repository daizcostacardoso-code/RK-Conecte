const ConversaoModel = {
    tipo: "CONVERSAO_PROJETO",
    versao: "4.7",

    criar(dados = {}) {
        const documento = this.normalizarDocumento(dados.documento);
        const documentoOrigem = dados.documentoOrigem || this.criarDocumentoOrigem(documento);

        return {
            tipo: this.tipo,
            versao: this.versao,
            documento,
            documentoOrigem,
            projetoAtual: dados.projetoAtual || dados.projeto || null,
            dataConversao: this.texto(dados.dataConversao || this.agoraISO()),
            origem: this.texto(dados.origem || "DOCUMENTO_COMERCIAL_APROVADO"),
            convertido: !!dados.convertido,
            ultimaAcaoConversao: this.texto(dados.ultimaAcaoConversao || "Conversao preparada."),
            metadados: this.normalizarMetadados(dados.metadados)
        };
    },

    montarDadosProjeto(documento = {}, opcoes = {}) {
        const dados = documento?.dados || {};
        const cliente = dados.cliente || {};
        const projeto = dados.projeto || {};
        const servico = dados.servico || {};
        const produtos = Array.isArray(dados.produtos) ? dados.produtos : [];
        const totais = dados.totais || {};
        const resumoFinanceiro = dados.resumoFinanceiro || {};
        const observacoes = dados.observacoes || {};
        const documentoOrigem = this.criarDocumentoOrigem(documento);
        const totalGeral = this.numero(totais.totalGeral ?? resumoFinanceiro.totalGeral);
        const statusProjeto = this.obterStatusProjetoAprovado();

        return {
            origem: "documento_comercial",
            status: statusProjeto,
            etapaAtual: this.obterEtapaProjeto(statusProjeto),
            etapa: this.obterEtapaProjeto(statusProjeto),
            titulo: this.montarTitulo(cliente, projeto, servico),
            cliente: {
                id: this.texto(cliente.id),
                nome: this.texto(cliente.nome),
                telefone: this.texto(cliente.telefone),
                email: this.texto(cliente.email),
                documento: this.texto(cliente.documento),
                endereco: this.texto(cliente.endereco)
            },
            obra: {
                endereco: this.texto(projeto.endereco || cliente.endereco),
                observacoes: this.montarObservacoesObra(projeto, observacoes)
            },
            orcamento: {
                id: documentoOrigem.id,
                numero: documentoOrigem.numero,
                status: "aprovado",
                total: totalGeral
            },
            comercial: {
                responsavel: this.texto(projeto.responsavel || opcoes.usuario),
                vendedor: this.texto(projeto.responsavel || opcoes.usuario),
                canal: "documento_comercial",
                valorEstimado: totalGeral,
                valorFechado: totalGeral,
                observacoes: this.montarObservacoesComerciais(documentoOrigem, servico, observacoes)
            },
            financeiro: {
                status: "aguardando_pagamento",
                valorTotal: totalGeral,
                valorRecebido: 0,
                saldo: totalGeral,
                observacoes: "Financeiro preparado a partir de Documento Comercial aprovado."
            },
            datas: {
                aprovacao: this.texto(opcoes.dataAprovacao)
            },
            tags: ["documento_comercial", "convertido", "projeto_executivo"],
            usuario: opcoes.usuario || "Sistema"
        };
    },

    anexarOrigemProjeto(projeto = {}, documento = {}, dados = {}) {
        const documentoOrigem = dados.documentoOrigem || this.criarDocumentoOrigem(documento);
        const documentoDados = documento?.dados || {};
        const dataConversao = this.texto(dados.dataConversao || this.agoraISO());
        const projetoComOrigem = {
            ...projeto,
            documentoOrigem,
            conversao: {
                tipo: this.tipo,
                versao: this.versao,
                documentoOrigem,
                dataConversao,
                statusComercial: dados.statusComercial || "APROVADO"
            },
            servicos: this.normalizarServicos(documentoDados.servico),
            produtos: this.copiarLista(documentoDados.produtos),
            totais: this.copiarValor(documentoDados.totais || {}),
            observacoes: this.copiarValor(documentoDados.observacoes || {})
        };

        if (typeof ProjetoModel !== "undefined" && typeof ProjetoModel.adicionarEvento === "function") {
            return ProjetoModel.adicionarEvento(
                projetoComOrigem,
                "projeto_convertido",
                "Projeto convertido a partir de Documento Comercial aprovado",
                dados.usuario || "Sistema",
                {
                    documentoOrigem,
                    dataConversao
                }
            );
        }

        return projetoComOrigem;
    },

    criarDocumentoOrigem(documento = {}) {
        const dados = documento?.dados || {};
        const projeto = dados.projeto || {};
        const cliente = dados.cliente || {};
        const metadados = documento?.metadados || dados.metadados || {};
        const id = this.texto(
            documento?.id ||
            documento?.documentoId ||
            metadados.id ||
            projeto.numero ||
            projeto.id ||
            `${cliente.nome || "cliente"}-${metadados.geradoEm || ""}`
        );

        return {
            id: this.slug(id),
            tipo: this.texto(documento?.tipo || "DOCUMENTO_COMERCIAL"),
            versao: this.texto(documento?.versao || ""),
            numero: this.texto(projeto.numero || projeto.id || this.slug(id)),
            clienteId: this.texto(cliente.id),
            clienteNome: this.texto(cliente.nome),
            projetoId: this.texto(projeto.id),
            projetoNome: this.texto(projeto.nome || projeto.numero),
            geradoEm: this.texto(metadados.geradoEm),
            origem: this.texto(metadados.origem || "DOCUMENTO_COMERCIAL")
        };
    },

    normalizarServicos(servico = {}) {
        if (!servico || typeof servico !== "object") {
            return [];
        }

        return [this.copiarValor(servico)];
    },

    montarTitulo(cliente = {}, projeto = {}, servico = {}) {
        const partes = [
            projeto.nome || projeto.numero,
            cliente.nome,
            servico.nome
        ].filter(Boolean);

        return partes.length ? partes.join(" - ") : "Projeto Executivo";
    },

    montarObservacoesObra(projeto = {}, observacoes = {}) {
        return [
            projeto.observacoes,
            observacoes.tecnicas
        ].filter(Boolean).join(" | ");
    },

    montarObservacoesComerciais(documentoOrigem = {}, servico = {}, observacoes = {}) {
        return [
            `Origem Documento Comercial: ${documentoOrigem.id || documentoOrigem.numero || "sem-id"}`,
            servico.nome ? `Servico: ${servico.nome}` : "",
            observacoes.comerciais,
            observacoes.livre
        ].filter(Boolean).join(" | ");
    },

    normalizarMetadados(metadados = {}) {
        return {
            origem: this.texto(metadados.origem || "APROVACAO_COMERCIAL"),
            preparadoPara: this.lista(metadados.preparadoPara, ["PRODUCAO", "OPERACIONAL", "FINANCEIRO"]),
            persistencia: this.texto(metadados.persistencia || "APP_STATE")
        };
    },

    obterStatusProjetoAprovado() {
        if (typeof STATUS_PROJETO !== "undefined" && STATUS_PROJETO.APROVADO) {
            return STATUS_PROJETO.APROVADO;
        }

        if (typeof WORKFLOW_STATE !== "undefined" && WORKFLOW_STATE.APROVADO) {
            return WORKFLOW_STATE.APROVADO;
        }

        return "aprovado";
    },

    obterEtapaProjeto(status = "aprovado") {
        if (typeof ProjetoStatus !== "undefined" && typeof ProjetoStatus.etapaPorStatus === "function") {
            return ProjetoStatus.etapaPorStatus(status);
        }

        return "comercial";
    },

    normalizarDocumento(documento = null) {
        if (!documento || typeof documento !== "object") {
            return null;
        }

        return this.copiarValor(documento);
    },

    copiarLista(lista = []) {
        return Array.isArray(lista) ? lista.map(item => this.copiarValor(item)) : [];
    },

    copiarValor(valor) {
        if (typeof structuredClone === "function") {
            try {
                return structuredClone(valor);
            } catch (erro) {
                return this.copiarValorManual(valor);
            }
        }

        return this.copiarValorManual(valor);
    },

    copiarValorManual(valor) {
        if (Array.isArray(valor)) {
            return valor.map(item => this.copiarValorManual(item));
        }

        if (valor && Object.prototype.toString.call(valor) === "[object Object]") {
            return Object.keys(valor).reduce((copia, chave) => {
                copia[chave] = this.copiarValorManual(valor[chave]);
                return copia;
            }, {});
        }

        return valor;
    },

    lista(valor, padrao = []) {
        return Array.isArray(valor) && valor.length ? [...valor] : [...padrao];
    },

    texto(valor) {
        return String(valor === undefined || valor === null ? "" : valor).trim();
    },

    numero(valor) {
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : 0;
    },

    slug(valor) {
        return this.texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "documento-comercial";
    },

    agoraISO() {
        return new Date().toISOString();
    }
};
