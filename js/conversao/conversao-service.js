const ConversaoService = {
    converter(documento = null, opcoes = {}) {
        try {
            const documentoAtual = this.normalizarDocumento(documento || this.obterDocumentoAtual());
            const validacao = ConversaoValidator.validarConversao(documentoAtual, opcoes);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros, documentoAtual);
            }

            if (typeof ProjetoService === "undefined" || !ProjetoService || typeof ProjetoService.criarManual !== "function") {
                return this.respostaErro(["ProjetoService indisponivel para conversao."], documentoAtual);
            }

            const comercial = this.obterComercial(documentoAtual, opcoes);
            const documentoOrigem = ConversaoModel.criarDocumentoOrigem(documentoAtual);
            const dataConversao = this.agoraISO();
            const dadosProjeto = ConversaoModel.montarDadosProjeto(documentoAtual, {
                ...opcoes,
                dataAprovacao: comercial.dataAprovacao
            });
            const projetoBase = ProjetoService.criarManual(dadosProjeto, opcoes.usuario || "Sistema");
            const projeto = ConversaoModel.anexarOrigemProjeto(projetoBase, documentoAtual, {
                documentoOrigem,
                dataConversao,
                statusComercial: comercial.statusComercial,
                usuario: opcoes.usuario || "Sistema"
            });
            const conversao = ConversaoModel.criar({
                documento: documentoAtual,
                documentoOrigem,
                projetoAtual: projeto,
                dataConversao,
                convertido: true,
                ultimaAcaoConversao: this.montarUltimaAcao("Documento Comercial convertido em Projeto Executivo."),
                metadados: {
                    origem: "APROVACAO_COMERCIAL"
                }
            });
            const workflowEvento = this.registrarWorkflow(projeto, conversao, opcoes);
            const eventos = this.emitirEventos(projeto, conversao);
            const appState = this.salvarAppState(projeto, conversao);

            return {
                sucesso: true,
                projeto,
                documento: documentoAtual,
                documentoOrigem,
                dataConversao,
                conversao,
                workflowEvento,
                eventos,
                appState,
                erros: [],
                detalhes: {
                    validacao,
                    comercial
                }
            };
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao converter Documento Comercial em Projeto."]);
        }
    },

    obterDocumentoAtual() {
        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.getItem !== "function") {
            return null;
        }

        return appStateService.getItem("documentoAtual");
    },

    obterComercial(documento = null, opcoes = {}) {
        if (typeof ComercialService !== "undefined" && typeof ComercialService.obterRegistroAtual === "function") {
            return ComercialService.obterRegistroAtual(documento, opcoes);
        }

        return {
            statusComercial: opcoes.statusComercial || "RASCUNHO",
            dataAprovacao: opcoes.dataAprovacao || ""
        };
    },

    obterConversaoAtual() {
        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.getItem !== "function") {
            return {};
        }

        const configuracoes = appStateService.getItem("configuracoes") || {};
        return configuracoes.conversao || {};
    },

    salvarAppState(projeto = {}, conversao = {}) {
        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.getItem !== "function" || typeof appStateService.setState !== "function") {
            return false;
        }

        const configuracoes = appStateService.getItem("configuracoes") || {};
        const conversaoState = {
            ...(configuracoes.conversao || {}),
            projetoAtual: projeto,
            documentoOrigem: conversao.documentoOrigem,
            dataConversao: conversao.dataConversao,
            convertido: true,
            ultimaAcaoConversao: conversao.ultimaAcaoConversao
        };

        appStateService.setState("projetoSelecionado", projeto);

        return appStateService.setState("configuracoes", {
            ...configuracoes,
            conversao: conversaoState
        });
    },

    registrarWorkflow(projeto = {}, conversao = {}, opcoes = {}) {
        if (typeof WorkflowEngine === "undefined" || !WorkflowEngine || typeof WorkflowEngine.registrar !== "function") {
            return null;
        }

        return WorkflowEngine.registrar({
            tipo: "projeto_convertido",
            descricao: "Projeto Executivo criado a partir de Documento Comercial aprovado.",
            usuario: opcoes.usuario || "Sistema",
            projetoId: projeto.id || projeto.numero || "",
            dados: {
                documentoOrigem: conversao.documentoOrigem,
                dataConversao: conversao.dataConversao,
                statusProjeto: projeto.status,
                statusComercial: "APROVADO"
            }
        });
    },

    emitirEventos(projeto = {}, conversao = {}) {
        if (typeof EventBus === "undefined" || !EventBus || typeof EventBus.emit !== "function") {
            return {
                criado: null,
                convertido: null
            };
        }

        const payload = {
            origem: "ConversaoService",
            projeto,
            documentoOrigem: conversao.documentoOrigem,
            dataConversao: conversao.dataConversao,
            conversao
        };

        return {
            criado: EventBus.emit(
                typeof EventTypes !== "undefined" && EventTypes.PROJETO_CRIADO
                    ? EventTypes.PROJETO_CRIADO
                    : "projeto.criado",
                payload
            ),
            convertido: EventBus.emit("projeto.convertido", payload)
        };
    },

    normalizarDocumento(documento = null) {
        if (typeof ComercialService !== "undefined" && typeof ComercialService.normalizarDocumento === "function") {
            return ComercialService.normalizarDocumento(documento);
        }

        if (documento?.documento && documento.documento.tipo === "DOCUMENTO_COMERCIAL") {
            return documento.documento;
        }

        return documento;
    },

    obterAppStateService() {
        if (typeof AppStateService !== "undefined" && AppStateService) {
            return AppStateService;
        }

        if (typeof AppState !== "undefined" && AppState) {
            return AppState;
        }

        return null;
    },

    montarUltimaAcao(descricao = "") {
        return `${descricao} ${new Date().toLocaleString("pt-BR")}`;
    },

    agoraISO() {
        return new Date().toISOString();
    },

    respostaErro(erros = [], documento = null) {
        return {
            sucesso: false,
            projeto: null,
            documento,
            documentoOrigem: documento ? ConversaoModel.criarDocumentoOrigem(documento) : null,
            dataConversao: "",
            conversao: null,
            workflowEvento: null,
            eventos: {
                criado: null,
                convertido: null
            },
            appState: false,
            erros: Array.isArray(erros) ? erros : [String(erros || "Erro na conversao em Projeto.")],
            detalhes: {}
        };
    }
};
