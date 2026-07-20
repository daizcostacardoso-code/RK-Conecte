const OrcamentoStorage = {
    async carregarAtual() {
        try {
            if (typeof db !== "undefined" && db) {
                const documento = await db.collection("orcamentos").doc("atual").get();
                if (documento.exists) return documento.data();
            }
        } catch (erro) {
            console.warn("Não foi possível carregar o orçamento da nuvem.", erro);
        }

        return Storage.carregar(Config.storage.orcamentoAtual, null);
    },

    async salvarAtual(dados) {
        Storage.salvar(Config.storage.orcamentoAtual, dados);

        try {
            if (typeof db === "undefined" || !db) {
                throw new Error("Firebase indisponível");
            }

            await db.collection("orcamentos").doc("atual").set(dados, { merge: true });
            return true;
        } catch (erro) {
            console.warn("Orçamento salvo localmente. Nuvem indisponível no momento.", erro);
            return false;
        }
    }
};
