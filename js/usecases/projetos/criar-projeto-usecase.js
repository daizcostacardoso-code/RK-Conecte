const CriarProjetoUseCase = {
    async executar(dados = {}, service = ProjetoService) {
        try {
            return service.criarProjeto(dados);
        } catch (erro) {
            return {
                sucesso: false,
                projeto: null,
                erros: [erro.message || "Erro ao criar Projeto."]
            };
        }
    }
};
