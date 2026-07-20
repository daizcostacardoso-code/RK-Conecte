const DocumentPrintRenderer = {
    renderizar(documento = {}) {
        return this.prepararImpressao(documento);
    },

    prepararImpressao(documento = {}) {
        const resultadoHtml = DocumentHtmlRenderer.renderizar(documento);

        if (!resultadoHtml.sucesso) {
            return {
                sucesso: false,
                html: "",
                impressao: null,
                erros: resultadoHtml.erros
            };
        }

        return {
            sucesso: true,
            html: resultadoHtml.html,
            impressao: {
                tipo: "DOCUMENTO_COMERCIAL_IMPRESSAO",
                status: "PREPARADO",
                execucaoAutomatica: false,
                prontoPara: "IMPRESSAO_FUTURA"
            },
            erros: []
        };
    }
};

const PrintRenderer = DocumentPrintRenderer;
