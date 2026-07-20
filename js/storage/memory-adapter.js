const MemoryAdapter = {
    store: {},

    async save(collection, id, data) {
        this.validarEntrada(collection, id);
        this.garantirColecao(collection);

        const registro = this.clonar({
            ...(data || {}),
            id
        });

        this.store[collection][id] = registro;
        return this.clonar(registro);
    },

    async get(collection, id) {
        this.validarEntrada(collection, id);
        const registro = this.store[collection]?.[id] || null;
        return this.clonar(registro);
    },

    async list(collection) {
        this.validarColecao(collection);
        this.garantirColecao(collection);
        return Object.values(this.store[collection]).map(registro => this.clonar(registro));
    },

    async update(collection, id, data) {
        this.validarEntrada(collection, id);
        this.garantirColecao(collection);

        if (!this.store[collection][id]) {
            return null;
        }

        const atualizado = {
            ...this.store[collection][id],
            ...(data || {}),
            id
        };

        this.store[collection][id] = this.clonar(atualizado);
        return this.clonar(atualizado);
    },

    async delete(collection, id) {
        this.validarEntrada(collection, id);

        if (!this.store[collection] || !this.store[collection][id]) {
            return false;
        }

        delete this.store[collection][id];
        return true;
    },

    clear(collection) {
        if (collection) {
            delete this.store[collection];
            return true;
        }

        this.store = {};
        return true;
    },

    garantirColecao(collection) {
        if (!this.store[collection]) {
            this.store[collection] = {};
        }
    },

    validarColecao(collection) {
        if (!collection || typeof collection !== "string") {
            throw new Error("Colecao invalida para MemoryAdapter.");
        }
    },

    validarEntrada(collection, id) {
        this.validarColecao(collection);

        if (!id || typeof id !== "string") {
            throw new Error("Id invalido para MemoryAdapter.");
        }
    },

    clonar(valor) {
        if (valor === null || valor === undefined) {
            return valor;
        }

        return JSON.parse(JSON.stringify(valor));
    }
};

function criarMemoryAdapter() {
    return {
        ...MemoryAdapter,
        store: {}
    };
}

