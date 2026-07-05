const AppStateService = {
    appState: null,

    configurar(appState) {
        this.appState = appState || (typeof AppState !== "undefined" ? AppState : null);
        return this;
    },

    obterAppState() {
        if (this.appState) {
            return this.appState;
        }

        if (typeof AppState !== "undefined") {
            return AppState;
        }

        return null;
    },

    getState() {
        const appState = this.obterAppState();
        return appState ? appState.getState() : {};
    },

    setState(chave, valor) {
        const appState = this.obterAppState();
        return appState ? appState.setState(chave, valor) : false;
    },

    updateState(alteracoes = {}) {
        const appState = this.obterAppState();
        return appState ? appState.updateState(alteracoes) : false;
    },

    clearState() {
        const appState = this.obterAppState();
        return appState ? appState.clearState() : false;
    },

    getItem(chave) {
        const appState = this.obterAppState();
        return appState ? appState.getItem(chave) : undefined;
    },

    removeItem(chave) {
        const appState = this.obterAppState();
        return appState ? appState.removeItem(chave) : false;
    },

    subscribe(chave, callback) {
        const appState = this.obterAppState();
        return appState ? appState.subscribe(chave, callback) : false;
    },

    unsubscribe(chave, callback) {
        const appState = this.obterAppState();
        return appState ? appState.unsubscribe(chave, callback) : false;
    }
};
