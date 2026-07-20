const ProjetoRepository = {
    collection: "projetos",
    adapter: null,

    configurar(adapter) {
        this.adapter = adapter;
        return this;
    },

    obterAdapter() {
        const adapter = this.adapter || (typeof MemoryAdapter !== "undefined" ? MemoryAdapter : null);

        if (!StorageAdapterContract.validar(adapter)) {
            throw new Error("ProjetoRepository precisa de um adapter valido.");
        }

        return adapter;
    },

    async salvarProjeto(projeto) {
        const normalizado = this.normalizarProjeto(projeto);
        return this.obterAdapter().save(this.collection, normalizado.id, normalizado);
    },

    async buscarProjeto(id) {
        return this.obterAdapter().get(this.collection, id);
    },

    async listarProjetos() {
        return this.obterAdapter().list(this.collection);
    },

    async atualizarProjeto(id, dados) {
        return this.obterAdapter().update(this.collection, id, dados);
    },

    async removerProjeto(id) {
        return this.obterAdapter().delete(this.collection, id);
    },

    normalizarProjeto(projeto = {}) {
        if (!projeto || typeof projeto !== "object") {
            throw new Error("Projeto invalido para salvar.");
        }

        const id = projeto.id || this.criarId();
        return {
            ...projeto,
            id
        };
    },

    criarId() {
        return `prj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
};

function criarProjetoRepository(adapter) {
    return Object.create(ProjetoRepository).configurar(adapter);
}

