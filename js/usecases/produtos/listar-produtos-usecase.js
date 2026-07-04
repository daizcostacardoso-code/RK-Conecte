const ListarProdutosUseCase = {
    async executar(filtros = {}, service = ProdutoService) {
        try {
            return service.listarProdutos(filtros);
        } catch (erro) {
            return {
                sucesso: false,
                produtos: [],
                erros: [erro.message || "Erro ao listar Produtos."]
            };
        }
    }
};
