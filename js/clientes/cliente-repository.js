const ClienteRepository = {
    collection: "clientes",
    adapter: null,

    configurar(adapter) {
        this.adapter = adapter;
        return this;
    },

    obterAdapter() {
        const adapter = this.adapter || (typeof MemoryAdapter !== "undefined" ? MemoryAdapter : null);

        if (typeof StorageAdapterContract === "undefined" || !StorageAdapterContract.validar(adapter)) {
            throw new Error("ClienteRepository precisa de um adapter valido.");
        }

        return adapter;
    },

    async salvarCliente(cliente) {
        const normalizado = this.normalizarCliente(cliente);
        return this.obterAdapter().save(this.collection, normalizado.id, normalizado);
    },

    async buscarCliente(id) {
        if (!id) return null;
        return this.obterAdapter().get(this.collection, id);
    },

    async listarClientes() {
        return this.obterAdapter().list(this.collection);
    },

    async atualizarCliente(id, dados) {
        if (!id) return null;
        return this.obterAdapter().update(this.collection, id, dados);
    },

    async removerCliente(id) {
        if (!id) return false;
        return this.obterAdapter().delete(this.collection, id);
    },

    normalizarCliente(cliente = {}) {
        if (!cliente || typeof cliente !== "object") {
            throw new Error("Cliente invalido para salvar.");
        }

        if (typeof ClienteModel !== "undefined" && typeof ClienteModel.normalizar === "function") {
            return ClienteModel.normalizar(cliente);
        }

        return {
            ...cliente,
            id: cliente.id || this.criarId()
        };
    },

    criarId() {
        return `cli_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
};

function criarClienteRepository(adapter) {
    return Object.create(ClienteRepository).configurar(adapter);
}
