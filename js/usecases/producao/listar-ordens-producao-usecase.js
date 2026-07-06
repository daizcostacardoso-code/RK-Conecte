const ListarOrdensProducaoUseCase = {
    async executar(filtros = {}, service = ProducaoService) {
        try {
            return service.listarOrdens(filtros);
        } catch (erro) {
            return {
                sucesso: false,
                ordens: [],
                erros: [erro.message || "Erro ao listar ordens de producao."]
            };
        }
    }
};
