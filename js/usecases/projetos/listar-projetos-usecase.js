const ListarProjetosUseCase = {
    async executar(filtros = {}, service = ProjetoService) {
        try {
            return service.listarProjetos(filtros);
        } catch (erro) {
            return {
                sucesso: false,
                projetos: [],
                erros: [erro.message || "Erro ao listar Projetos."]
            };
        }
    }
};
