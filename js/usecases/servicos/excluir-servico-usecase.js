const ExcluirServicoUseCase = {
    async executar(id, service = ServicoService) {
        try {
            return service.desativarServico(id);
        } catch (erro) {
            return {
                sucesso: false,
                servico: null,
                erros: [erro.message || "Erro ao inativar Servico."]
            };
        }
    }
};
