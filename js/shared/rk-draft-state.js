const RKDraftState = {
    storageKey: "rk_conecte_workflow_draft_v1",
    legacyDemoKey: "rk_conecte_e2e_demo_state",
    version: 1,
    camposPermitidos: Object.freeze([
        "clienteSelecionado",
        "projetoSelecionado",
        "projetoAtual",
        "orcamentoAtual",
        "documentoAtual",
        "statusComercial",
        "ordemAtual",
        "configuracoes"
    ]),

    carregar() {
        try {
            const estado = JSON.parse(localStorage.getItem(this.storageKey) || "null");
            if (!estado || estado.version !== this.version || typeof estado.dados !== "object") {
                return null;
            }
            return this.clonar(estado.dados);
        } catch (erro) {
            console.warn("Nao foi possivel carregar o rascunho do fluxo.", erro);
            return null;
        }
    },

    salvarFluxo(alteracoes = {}) {
        try {
            const atual = this.carregar() || {};
            const permitidas = this.filtrarCampos(alteracoes);
            const dados = {
                ...atual,
                ...permitidas,
                configuracoes: permitidas.configuracoes
                    ? { ...(atual.configuracoes || {}), ...permitidas.configuracoes }
                    : atual.configuracoes
            };

            localStorage.setItem(this.storageKey, JSON.stringify({
                version: this.version,
                atualizadoEm: new Date().toISOString(),
                dados
            }));
            return this.clonar(dados);
        } catch (erro) {
            console.warn("Nao foi possivel salvar o rascunho do fluxo.", erro);
            return null;
        }
    },

    limpar() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.legacyDemoKey);
            return true;
        } catch (erro) {
            return false;
        }
    },

    removerDemoLegado() {
        try {
            localStorage.removeItem(this.legacyDemoKey);
            return true;
        } catch (erro) {
            return false;
        }
    },

    iniciar() {
        this.removerDemoLegado();
        const estado = this.carregar();
        const appState = this.obterAppStateService();
        if (!estado || !appState || typeof appState.setState !== "function") return false;

        this.camposPermitidos.forEach(chave => {
            if (estado[chave] !== undefined) appState.setState(chave, estado[chave]);
        });
        return true;
    },

    filtrarCampos(alteracoes = {}) {
        return this.camposPermitidos.reduce((resultado, chave) => {
            if (alteracoes[chave] !== undefined) {
                resultado[chave] = this.clonar(alteracoes[chave]);
            }
            return resultado;
        }, {});
    },

    obterAppStateService() {
        if (typeof AppStateService !== "undefined" && AppStateService) return AppStateService;
        if (typeof AppState !== "undefined" && AppState) return AppState;
        return null;
    },

    clonar(valor) {
        if (valor === null || valor === undefined) return valor;
        return JSON.parse(JSON.stringify(valor));
    }
};

if (typeof window !== "undefined") {
    window.RKDraftState = RKDraftState;
}

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => RKDraftState.iniciar());
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { RKDraftState };
}
