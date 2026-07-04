const ProjetoStorage = {
    async listar() {
        try {
            if (typeof db !== "undefined" && db) {
                const snapshot = await db.collection("projetos").orderBy("datas.atualizacao", "desc").get();
                const projetos = snapshot.docs.map(documento => ProjetoModel.normalizar({
                    id: documento.id,
                    ...documento.data()
                }));

                this.salvarListaLocal(projetos);
                return projetos;
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Projetos na nuvem. Usando dados locais.", erro);
        }

        return this.listarLocal();
    },

    async carregar(id) {
        if (!id) return null;

        try {
            if (typeof db !== "undefined" && db) {
                const documento = await db.collection("projetos").doc(id).get();
                if (documento.exists) {
                    return ProjetoModel.normalizar({
                        id: documento.id,
                        ...documento.data()
                    });
                }
            }
        } catch (erro) {
            console.warn("Nao foi possivel carregar Projeto na nuvem. Usando dados locais.", erro);
        }

        return this.listarLocal().find(projeto => projeto.id === id) || null;
    },

    async salvar(projeto) {
        const normalizado = ProjetoModel.normalizar(projeto);
        this.salvarLocal(normalizado);

        try {
            if (typeof db === "undefined" || !db) {
                throw new Error("Firebase indisponivel");
            }

            await db.collection("projetos").doc(normalizado.id).set(normalizado, { merge: true });
            return {
                projeto: normalizado,
                nuvem: true
            };
        } catch (erro) {
            console.warn("Projeto salvo localmente. Nuvem indisponivel no momento.", erro);
            return {
                projeto: normalizado,
                nuvem: false
            };
        }
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

    listarLocal() {
        const projetos = Storage.carregar(Config.storage.projetos, []);
        return Array.isArray(projetos) ? projetos.map(projeto => ProjetoModel.normalizar(projeto)) : [];
    },

    salvarLocal(projeto) {
        const normalizado = ProjetoModel.normalizar(projeto);
        const projetos = this.listarLocal();
        const indice = projetos.findIndex(item => item.id === normalizado.id);

        if (indice >= 0) {
            projetos[indice] = normalizado;
        } else {
            projetos.unshift(normalizado);
        }

        this.salvarListaLocal(this.ordenarPorAtualizacao(projetos));
        this.salvarAtual(normalizado);
        return normalizado;
    },

    salvarListaLocal(projetos = []) {
        Storage.salvar(Config.storage.projetos, this.ordenarPorAtualizacao(projetos));
    },

    ordenarPorAtualizacao(projetos = []) {
        return [...projetos].sort((a, b) => {
            const dataA = new Date(a.datas?.atualizacao || 0).getTime();
            const dataB = new Date(b.datas?.atualizacao || 0).getTime();
            return dataB - dataA;
        });
    }
};

