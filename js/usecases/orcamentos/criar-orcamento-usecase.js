const CriarOrcamentoUseCase = {
    async executar(dados = {}, orchestrator = OrcamentoOrchestrator) {
        try {
            return orchestrator.iniciar(dados);
        } catch (erro) {
            return {
                sucesso: false,
                contexto: OrcamentoContext.criar(),
                erros: [erro.message || "Erro ao criar contexto de Orcamento."],
                detalhes: {}
            };
        }
    }
};
