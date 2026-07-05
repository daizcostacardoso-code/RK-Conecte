const APP_STATE_EVENT_TYPES = Object.freeze({
    CHANGED: "app.state.changed",
    ITEM_CHANGED: "app.state.item_changed",
    CLEARED: "app.state.cleared"
});

const AppStateEvents = {
    tipos: APP_STATE_EVENT_TYPES,

    emitir(evento, payload = {}) {
        if (typeof EventBus === "undefined" || !EventBus || typeof EventBus.emit !== "function") {
            return null;
        }

        return EventBus.emit(evento, {
            ...payload,
            evento,
            emitidoEm: this.agoraISO()
        });
    },

    estadoAlterado(payload = {}) {
        return this.emitir(this.tipos.CHANGED, payload);
    },

    itemAlterado(payload = {}) {
        return this.emitir(this.tipos.ITEM_CHANGED, payload);
    },

    estadoLimpo(payload = {}) {
        return this.emitir(this.tipos.CLEARED, payload);
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

const APP_STATE_EVENTS = APP_STATE_EVENT_TYPES;
