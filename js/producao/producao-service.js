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
                clienteId: dados.clienteId || projeto?.cliente?.id || projeto?.clienteId || "",
                numero: dados.numero || this.criarNumeroOrdem(projeto),
                responsavel: dados.responsavel || opcoes.responsavel || projeto?.operacional?.responsavel || "Equipe Producao",
                prioridade: dados.prioridade || projeto?.prioridade || ProducaoModel.prioridades.NORMAL,
                descricao: dados.descricao || projeto?.titulo || projeto?.descricao || "",
                usuario: dados.usuario || opcoes.usuario || "Sistema"
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

            const ordemRepository = await this.obterRepository().buscarOrdem(id);
            const ordemAtual = this.obterOrdemAtual();
            const ordem = ordemRepository || (ordemAtual?.id === id ? ProducaoModel.normalizar(ordemAtual) : null);

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
            const ordensRepository = await this.obterRepository().listarOrdens();
            const ordens = this.mesclarComOrdemAtual(ordensRepository);

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

    async obterIndicadores(filtros = {}) {
        const resultado = await this.listarOrdens(filtros);
        const indicadores = this.calcularIndicadores(resultado.ordens || []);

        return {
            sucesso: resultado.sucesso,
            indicadores,
            erros: resultado.erros || []
        };
    },

    async planejarOrdem(id, alteracoes = {}, usuario = "Sistema") {
        try {
            const resultadoBusca = await this.buscarOrdem(id);

            if (!resultadoBusca.sucesso) {
                return resultadoBusca;
            }

            const ordemAtual = resultadoBusca.ordem;
            if (ordemAtual.status === ProducaoModel.status.PENDENTE) {
                const transicao = ProducaoValidator.validarTransicao(ordemAtual.status, ProducaoModel.status.PLANEJADA);

                if (!transicao.valido) {
                    return this.respostaErro(transicao.erros, ordemAtual);
                }
            }

            const prioridadeAnterior = ordemAtual.prioridade;
            const responsavelAnterior = ordemAtual.responsavel;
            const atualizada = ProducaoModel.planejar(ordemAtual, alteracoes, usuario);
            const validacao = ProducaoValidator.validar(atualizada);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros, ordemAtual);
            }

            const resultado = await this.salvarAtualizacao(atualizada, {
                usuario,
                evento: "ordem.planejada",
                acaoWorkflow: "ordem_planejada",
                detalhes: {
                    validacao
                }
            });

            if (
                Object.prototype.hasOwnProperty.call(alteracoes, "responsavel") &&
                atualizada.responsavel !== responsavelAnterior
            ) {
                this.emitirEvento("ordem.responsavel", resultado.ordem, {
                    responsavelAnterior,
                    responsavelDestino: atualizada.responsavel
                });
            }

            if (
                Object.prototype.hasOwnProperty.call(alteracoes, "prioridade") &&
                atualizada.prioridade !== prioridadeAnterior
            ) {
                this.emitirEvento("ordem.prioridade", resultado.ordem, {
                    prioridadeAnterior,
                    prioridadeDestino: atualizada.prioridade
                });
            }

            return resultado;
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao planejar ordem de producao."]);
        }
    },

    async alterarResponsavel(id, responsavel = "", usuario = "Sistema") {
        try {
            const resultadoBusca = await this.buscarOrdem(id);

            if (!resultadoBusca.sucesso) {
                return resultadoBusca;
            }

            const atualizada = ProducaoModel.definirResponsavel(resultadoBusca.ordem, responsavel, usuario);
            const validacao = ProducaoValidator.validar(atualizada);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros, resultadoBusca.ordem);
            }

            return this.salvarAtualizacao(atualizada, {
                usuario,
                evento: "ordem.responsavel",
                acaoWorkflow: "ordem_responsavel_definido",
                detalhes: {
                    validacao
                }
            });
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao alterar responsavel da ordem de producao."]);
        }
    },

    async alterarPrioridade(id, prioridade = ProducaoModel.prioridades.NORMAL, usuario = "Sistema") {
        try {
            const resultadoBusca = await this.buscarOrdem(id);

            if (!resultadoBusca.sucesso) {
                return resultadoBusca;
            }

            const atualizada = ProducaoModel.alterarPrioridade(resultadoBusca.ordem, prioridade, usuario);
            const validacao = ProducaoValidator.validar(atualizada);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros, resultadoBusca.ordem);
            }

            return this.salvarAtualizacao(atualizada, {
                usuario,
                evento: "ordem.prioridade",
                acaoWorkflow: "ordem_prioridade_alterada",
                detalhes: {
                    validacao
                }
            });
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao alterar prioridade da ordem de producao."]);
        }
    },

    async atualizarChecklist(id, itemId = "", concluido = false, usuario = "Sistema") {
        try {
            const resultadoBusca = await this.buscarOrdem(id);

            if (!resultadoBusca.sucesso) {
                return resultadoBusca;
            }

            const atualizada = ProducaoModel.atualizarChecklist(resultadoBusca.ordem, itemId, concluido, usuario);
            const validacao = ProducaoValidator.validar(atualizada);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros, resultadoBusca.ordem);
            }

            return this.salvarAtualizacao(atualizada, {
                usuario,
                evento: "ordem.checklist_atualizado",
                acaoWorkflow: "ordem_checklist_atualizado",
                detalhes: {
                    itemId,
                    concluido: Boolean(concluido),
                    validacao
                }
            });
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao atualizar checklist da ordem de producao."]);
        }
    },

    async liberarOrdem(id, usuario = "Sistema") {
        try {
            const resultadoBusca = await this.buscarOrdem(id);

            if (!resultadoBusca.sucesso) {
                return resultadoBusca;
            }

            const planejamento = ProducaoValidator.validarPlanejamento(resultadoBusca.ordem);

            if (!planejamento.valido) {
                return this.respostaErro(planejamento.erros, resultadoBusca.ordem);
            }

            const transicao = ProducaoValidator.validarTransicao(resultadoBusca.ordem.status, ProducaoModel.status.LIBERADA);

            if (!transicao.valido) {
                return this.respostaErro(transicao.erros, resultadoBusca.ordem);
            }

            const atualizada = ProducaoModel.liberar(resultadoBusca.ordem, usuario);
            const validacao = ProducaoValidator.validar(atualizada);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros, resultadoBusca.ordem);
            }

            return this.salvarAtualizacao(atualizada, {
                usuario,
                evento: "ordem.liberada",
                acaoWorkflow: "ordem_liberada",
                detalhes: {
                    transicao,
                    planejamento,
                    validacao
                }
            });
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao liberar ordem de producao."]);
        }
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

            return this.salvarAtualizacao(atualizada, {
                usuario: opcoes.usuario || "Sistema",
                evento: opcoes.evento,
                acaoWorkflow: opcoes.acaoWorkflow || "ordem_status_alterado",
                detalhes: {
                    transicao,
                    validacao
                }
            });
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao alterar status da ordem de producao."]);
        }
    },

    async salvarAtualizacao(ordem = {}, opcoes = {}) {
        const salva = await this.obterRepository().salvarOrdem(ordem);
        const workflowEvento = this.registrarWorkflow(opcoes.acaoWorkflow || "ordem_atualizada", salva, opcoes);
        const evento = opcoes.evento ? this.emitirEvento(opcoes.evento, salva, {
            ...(opcoes.detalhes || {}),
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
                ...(opcoes.detalhes || {})
            }
        };
    },

    mesclarComOrdemAtual(ordens = []) {
        const lista = Array.isArray(ordens) ? ordens.map(ordem => ProducaoModel.normalizar(ordem)) : [];
        const ordemAtual = this.obterOrdemAtual();

        if (!ordemAtual?.id || lista.some(ordem => ordem.id === ordemAtual.id)) {
            return lista;
        }

        return [ProducaoModel.normalizar(ordemAtual), ...lista];
    },

    filtrar(ordens = [], filtros = {}) {
        const projetoId = String(filtros.projetoId || "").trim();
        const status = filtros.status ? ProducaoModel.normalizarStatus(filtros.status) : "";
        const responsavel = String(filtros.responsavel || "").trim().toLowerCase();
        const prioridade = filtros.prioridade ? ProducaoModel.normalizarPrioridade(filtros.prioridade) : "";

        return ordens.filter(ordem => {
            const normalizada = ProducaoModel.normalizar(ordem);
            const projetoOk = !projetoId || normalizada.projetoId === projetoId;
            const statusOk = !status || normalizada.status === status;
            const responsavelOk = !responsavel || String(normalizada.responsavel || "").toLowerCase().includes(responsavel);
            const prioridadeOk = !prioridade || normalizada.prioridade === prioridade;

            return projetoOk && statusOk && responsavelOk && prioridadeOk;
        });
    },

    calcularIndicadores(ordens = []) {
        const indicadores = {
            pendentes: 0,
            planejadas: 0,
            liberadas: 0,
            emProducao: 0,
            finalizadas: 0,
            urgentes: 0,
            total: ordens.length
        };

        ordens.forEach(ordem => {
            const status = ProducaoModel.normalizarStatus(ordem.status);
            const prioridade = ProducaoModel.normalizarPrioridade(ordem.prioridade);

            if (status === ProducaoModel.status.PENDENTE) indicadores.pendentes += 1;
            if (status === ProducaoModel.status.PLANEJADA) indicadores.planejadas += 1;
            if (status === ProducaoModel.status.LIBERADA) indicadores.liberadas += 1;
            if (status === ProducaoModel.status.EM_PRODUCAO) indicadores.emProducao += 1;
            if (status === ProducaoModel.status.FINALIZADA) indicadores.finalizadas += 1;
            if (prioridade === ProducaoModel.prioridades.URGENTE) indicadores.urgentes += 1;
        });

        return indicadores;
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

        return appStateService.getItem("projetoAtual") || appStateService.getItem("projetoSelecionado");
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
                numero: ordem.numero,
                status: ordem.status,
                prioridade: ordem.prioridade,
                responsavel: ordem.responsavel,
                previsaoInicio: ordem.previsaoInicio,
                previsaoEntrega: ordem.previsaoEntrega
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
            prioridade: ordem.prioridade,
            detalhes
        });
    },

    descricaoWorkflow(acao = "", ordem = {}) {
        const descricoes = {
            ordem_criada: "Ordem de producao criada.",
            ordem_planejada: "Ordem de producao planejada.",
            ordem_responsavel_definido: "Responsavel da ordem de producao definido.",
            ordem_prioridade_alterada: "Prioridade da ordem de producao alterada.",
            ordem_checklist_atualizado: "Checklist da ordem de producao atualizado.",
            ordem_liberada: "Ordem de producao liberada.",
            ordem_iniciada: "Ordem de producao iniciada.",
            ordem_finalizada: "Ordem de producao finalizada.",
            ordem_status_alterado: "Status da ordem de producao alterado.",
            ordem_atualizada: "Ordem de producao atualizada."
        };

        return descricoes[acao] || `Ordem de producao ${ordem.numero || ordem.id || ""}`.trim();
    },

    criarNumeroOrdem(projeto = null) {
        if (projeto?.numero) {
            return `OP-${String(projeto.numero).replace(/^PRJ-?/i, "")}`;
        }

        if (projeto?.codigo) {
            return `OP-${String(projeto.codigo).replace(/^PRJ-?/i, "")}`;
        }

        return ProducaoModel.criarNumero();
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
