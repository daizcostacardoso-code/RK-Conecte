const BuscarClienteUseCase = {
    async executar(entrada, service = ClienteService) {
        try {
            const id = typeof entrada === "object" ? entrada?.id : entrada;
            return service.buscarCliente(id);
        } catch (erro) {
            return {
                sucesso: false,
                cliente: null,
                erros: [erro.message || "Erro ao buscar Cliente."]
            };
        }
    }
};
