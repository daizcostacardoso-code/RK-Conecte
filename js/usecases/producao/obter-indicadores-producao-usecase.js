const ObterIndicadoresProducaoUseCase = {
    async executar(filtros = {}, service = ProducaoService) {
        try {
            return service.obterIndicadores(filtros);
        } catch (erro) {
            return {
                sucesso: false,
                indicadores: {
                    pendentes: 0,
                    planejadas: 0,
                    liberadas: 0,
                    emProducao: 0,
                    finalizadas: 0,
                    urgentes: 0,
                    total: 0
                },
                erros: [erro.message || "Erro ao obter indicadores de producao."]
            };
        }
    }
};
