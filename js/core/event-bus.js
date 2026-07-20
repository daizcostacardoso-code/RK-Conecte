const EventBus = {
    listeners: {},

    on(evento, callback) {
        if (!evento || typeof callback !== "function") {
            console.warn("EventBus.on recebeu parametros invalidos.", { evento, callback });
            return () => false;
        }

        if (!this.listeners[evento]) {
            this.listeners[evento] = new Set();
        }

        this.listeners[evento].add(callback);
        return () => this.off(evento, callback);
    },

    off(evento, callback) {
        if (!evento || !this.listeners[evento]) {
            return false;
        }

        if (!callback) {
            return this.clear(evento);
        }

        const removido = this.listeners[evento].delete(callback);

        if (this.listeners[evento].size === 0) {
            delete this.listeners[evento];
        }

        return removido;
    },

    emit(evento, payload = {}) {
        const callbacks = Array.from(this.listeners[evento] || []);
        const erros = [];

        callbacks.forEach(callback => {
            try {
                callback(payload, evento);
            } catch (erro) {
                erros.push(erro);
                console.error("Erro em listener do EventBus.", { evento, erro });
            }
        });

        return {
            evento,
            total: callbacks.length,
            erros
        };
    },

    once(evento, callback) {
        if (typeof callback !== "function") {
            console.warn("EventBus.once recebeu callback invalido.", { evento, callback });
            return () => false;
        }

        const executarUmaVez = (payload, nomeEvento) => {
            this.off(evento, executarUmaVez);
            callback(payload, nomeEvento);
        };

        return this.on(evento, executarUmaVez);
    },

    clear(evento) {
        if (evento) {
            delete this.listeners[evento];
            return true;
        }

        this.listeners = {};
        return true;
    }
};

