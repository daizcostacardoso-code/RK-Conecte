const ProdutoFactory = {
    criar(dados = {}) {
        if (typeof criarProdutoBase === "function") {
            return criarProdutoBase(dados);
        }

        return ProdutoModel.criar(dados);
    },

    criarPadrao(dados = {}) {
        return this.criar({
            categoria: "vidro",
            subcategoria: "",
            unidadeVenda: "unidade",
            tipoCalculo: "unidade",
            precoCusto: 0,
            precoVenda: 0,
            margem: 0,
            ativo: true,
            atributos: {},
            ...dados
        });
    },

    criarVazio() {
        return this.criarPadrao({
            nome: "Produto"
        });
    }
};
