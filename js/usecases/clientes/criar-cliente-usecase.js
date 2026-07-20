const CriarClienteUseCase = {
    async executar(dados = {}, service = ClienteService) {
        try {
            return service.criarCliente(dados);
        } catch (erro) {
            return {
                sucesso: false,
                cliente: null,
                erros: [erro.message || "Erro ao criar Cliente."]
            };
        }
    }
};
