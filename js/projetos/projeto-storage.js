const ProjetoStorage = {
    async listar() {
        const firestore = this.obterBanco();
        const snapshot = await firestore.collection("projetos").get();
        return this.ordenarPorAtualizacao(snapshot.docs.map(documento => ProjetoModel.normalizar({
            id: documento.id,
            ...documento.data()
        })));
    },

    async carregar(id) {
        if (!id) return null;

        const documento = await this.obterBanco().collection("projetos").doc(id).get();
        return documento.exists
            ? ProjetoModel.normalizar({ id: documento.id, ...documento.data() })
            : null;
    },

    async salvar(projeto) {
        const normalizado = ProjetoModel.normalizar(projeto);
        await this.obterBanco().collection("projetos").doc(normalizado.id).set(normalizado, { merge: true });
        return { projeto: normalizado, nuvem: true };
    },

    obterBanco() {
        const firestore = typeof db !== "undefined" && db ? db : globalThis.RKFirebase?.db;
        if (!firestore || typeof firestore.collection !== "function") {
            throw new Error("Firestore indisponivel para Projetos.");
        }
        return firestore;
    },

    salvarAtual(projeto) {
        const normalizado = ProjetoModel.normalizar(projeto);
        Storage.salvar(Config.storage.projetoAtual, normalizado);
        return normalizado;
    },

    carregarAtual() {
        const dados = Storage.carregar(Config.storage.projetoAtual, null);
        return dados ? ProjetoModel.normalizar(dados) : null;
    },

    ordenarPorAtualizacao(projetos = []) {
        return [...projetos].sort((a, b) => {
            const dataA = new Date(a.datas?.atualizacao || 0).getTime();
            const dataB = new Date(b.datas?.atualizacao || 0).getTime();
            return dataB - dataA;
        });
    }
};
