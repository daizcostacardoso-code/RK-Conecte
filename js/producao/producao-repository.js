const ProducaoRepository = {
    collection: "ordens_producao",
    adapter: null,

    configurar(adapter) {
        this.adapter = adapter;
        return this;
    },

    obterAdapter() {
        const adapter = this.adapter || (typeof MemoryAdapter !== "undefined" ? MemoryAdapter : null);

        if (typeof StorageAdapterContract === "undefined" || !StorageAdapterContract.validar(adapter)) {
            throw new Error("ProducaoRepository precisa de um adapter valido.");
        }

        return adapter;
    },

    async salvarOrdem(ordem) {
        const normalizada = this.normalizarOrdem(ordem);
        return this.obterAdapter().save(this.collection, normalizada.id, normalizada);
    },

    async buscarOrdem(id) {
        if (!id) return null;
        return this.obterAdapter().get(this.collection, id);
    },

    async listarOrdens() {
        return this.obterAdapter().list(this.collection);
    },

    async atualizarOrdem(id, dados) {
        if (!id) return null;
        const atual = await this.buscarOrdem(id);

        if (!atual) return null;

        const normalizada = this.normalizarOrdem({
            ...atual,
            ...(dados || {}),
            id
        });
        return this.obterAdapter().save(this.collection, id, normalizada);
    },

    async removerOrdem(id) {
        if (!id) return false;
        return this.obterAdapter().delete(this.collection, id);
    },

    normalizarOrdem(ordem = {}) {
        if (!ordem || typeof ordem !== "object") {
            throw new Error("Ordem de producao invalida para salvar.");
        }

        if (typeof ProducaoModel !== "undefined" && typeof ProducaoModel.normalizar === "function") {
            return ProducaoModel.normalizar(ordem);
        }

        return {
            ...ordem,
            id: ordem.id || this.criarId()
        };
    },

    criarId() {
        return `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
};

function criarProducaoRepository(adapter) {
    return Object.create(ProducaoRepository).configurar(adapter);
}
