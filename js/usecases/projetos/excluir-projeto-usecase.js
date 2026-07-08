const ExcluirProjetoUseCase = {
    async executar(id, service = ProjetoService) {
        try {
            return service.desativarProjeto(id);
        } catch (erro) {
            return {
                sucesso: false,
                projeto: null,
                erros: [erro.message || "Erro ao inativar Projeto."]
            };
        }
    }
};
