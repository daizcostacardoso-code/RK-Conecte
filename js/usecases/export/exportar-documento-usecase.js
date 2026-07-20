const ExportarDocumentoUseCase = {
    executar(documento = {}, opcoes = {}, service = ExportService, renderer = DocumentHtmlRenderer) {
        try {
            const validacao = this.validarDocumento(documento);

            if (!validacao.valido) {
                return this.respostaErro(validacao.erros);
            }

            const resultadoHtml = renderer.renderizar(documento);

            if (!resultadoHtml.sucesso) {
                return this.respostaErro(resultadoHtml.erros);
            }

            return service.exportar(documento, {
                ...opcoes,
                html: resultadoHtml.html,
                renderer
            });
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao executar ExportarDocumentoUseCase."]);
        }
    },

    validarDocumento(documento = {}) {
        const erros = [];

        if (typeof DocumentService !== "undefined" && typeof DocumentService.validarDocumento === "function") {
            const validacaoDocumento = DocumentService.validarDocumento(documento);

            if (!validacaoDocumento.valido) {
                erros.push(...validacaoDocumento.erros);
            }
        }

        if (typeof DocumentRenderer !== "undefined" && typeof DocumentRenderer.prepararVisualizacao === "function") {
            const visualizacao = DocumentRenderer.prepararVisualizacao(documento);

            if (!visualizacao.sucesso) {
                erros.push(...visualizacao.erros);
            }
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    respostaErro(erros = []) {
        return {
            sucesso: false,
            formato: "",
            documento: null,
            html: "",
            exportacao: null,
            adapter: null,
            arquivo: null,
            download: false,
            erros: Array.isArray(erros) ? erros : [String(erros || "Erro ao exportar Documento Comercial.")],
            detalhes: {}
        };
    }
};
