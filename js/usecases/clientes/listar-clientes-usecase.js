const ListarClientesUseCase = {
    async executar(filtros = {}, service = ClienteService) {
        try {
            return service.listarClientes(filtros);
        } catch (erro) {
            return {
                sucesso: false,
                clientes: [],
                erros: [erro.message || "Erro ao listar Clientes."]
            };
        }
    }
};
