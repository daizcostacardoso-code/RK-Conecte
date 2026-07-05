const ComercialService = {
    solicitar(documento = null, opcoes = {}) {
        return this.executarAcao({
            documento,
            opcoes,
            acao: "solicitar_aprovacao",
            statusDestino: COMERCIAL_STATUS.EM_REVISAO,
            evento: "documento.em_revisao",
            mensagem: "Documento Comercial enviado para revisao."
        });
    },

    aprovar(documento = null, opcoes = {}) {
        return this.executarAcao({
            documento,
            opcoes,
            acao: "aprovar",
            statusDestino: COMERCIAL_STATUS.APROVADO,
            evento: "documento.aprovado",
            mensagem: "Documento Comercial aprovado."
        });
    },

    reprovar(documento = null, motivo = "", opcoes = {}) {
        return this.executarAcao({
            documento,
            opcoes: {
                ...opcoes,
                motivoReprovacao: motivo || opcoes.motivoReprovacao || opcoes.observacao
            },
            acao: "reprovar",
            statusDestino: COMERCIAL_STATUS.REPROVADO,
            evento: "documento.reprovado",
            mensagem: "Documento Comercial reprovado."
        });
    },

    voltar(documento = null, opcoes = {}) {
        return this.executarAcao({
            documento,
            opcoes,
            acao: "voltar_revisao",
            statusDestino: COMERCIAL_STATUS.EM_REVISAO,
            evento: "documento.em_revisao",
            mensagem: "Documento Comercial voltou para revisao."
        });
    },

    executarAcao(configuracao = {}) {
        try {
            const documento = this.normalizarDocumento(configuracao.documento || this.obterDocumentoAtual());
            const registroAtual = this.obterRegistroAtual(documento, configuracao.opcoes);
            const statusAtual = registroAtual.statusComercial;
            const statusDestino = configuracao.statusDestino;
            const validacao = this.validarAcao(configuracao.acao, documento, statusAtual);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros, documento, registroAtual);
            }

            const transicao = ComercialValidator.validarTransicao(statusAtual, statusDestino);

            if (!transicao.valido) {
                return this.respostaErro([
                    `Transicao comercial invalida: ${transicao.origem} -> ${transicao.destino}.`
                ], documento, registroAtual);
            }

            const exportacao = this.validarProntidaoExportacao(documento);
            const registro = ComercialModel.atualizarStatus(registroAtual, statusDestino, {
                acao: configuracao.acao,
                usuario: configuracao.opcoes.usuario,
                observacao: configuracao.opcoes.observacao,
                motivoReprovacao: configuracao.opcoes.motivoReprovacao,
                origem: "ComercialService",
                ultimaAcaoComercial: this.montarUltimaAcao(configuracao.mensagem)
            });
            const workflowEvento = this.registrarWorkflow(configuracao.acao, registro, configuracao.opcoes);
            const evento = this.emitirEvento(configuracao.evento, registro, {
                acao: configuracao.acao,
                statusAnterior: statusAtual,
                exportacao
            });
            const appState = this.salvarAppState(registro);

            return {
                sucesso: true,
                documento,
                comercial: registro,
                statusComercial: registro.statusComercial,
                dataAprovacao: registro.dataAprovacao,
                ultimaAcaoComercial: registro.ultimaAcaoComercial,
                evento,
                workflowEvento,
                exportacao,
                erros: [],
                detalhes: {
                    validacao,
                    transicao,
                    appState
                }
            };
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao executar acao comercial."]);
        }
    },

    validarAcao(acao = "", documento = null, statusAtual = COMERCIAL_STATUS.RASCUNHO) {
        if (acao === "solicitar_aprovacao") {
            return ComercialValidator.validarSolicitacao(documento, statusAtual);
        }

        if (acao === "aprovar") {
            return ComercialValidator.validarAprovacao(documento, statusAtual);
        }

        if (acao === "reprovar") {
            return ComercialValidator.validarReprovacao(documento, statusAtual);
        }

        if (acao === "voltar_revisao") {
            return ComercialValidator.validarVoltarRevisao(documento, statusAtual);
        }

        return {
            valido: false,
            erros: ["Acao comercial invalida."]
        };
    },

    validarProntidaoExportacao(documento = null) {
        try {
            if (
                typeof DocumentHtmlRenderer === "undefined" ||
                typeof ExportService === "undefined" ||
                typeof ExportModel === "undefined"
            ) {
                return {
                    disponivel: false,
                    valido: true,
                    formato: "PDF",
                    erros: [],
                    avisos: ["ExportService indisponivel no ambiente atual."]
                };
            }

            const resultadoHtml = DocumentHtmlRenderer.renderizar(documento);

            if (!resultadoHtml.sucesso) {
                return {
                    disponivel: true,
                    valido: false,
                    formato: "PDF",
                    erros: resultadoHtml.erros,
                    avisos: []
                };
            }

            const exportacao = ExportModel.criar({
                documento,
                html: resultadoHtml.html,
                formato: "PDF",
                metadados: {
                    origem: "APROVACAO_COMERCIAL",
                    prontoPara: "EXPORTACAO_APOS_APROVACAO"
                }
            });
            const validacao = ExportService.validar(exportacao);

            return {
                disponivel: true,
                valido: validacao.valido,
                formato: exportacao.formato,
                nomeArquivo: exportacao.nomeArquivo,
                htmlGerado: !!resultadoHtml.html,
                erros: validacao.erros,
                avisos: []
            };
        } catch (erro) {
            return {
                disponivel: true,
                valido: false,
                formato: "PDF",
                erros: [erro.message || "Nao foi possivel validar exportacao comercial."],
                avisos: []
            };
        }
    },

    obterRegistroAtual(documento = null, opcoes = {}) {
        const configuracoes = this.obterConfiguracoesComerciais();
        const comercialDocumento = documento?.comercial || documento?.metadados?.comercial || {};
        const base = {
            ...configuracoes,
            ...comercialDocumento,
            ...(opcoes.comercial || {}),
            documento,
            statusComercial: opcoes.statusComercial ||
                opcoes.comercial?.statusComercial ||
                comercialDocumento.statusComercial ||
                configuracoes.statusComercial ||
                COMERCIAL_STATUS.RASCUNHO
        };

        return ComercialModel.criar(base);
    },

    obterDocumentoAtual() {
        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.getItem !== "function") {
            return null;
        }

        return appStateService.getItem("documentoAtual");
    },

    obterConfiguracoesComerciais() {
        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.getItem !== "function") {
            return {};
        }

        const configuracoes = appStateService.getItem("configuracoes") || {};
        return configuracoes.comercial || {};
    },

    salvarAppState(registro = {}) {
        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.getItem !== "function" || typeof appStateService.setState !== "function") {
            return false;
        }

        const configuracoes = appStateService.getItem("configuracoes") || {};
        const comercial = {
            ...(configuracoes.comercial || {}),
            statusComercial: registro.statusComercial,
            dataAprovacao: registro.dataAprovacao,
            ultimaAcaoComercial: registro.ultimaAcaoComercial,
            dataSolicitacao: registro.dataSolicitacao,
            dataReprovacao: registro.dataReprovacao,
            motivoReprovacao: registro.motivoReprovacao,
            atualizadoEm: registro.atualizadoEm,
            historico: registro.historico
        };

        if (registro.documento) {
            appStateService.setState("documentoAtual", registro.documento);
        }

        return appStateService.setState("configuracoes", {
            ...configuracoes,
            comercial
        });
    },

    registrarWorkflow(acao = "", registro = {}, opcoes = {}) {
        if (typeof WorkflowEngine === "undefined" || !WorkflowEngine || typeof WorkflowEngine.registrar !== "function") {
            return null;
        }

        return WorkflowEngine.registrar({
            tipo: "aprovacao_comercial",
            descricao: registro.ultimaAcaoComercial,
            usuario: opcoes.usuario || "",
            projetoId: registro.projetoId || "",
            dados: {
                acao,
                statusComercial: registro.statusComercial,
                dataAprovacao: registro.dataAprovacao,
                documentoId: registro.documentoId
            }
        });
    },

    emitirEvento(nomeEvento = "", registro = {}, detalhes = {}) {
        if (typeof EventBus === "undefined" || !EventBus || typeof EventBus.emit !== "function") {
            return null;
        }

        return EventBus.emit(nomeEvento, {
            origem: "ComercialService",
            documento: registro.documento,
            comercial: registro,
            statusComercial: registro.statusComercial,
            dataAprovacao: registro.dataAprovacao,
            ultimaAcaoComercial: registro.ultimaAcaoComercial,
            detalhes
        });
    },

    normalizarDocumento(documento = null) {
        if (!documento) {
            return null;
        }

        if (documento.tipo === "DOCUMENTO_COMERCIAL") {
            return documento;
        }

        if (documento.documento && documento.documento.tipo === "DOCUMENTO_COMERCIAL") {
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

    respostaErro(erros = [], documento = null, comercial = null) {
        return {
            sucesso: false,
            documento,
            comercial,
            statusComercial: comercial?.statusComercial || COMERCIAL_STATUS.RASCUNHO,
            dataAprovacao: comercial?.dataAprovacao || "",
            ultimaAcaoComercial: comercial?.ultimaAcaoComercial || "",
            evento: null,
            workflowEvento: null,
            exportacao: null,
            erros: Array.isArray(erros) ? erros : [String(erros || "Erro comercial.")],
            detalhes: {}
        };
    }
};
