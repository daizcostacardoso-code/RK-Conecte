const CalcularOrcamentoUseCase = {
    async executar(contexto = {}, dadosCalculo = {}, orchestrator = OrcamentoOrchestrator) {
        try {
            return orchestrator.calcular(contexto, dadosCalculo);
        } catch (erro) {
            return {
                sucesso: false,
                contexto: OrcamentoContext.normalizar(contexto),
                erros: [erro.message || "Erro ao calcular Orcamento."],
                detalhes: {}
            };
        }
    }
};
