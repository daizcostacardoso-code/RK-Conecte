const RenderizarDocumentoUseCase = {
    executar(documento = {}, renderer = DocumentHtmlRenderer) {
        try {
            const resultado = renderer.renderizar(documento);

            if (!resultado.sucesso) {
                return {
                    sucesso: false,
                    html: "",
                    erros: resultado.erros || ["Erro ao renderizar Documento Comercial."]
                };
            }

            return {
                sucesso: true,
                html: resultado.html || "",
                erros: []
            };
        } catch (erro) {
            return {
                sucesso: false,
                html: "",
                erros: [erro.message || "Erro ao executar RenderizarDocumentoUseCase."]
            };
        }
    }
};
