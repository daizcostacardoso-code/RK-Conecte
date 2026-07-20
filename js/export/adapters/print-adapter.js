const PrintAdapter = {
    tipo: "PRINT",

    gerar(exportacao = {}) {
        const preparo = this.preparar(exportacao);

        if (!preparo.sucesso) {
            return preparo;
        }

        return {
            sucesso: true,
            formato: this.tipo,
            html: exportacao.html || "",
            impressao: preparo.exportacao,
            erros: [],
            detalhes: {
                execucaoAutomatica: false,
                windowPrint: false
            }
        };
    },

    validar(exportacao = {}) {
        const erros = [];

        if (!exportacao || typeof exportacao !== "object") {
            erros.push("Exportacao de impressao invalida.");
        }

        if (exportacao.formato !== "PRINT") {
            erros.push("PrintAdapter aceita apenas formato PRINT.");
        }

        if (!exportacao.html || typeof exportacao.html !== "string") {
            erros.push("PrintAdapter precisa receber HTML renderizado.");
        }

        if (!exportacao.documento) {
            erros.push("PrintAdapter precisa receber Documento Comercial.");
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
                tipo: "DOCUMENTO_COMERCIAL_IMPRESSAO",
                status: "PREPARADO",
                nomeArquivo: exportacao.nomeArquivo,
                mimeType: "text/html",
                extensao: "html",
                execucaoAutomatica: false,
                windowPrint: false,
                download: false,
                prontoPara: "IMPRESSAO_FUTURA"
            },
            erros: [],
            detalhes: {
                validacao
            }
        };
    }
};
