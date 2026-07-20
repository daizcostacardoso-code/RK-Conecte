const BuscarProdutoUseCase = {
    async executar(entrada, service = ProdutoService) {
        try {
            const id = typeof entrada === "object" ? entrada?.id : entrada;
            return service.buscarProduto(id);
        } catch (erro) {
            return {
                sucesso: false,
                produto: null,
                erros: [erro.message || "Erro ao buscar Produto."]
            };
        }
    }
};
