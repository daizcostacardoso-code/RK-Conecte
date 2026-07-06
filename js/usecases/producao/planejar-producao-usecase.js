const PlanejarProducaoUseCase = {
    async executar(id, dados = {}, usuario = "Sistema", service = ProducaoService) {
        try {
            return service.planejarOrdem(id, dados, usuario);
        } catch (erro) {
            return {
                sucesso: false,
                ordem: null,
                erros: [erro.message || "Erro ao planejar producao."]
            };
        }
    }
};
