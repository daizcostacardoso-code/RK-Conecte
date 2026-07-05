const CriarOrdemProducaoUseCase = {
    async executar(dados = {}, service = ProducaoService) {
        try {
            return service.criarOrdem(dados);
        } catch (erro) {
            return {
                sucesso: false,
                ordem: null,
                projeto: null,
                evento: null,
                workflowEvento: null,
                appState: false,
                erros: [erro.message || "Erro ao criar ordem de producao."],
                detalhes: {}
            };
        }
    }
};
