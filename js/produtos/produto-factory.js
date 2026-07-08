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
            unidadeVenda: "unidade",
            unidade: "unidade",
            unidadeCalculo: "unidade",
            tipoCalculo: "unidade",
            regraCalculo: "unidade",
            custoUnitario: 0,
            precoCusto: 0,
            custo: 0,
            ativo: true,
            ...dados
        });
    },

    criarVazio() {
        return this.criarPadrao({
            nome: "Produto"
        });
    }
};
