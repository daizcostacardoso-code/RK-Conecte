const ValidarOrcamentoUseCase = {
    async executar(contexto = {}, orchestrator = OrcamentoOrchestrator) {
        try {
            return orchestrator.validar(contexto);
        } catch (erro) {
            return {
                sucesso: false,
                contexto: OrcamentoContext.normalizar(contexto),
                erros: [erro.message || "Erro ao validar Orcamento."],
                detalhes: {}
            };
        }
    }
};
