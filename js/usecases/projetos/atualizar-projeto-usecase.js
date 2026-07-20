const AtualizarProjetoUseCase = {
    async executar(id, alteracoes = {}, service = ProjetoService) {
        try {
            return service.atualizarProjeto(id, alteracoes);
        } catch (erro) {
            return {
                sucesso: false,
                projeto: null,
                erros: [erro.message || "Erro ao atualizar Projeto."]
            };
        }
    }
};
