const LocalStorageAdapter = {
    keyPrefix: "rk_conecte_",

    async save(collection, id, data) {
        this.validarEntrada(collection, id);
        const registros = this.carregarColecao(collection);
        const registro = this.clonar({
            ...(data || {}),
            id
        });

        registros[id] = registro;
        this.salvarColecao(collection, registros);
        return this.clonar(registro);
    },

    async get(collection, id) {
        this.validarEntrada(collection, id);
        const registros = this.carregarColecao(collection);
        return this.clonar(registros[id] || null);
    },

    async list(collection) {
        this.validarColecao(collection);
        return Object.values(this.carregarColecao(collection)).map(registro => this.clonar(registro));
    },

    async update(collection, id, data) {
        this.validarEntrada(collection, id);
        const registros = this.carregarColecao(collection);

        if (!registros[id]) {
            return null;
        }

        const atualizado = {
            ...registros[id],
            ...(data || {}),
            id
        };

        registros[id] = atualizado;
        this.salvarColecao(collection, registros);
        return this.clonar(atualizado);
    },

    async delete(collection, id) {
        this.validarEntrada(collection, id);
        const registros = this.carregarColecao(collection);

        if (!registros[id]) {
            return false;
        }

        delete registros[id];
        this.salvarColecao(collection, registros);
        return true;
    },

    carregarColecao(collection) {
        const chave = this.obterChave(collection);

        try {
            const bruto = localStorage.getItem(chave);
            const dados = bruto ? JSON.parse(bruto) : [];
            return this.normalizarMapa(dados);
        } catch (erro) {
            console.warn("Nao foi possivel carregar colecao local.", collection, erro);
            return {};
        }
    },

    salvarColecao(collection, registros = {}) {
        const chave = this.obterChave(collection);
        const lista = Object.values(registros).sort((a, b) => {
            const dataA = new Date(a.atualizadoEm || a.ultimaAtualizacao || a.datas?.atualizacao || 0).getTime();
            const dataB = new Date(b.atualizadoEm || b.ultimaAtualizacao || b.datas?.atualizacao || 0).getTime();
            return dataB - dataA;
        });

        localStorage.setItem(chave, JSON.stringify(lista));
        return true;
    },

    normalizarMapa(dados) {
        const lista = Array.isArray(dados) ? dados : Object.values(dados || {});

        return lista.reduce((mapa, item) => {
            if (item && item.id) {
                mapa[item.id] = item;
            }

            return mapa;
        }, {});
    },

    obterChave(collection) {
        const storageConfig = typeof Config !== "undefined" && Config.storage ? Config.storage : {};
        return storageConfig[collection] || `${this.keyPrefix}${collection}`;
    },

    validarColecao(collection) {
        if (!collection || typeof collection !== "string") {
            throw new Error("Colecao invalida para LocalStorageAdapter.");
        }
    },

    validarEntrada(collection, id) {
        this.validarColecao(collection);

        if (!id || typeof id !== "string") {
            throw new Error("Id invalido para LocalStorageAdapter.");
        }
    },

    clonar(valor) {
        if (valor === null || valor === undefined) {
            return valor;
        }

        return JSON.parse(JSON.stringify(valor));
    }
};

function criarLocalStorageAdapter() {
    return {
        ...LocalStorageAdapter
    };
}
