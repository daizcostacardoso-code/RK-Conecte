const AtualizarProdutoUseCase = {
    async executar(id, alteracoes = {}, service = ProdutoService) {
        try {
            return service.atualizarProduto(id, alteracoes);
        } catch (erro) {
            return {
                sucesso: false,
                produto: null,
                erros: [erro.message || "Erro ao atualizar Produto."]
            };
        }
    }
};
