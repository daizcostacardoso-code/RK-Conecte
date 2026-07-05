const APP_STATE_DEFAULTS = Object.freeze({
    usuarioAtual: null,
    empresaAtual: null,
    clienteSelecionado: null,
    projetoSelecionado: null,
    orcamentoAtual: null,
    servicoSelecionado: null,
    produtosSelecionados: [],
    documentoAtual: null,
    configuracoes: {},
    loading: false,
    erros: []
});

const APP_STATE_KEYS = Object.freeze(Object.keys(APP_STATE_DEFAULTS));

const AppState = {
    estado: null,
    assinantes: {},

    getState() {
        this.garantirEstado();
        return this.copiarValor(this.estado);
    },

    setState(chave, valor) {
        this.garantirEstado();

        if (!this.chaveValida(chave)) {
            return this.respostaChaveInvalida(chave);
        }

        const valorAnterior = this.getItem(chave);
        const novoValor = this.copiarValor(valor);

        if (this.valoresIguais(this.estado[chave], novoValor)) {
            return false;
        }

        this.estado[chave] = novoValor;

        const valorAtual = this.getItem(chave);
        this.notificarItem(chave, valorAtual, valorAnterior, "setState");
        this.notificarEstado({
            tipo: "setState",
            chave,
            valor: valorAtual,
            valorAnterior
        });

        return true;
    },

    updateState(alteracoes = {}) {
        this.garantirEstado();

        if (!alteracoes || typeof alteracoes !== "object" || Array.isArray(alteracoes)) {
            console.warn("AppState.updateState recebeu alteracoes invalidas.", { alteracoes });
            return false;
        }

        const valoresAnteriores = {};
        const valoresAtuais = {};

        Object.keys(alteracoes).forEach(chave => {
            if (!this.chaveValida(chave)) {
                this.respostaChaveInvalida(chave);
                return;
            }

            const novoValor = this.copiarValor(alteracoes[chave]);

            if (this.valoresIguais(this.estado[chave], novoValor)) {
                return;
            }

            valoresAnteriores[chave] = this.getItem(chave);
            this.estado[chave] = novoValor;
            valoresAtuais[chave] = this.getItem(chave);
        });

        const chavesAlteradas = Object.keys(valoresAtuais);

        if (chavesAlteradas.length === 0) {
            return false;
        }

        chavesAlteradas.forEach(chave => {
            this.notificarItem(chave, valoresAtuais[chave], valoresAnteriores[chave], "updateState");
        });

        this.notificarEstado({
            tipo: "updateState",
            chaves: chavesAlteradas,
            alteracoes: this.copiarValor(valoresAtuais),
            valoresAnteriores: this.copiarValor(valoresAnteriores)
        });

        return true;
    },

    clearState() {
        this.garantirEstado();

        const estadoAnterior = this.getState();
        this.estado = this.criarEstadoInicial();
        const estadoAtual = this.getState();

        APP_STATE_KEYS.forEach(chave => {
            if (!this.valoresIguais(estadoAnterior[chave], estadoAtual[chave])) {
                this.notificarItem(chave, estadoAtual[chave], estadoAnterior[chave], "clearState");
            }
        });

        this.notificarLimpeza(estadoAnterior, estadoAtual);
        this.notificarEstado({
            tipo: "clearState",
            estadoAnterior,
            estadoAtual
        });

        return true;
    },

    getItem(chave) {
        this.garantirEstado();

        if (!this.chaveValida(chave)) {
            return undefined;
        }

        return this.copiarValor(this.estado[chave]);
    },

    removeItem(chave) {
        this.garantirEstado();

        if (!this.chaveValida(chave)) {
            return this.respostaChaveInvalida(chave);
        }

        const estadoInicial = this.criarEstadoInicial();
        const valorAnterior = this.getItem(chave);
        const valorPadrao = this.copiarValor(estadoInicial[chave]);

        if (this.valoresIguais(this.estado[chave], valorPadrao)) {
            return false;
        }

        this.estado[chave] = valorPadrao;

        const valorAtual = this.getItem(chave);
        this.notificarItem(chave, valorAtual, valorAnterior, "removeItem");
        this.notificarEstado({
            tipo: "removeItem",
            chave,
            valor: valorAtual,
            valorAnterior
        });

        return true;
    },

    subscribe(chave, callback) {
        this.garantirEstado();

        if (!this.chaveValida(chave)) {
            return this.respostaChaveInvalida(chave);
        }

        if (typeof callback !== "function") {
            console.warn("AppState.subscribe recebeu callback invalido.", { chave, callback });
            return false;
        }

        if (!this.assinantes[chave]) {
            this.assinantes[chave] = new Set();
        }

        this.assinantes[chave].add(callback);
        return () => this.unsubscribe(chave, callback);
    },

    unsubscribe(chave, callback) {
        this.garantirEstado();

        if (!this.chaveValida(chave) || !this.assinantes[chave]) {
            return false;
        }

        if (!callback) {
            delete this.assinantes[chave];
            return true;
        }

        const removido = this.assinantes[chave].delete(callback);

        if (this.assinantes[chave].size === 0) {
            delete this.assinantes[chave];
        }

        return removido;
    },

    criarEstadoInicial() {
        return this.copiarValor(APP_STATE_DEFAULTS);
    },

    garantirEstado() {
        if (!this.estado) {
            this.estado = this.criarEstadoInicial();
        }

        if (!this.assinantes) {
            this.assinantes = {};
        }
    },

    chaveValida(chave) {
        return APP_STATE_KEYS.includes(chave);
    },

    notificarItem(chave, valor, valorAnterior, origem) {
        const payload = {
            origem,
            chave,
            valor: this.copiarValor(valor),
            valorAnterior: this.copiarValor(valorAnterior),
            estado: this.getState()
        };

        this.notificarAssinantes(chave, payload);

        if (typeof AppStateEvents !== "undefined" && AppStateEvents && typeof AppStateEvents.itemAlterado === "function") {
            return AppStateEvents.itemAlterado(payload);
        }

        return this.emitirEvento("app.state.item_changed", payload);
    },

    notificarEstado(payload = {}) {
        const dados = {
            ...payload,
            estado: this.getState()
        };

        if (typeof AppStateEvents !== "undefined" && AppStateEvents && typeof AppStateEvents.estadoAlterado === "function") {
            return AppStateEvents.estadoAlterado(dados);
        }

        return this.emitirEvento("app.state.changed", dados);
    },

    notificarLimpeza(estadoAnterior, estadoAtual) {
        const payload = {
            estadoAnterior: this.copiarValor(estadoAnterior),
            estadoAtual: this.copiarValor(estadoAtual)
        };

        if (typeof AppStateEvents !== "undefined" && AppStateEvents && typeof AppStateEvents.estadoLimpo === "function") {
            return AppStateEvents.estadoLimpo(payload);
        }

        return this.emitirEvento("app.state.cleared", payload);
    },

    notificarAssinantes(chave, payload) {
        const callbacks = Array.from(this.assinantes[chave] || []);

        callbacks.forEach(callback => {
            try {
                callback(payload.valor, payload.valorAnterior, payload);
            } catch (erro) {
                console.error("Erro em assinante do AppState.", { chave, erro });
            }
        });
    },

    emitirEvento(evento, payload = {}) {
        if (typeof EventBus === "undefined" || !EventBus || typeof EventBus.emit !== "function") {
            return null;
        }

        return EventBus.emit(evento, payload);
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

    valoresIguais(valorA, valorB) {
        if (Object.is(valorA, valorB)) {
            return true;
        }

        try {
            return JSON.stringify(valorA) === JSON.stringify(valorB);
        } catch (erro) {
            return false;
        }
    },

    respostaChaveInvalida(chave) {
        console.warn("AppState recebeu chave invalida.", {
            chave,
            chavesPermitidas: APP_STATE_KEYS
        });
        return false;
    }
};
