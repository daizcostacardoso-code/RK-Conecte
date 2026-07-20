const ListarServicosUseCase = {
    async executar(filtros = {}, service = ServicoService) {
        try {
            return service.listarServicos(filtros);
        } catch (erro) {
            return {
                sucesso: false,
                servicos: [],
                erros: [erro.message || "Erro ao listar Servicos."]
            };
        }
    }
};
