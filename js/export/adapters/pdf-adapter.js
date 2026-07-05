const PdfAdapter = {
    tipo: "PDF",

    gerar(exportacao = {}) {
        const preparo = this.preparar(exportacao);

        if (!preparo.sucesso) {
            return preparo;
        }

        return {
            sucesso: true,
            formato: this.tipo,
            arquivo: null,
            blob: null,
            url: null,
            exportacao: preparo.exportacao,
            erros: [],
            detalhes: {
                simulado: true,
                bibliotecaExterna: false,
                geracaoEfetiva: false,
                download: false
            }
        };
    },

    validar(exportacao = {}) {
        const erros = [];

        if (!exportacao || typeof exportacao !== "object") {
            erros.push("Exportacao PDF invalida.");
        }

        if (exportacao.formato !== "PDF") {
            erros.push("PdfAdapter aceita apenas formato PDF.");
        }

        if (!exportacao.html || typeof exportacao.html !== "string") {
            erros.push("PdfAdapter precisa receber HTML renderizado.");
        }

        if (!exportacao.documento) {
            erros.push("PdfAdapter precisa receber Documento Comercial.");
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    preparar(exportacao = {}) {
        const validacao = this.validar(exportacao);

        if (!validacao.valido) {
            return {
                sucesso: false,
                formato: this.tipo,
                exportacao: null,
                erros: validacao.erros,
                detalhes: {
                    validacao
                }
            };
        }

        return {
            sucesso: true,
            formato: this.tipo,
            exportacao: {
                tipo: "PDF_COMERCIAL_SIMULADO",
                status: "PREPARADO",
                nomeArquivo: exportacao.nomeArquivo,
                mimeType: "application/pdf",
                extensao: "pdf",
                origemHtml: true,
                geracaoEfetiva: false,
                download: false,
                bibliotecaExterna: false,
                prontoPara: "PDF_REAL_FUTURO"
            },
            erros: [],
            detalhes: {
                validacao
            }
        };
    }
};
