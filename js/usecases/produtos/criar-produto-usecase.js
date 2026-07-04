const CriarProdutoUseCase = {
    async executar(dados = {}, service = ProdutoService) {
        try {
            return service.criarProduto(dados);
        } catch (erro) {
            return {
                sucesso: false,
                produto: null,
                erros: [erro.message || "Erro ao criar Produto."]
            };
        }
    }
};
