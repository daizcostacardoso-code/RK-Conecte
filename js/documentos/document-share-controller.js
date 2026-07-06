const DocumentShareController = {
    estado: {
        aberto: false,
        documento: null,
        previewHtml: "",
        pdfUrl: "",
        pdfNomeArquivo: "",
        filtros: {
            numero: "",
            cliente: "",
            data: ""
        },
        resultadosBusca: [],
        resultadoSelecionadoId: "",
        fonteBusca: "",
        buscando: false,
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
        const registroAtual = this.normalizarRegistroAtual(documentoAtual);
        this.revogarPdfUrl();

        this.estado = {
            ...this.estado,
            aberto: true,
            documento: documentoAtual,
            previewHtml: "",
            pdfUrl: "",
            pdfNomeArquivo: "",
            filtros: this.montarFiltrosRegistro(registroAtual),
            resultadosBusca: registroAtual ? [registroAtual] : [],
            resultadoSelecionadoId: registroAtual ? registroAtual.id || registroAtual.numero : "",
            fonteBusca: registroAtual ? "atual" : "",
            ultimaAcaoExportacao: this.obterUltimaAcao()
        };

        this.salvarDocumentoAtual(documentoAtual);
        this.persistirDocumentoAtual("ABERTURA_CENTRAL");
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

        this.revogarPdfUrl();
        this.estado.previewHtml = resultado.html;
        this.estado.pdfUrl = "";
        this.estado.pdfNomeArquivo = "";
        this.registrarAcao("Documento visualizado.");
        return this.registrarMensagem("Documento Comercial renderizado para visualizacao.", "sucesso");
    },

    async exportarPdf() {
        const validacao = this.validarDocumentoAtual();

        if (!validacao.valido) {
            return this.registrarMensagem(this.formatarErros(validacao.erros), "erro");
        }

        await this.persistirDocumentoAtual("DOWNLOAD_PDF");
        const resultado = ExportService.exportar(this.estado.documento, {
            formato: "PDF",
            adapters: {
                PDF: typeof PdfAdapter !== "undefined" ? PdfAdapter : null
            }
        });

        if (!resultado.sucesso) {
            return this.registrarMensagem(this.formatarErros(resultado.erros), "erro");
        }

        this.revogarPdfUrl();
        this.estado.pdfUrl = "";
        this.estado.pdfNomeArquivo = "";
        this.registrarAcao("PDF solicitado pelo adapter.");

        if (resultado.arquivo && typeof resultado.arquivo.gerar === "function") {
            this.registrarMensagem("PDF em geracao. O download sera iniciado se o navegador permitir.", "sucesso");
            const pdf = await resultado.arquivo.gerar();

            if (pdf?.sucesso && pdf.bytes) {
                this.baixarArquivo(pdf.bytes, pdf.nomeArquivo || resultado.arquivo.nomeArquivo, pdf.mimeType || resultado.arquivo.mimeType);
                return this.registrarMensagem("PDF gerado e download iniciado.", "sucesso");
            }

            return this.registrarMensagem(this.formatarErros(pdf?.erros || ["Nao foi possivel gerar o PDF para download."]), "erro");
        }

        return this.registrarMensagem("PDF preparado, mas download indisponivel neste ambiente.", "sucesso");
    },

    async visualizarPdf() {
        const validacao = this.validarDocumentoAtual();

        if (!validacao.valido) {
            return this.registrarMensagem(this.formatarErros(validacao.erros), "erro");
        }

        await this.persistirDocumentoAtual("PREVIEW_PDF");
        const resultado = ExportService.exportar(this.estado.documento, {
            formato: "PDF",
            adapters: {
                PDF: typeof PdfAdapter !== "undefined" ? PdfAdapter : null
            }
        });

        if (!resultado.sucesso) {
            return this.registrarMensagem(this.formatarErros(resultado.erros), "erro");
        }

        if (!resultado.arquivo || typeof resultado.arquivo.gerar !== "function") {
            return this.registrarMensagem("PDF preparado, mas preview indisponivel neste ambiente.", "erro");
        }

        this.registrarMensagem("PDF em geracao para visualizacao.", "sucesso");
        const pdf = await resultado.arquivo.gerar();

        if (!pdf?.sucesso || !pdf.bytes) {
            return this.registrarMensagem(this.formatarErros(pdf?.erros || ["Nao foi possivel gerar o PDF para visualizacao."]), "erro");
        }

        const url = this.criarUrlPdf(pdf.bytes, pdf.mimeType || resultado.arquivo.mimeType);

        if (!url) {
            return this.registrarMensagem("Navegador sem suporte para preview local do PDF.", "erro");
        }

        this.estado.previewHtml = resultado.html || this.estado.previewHtml;
        this.estado.pdfUrl = url;
        this.estado.pdfNomeArquivo = pdf.nomeArquivo || resultado.arquivo.nomeArquivo || "documento-comercial.pdf";
        this.registrarAcao("PDF visualizado sem download.");
        return this.registrarMensagem("PDF gerado para visualizacao. Nenhum download foi iniciado.", "sucesso");
    },

    baixarArquivo(bytes, nomeArquivo = "documento-comercial.pdf", mimeType = "application/pdf") {
        if (typeof Blob === "undefined" || typeof URL === "undefined" || typeof document === "undefined") {
            return false;
        }

        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = nomeArquivo || "documento-comercial.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        return true;
    },

    criarUrlPdf(bytes, mimeType = "application/pdf") {
        if (typeof Blob === "undefined" || typeof URL === "undefined") {
            return "";
        }

        this.revogarPdfUrl();
        const blob = new Blob([bytes], { type: mimeType || "application/pdf" });
        return URL.createObjectURL(blob);
    },

    revogarPdfUrl() {
        if (this.estado.pdfUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
            URL.revokeObjectURL(this.estado.pdfUrl);
        }
    },

    async buscarPdfPorFiltros(filtros = null) {
        const filtrosBusca = this.normalizarFiltrosBusca(filtros || this.obterFiltrosDaTela());

        if (!this.filtrosTemBusca(filtrosBusca)) {
            const registroAtual = this.normalizarRegistroAtual(this.estado.documento);

            this.estado = {
                ...this.estado,
                filtros: filtrosBusca,
                buscando: false,
                fonteBusca: registroAtual ? "atual" : "",
                resultadosBusca: registroAtual ? [registroAtual] : [],
                resultadoSelecionadoId: registroAtual ? registroAtual.id || registroAtual.numero : ""
            };
            this.renderizar();

            return this.registrarMensagem(
                registroAtual
                    ? "Filtro vazio manteve o orcamento atual carregado."
                    : "Informe numero, cliente ou data para buscar PDFs.",
                registroAtual ? "neutro" : "erro"
            );
        }

        this.estado = {
            ...this.estado,
            filtros: filtrosBusca,
            buscando: true,
            fonteBusca: "",
            resultadosBusca: []
        };
        this.renderizar();

        if (typeof DocumentPdfRepository === "undefined" || !DocumentPdfRepository) {
            this.estado.buscando = false;
            return this.registrarMensagem("Repositorio de PDFs indisponivel para busca.", "erro");
        }

        const resultado = await DocumentPdfRepository.buscar(filtrosBusca);

        this.estado.buscando = false;
        this.estado.resultadosBusca = resultado.registros || [];
        this.estado.fonteBusca = resultado.fonte || "";
        this.registrarAcao(`Busca de PDF executada em ${resultado.fonte || "armazenamento"}.`);

        if (!this.estado.resultadosBusca.length) {
            return this.registrarMensagem("Nenhum PDF encontrado para os filtros informados.", "erro");
        }

        return this.registrarMensagem(`${this.estado.resultadosBusca.length} PDF(s) encontrado(s) em ${resultado.fonte === "firestore" ? "Firestore" : "armazenamento local"}.`, "sucesso");
    },

    limparFiltros() {
        const registroAtual = this.normalizarRegistroAtual(this.estado.documento);

        this.estado = {
            ...this.estado,
            filtros: {
                numero: "",
                cliente: "",
                data: ""
            },
            resultadosBusca: registroAtual ? [registroAtual] : [],
            resultadoSelecionadoId: registroAtual ? registroAtual.id || registroAtual.numero : "",
            fonteBusca: registroAtual ? "atual" : ""
        };

        this.renderizar();
        return true;
    },

    selecionarRegistro(registroId, opcoes = {}) {
        const registro = this.encontrarRegistro(registroId);

        if (!registro) {
            return this.registrarMensagem("PDF selecionado nao encontrado na lista de resultados.", "erro");
        }

        if (typeof DocumentPdfRepository === "undefined" || !DocumentPdfRepository) {
            return this.registrarMensagem("Repositorio de PDFs indisponivel para abrir o resultado.", "erro");
        }

        const documento = this.normalizarDocumento(DocumentPdfRepository.obterDocumento(registro));

        if (!documento) {
            return this.registrarMensagem("O resultado encontrado nao possui dados suficientes para visualizar ou baixar o PDF.", "erro");
        }

        this.revogarPdfUrl();
        this.estado = {
            ...this.estado,
            documento,
            previewHtml: "",
            pdfUrl: "",
            pdfNomeArquivo: "",
            resultadoSelecionadoId: registro.id || registroId
        };
        this.salvarDocumentoAtual(documento);
        this.registrarAcao(`PDF ${registro.numero || registro.id} carregado da busca.`);

        if (opcoes.visualizarHtml === false) {
            this.renderizar();
            return {
                sucesso: true,
                documento,
                registro
            };
        }

        this.visualizar();
        return {
            sucesso: true,
            documento,
            registro
        };
    },

    async visualizarPdfRegistro(registroId) {
        const selecao = this.selecionarRegistro(registroId, { visualizarHtml: false });

        if (!selecao?.sucesso) {
            return selecao;
        }

        return this.visualizarPdf();
    },

    async baixarPdfRegistro(registroId) {
        const selecao = this.selecionarRegistro(registroId, { visualizarHtml: false });

        if (!selecao?.sucesso) {
            return selecao;
        }

        return this.exportarPdf();
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

    async persistirDocumentoAtual(origem = "DOCUMENTO_COMERCIAL") {
        if (!this.estado.documento || typeof DocumentPdfRepository === "undefined" || !DocumentPdfRepository) {
            return null;
        }

        return DocumentPdfRepository.salvar(this.estado.documento, { origem });
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

    obterFiltrosDaTela() {
        if (typeof DocumentShareUI !== "undefined" && typeof DocumentShareUI.obterFiltros === "function") {
            return this.normalizarFiltrosBusca(DocumentShareUI.obterFiltros());
        }

        return this.normalizarFiltrosBusca(this.estado.filtros || {});
    },

    normalizarFiltrosBusca(filtros = {}) {
        return {
            numero: String(filtros.numero || filtros.numeroOrcamento || "").trim(),
            cliente: String(filtros.cliente || "").trim(),
            data: filtros.data || ""
        };
    },

    filtrosTemBusca(filtros = {}) {
        return !!(filtros.numero || filtros.cliente || filtros.data);
    },

    normalizarRegistroAtual(documento = null) {
        if (!documento || typeof DocumentPdfRepository === "undefined" || !DocumentPdfRepository) {
            return null;
        }

        if (typeof DocumentPdfRepository.normalizarRegistro !== "function") {
            return null;
        }

        return DocumentPdfRepository.normalizarRegistro(documento);
    },

    montarFiltrosRegistro(registro = null) {
        return {
            numero: registro?.numero || "",
            cliente: "",
            data: ""
        };
    },

    encontrarRegistro(registroId) {
        const id = String(registroId || "");
        return (this.estado.resultadosBusca || []).find(registro => {
            return String(registro.id || "") === id || String(registro.numero || "") === id;
        }) || null;
    },

    agoraLegivel() {
        return new Date().toLocaleString("pt-BR");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    DocumentShareController.iniciar();
});
