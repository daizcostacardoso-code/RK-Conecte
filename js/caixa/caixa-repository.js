const CaixaRepository = {
    chaveLocal: "vidracaria_caixa_empresa",
    colecaoFirestore: "caixa_empresa",

    configurar(opcoes = {}) {
        this.chaveLocal = opcoes.chaveLocal || this.chaveLocal;
        this.colecaoFirestore = opcoes.colecaoFirestore || this.colecaoFirestore;
        return this;
    },

    async listar() {
        const locais = CaixaModel.normalizarLista(this.listarLocal());
        const nuvem = CaixaModel.normalizarLista(await this.listarFirestore());
        const mesclados = this.mesclarListas(locais, nuvem);

        this.salvarLocal(mesclados);
        return mesclados;
    },

    async salvar(movimento) {
        const normalizado = CaixaModel.criar(movimento);
        const locais = this.mesclarListas(this.listarLocal(), [normalizado]);
        this.salvarLocal(locais);

        const salvoNuvem = await this.salvarFirestore(normalizado);
        if (salvoNuvem && salvoNuvem.idFirestore) {
            const atualizados = this.mesclarListas(this.listarLocal(), [salvoNuvem]);
            this.salvarLocal(atualizados);
            return salvoNuvem;
        }

        return normalizado;
    },

    async atualizar(id, dados = {}) {
        const lista = CaixaModel.normalizarLista(this.listarLocal());
        const indice = this.indicePorId(lista, id);
        if (indice < 0) return null;

        const atualizado = CaixaModel.criar({
            ...lista[indice],
            ...dados,
            atualizadoEmISO: dados.atualizadoEmISO || new Date().toISOString()
        }, indice);

        lista[indice] = atualizado;
        this.salvarLocal(CaixaModel.ordenar(lista));
        await this.atualizarFirestore(atualizado, dados);

        return atualizado;
    },

    async cancelar(id) {
        return this.atualizar(id, {
            status: "cancelado",
            atualizadoEmISO: new Date().toISOString()
        });
    },

    async excluir(id) {
        const lista = CaixaModel.normalizarLista(this.listarLocal());
        const indice = this.indicePorId(lista, id);
        if (indice < 0) return false;

        const [removido] = lista.splice(indice, 1);
        this.salvarLocal(lista);
        await this.excluirFirestore(removido);
        return true;
    },

    async exportarJSON() {
        return CaixaModel.ordenar(await this.listar());
    },

    async importarJSON(lista) {
        const mesclados = this.mesclarListas(this.listarLocal(), Array.isArray(lista) ? lista : []);
        this.salvarLocal(mesclados);
        return mesclados;
    },

    listarLocal() {
        if (typeof Storage !== "undefined" && Storage && typeof Storage.carregar === "function") {
            const dados = Storage.carregar(this.chaveLocal, []);
            return Array.isArray(dados) ? dados : [];
        }

        try {
            const bruto = localStorage.getItem(this.chaveLocal);
            const dados = JSON.parse(bruto || "[]");
            return Array.isArray(dados) ? dados : [];
        } catch (erro) {
            console.error("Erro ao listar caixa local:", erro);
            return [];
        }
    },

    salvarLocal(lista) {
        const normalizada = CaixaModel.ordenar(lista);

        if (typeof Storage !== "undefined" && Storage && typeof Storage.salvar === "function") {
            Storage.salvar(this.chaveLocal, normalizada);
            return normalizada;
        }

        localStorage.setItem(this.chaveLocal, JSON.stringify(normalizada));
        return normalizada;
    },

    async listarFirestore() {
        try {
            if (!this.dbDisponivel()) return [];
            const snap = await db.collection(this.colecaoFirestore).limit(1000).get();
            const dados = [];
            snap.forEach(doc => dados.push({ idFirestore: doc.id, ...doc.data() }));
            return dados;
        } catch (erro) {
            console.error("Erro ao listar caixa no Firestore:", erro);
            return [];
        }
    },

    async salvarFirestore(movimento) {
        try {
            if (!this.dbDisponivel()) return null;

            if (movimento.idFirestore) {
                const refExistente = db.collection(this.colecaoFirestore).doc(movimento.idFirestore);
                await refExistente.set(movimento, { merge: true });
                return movimento;
            }

            const ref = await db.collection(this.colecaoFirestore).add(movimento);
            const atualizado = { ...movimento, idFirestore: ref.id };
            await ref.set({ idFirestore: ref.id }, { merge: true });
            return atualizado;
        } catch (erro) {
            console.error("Erro ao salvar caixa no Firestore:", erro);
            return null;
        }
    },

    async atualizarFirestore(movimento, dados = {}) {
        try {
            if (!this.dbDisponivel() || !movimento.idFirestore) return false;
            await db.collection(this.colecaoFirestore).doc(movimento.idFirestore).set({
                ...dados,
                idFirestore: movimento.idFirestore,
                atualizadoEmISO: movimento.atualizadoEmISO
            }, { merge: true });
            return true;
        } catch (erro) {
            console.error("Erro ao atualizar caixa no Firestore:", erro);
            return false;
        }
    },

    async excluirFirestore(movimento = {}) {
        try {
            if (!this.dbDisponivel() || !movimento.idFirestore) return false;
            await db.collection(this.colecaoFirestore).doc(movimento.idFirestore).delete();
            return true;
        } catch (erro) {
            console.error("Erro ao excluir caixa no Firestore:", erro);
            return false;
        }
    },

    mesclarListas(...listas) {
        const resultado = [];
        const indicePorIdentidade = new Map();

        listas.flat().forEach((movimento, indiceEntrada) => {
            const normalizado = CaixaModel.criar(movimento, indiceEntrada);
            const identidades = CaixaModel.identidades(normalizado, indiceEntrada);
            const indiceExistente = identidades
                .map(identidade => indicePorIdentidade.get(identidade))
                .find(indice => indice !== undefined);

            if (indiceExistente === undefined) {
                resultado.push(normalizado);
                CaixaModel.identidades(normalizado, resultado.length - 1)
                    .forEach(identidade => indicePorIdentidade.set(identidade, resultado.length - 1));
                return;
            }

            const anterior = resultado[indiceExistente];
            const combinado = CaixaModel.criar({
                ...anterior,
                ...normalizado,
                idLocal: anterior.idLocal || normalizado.idLocal,
                idFirestore: normalizado.idFirestore || anterior.idFirestore,
                criadoEmISO: anterior.criadoEmISO || normalizado.criadoEmISO
            }, indiceExistente);

            resultado[indiceExistente] = combinado;
            CaixaModel.identidades(combinado, indiceExistente)
                .forEach(identidade => indicePorIdentidade.set(identidade, indiceExistente));
        });

        return CaixaModel.ordenar(resultado);
    },

    indicePorId(lista, id) {
        const chave = String(id || "");
        return CaixaModel.normalizarLista(lista).findIndex((movimento, indice) => {
            return CaixaModel.identidades(movimento, indice).includes(chave);
        });
    },

    dbDisponivel() {
        return typeof db !== "undefined" && db && typeof db.collection === "function";
    }
};

window.CaixaRepository = CaixaRepository;
