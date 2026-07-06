const AlterarResponsavelProducaoUseCase = {
    async executar(id, responsavel = "", usuario = "Sistema", service = ProducaoService) {
        try {
            return service.alterarResponsavel(id, responsavel, usuario);
        } catch (erro) {
            return {
                sucesso: false,
                ordem: null,
                erros: [erro.message || "Erro ao alterar responsavel da producao."]
            };
        }
    }
};
