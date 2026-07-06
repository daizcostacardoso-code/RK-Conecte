const AlterarPrioridadeProducaoUseCase = {
    async executar(id, prioridade = "", usuario = "Sistema", service = ProducaoService) {
        try {
            return service.alterarPrioridade(id, prioridade, usuario);
        } catch (erro) {
            return {
                sucesso: false,
                ordem: null,
                erros: [erro.message || "Erro ao alterar prioridade da producao."]
            };
        }
    }
};
