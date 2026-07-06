const ProducaoController = {
    estado: {
        projeto: null,
        ordens: [],
        ordemSelecionadaId: "",
        indicadores: {
            pendentes: 0,
            planejadas: 0,
            liberadas: 0,
            emProducao: 0,
            finalizadas: 0,
            urgentes: 0,
            total: 0
        },
        mensagem: "",
        tipoMensagem: "info"
    },

    async iniciar() {
        this.configurarProducaoService();

        if (typeof ProducaoUI !== "undefined") {
            ProducaoUI.configurar(this);
        }

        await this.carregar();
        return this.renderizar();
    },

    configurarProducaoService() {
        if (
            typeof ProducaoRepository !== "undefined" &&
            typeof criarMemoryAdapter === "function" &&
            !ProducaoRepository.adapter
        ) {
            ProducaoRepository.configurar(criarMemoryAdapter());
        }

        if (typeof ProducaoService !== "undefined" && typeof ProducaoService.configurar === "function") {
            ProducaoService.configurar(ProducaoRepository);
        }
    },

    async carregar(opcoes = {}) {
        const projeto = this.obterProjetoAtual();
        const resultadoOrdens = await this.executarListagem();
        const ordens = resultadoOrdens.sucesso
            ? this.enriquecerOrdens(resultadoOrdens.ordens || [], projeto)
            : [];
        const resultadoIndicadores = await this.executarIndicadores();
        const ordemSelecionadaId = this.resolverOrdemSelecionada(ordens, opcoes.ordemSelecionadaId);

        this.estado = {
            projeto,
            ordens,
            ordemSelecionadaId,
            indicadores: resultadoIndicadores.indicadores || this.estado.indicadores,
            mensagem: resultadoOrdens.sucesso
                ? (ordens.length ? "" : "Use o botao Criar ordem demo para preparar a entrada em Producao.")
                : this.formatarErros(resultadoOrdens.erros),
            tipoMensagem: resultadoOrdens.sucesso ? "info" : "erro"
        };

        return this.estado;
    },

    async criarOrdemDemo() {
        const projeto = this.estado.projeto || this.obterProjetoAtual();

        if (!projeto) {
            this.estado.mensagem = "Converta ou selecione um Projeto antes de criar a Ordem de Producao.";
            this.estado.tipoMensagem = "erro";
            this.renderizar();
            return false;
        }

        const dados = {
            projeto,
            projetoId: projeto.id,
            clienteId: projeto.cliente?.id || "",
            responsavel: projeto.operacional?.responsavel || "Equipe Producao",
            prioridade: projeto.prioridade || ProducaoModel.prioridades.NORMAL,
            descricao: projeto.titulo || "Ordem de Producao demo",
            observacoes: "Ordem de Producao de demonstracao criada a partir do Projeto convertido.",
            usuario: "Fluxo E2E Demo"
        };
        const resultado = await this.executarCriacao(dados);

        return this.finalizarAcao(resultado, "Ordem de Producao demo criada.");
    },

    selecionarOrdem(id) {
        this.estado.ordemSelecionadaId = id || "";
        this.estado.mensagem = "";
        this.estado.tipoMensagem = "info";
        return this.renderizar();
    },

    async salvarPlanejamento(id, dados = {}) {
        const resultado = await this.executarPlanejamento(id, dados);
        return this.finalizarAcao(resultado, "Planejamento atualizado.");
    },

    async alterarResponsavel(id, responsavel = "") {
        const resultado = await this.executarAlteracaoResponsavel(id, responsavel);
        return this.finalizarAcao(resultado, "Responsavel atualizado.");
    },

    async alterarPrioridade(id, prioridade = "") {
        const resultado = await this.executarAlteracaoPrioridade(id, prioridade);
        return this.finalizarAcao(resultado, "Prioridade atualizada.");
    },

    async atualizarChecklist(id, itemId = "", concluido = false) {
        const resultado = await this.executarAtualizacaoChecklist(id, itemId, concluido);
        return this.finalizarAcao(resultado, "Checklist atualizado.");
    },

    async liberarProducao(id) {
        const resultado = await this.executarLiberacao(id);
        return this.finalizarAcao(resultado, "Producao liberada.");
    },

    async finalizarAcao(resultado, mensagemSucesso = "") {
        if (!resultado || !resultado.sucesso) {
            this.estado.mensagem = this.formatarErros(resultado?.erros || []);
            this.estado.tipoMensagem = "erro";
            this.renderizar();
            return resultado;
        }

        this.salvarOrdemAtual(resultado.ordem);
        await this.carregar({ ordemSelecionadaId: resultado.ordem?.id });
        this.estado.mensagem = mensagemSucesso;
        this.estado.tipoMensagem = "sucesso";
        this.renderizar();
        return resultado;
    },

    async executarCriacao(dados = {}) {
        if (typeof CriarOrdemProducaoUseCase !== "undefined") {
            return CriarOrdemProducaoUseCase.executar(dados, ProducaoService);
        }

        return this.respostaCamadaIndisponivel("criar ordem");
    },

    async executarListagem(filtros = {}) {
        if (typeof ListarOrdensProducaoUseCase !== "undefined") {
            return ListarOrdensProducaoUseCase.executar(filtros, ProducaoService);
        }

        return {
            sucesso: false,
            ordens: [],
            erros: ["Camada de Producao indisponivel para listar ordens."]
        };
    },

    async executarIndicadores(filtros = {}) {
        if (typeof ObterIndicadoresProducaoUseCase !== "undefined") {
            return ObterIndicadoresProducaoUseCase.executar(filtros, ProducaoService);
        }

        return {
            sucesso: false,
            indicadores: this.estado.indicadores,
            erros: ["Camada de Producao indisponivel para indicadores."]
        };
    },

    async executarPlanejamento(id, dados = {}) {
        if (typeof PlanejarProducaoUseCase !== "undefined") {
            return PlanejarProducaoUseCase.executar(id, dados, this.obterUsuarioAcao(), ProducaoService);
        }

        return this.respostaCamadaIndisponivel("planejar ordem");
    },

    async executarAlteracaoResponsavel(id, responsavel = "") {
        if (typeof AlterarResponsavelProducaoUseCase !== "undefined") {
            return AlterarResponsavelProducaoUseCase.executar(id, responsavel, this.obterUsuarioAcao(), ProducaoService);
        }

        return this.respostaCamadaIndisponivel("alterar responsavel");
    },

    async executarAlteracaoPrioridade(id, prioridade = "") {
        if (typeof AlterarPrioridadeProducaoUseCase !== "undefined") {
            return AlterarPrioridadeProducaoUseCase.executar(id, prioridade, this.obterUsuarioAcao(), ProducaoService);
        }

        return this.respostaCamadaIndisponivel("alterar prioridade");
    },

    async executarAtualizacaoChecklist(id, itemId = "", concluido = false) {
        if (typeof AtualizarChecklistProducaoUseCase !== "undefined") {
            return AtualizarChecklistProducaoUseCase.executar(id, itemId, concluido, this.obterUsuarioAcao(), ProducaoService);
        }

        return this.respostaCamadaIndisponivel("atualizar checklist");
    },

    async executarLiberacao(id) {
        if (typeof LiberarProducaoUseCase !== "undefined") {
            return LiberarProducaoUseCase.executar(id, this.obterUsuarioAcao(), ProducaoService);
        }

        return this.respostaCamadaIndisponivel("liberar producao");
    },

    enriquecerOrdens(ordens = [], projeto = null) {
        return ordens.map(ordem => {
            const projetoRelacionado = projeto && ordem.projetoId === projeto.id ? projeto : null;

            return {
                ...ordem,
                projetoTitulo: projetoRelacionado?.titulo || projetoRelacionado?.numero || ordem.projetoId || "",
                clienteNome: projetoRelacionado?.cliente?.nome || ordem.clienteId || ""
            };
        });
    },

    resolverOrdemSelecionada(ordens = [], preferencia = "") {
        if (preferencia && ordens.some(ordem => ordem.id === preferencia)) {
            return preferencia;
        }

        if (this.estado.ordemSelecionadaId && ordens.some(ordem => ordem.id === this.estado.ordemSelecionadaId)) {
            return this.estado.ordemSelecionadaId;
        }

        const ordemAtual = this.obterOrdemAtual();
        if (ordemAtual?.id && ordens.some(ordem => ordem.id === ordemAtual.id)) {
            return ordemAtual.id;
        }

        return ordens[0]?.id || "";
    },

    obterProjetoAtual() {
        const appState = this.obterAppStateService();
        const appProjeto = appState && typeof appState.getItem === "function"
            ? appState.getItem("projetoAtual") || appState.getItem("projetoSelecionado")
            : null;

        if (appProjeto) {
            return appProjeto;
        }

        const demo = this.obterEstadoDemo();
        return demo?.configuracoes?.conversao?.projetoAtual ||
            demo?.projetoAtual ||
            demo?.projetoSelecionado ||
            null;
    },

    obterOrdemAtual() {
        const appState = this.obterAppStateService();
        const appOrdem = appState && typeof appState.getItem === "function"
            ? appState.getItem("ordemAtual")
            : null;

        if (appOrdem) {
            return appOrdem;
        }

        const demo = this.obterEstadoDemo();
        return demo?.ordemAtual || null;
    },

    salvarOrdemAtual(ordem = {}) {
        const appState = this.obterAppStateService();

        if (appState && typeof appState.setState === "function") {
            appState.setState("ordemAtual", ordem);
        }

        if (typeof RKE2EDemoState !== "undefined" && typeof RKE2EDemoState.salvarFluxo === "function") {
            RKE2EDemoState.salvarFluxo({
                ordemAtual: ordem
            });
        }

        return true;
    },

    obterUsuarioAcao() {
        const appState = this.obterAppStateService();
        const usuario = appState && typeof appState.getItem === "function"
            ? appState.getItem("usuarioAtual")
            : null;

        return usuario?.nome || usuario?.nomeUsuario || usuario?.usuario || "Sistema";
    },

    obterEstadoDemo() {
        if (typeof RKE2EDemoState !== "undefined" && typeof RKE2EDemoState.carregar === "function") {
            return RKE2EDemoState.carregar();
        }

        return null;
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

    renderizar() {
        if (typeof ProducaoUI !== "undefined" && typeof ProducaoUI.renderizar === "function") {
            return ProducaoUI.renderizar(this.estado);
        }

        return false;
    },

    formatarErros(erros = []) {
        if (!Array.isArray(erros) || !erros.length) {
            return "Nao foi possivel concluir a acao de Producao.";
        }

        return [...new Set(erros.filter(Boolean))].join(" ");
    },

    respostaCamadaIndisponivel(acao) {
        return {
            sucesso: false,
            ordem: null,
            erros: [`Camada de Producao indisponivel para ${acao}.`]
        };
    }
};

document.addEventListener("DOMContentLoaded", () => {
    ProducaoController.iniciar();
});
