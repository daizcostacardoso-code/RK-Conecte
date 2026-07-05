const GerarPdfUseCase = {
    executar(contexto = {}, service = PdfService) {
        try {
            return service.prepararExportacao(contexto);
        } catch (erro) {
            return {
                sucesso: false,
                modelo: null,
                template: null,
                exportacao: null,
                erros: [erro.message || "Erro ao executar GerarPdfUseCase."],
                detalhes: {}
            };
        }
    }
};
