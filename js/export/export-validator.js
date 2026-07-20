const ExportValidator = {
    validar(exportacao = {}) {
        const erros = [];

        if (!exportacao || typeof exportacao !== "object") {
            return {
                valido: false,
                erros: ["Exportacao invalida."]
            };
        }

        this.validarFormato(exportacao.formato, erros);
        this.validarDocumento(exportacao.documento, erros);
        this.validarHtml(exportacao.html, erros);

        return {
            valido: erros.length === 0,
            erros
        };
    },

    validarFormato(formato, erros = []) {
        const formatoNormalizado = typeof ExportModel !== "undefined"
            ? ExportModel.normalizarFormato(formato)
            : String(formato || "").toUpperCase();

        if (!["PDF", "PRINT"].includes(formatoNormalizado)) {
            erros.push("Formato de exportacao nao suportado.");
        }
    },

    validarDocumento(documento = {}, erros = []) {
        if (!documento || typeof documento !== "object") {
            erros.push("Documento Comercial e obrigatorio para exportacao.");
            return;
        }

        if (typeof DocumentService !== "undefined" && typeof DocumentService.validarDocumento === "function") {
            const validacaoDocumento = DocumentService.validarDocumento(documento);

            if (!validacaoDocumento.valido) {
                erros.push(...validacaoDocumento.erros);
            }
        }

        if (typeof DocumentRenderer !== "undefined" && typeof DocumentRenderer.validarDocumento === "function") {
            const validacaoRenderizacao = DocumentRenderer.validarDocumento(documento);

            if (!validacaoRenderizacao.valido) {
                erros.push(...validacaoRenderizacao.erros);
            }
        }
    },

    validarHtml(html, erros = []) {
        if (typeof html !== "string" || !html.trim()) {
            erros.push("HTML renderizado e obrigatorio para exportacao.");
        }
    }
};
