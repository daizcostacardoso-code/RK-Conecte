const Itens = {
    lista: [],

    adicionar(item) {
        this.lista.push(item);
    },

    remover(indice) {
        this.lista.splice(indice, 1);
    },

    limpar() {
        this.lista = [];
    },

    todos() {
        return this.lista;
    },

    carregar(itens) {
        this.lista = Array.isArray(itens) ? itens : [];
    }
};