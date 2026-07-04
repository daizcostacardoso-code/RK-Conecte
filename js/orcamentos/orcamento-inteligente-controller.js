const OrcamentoInteligenteController = {
    contexto: null,

    iniciarTela() {
        OrcamentoInteligenteUI.iniciar();
        this.vincularEventos();
        this.novoOrcamento();
    },

    vincularEventos() {
        const btnNovo = OrcamentoInteligenteUI.elementos.btnNovo;
        if (!btnNovo) return;

        btnNovo.addEventListener("click", () => this.novoOrcamento());
    },

    async novoOrcamento() {
        const resultado = await this.criarContexto();
        this.contexto = resultado.contexto;
        this.renderizarEstadoInicial();
    },

    atualizarEtapa(status) {
        if (this.contexto && status) {
            this.contexto = OrcamentoContext.atualizar(this.contexto, { status });
        }

        OrcamentoInteligenteUI.renderizarEtapas(this.contexto || {});
    },

    renderizarEstadoInicial() {
        this.atualizarEtapa(this.contexto?.status);
        OrcamentoInteligenteUI.renderizarEstadoVazio(this.contexto || {});
        this.renderizarResumo();
    },

    renderizarResumo() {
        OrcamentoInteligenteUI.renderizarResumo(this.contexto || {});
    },

    async criarContexto() {
        if (typeof CriarOrcamentoUseCase !== "undefined") {
            return CriarOrcamentoUseCase.executar();
        }

        if (typeof OrcamentoOrchestrator !== "undefined" && typeof OrcamentoOrchestrator.iniciar === "function") {
            return OrcamentoOrchestrator.iniciar();
        }

        if (typeof OrcamentoFactory !== "undefined" && typeof OrcamentoFactory.criar === "function") {
            return {
                sucesso: true,
                contexto: OrcamentoFactory.criar(),
                erros: [],
                detalhes: {}
            };
        }

        return {
            sucesso: false,
            contexto: {
                status: "INICIADO",
                produtos: [],
                historico: [],
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString()
            },
            erros: ["Orquestrador de or\u00e7amento indispon\u00edvel."],
            detalhes: {}
        };
    }
};

document.addEventListener("DOMContentLoaded", () => OrcamentoInteligenteController.iniciarTela());
