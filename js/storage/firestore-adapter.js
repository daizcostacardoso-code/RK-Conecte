const FirestoreAdapter = {
    colecoes: Object.freeze({
        projetos: "projetos",
        servicos: "servicos"
    }),

    async save(collection, id, data) {
        const referencia = this.obterDocumento(collection, id);
        const registro = this.clonar({ ...(data || {}), id });
        await referencia.set(registro);
        return this.clonar(registro);
    },

    async get(collection, id) {
        const referencia = this.obterDocumento(collection, id);
        const snapshot = await referencia.get();
        return snapshot.exists
            ? this.normalizarDocumento(snapshot)
            : null;
    },

    async list(collection) {
        const snapshot = await this.obterColecao(collection).get();
        return snapshot.docs.map(documento => this.normalizarDocumento(documento));
    },

    async update(collection, id, data) {
        const referencia = this.obterDocumento(collection, id);
        const snapshot = await referencia.get();
        if (!snapshot.exists) return null;

        const atualizado = this.clonar({
            ...(snapshot.data() || {}),
            ...(data || {}),
            id
        });
        await referencia.set(atualizado, { merge: true });
        return atualizado;
    },

    async delete(collection, id) {
        const referencia = this.obterDocumento(collection, id);
        const snapshot = await referencia.get();
        if (!snapshot.exists) return false;
        await referencia.delete();
        return true;
    },

    obterBanco() {
        const firestore = typeof db !== "undefined" && db
            ? db
            : globalThis.RKFirebase?.db;

        if (!firestore || typeof firestore.collection !== "function") {
            throw new Error("Dados temporariamente indisponiveis. Verifique a conexao e tente novamente.");
        }

        return firestore;
    },

    obterColecao(collection) {
        const nome = this.colecoes[collection];
        if (!nome) {
            throw new Error(`Colecao nao autorizada: ${collection || "vazia"}.`);
        }
        return this.obterBanco().collection(nome);
    },

    obterDocumento(collection, id) {
        this.validarId(id);
        return this.obterColecao(collection).doc(id);
    },

    validarId(id) {
        if (!id || typeof id !== "string" || id.includes("/")) {
            throw new Error("Id invalido para a operacao.");
        }
    },

    normalizarDocumento(documento) {
        return this.clonar({
            ...(documento.data() || {}),
            id: documento.id
        });
    },

    clonar(valor) {
        if (valor === null || valor === undefined) return valor;
        return JSON.parse(JSON.stringify(valor));
    }
};

function criarFirestoreAdapter() {
    return {
        ...FirestoreAdapter,
        colecoes: FirestoreAdapter.colecoes
    };
}

if (typeof window !== "undefined") {
    window.FirestoreAdapter = FirestoreAdapter;
    window.criarFirestoreAdapter = criarFirestoreAdapter;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { FirestoreAdapter, criarFirestoreAdapter };
}
