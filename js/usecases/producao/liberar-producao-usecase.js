const LiberarProducaoUseCase = {
    async executar(id, usuario = "Sistema", service = ProducaoService) {
        try {
            return service.liberarOrdem(id, usuario);
        } catch (erro) {
            return {
                sucesso: false,
                ordem: null,
                erros: [erro.message || "Erro ao liberar producao."]
            };
        }
    }
};
