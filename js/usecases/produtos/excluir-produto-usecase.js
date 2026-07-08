const ExcluirProdutoUseCase = {
    async executar(id, service = ProdutoService) {
        try {
            return service.desativarProduto(id);
        } catch (erro) {
            return {
                sucesso: false,
                produto: null,
                erros: [erro.message || "Erro ao inativar Produto."]
            };
        }
    }
};
