const ExportService = {
    exportar(documento = {}, opcoes = {}) {
        try {
            const formato = this.normalizarFormato(opcoes.formato || opcoes.tipo || opcoes.adapter);
            const resultadoHtml = this.obterHtml(documento, opcoes);

            if (!resultadoHtml.sucesso) {
                return this.respostaErro(resultadoHtml.erros, documento, "", formato);
            }

            const exportacao = ExportModel.criar({
                documento,
                html: resultadoHtml.html,
                formato,
                nomeArquivo: opcoes.nomeArquivo,
                opcoes,
                metadados: {
                    origem: "DOCUMENT_RENDERER",
                    adapter: formato,
                    documentoTipo: documento?.tipo,
                    documentoVersao: documento?.versao
                }
            });

            const validacao = this.validar(exportacao);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    formato,
                    documento,
                    html: resultadoHtml.html,
                    exportacao: null,
                    adapter: null,
                    arquivo: null,
                    download: false,
                    erros: validacao.erros,
                    detalhes: {
                        validacao
                    }
                };
            }

            const adapter = this.selecionarAdapter(formato, opcoes.adapters);

            if (!adapter) {
                return this.respostaErro([`Adapter nao encontrado para o formato ${formato}.`], documento, resultadoHtml.html, formato);
            }

            const resultadoAdapter = adapter.gerar(exportacao);

            if (!resultadoAdapter.sucesso) {
                return {
                    sucesso: false,
                    formato,
                    documento,
                    html: resultadoHtml.html,
                    exportacao: null,
                    adapter: {
                        tipo: adapter.tipo || formato
                    },
                    arquivo: null,
                    download: false,
                    erros: resultadoAdapter.erros || ["Erro ao executar adapter de exportacao."],
                    detalhes: {
                        validacao,
                        adapter: resultadoAdapter
                    }
                };
            }

            return {
                sucesso: true,
                formato,
                documento,
                html: resultadoHtml.html,
                exportacao: resultadoAdapter.exportacao || resultadoAdapter.impressao || null,
                adapter: {
                    tipo: adapter.tipo || formato,
                    status: "SIMULADO"
                },
                arquivo: resultadoAdapter.arquivo || null,
                download: false,
                erros: [],
                detalhes: {
                    validacao,
                    adapter: resultadoAdapter
                }
            };
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao exportar Documento Comercial."], documento, "", opcoes.formato);
        }
    },

    validar(exportacao = {}) {
        if (typeof ExportValidator !== "undefined" && typeof ExportValidator.validar === "function") {
            return ExportValidator.validar(exportacao);
        }

        const erros = [];

        if (!exportacao.documento) {
            erros.push("Documento Comercial e obrigatorio para exportacao.");
        }

        if (!exportacao.html) {
            erros.push("HTML renderizado e obrigatorio para exportacao.");
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    selecionarAdapter(formato = "PDF", adapters = {}) {
        const formatoNormalizado = this.normalizarFormato(formato);
        const disponiveis = this.obterAdapters(adapters);

        return disponiveis[formatoNormalizado] || null;
    },

    obterHtml(documento = {}, opcoes = {}) {
        if (typeof opcoes.html === "string" && opcoes.html.trim()) {
            return {
                sucesso: true,
                html: opcoes.html,
                erros: []
            };
        }

        const renderer = opcoes.renderer || (typeof DocumentHtmlRenderer !== "undefined" ? DocumentHtmlRenderer : null);

        if (!renderer || typeof renderer.renderizar !== "function") {
            return {
                sucesso: false,
                html: "",
                erros: ["DocumentHtmlRenderer nao esta disponivel para exportacao."]
            };
        }

        return renderer.renderizar(documento);
    },

    obterAdapters(adapters = {}) {
        return {
            PDF: adapters.PDF || adapters.pdf || (typeof PdfAdapter !== "undefined" ? PdfAdapter : null),
            PRINT: adapters.PRINT || adapters.print || adapters.IMPRESSAO || (typeof PrintAdapter !== "undefined" ? PrintAdapter : null)
        };
    },

    normalizarFormato(formato = "PDF") {
        if (typeof ExportModel !== "undefined" && typeof ExportModel.normalizarFormato === "function") {
            return ExportModel.normalizarFormato(formato);
        }

        const valor = String(formato || "PDF").toUpperCase();
        return valor === "PRINT" || valor === "IMPRESSAO" ? "PRINT" : "PDF";
    },

    respostaErro(erros = [], documento = null, html = "", formato = "PDF") {
        return {
            sucesso: false,
            formato: this.normalizarFormato(formato),
            documento,
            html,
            exportacao: null,
            adapter: null,
            arquivo: null,
            download: false,
            erros: Array.isArray(erros) ? erros : [String(erros || "Erro ao exportar Documento Comercial.")],
            detalhes: {}
        };
    }
};
