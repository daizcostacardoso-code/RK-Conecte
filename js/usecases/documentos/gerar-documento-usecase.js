const GerarDocumentoUseCase = {
    executar(contexto = {}, service = DocumentService) {
        try {
            return service.prepararExportacao(contexto);
        } catch (erro) {
            return {
                sucesso: false,
                documento: null,
                exportacao: null,
                erros: [erro.message || "Erro ao executar GerarDocumentoUseCase."],
                detalhes: {}
            };
        }
    }
};
