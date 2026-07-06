const AtualizarChecklistProducaoUseCase = {
    async executar(id, itemId = "", concluido = false, usuario = "Sistema", service = ProducaoService) {
        try {
            return service.atualizarChecklist(id, itemId, concluido, usuario);
        } catch (erro) {
            return {
                sucesso: false,
                ordem: null,
                erros: [erro.message || "Erro ao atualizar checklist da producao."]
            };
        }
    }
};
