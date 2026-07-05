const ComercialController = {
    rootId: "aprovacaoComercialRoot",
    estado: {
        documento: null,
        comercial: null,
        statusComercial: COMERCIAL_STATUS.RASCUNHO,
        dataAprovacao: "",
        ultimaAcaoComercial: "Nenhuma acao comercial registrada.",
        previewHtml: "",
        exportacao: null,
        mensagens: []
    },

    iniciar() {
        this.carregar();
        this.renderizar();
    },

    solicitar() {
        const resultado = ComercialService.solicitar(this.estado.documento);
        return this.processarResultado(resultado);
    },

    aprovar() {
        const resultado = AprovarDocumentoUseCase.executar(this.estado.documento);
        return this.processarResultado(resultado);
    },

    reprovar() {
        const resultado = ReprovarDocumentoUseCase.executar(
            this.estado.documento,
            "Documento reprovado pela aprovacao comercial."
        );
        return this.processarResultado(resultado);
    },

    voltar() {
        const resultado = ComercialService.voltar(this.estado.documento);
        return this.processarResultado(resultado);
    },

    carregar() {
        const documento = this.obterDocumentoAtual();
        const comercial = ComercialService.obterRegistroAtual(documento);
        const exportacao = documento ? ComercialService.validarProntidaoExportacao(documento) : null;

        this.estado = {
            ...this.estado,
            documento,
            comercial,
            statusComercial: comercial.statusComercial,
            dataAprovacao: comercial.dataAprovacao,
            ultimaAcaoComercial: comercial.ultimaAcaoComercial || this.estado.ultimaAcaoComercial,
            previewHtml: this.prepararPreview(documento),
            exportacao
        };

        return this.estado;
    },

    processarResultado(resultado = {}) {
        if (!resultado.sucesso) {
            return this.registrarMensagem(this.formatarErros(resultado.erros), "erro");
        }

        this.estado = {
            ...this.estado,
            documento: resultado.documento,
            comercial: resultado.comercial,
            statusComercial: resultado.statusComercial,
            dataAprovacao: resultado.dataAprovacao,
            ultimaAcaoComercial: resultado.ultimaAcaoComercial,
            previewHtml: this.prepararPreview(resultado.documento),
            exportacao: resultado.exportacao
        };

        return this.registrarMensagem(resultado.ultimaAcaoComercial, "sucesso");
    },

    obterDocumentoAtual() {
        const appStateService = this.obterAppStateService();
        const documento = appStateService && typeof appStateService.getItem === "function"
            ? appStateService.getItem("documentoAtual")
            : null;

        if (documento) {
            return ComercialService.normalizarDocumento(documento);
        }

        return this.criarDocumentoPorOrcamentoAtual(appStateService);
    },

    criarDocumentoPorOrcamentoAtual(appStateService = null) {
        if (
            !appStateService ||
            typeof appStateService.getItem !== "function" ||
            typeof DocumentService === "undefined" ||
            typeof DocumentService.gerarDocumento !== "function"
        ) {
            return null;
        }

        const orcamentoAtual = appStateService.getItem("orcamentoAtual");

        if (!orcamentoAtual) {
            return null;
        }

        try {
            const documento = DocumentService.gerarDocumento(orcamentoAtual);

            if (documento && documento.tipo === "DOCUMENTO_COMERCIAL" && typeof appStateService.setState === "function") {
                appStateService.setState("documentoAtual", documento);
            }

            return documento;
        } catch (erro) {
            return null;
        }
    },

    prepararPreview(documento = null) {
        if (!documento || typeof DocumentHtmlRenderer === "undefined" || typeof DocumentHtmlRenderer.renderizar !== "function") {
            return "";
        }

        const resultado = DocumentHtmlRenderer.renderizar(documento);
        return resultado.sucesso ? resultado.html : "";
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

    renderizar() {
        const root = document.getElementById(this.rootId);

        if (!root) {
            return false;
        }

        root.innerHTML = [
            `<section class="comercial-shell" aria-labelledby="comercialTitulo">`,
            `<header class="comercial-header">`,
            `<p class="comercial-eyebrow">Formalizacao Comercial</p>`,
            `<h1 id="comercialTitulo">Aprovacao Comercial</h1>`,
            this.renderizarResumo(),
            `</header>`,
            `<div class="comercial-grid">`,
            `<aside class="comercial-panel" aria-label="Acoes comerciais">`,
            this.renderizarStatus(),
            this.renderizarAcoes(),
            this.renderizarExportacao(),
            `</aside>`,
            `<section class="comercial-preview-area" aria-label="Documento Comercial">`,
            this.renderizarMensagem(),
            this.renderizarPreview(),
            `</section>`,
            `</div>`,
            `</section>`
        ].join("");

        this.registrarEventos(root);
        return true;
    },

    renderizarResumo() {
        const dados = this.estado.documento?.dados || {};
        const cliente = dados.cliente?.nome || "Cliente nao informado";
        const projeto = dados.projeto?.nome || dados.projeto?.numero || dados.projeto?.id || "Projeto nao informado";

        return [
            `<div class="comercial-summary">`,
            `<span>${this.escapar(cliente)}</span>`,
            `<span>${this.escapar(projeto)}</span>`,
            `</div>`
        ].join("");
    },

    renderizarStatus() {
        const status = this.estado.statusComercial || COMERCIAL_STATUS.RASCUNHO;

        return [
            `<section class="comercial-section">`,
            `<h2>Status</h2>`,
            `<div class="comercial-status" data-status="${this.escapar(status)}">`,
            `<strong>${this.escapar(this.rotuloStatus(status))}</strong>`,
            `<span>${this.escapar(this.estado.ultimaAcaoComercial)}</span>`,
            `</div>`,
            `</section>`
        ].join("");
    },

    renderizarAcoes() {
        return [
            `<section class="comercial-section">`,
            `<h2>Acoes</h2>`,
            `<div class="comercial-actions">`,
            this.renderizarBotao("solicitar", "Solicitar Aprovacao", this.podeSolicitar()),
            this.renderizarBotao("aprovar", "Aprovar", this.podeDecidir()),
            this.renderizarBotao("reprovar", "Reprovar", this.podeDecidir()),
            this.renderizarBotao("voltar", "Voltar para Revisao", this.podeVoltar()),
            `</div>`,
            `</section>`
        ].join("");
    },

    renderizarExportacao() {
        const exportacao = this.estado.exportacao;
        const texto = exportacao
            ? (exportacao.valido ? "Exportacao preparada" : this.formatarErros(exportacao.erros))
            : "Exportacao aguardando documento";

        return [
            `<section class="comercial-section">`,
            `<h2>Documento</h2>`,
            `<p class="comercial-note">${this.escapar(texto)}</p>`,
            `</section>`
        ].join("");
    },

    renderizarMensagem() {
        const mensagem = Array.isArray(this.estado.mensagens) && this.estado.mensagens.length
            ? this.estado.mensagens[this.estado.mensagens.length - 1]
            : null;

        if (!mensagem) {
            return [
                `<div class="comercial-message" data-tipo="neutro" aria-live="polite">`,
                `<p>${this.estado.documento ? "Documento Comercial carregado." : "Nenhum Documento Comercial carregado."}</p>`,
                `</div>`
            ].join("");
        }

        return [
            `<div class="comercial-message" data-tipo="${this.escapar(mensagem.tipo)}" aria-live="polite">`,
            `<p>${this.escapar(mensagem.texto)}</p>`,
            `</div>`
        ].join("");
    },

    renderizarPreview() {
        if (!this.estado.previewHtml) {
            return [
                `<div class="comercial-preview comercial-preview-empty">`,
                `<p>Aguardando Documento Comercial valido.</p>`,
                `</div>`
            ].join("");
        }

        return [
            `<div class="comercial-preview">`,
            this.estado.previewHtml,
            `</div>`
        ].join("");
    },

    renderizarBotao(acao, texto, habilitado = false) {
        const atributoDisabled = habilitado ? "" : " disabled";

        return [
            `<button type="button" class="comercial-button" data-comercial-action="${this.escapar(acao)}"${atributoDisabled}>`,
            `<span>${this.escapar(texto)}</span>`,
            `</button>`
        ].join("");
    },

    registrarEventos(root) {
        root.querySelectorAll("[data-comercial-action]").forEach(botao => {
            botao.addEventListener("click", () => {
                const acao = botao.getAttribute("data-comercial-action");

                if (typeof this[acao] === "function") {
                    this[acao]();
                }
            });
        });
    },

    podeSolicitar() {
        return !!this.estado.documento && this.estado.statusComercial === COMERCIAL_STATUS.RASCUNHO;
    },

    podeDecidir() {
        return !!this.estado.documento && this.estado.statusComercial === COMERCIAL_STATUS.EM_REVISAO;
    },

    podeVoltar() {
        return !!this.estado.documento && [
            COMERCIAL_STATUS.APROVADO,
            COMERCIAL_STATUS.REPROVADO
        ].includes(this.estado.statusComercial);
    },

    rotuloStatus(status = COMERCIAL_STATUS.RASCUNHO) {
        const rotulos = {
            [COMERCIAL_STATUS.RASCUNHO]: "Rascunho",
            [COMERCIAL_STATUS.EM_REVISAO]: "Em revisao",
            [COMERCIAL_STATUS.APROVADO]: "Aprovado",
            [COMERCIAL_STATUS.REPROVADO]: "Reprovado"
        };

        return rotulos[status] || status;
    },

    obterAppStateService() {
        if (typeof AppStateService !== "undefined" && AppStateService) {
            return AppStateService;
        }

        if (typeof AppState !== "undefined" && AppState) {
            return AppState;
        }

        return null;
    },

    formatarErros(erros = []) {
        if (!Array.isArray(erros) || !erros.length) {
            return "Nao foi possivel concluir a acao.";
        }

        return [...new Set(erros.filter(Boolean))].join(" ");
    },

    escapar(valor) {
        return String(valor === undefined || valor === null ? "" : valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    ComercialController.iniciar();
});
