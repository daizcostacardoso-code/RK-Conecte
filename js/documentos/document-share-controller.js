const DocumentShareController = {
    estado: {
        aberto: false,
        documento: null,
        previewHtml: "",
        mensagens: [],
        ultimaAcaoExportacao: "Nenhuma exportacao realizada."
    },

    iniciar() {
        if (typeof DocumentShareUI !== "undefined") {
            DocumentShareUI.configurar(this);
        }

        this.abrir();
    },

    abrir(documento = null) {
        const documentoAtual = this.normalizarDocumento(documento || this.obterDocumentoAtual());

        this.estado = {
            ...this.estado,
            aberto: true,
            documento: documentoAtual,
            previewHtml: "",
            ultimaAcaoExportacao: this.obterUltimaAcao()
        };

        this.salvarDocumentoAtual(documentoAtual);
        this.renderizar();
        return true;
    },

    fechar() {
        this.estado = {
            ...this.estado,
            aberto: false
        };

        this.renderizar();
        return true;
    },

    visualizar() {
        const validacao = this.validarDocumentoAtual();

        if (!validacao.valido) {
            return this.registrarMensagem(this.formatarErros(validacao.erros), "erro");
        }

        const resultado = DocumentHtmlRenderer.renderizar(this.estado.documento);

        if (!resultado.sucesso) {
            return this.registrarMensagem(this.formatarErros(resultado.erros), "erro");
        }

        this.estado.previewHtml = resultado.html;
        this.registrarAcao("Documento visualizado.");
        return this.registrarMensagem("Documento Comercial renderizado para visualizacao.", "sucesso");
    },

    exportarPdf() {
        const validacao = this.validarDocumentoAtual();

        if (!validacao.valido) {
            return this.registrarMensagem(this.formatarErros(validacao.erros), "erro");
        }

        const resultado = ExportService.exportar(this.estado.documento, {
            formato: "PDF",
            adapters: {
                PDF: typeof PdfAdapter !== "undefined" ? PdfAdapter : null
            }
        });

        if (!resultado.sucesso) {
            return this.registrarMensagem(this.formatarErros(resultado.erros), "erro");
        }

        this.estado.previewHtml = resultado.html || this.estado.previewHtml;
        this.registrarAcao("PDF preparado pelo adapter simulado.");
        return this.registrarMensagem("PDF preparado para geracao futura. Nenhum arquivo foi baixado.", "sucesso");
    },

    imprimir() {
        const validacao = this.validarDocumentoAtual();

        if (!validacao.valido) {
            return this.registrarMensagem(this.formatarErros(validacao.erros), "erro");
        }

        const resultado = ExportService.exportar(this.estado.documento, {
            formato: "IMPRESSAO",
            adapters: {
                PRINT: typeof PrintAdapter !== "undefined" ? PrintAdapter : null
            }
        });

        if (!resultado.sucesso) {
            return this.registrarMensagem(this.formatarErros(resultado.erros), "erro");
        }

        this.estado.previewHtml = resultado.html || this.estado.previewHtml;
        this.registrarAcao("Impressao preparada pelo adapter simulado.");
        return this.registrarMensagem("Impressao preparada para execucao futura. Nenhuma janela de impressao foi aberta.", "sucesso");
    },

    email() {
        this.registrarAcao("Email marcado como em breve.");
        return this.registrarMensagem("Email em breve. Nenhum envio foi realizado.", "neutro");
    },

    whatsapp() {
        this.registrarAcao("WhatsApp marcado como em breve.");
        return this.registrarMensagem("WhatsApp em breve. Nenhuma mensagem foi enviada.", "neutro");
    },

    copiarLink() {
        this.registrarAcao("Link marcado como em breve.");
        return this.registrarMensagem("Copiar Link em breve. Nenhum link foi gerado.", "neutro");
    },

    validarDocumentoAtual() {
        const erros = [];

        if (!this.estado.documento) {
            erros.push("Nenhum Documento Comercial carregado.");
            return {
                valido: false,
                erros
            };
        }

        if (typeof DocumentService !== "undefined" && typeof DocumentService.validarDocumento === "function") {
            const validacaoDocumento = DocumentService.validarDocumento(this.estado.documento);

            if (!validacaoDocumento.valido) {
                erros.push(...validacaoDocumento.erros);
            }
        }

        if (typeof DocumentRenderer !== "undefined" && typeof DocumentRenderer.prepararVisualizacao === "function") {
            const visualizacao = DocumentRenderer.prepararVisualizacao(this.estado.documento);

            if (!visualizacao.sucesso) {
                erros.push(...visualizacao.erros);
            }
        }

        return {
            valido: erros.length === 0,
            erros: this.errosUnicos(erros)
        };
    },

    obterDocumentoAtual() {
        if (typeof AppState !== "undefined" && typeof AppState.getItem === "function") {
            return this.normalizarDocumento(AppState.getItem("documentoAtual"));
        }

        return null;
    },

    salvarDocumentoAtual(documento = null) {
        if (!documento || typeof AppState === "undefined" || typeof AppState.setState !== "function") {
            return false;
        }

        return AppState.setState("documentoAtual", documento);
    },

    obterUltimaAcao() {
        if (typeof AppState === "undefined" || typeof AppState.getItem !== "function") {
            return this.estado.ultimaAcaoExportacao;
        }

        const configuracoes = AppState.getItem("configuracoes") || {};
        return configuracoes.ultimaAcaoExportacao || this.estado.ultimaAcaoExportacao;
    },

    salvarUltimaAcao(acao) {
        if (typeof AppState === "undefined" || typeof AppState.getItem !== "function" || typeof AppState.setState !== "function") {
            return false;
        }

        const configuracoes = AppState.getItem("configuracoes") || {};

        return AppState.setState("configuracoes", {
            ...configuracoes,
            ultimaAcaoExportacao: acao
        });
    },

    registrarAcao(descricao) {
        const acao = `${descricao} ${this.agoraLegivel()}`;

        this.estado.ultimaAcaoExportacao = acao;
        this.salvarUltimaAcao(acao);
        return acao;
    },

    registrarMensagem(texto, tipo = "neutro") {
        this.estado.mensagens = [
            ...this.estado.mensagens.slice(-2),
            {
                texto,
                tipo,
                data: new Date().toISOString()
            }
        ];

        this.renderizar();
        return {
            sucesso: tipo !== "erro",
            mensagem: texto
        };
    },

    normalizarDocumento(documento = null) {
        if (!documento) {
            return null;
        }

        if (documento.tipo === "DOCUMENTO_COMERCIAL") {
            return documento;
        }

        if (documento.documento && documento.documento.tipo === "DOCUMENTO_COMERCIAL") {
            return documento.documento;
        }

        return documento;
    },

    renderizar() {
        if (typeof DocumentShareUI !== "undefined" && typeof DocumentShareUI.renderizarModal === "function") {
            DocumentShareUI.renderizarModal(this.estado);
        }
    },

    formatarErros(erros = []) {
        if (!Array.isArray(erros) || !erros.length) {
            return "Nao foi possivel concluir a acao.";
        }

        return this.errosUnicos(erros).join(" ");
    },

    errosUnicos(erros = []) {
        return [...new Set(erros.filter(Boolean))];
    },

    agoraLegivel() {
        return new Date().toLocaleString("pt-BR");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    DocumentShareController.iniciar();
});
