const FirestoreAdapter = {
    mensagemNaoImplementado: "FirestoreAdapter ainda não implementado nesta sprint.",

    async save(collection, id, data) {
        throw new Error(this.mensagemNaoImplementado);
    },

    async get(collection, id) {
        throw new Error(this.mensagemNaoImplementado);
    },

    async list(collection) {
        throw new Error(this.mensagemNaoImplementado);
    },

    async update(collection, id, data) {
        throw new Error(this.mensagemNaoImplementado);
    },

    async delete(collection, id) {
        throw new Error(this.mensagemNaoImplementado);
    }
};
