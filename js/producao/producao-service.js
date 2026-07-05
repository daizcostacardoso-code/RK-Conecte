const ProducaoService = {
    repository: null,

    configurar(repository = ProducaoRepository) {
        this.repository = repository;
        return this;
    },

    obterRepository() {
        return this.repository || ProducaoRepository;
    },

    async criarOrdem(dados = {}, opcoes = {}) {
        try {
            const projeto = this.obterProjetoReferencia(dados, opcoes);
            const ordem = ProducaoModel.criar({
                ...dados,
                projetoId: dados.projetoId || projeto?.id || "",
                responsavel: dados.responsavel || opcoes.responsavel || "",
                prioridade: dados.prioridade || projeto?.prioridade || "MEDIA"
            });
            const validacao = ProducaoValidator.validar(ordem);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros, null);
            }

            const salva = await this.obterRepository().salvarOrdem(ordem);
            const workflowEvento = this.registrarWorkflow("ordem_criada", salva, opcoes);
            const evento = this.emitirEvento("ordem.criada", salva, {
                projeto,
                workflowEvento
            });
            const appState = this.salvarAppState(salva);

            return {
                sucesso: true,
                ordem: salva,
                projeto,
                evento,
                workflowEvento,
                appState,
                erros: [],
                detalhes: {
                    validacao
                }
            };
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao criar ordem de producao."]);
        }
    },

    async buscarOrdem(id) {
        try {
            if (!id) {
                return this.respostaErro(["Id da ordem de producao e obrigatorio."], null);
            }

            const ordem = await this.obterRepository().buscarOrdem(id);

            return {
                sucesso: !!ordem,
                ordem,
                projeto: null,
                evento: null,
                workflowEvento: null,
                appState: false,
                erros: ordem ? [] : ["Ordem de producao nao encontrada."],
                detalhes: {}
            };
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao buscar ordem de producao."]);
        }
    },

    async listarOrdens(filtros = {}) {
        try {
            const ordens = await this.obterRepository().listarOrdens();

            return {
                sucesso: true,
                ordens: this.filtrar(ordens, filtros),
                erros: []
            };
        } catch (erro) {
            return {
                sucesso: false,
                ordens: [],
                erros: [erro.message || "Erro ao listar ordens de producao."]
            };
        }
    },

    async planejarOrdem(id, alteracoes = {}, usuario = "Sistema") {
        return this.alterarStatus(id, ProducaoModel.status.PLANEJADA, {
            ...alteracoes,
            usuario,
            evento: null,
            acaoWorkflow: "ordem_planejada"
        });
    },

    async iniciarOrdem(id, usuario = "Sistema") {
        return this.alterarStatus(id, ProducaoModel.status.EM_PRODUCAO, {
            usuario,
            evento: "ordem.iniciada",
            acaoWorkflow: "ordem_iniciada"
        });
    },

    async finalizarOrdem(id, usuario = "Sistema", observacoes = "") {
        return this.alterarStatus(id, ProducaoModel.status.FINALIZADA, {
            usuario,
            observacoes,
            evento: "ordem.finalizada",
            acaoWorkflow: "ordem_finalizada"
        });
    },

    async alterarStatus(id, novoStatus, opcoes = {}) {
        try {
            const resultadoBusca = await this.buscarOrdem(id);

            if (!resultadoBusca.sucesso) {
                return resultadoBusca;
            }

            const transicao = ProducaoValidator.validarTransicao(resultadoBusca.ordem.status, novoStatus);

            if (!transicao.valido) {
                return this.respostaErro(transicao.erros, resultadoBusca.ordem);
            }

            const alteracoes = ["observacoes", "responsavel", "prioridade"].reduce((dados, chave) => {
                if (opcoes[chave] !== undefined) {
                    dados[chave] = opcoes[chave];
                }

                return dados;
            }, {});

            const base = ProducaoModel.atualizar(resultadoBusca.ordem, alteracoes);
            const atualizada = ProducaoModel.alterarStatus(base, novoStatus, opcoes.usuario || "Sistema");
            const validacao = ProducaoValidator.validar(atualizada);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros, resultadoBusca.ordem);
            }

            const salva = await this.obterRepository().salvarOrdem(atualizada);
            const workflowEvento = this.registrarWorkflow(opcoes.acaoWorkflow || "ordem_status_alterado", salva, opcoes);
            const evento = opcoes.evento ? this.emitirEvento(opcoes.evento, salva, {
                statusAnterior: transicao.origem,
                statusDestino: transicao.destino,
                workflowEvento
            }) : null;
            const appState = this.salvarAppState(salva);

            return {
                sucesso: true,
                ordem: salva,
                projeto: null,
                evento,
                workflowEvento,
                appState,
                erros: [],
                detalhes: {
                    transicao,
                    validacao
                }
            };
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao alterar status da ordem de producao."]);
        }
    },

    filtrar(ordens = [], filtros = {}) {
        const projetoId = String(filtros.projetoId || "").trim();
        const status = filtros.status ? ProducaoModel.normalizarStatus(filtros.status) : "";
        const responsavel = String(filtros.responsavel || "").trim().toLowerCase();
        const prioridade = String(filtros.prioridade || "").trim().toUpperCase();

        return ordens.filter(ordem => {
            const projetoOk = !projetoId || ordem.projetoId === projetoId;
            const statusOk = !status || ordem.status === status;
            const responsavelOk = !responsavel || String(ordem.responsavel || "").toLowerCase().includes(responsavel);
            const prioridadeOk = !prioridade || ordem.prioridade === prioridade;

            return projetoOk && statusOk && responsavelOk && prioridadeOk;
        });
    },

    obterProjetoReferencia(dados = {}, opcoes = {}) {
        const projeto = opcoes.projeto || dados.projeto || this.obterProjetoAtual();

        if (projeto && typeof projeto === "object") {
            return projeto;
        }

        const projetoId = String(dados.projetoId || opcoes.projetoId || "").trim();
        const projetoService = opcoes.projetoService || this.obterProjetoService();
        const projetos = Array.isArray(opcoes.projetos) ? opcoes.projetos : [];

        if (!projetoId || !projetoService || typeof projetoService.filtrar !== "function") {
            return null;
        }

        return projetos.find(item => item.id === projetoId) ||
            projetoService.filtrar(projetos, { busca: projetoId })[0] ||
            null;
    },

    obterProjetoAtual() {
        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.getItem !== "function") {
            return null;
        }

        return appStateService.getItem("projetoSelecionado");
    },

    salvarAppState(ordem = {}) {
        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.setState !== "function") {
            return false;
        }

        return appStateService.setState("ordemAtual", ordem);
    },

    obterOrdemAtual() {
        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.getItem !== "function") {
            return null;
        }

        return appStateService.getItem("ordemAtual");
    },

    registrarWorkflow(acao = "", ordem = {}, opcoes = {}) {
        if (typeof WorkflowEngine === "undefined" || !WorkflowEngine || typeof WorkflowEngine.registrar !== "function") {
            return null;
        }

        return WorkflowEngine.registrar({
            tipo: acao || "ordem_producao",
            descricao: this.descricaoWorkflow(acao, ordem),
            usuario: opcoes.usuario || "Sistema",
            projetoId: ordem.projetoId || "",
            dados: {
                ordemId: ordem.id,
                status: ordem.status,
                prioridade: ordem.prioridade,
                responsavel: ordem.responsavel
            }
        });
    },

    emitirEvento(nomeEvento = "", ordem = {}, detalhes = {}) {
        if (typeof EventBus === "undefined" || !EventBus || typeof EventBus.emit !== "function") {
            return null;
        }

        return EventBus.emit(nomeEvento, {
            origem: "ProducaoService",
            ordem,
            projetoId: ordem.projetoId,
            ordemId: ordem.id,
            status: ordem.status,
            detalhes
        });
    },

    descricaoWorkflow(acao = "", ordem = {}) {
        const descricoes = {
            ordem_criada: "Ordem de producao criada.",
            ordem_planejada: "Ordem de producao planejada.",
            ordem_iniciada: "Ordem de producao iniciada.",
            ordem_finalizada: "Ordem de producao finalizada.",
            ordem_status_alterado: "Status da ordem de producao alterado."
        };

        return descricoes[acao] || `Ordem de producao ${ordem.id || ""}`.trim();
    },

    obterProjetoService() {
        return typeof ProjetoService !== "undefined" ? ProjetoService : null;
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

    respostaErro(erros = [], ordem = null) {
        return {
            sucesso: false,
            ordem,
            projeto: null,
            evento: null,
            workflowEvento: null,
            appState: false,
            erros: Array.isArray(erros) ? erros : [String(erros || "Erro na producao.")],
            detalhes: {}
        };
    }
};
