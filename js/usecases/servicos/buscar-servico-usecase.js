const BuscarServicoUseCase = {
    async executar(entrada, service = ServicoService) {
        try {
            const id = typeof entrada === "object" ? entrada?.id : entrada;
            return service.buscarServico(id);
        } catch (erro) {
            return {
                sucesso: false,
                servico: null,
                erros: [erro.message || "Erro ao buscar Servico."]
            };
        }
    }
};
