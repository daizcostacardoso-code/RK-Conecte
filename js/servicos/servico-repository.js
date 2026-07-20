const ServicoRepository = {
    collection: "servicos",
    adapter: null,

    configurar(adapter) {
        this.adapter = adapter;
        return this;
    },

    obterAdapter() {
        const adapter = this.adapter
            || (typeof criarFirestoreAdapter === "function" ? criarFirestoreAdapter() : null)
            || (typeof FirestoreAdapter !== "undefined" ? FirestoreAdapter : null);

        if (typeof StorageAdapterContract === "undefined" || !StorageAdapterContract.validar(adapter)) {
            throw new Error("Camada de dados dos serviços indisponível.");
        }

        this.adapter = adapter;
        return adapter;
    },

    async salvarServico(servico) {
        const normalizado = this.normalizarServico(servico);
        return this.obterAdapter().save(this.collection, normalizado.id, normalizado);
    },

    async buscarServico(id) {
        if (!id) return null;
        return this.obterAdapter().get(this.collection, id);
    },

    async listarServicos() {
        return this.obterAdapter().list(this.collection);
    },

    async atualizarServico(id, dados) {
        if (!id) return null;
        return this.obterAdapter().update(this.collection, id, dados);
    },

    async removerServico(id) {
        if (!id) return false;
        return this.obterAdapter().delete(this.collection, id);
    },

    normalizarServico(servico = {}) {
        if (!servico || typeof servico !== "object") {
            throw new Error("Servico invalido para salvar.");
        }

        if (typeof ServicoModel !== "undefined" && typeof ServicoModel.normalizar === "function") {
            return ServicoModel.normalizar(servico);
        }

        return {
            ...servico,
            id: servico.id || this.criarId()
        };
    },

    criarId() {
        return `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
};

function criarServicoRepository(adapter) {
    return Object.create(ServicoRepository).configurar(adapter);
}
