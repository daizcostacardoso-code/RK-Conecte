const DocumentRenderer = {
    renderizar(documento = {}) {
        const visualizacao = this.prepararVisualizacao(documento);

        return {
            sucesso: visualizacao.sucesso,
            html: "",
            erros: visualizacao.erros
        };
    },

    validarDocumento(documento = {}) {
        const erros = [];

        if (!documento || typeof documento !== "object") {
            return {
                valido: false,
                erros: ["Documento Comercial invalido para renderizacao."]
            };
        }

        if (documento.tipo !== "DOCUMENTO_COMERCIAL") {
            erros.push("Renderizador recebeu um documento fora do padrao DOCUMENTO_COMERCIAL.");
        }

        if (!documento.dados || typeof documento.dados !== "object") {
            erros.push("Documento Comercial precisa conter dados normalizados.");
        }

        if (!documento.secoes || typeof documento.secoes !== "object") {
            erros.push("Documento Comercial precisa conter secoes renderizaveis.");
        }

        [
            "cabecalho",
            "cliente",
            "projeto",
            "produtos",
            "totais",
            "rodape"
        ].forEach(secao => {
            if (!documento.secoes || !documento.secoes[secao]) {
                erros.push(`Secao obrigatoria ausente no Documento Comercial: ${secao}.`);
            }
        });

        if (typeof DocumentValidator !== "undefined" && typeof DocumentValidator.validar === "function") {
            const validacaoDominio = DocumentValidator.validar(documento);
            if (!validacaoDominio.valido) {
                erros.push(...validacaoDominio.erros);
            }
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    prepararVisualizacao(documento = {}) {
        const validacao = this.validarDocumento(documento);

        if (!validacao.valido) {
            return {
                sucesso: false,
                documento: null,
                secoes: {},
                ordem: [],
                metadados: {},
                erros: validacao.erros
            };
        }

        return {
            sucesso: true,
            documento,
            secoes: documento.secoes || {},
            ordem: Array.isArray(documento.ordem) ? documento.ordem : Object.keys(documento.secoes || {}),
            metadados: documento.metadados || {},
            erros: []
        };
    }
};
