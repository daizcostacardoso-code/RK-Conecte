const ProjetoVisualController = {
    buscaTimer: null,
    estado: {
        projetos: [],
        projetoSelecionado: null
    },

    async iniciar() {
        this.configurarProjetoService();

        ProjetoVisualUI.configurar(this);
        ProjetoVisualUI.iniciar({
            aoFiltrarProjetos: filtros => this.agendarBusca(filtros),
            aoSelecionarProjeto: id => this.selecionarProjeto(id),
            aoSalvarProjeto: dados => this.salvarProjeto(dados),
            aoEditarProjeto: id => this.editarProjeto(id),
            aoInativarProjeto: id => this.inativarProjeto(id)
        });

        await this.listarProjetos();
        const projetoId = new URLSearchParams(window.location.search || "").get("projetoId");
        if (projetoId) await this.selecionarProjeto(projetoId);
    },

    configurarProjetoService() {
        if (typeof ProjetoRepository !== "undefined" && !ProjetoRepository.adapter) {
            const adapter = typeof criarFirestoreAdapter === "function"
                ? criarFirestoreAdapter()
                : typeof FirestoreAdapter !== "undefined"
                    ? FirestoreAdapter
                    : null;

            if (adapter) {
                ProjetoRepository.configurar(adapter);
            }
        }

        if (typeof ProjetoService !== "undefined" && typeof ProjetoService.configurar === "function") {
            ProjetoService.configurar(typeof ProjetoRepository !== "undefined" ? ProjetoRepository : null);
        }
    },

    agendarBusca(filtros = {}) {
        window.clearTimeout(this.buscaTimer);
        this.buscaTimer = window.setTimeout(() => this.listarProjetos(filtros), 160);
    },

    async salvarProjeto(dados = {}) {
        ProjetoVisualUI.definirCarregando(true);
        ProjetoVisualUI.mostrarAviso("");

        const resultado = dados.id
            ? await this.executarAtualizacao(dados.id, dados)
            : await this.executarCriacao(dados);

        ProjetoVisualUI.definirCarregando(false);

        if (!resultado.sucesso) {
            ProjetoVisualUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ProjetoVisualUI.mostrarAviso(dados.id ? "Projeto atualizado com sucesso." : "Projeto cadastrado com sucesso.", "sucesso");
        ProjetoVisualUI.limparFormulario();
        await this.listarProjetos(ProjetoVisualUI.obterFiltros());
        await this.selecionarProjeto(resultado.projeto.id);
        return resultado;
    },

    async listarProjetos(filtros = {}) {
        ProjetoVisualUI.renderizarCarregamentoLista("Carregando projetos do Firestore...");
        ProjetoVisualUI.mostrarAviso("Carregando projetos...", "info");
        const resultado = await this.executarListagem(filtros);

        if (!resultado.sucesso) {
            this.estado.projetos = [];
            ProjetoVisualUI.renderizarLista([]);
            ProjetoVisualUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        this.estado.projetos = resultado.projetos || [];
        ProjetoVisualUI.renderizarLista(this.estado.projetos);
        ProjetoVisualUI.mostrarAviso("");
        return resultado;
    },

    async selecionarProjeto(id) {
        const resultado = await this.executarBusca(id);

        if (!resultado.sucesso) {
            ProjetoVisualUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        this.estado.projetoSelecionado = resultado.projeto;
        ProjetoVisualUI.renderizarDetalhe(resultado.projeto);
        return resultado;
    },

    async editarProjeto(id) {
        const resultado = await this.selecionarProjeto(id);

        if (resultado.sucesso) {
            ProjetoVisualUI.preencherFormulario(resultado.projeto);
        }

        return resultado;
    },

    async inativarProjeto(id) {
        const resultado = await this.executarExclusao(id);

        if (!resultado.sucesso) {
            ProjetoVisualUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ProjetoVisualUI.mostrarAviso("Projeto inativado como cancelado.", "sucesso");
        await this.listarProjetos(ProjetoVisualUI.obterFiltros());
        await this.selecionarProjeto(id);
        return resultado;
    },

    async usarProjeto(id) {
        const resultado = await this.selecionarProjeto(id);

        if (!resultado.sucesso) {
            return resultado;
        }

        this.salvarProjetoAtual(resultado.projeto);
        ProjetoVisualUI.mostrarAviso("Projeto selecionado para uso futuro no orcamento.", "sucesso");
        return resultado;
    },

    salvarProjetoAtual(projeto = {}) {
        const appState = this.obterAppStateService();

        if (appState && typeof appState.setState === "function") {
            appState.setState("projetoSelecionado", projeto);
            appState.setState("projetoAtual", projeto);

            if (projeto.cliente) {
                appState.setState("clienteSelecionado", projeto.cliente);
            }
        }

        if (typeof ProjetoStorage !== "undefined" && typeof ProjetoStorage.salvarAtual === "function") {
            ProjetoStorage.salvarAtual(projeto);
        }

        if (typeof RKDraftState !== "undefined" && typeof RKDraftState.salvarFluxo === "function") {
            RKDraftState.salvarFluxo({
                projetoSelecionado: projeto,
                projetoAtual: projeto,
                clienteSelecionado: projeto.cliente || null
            });
        }

        return true;
    },

    executarCriacao(dados) {
        if (typeof CriarProjetoUseCase !== "undefined") {
            return CriarProjetoUseCase.executar(dados, ProjetoService);
        }

        return ProjetoService.criarProjeto(dados);
    },

    executarAtualizacao(id, dados) {
        if (typeof AtualizarProjetoUseCase !== "undefined") {
            return AtualizarProjetoUseCase.executar(id, dados, ProjetoService);
        }

        return ProjetoService.atualizarProjeto(id, dados);
    },

    executarExclusao(id) {
        if (typeof ExcluirProjetoUseCase !== "undefined") {
            return ExcluirProjetoUseCase.executar(id, ProjetoService);
        }

        return ProjetoService.desativarProjeto(id);
    },

    executarListagem(filtros) {
        if (typeof ListarProjetosUseCase !== "undefined") {
            return ListarProjetosUseCase.executar(filtros, ProjetoService);
        }

        return ProjetoService.listarProjetos(filtros);
    },

    async executarBusca(id) {
        if (typeof ProjetoService !== "undefined" && typeof ProjetoService.buscarProjeto === "function") {
            return ProjetoService.buscarProjeto(id);
        }

        return {
            sucesso: false,
            projeto: null,
            erros: ["Camada de Projetos indisponivel para buscar."]
        };
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

    formatarErros(erros = []) {
        if (!Array.isArray(erros) || !erros.length) {
            return "Nao foi possivel concluir a acao.";
        }

        return erros.join(" ");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("formProjeto")) {
        ProjetoVisualController.iniciar();
    }
});
