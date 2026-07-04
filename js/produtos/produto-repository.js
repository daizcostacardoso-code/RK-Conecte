const ProdutoRepository = {
    collection: "produtos",
    adapter: null,

    configurar(adapter) {
        this.adapter = adapter;
        return this;
    },

    obterAdapter() {
        const adapter = this.adapter || (typeof MemoryAdapter !== "undefined" ? MemoryAdapter : null);

        if (typeof StorageAdapterContract === "undefined" || !StorageAdapterContract.validar(adapter)) {
            throw new Error("ProdutoRepository precisa de um adapter valido.");
        }

        return adapter;
    },

    async salvarProduto(produto) {
        const normalizado = this.normalizarProduto(produto);
        return this.obterAdapter().save(this.collection, normalizado.id, normalizado);
    },

    async buscarProduto(id) {
        if (!id) return null;
        return this.obterAdapter().get(this.collection, id);
    },

    async listarProdutos() {
        return this.obterAdapter().list(this.collection);
    },

    async atualizarProduto(id, dados) {
        if (!id) return null;
        return this.obterAdapter().update(this.collection, id, dados);
    },

    async removerProduto(id) {
        if (!id) return false;
        return this.obterAdapter().delete(this.collection, id);
    },

    normalizarProduto(produto = {}) {
        if (!produto || typeof produto !== "object") {
            throw new Error("Produto invalido para salvar.");
        }

        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.normalizar === "function") {
            return ProdutoModel.normalizar(produto);
        }

        return {
            ...produto,
            id: produto.id || this.criarId()
        };
    },

    criarId() {
        return `prd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
};

function criarProdutoRepository(adapter) {
    return Object.create(ProdutoRepository).configurar(adapter);
}
