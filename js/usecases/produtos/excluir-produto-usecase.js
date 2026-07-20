const ExcluirProdutoUseCase = {
    async executar(id, service = ProdutoService) {
        try {
            return service.excluirProduto(id);
        } catch (erro) {
            return {
                sucesso: false,
                produto: null,
                erros: [erro.message || "Erro ao inativar Produto."]
            };
        }
    }
};
