const AtualizarServicoUseCase = {
    async executar(id, alteracoes = {}, service = ServicoService) {
        try {
            return service.atualizarServico(id, alteracoes);
        } catch (erro) {
            return {
                sucesso: false,
                servico: null,
                erros: [erro.message || "Erro ao atualizar Servico."]
            };
        }
    }
};
