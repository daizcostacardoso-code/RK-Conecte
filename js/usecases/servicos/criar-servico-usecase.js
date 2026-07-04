const CriarServicoUseCase = {
    async executar(dados = {}, service = ServicoService) {
        try {
            return service.criarServico(dados);
        } catch (erro) {
            return {
                sucesso: false,
                servico: null,
                erros: [erro.message || "Erro ao criar Servico."]
            };
        }
    }
};
