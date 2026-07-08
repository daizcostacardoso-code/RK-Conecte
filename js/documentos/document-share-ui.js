const DocumentShareUI = {
    rootId: "documentShareRoot",
    controller: null,

    configurar(controller) {
        this.controller = controller;
        return this;
    },

    renderizarModal(estado = {}) {
        const root = this.obterRoot();

        if (!root) {
            return false;
        }

        if (!estado.aberto) {
            root.innerHTML = [
                `<section class="document-share-closed" aria-live="polite">`,
                `<p class="document-share-eyebrow">Documento Comercial</p>`,
                `<h1>Central fechada</h1>`,
                `<p>A Central de Compartilhamento foi fechada.</p>`,
                `</section>`
            ].join("");
            return true;
        }

        root.innerHTML = [
            `<section class="document-share-shell" aria-labelledby="documentShareTitle">`,
            `<header class="document-share-header">`,
            `<p class="document-share-eyebrow">Documento Comercial</p>`,
            `<h1 id="documentShareTitle">Documento Comercial</h1>`,
            `<p>Compartilhe ou exporte sua proposta comercial.</p>`,
            `</header>`,
            `<div class="document-share-grid">`,
            `<div class="document-share-actions">`,
            this.renderizarAcoes(estado),
            `</div>`,
            `<div class="document-share-preview-area">`,
            `<div id="documentShareMensagens">${this.renderizarMensagens(estado)}</div>`,
            `<div id="documentShareHistorico">${this.renderizarHistorico(estado)}</div>`,
            `<div id="documentSharePreview">${this.renderizarPreview(estado)}</div>`,
            `</div>`,
            `</div>`,
            `<footer class="document-share-footer">`,
            `<button type="button" class="document-share-button" data-share-action="fechar">Fechar</button>`,
            `</footer>`,
            `</section>`
        ].join("");

        this.registrarEventos(root);
        return true;
    },

    renderizarAcoes(estado = {}) {
        return [
            this.renderizarFiltros(estado),
            `<section class="document-share-section" aria-labelledby="documentShareExportacaoTitulo">`,
            `<h2 id="documentShareExportacaoTitulo">Exportacao</h2>`,
            `<div class="document-share-button-list">`,
            this.renderizarBotao("exportarPdf", "Exportar PDF", "PDF"),
            this.renderizarBotao("imprimir", "Preparar Impressao", "Print"),
            `</div>`,
            `</section>`,
            `<section class="document-share-section" aria-labelledby="documentShareCompartilhamentoTitulo">`,
            `<h2 id="documentShareCompartilhamentoTitulo">Compartilhamento</h2>`,
            `<div class="document-share-button-list">`,
            this.renderizarBotao("whatsapp", "WhatsApp", "Em breve"),
            this.renderizarBotao("email", "Email", "Em breve"),
            this.renderizarBotao("copiarLink", "Copiar Link", "Em breve"),
            `</div>`,
            `</section>`
        ].join("");
    },

    renderizarFiltros(estado = {}) {
        const filtros = estado.filtros || {};

        return [
            `<section class="document-share-section document-share-filter" aria-labelledby="documentShareFiltroTitulo">`,
            `<h2 id="documentShareFiltroTitulo">Buscar PDF</h2>`,
            `<form class="document-share-filter-form" data-share-filter-form="true">`,
            `<label for="documentShareFiltroNumero">Numero do orcamento</label>`,
            `<input type="search" id="documentShareFiltroNumero" name="numero" value="${this.escaparAtributo(filtros.numero || "")}" placeholder="000001">`,
            `<label for="documentShareFiltroCliente">Cliente</label>`,
            `<input type="search" id="documentShareFiltroCliente" name="cliente" value="${this.escaparAtributo(filtros.cliente || "")}" placeholder="Nome do cliente">`,
            `<label for="documentShareFiltroData">Data</label>`,
            `<input type="date" id="documentShareFiltroData" name="data" value="${this.escaparAtributo(filtros.data || "")}">`,
            `<div class="document-share-filter-actions">`,
            `<button type="submit" class="document-share-button document-share-button-primary">`,
            `<span>${estado.buscando ? "Buscando..." : "Buscar"}</span>`,
            `<span class="document-share-button-token">Filtro</span>`,
            `</button>`,
            `<button type="button" class="document-share-button" data-share-filter-action="limpar">`,
            `<span>Limpar</span>`,
            `<span class="document-share-button-token">Reset</span>`,
            `</button>`,
            `</div>`,
            `</form>`,
            this.renderizarResultados(estado),
            `</section>`
        ].join("");
    },

    renderizarResultados(estado = {}) {
        const resultados = Array.isArray(estado.resultadosBusca) ? estado.resultadosBusca : [];

        if (!resultados.length) {
            return [
                `<div class="document-share-results document-share-results-empty">`,
                `<p>Nenhum PDF carregado pelos filtros.</p>`,
                `</div>`
            ].join("");
        }

        const fonte = estado.fonteBusca === "firestore"
            ? "Firestore"
            : estado.fonteBusca === "atual" ? "orcamento atual" : "armazenamento local";

        return [
            `<div class="document-share-results" aria-live="polite">`,
            `<p class="document-share-results-source">${this.escapar(resultados.length)} resultado(s) de ${this.escapar(fonte)}.</p>`,
            resultados.map(registro => this.renderizarResultado(registro, estado.resultadoSelecionadoId)).join(""),
            `</div>`
        ].join("");
    },

    renderizarResultado(registro = {}, selecionadoId = "") {
        const selecionado = selecionadoId && (selecionadoId === registro.id || selecionadoId === registro.numero);

        return [
            `<article class="document-share-result${selecionado ? " document-share-result-selected" : ""}">`,
            `<strong>${this.escapar(registro.clienteNome || registro.cliente?.nome || "Cliente nao informado")}</strong>`,
            `<span>Orcamento ${this.escapar(registro.numero || registro.id || "sem numero")} - ${this.escapar(this.formatarData(registro.dataEmissao))}</span>`,
            `<div class="document-share-result-actions">`,
            `<button type="button" class="document-share-result-button" data-share-result-action="carregar" data-registro-id="${this.escaparAtributo(registro.id || registro.numero)}">Abrir</button>`,
            `<button type="button" class="document-share-result-button" data-share-result-action="visualizarPdf" data-registro-id="${this.escaparAtributo(registro.id || registro.numero)}">Ver PDF</button>`,
            `<button type="button" class="document-share-result-button" data-share-result-action="baixarPdf" data-registro-id="${this.escaparAtributo(registro.id || registro.numero)}">Baixar</button>`,
            `</div>`,
            `</article>`
        ].join("");
    },

    renderizarBotao(acao, texto, token, principal = false) {
        const classe = principal ? " document-share-button-primary" : "";

        return [
            `<button type="button" class="document-share-button${classe}" data-share-action="${this.escapar(acao)}">`,
            `<span>${this.escapar(texto)}</span>`,
            `<span class="document-share-button-token">${this.escapar(token)}</span>`,
            `</button>`
        ].join("");
    },

    renderizarPreview(estado = {}) {
        if (estado.pdfUrl) {
            const pdfUrl = this.escaparAtributo(estado.pdfUrl);
            const nomeArquivo = this.escaparAtributo(estado.pdfNomeArquivo || "documento-comercial.pdf");

            return [
                `<section class="document-share-preview document-share-preview-pdf" aria-label="Preview do PDF">`,
                `<div class="document-share-pdf-toolbar">`,
                `<div>`,
                `<strong>${this.escapar(estado.pdfNomeArquivo || "documento-comercial.pdf")}</strong>`,
                `<span>Visualizacao sem download</span>`,
                `</div>`,
                `<div class="document-share-pdf-toolbar-actions">`,
                `<a href="${pdfUrl}" target="_blank" rel="noopener">Abrir PDF</a>`,
                `<a href="${pdfUrl}" download="${nomeArquivo}">Baixar</a>`,
                `</div>`,
                `</div>`,
                `<object class="document-share-pdf-object" title="Preview do PDF" data="${pdfUrl}#view=FitH" type="application/pdf">`,
                `<div class="document-share-pdf-fallback">`,
                `<strong>O navegador nao exibiu o PDF aqui.</strong>`,
                `<p>No celular, abra em tela cheia ou baixe o arquivo para visualizar.</p>`,
                `<a href="${pdfUrl}" target="_blank" rel="noopener">Abrir PDF</a>`,
                `<a href="${pdfUrl}" download="${nomeArquivo}">Baixar PDF</a>`,
                `</div>`,
                `</object>`,
                `</section>`
            ].join("");
        }

        if (!estado.previewHtml) {
            return [
                `<section class="document-share-preview" aria-label="Preview do Documento Comercial">`,
                `<div class="document-share-preview-empty">`,
                `<p>Preview ainda nao gerado.</p>`,
                `</div>`,
                `</section>`
            ].join("");
        }

        return [
            `<section class="document-share-preview" aria-label="Preview do Documento Comercial">`,
            estado.previewHtml,
            `</section>`
        ].join("");
    },

    renderizarHistorico(estado = {}) {
        return [
            `<section class="document-share-history" aria-live="polite">`,
            `<p><strong>Ultima acao:</strong></p>`,
            `<p>${this.escapar(estado.ultimaAcaoExportacao || "Nenhuma exportacao realizada.")}</p>`,
            `</section>`
        ].join("");
    },

    renderizarMensagens(estado = {}) {
        const mensagem = Array.isArray(estado.mensagens) && estado.mensagens.length
            ? estado.mensagens[estado.mensagens.length - 1]
            : null;

        if (!mensagem) {
            return [
                `<section class="document-share-message" data-tipo="neutro" aria-live="polite">`,
                `<p>Documento pronto para visualizacao quando disponivel.</p>`,
                `</section>`
            ].join("");
        }

        return [
            `<section class="document-share-message" data-tipo="${this.escapar(mensagem.tipo || "neutro")}" aria-live="polite">`,
            `<p>${this.escapar(mensagem.texto)}</p>`,
            `</section>`
        ].join("");
    },

    atualizar(estado = {}) {
        this.renderizarModal(estado);
    },

    registrarEventos(root) {
        const formFiltro = root.querySelector("[data-share-filter-form]");
        if (formFiltro) {
            formFiltro.addEventListener("submit", evento => {
                evento.preventDefault();

                if (this.controller && typeof this.controller.buscarPdfPorFiltros === "function") {
                    this.controller.buscarPdfPorFiltros(this.obterFiltros());
                }
            });
        }

        root.querySelectorAll("[data-share-filter-action]").forEach(botao => {
            botao.addEventListener("click", () => {
                const acao = botao.getAttribute("data-share-filter-action");

                if (acao === "limpar" && this.controller && typeof this.controller.limparFiltros === "function") {
                    this.controller.limparFiltros();
                }
            });
        });

        root.querySelectorAll("[data-share-result-action]").forEach(botao => {
            botao.addEventListener("click", () => {
                const acao = botao.getAttribute("data-share-result-action");
                const registroId = botao.getAttribute("data-registro-id");

                if (!this.controller) {
                    return;
                }

                if (acao === "carregar" && typeof this.controller.selecionarRegistro === "function") {
                    this.controller.selecionarRegistro(registroId);
                }

                if (acao === "visualizarPdf" && typeof this.controller.visualizarPdfRegistro === "function") {
                    this.controller.visualizarPdfRegistro(registroId);
                }

                if (acao === "baixarPdf" && typeof this.controller.baixarPdfRegistro === "function") {
                    this.controller.baixarPdfRegistro(registroId);
                }
            });
        });

        root.querySelectorAll("[data-share-action]").forEach(botao => {
            botao.addEventListener("click", () => {
                const acao = botao.getAttribute("data-share-action");

                if (this.controller && typeof this.controller[acao] === "function") {
                    this.controller[acao]();
                }
            });
        });
    },

    obterRoot() {
        return document.getElementById(this.rootId);
    },

    obterFiltros() {
        const root = this.obterRoot() || document;

        return {
            numero: root.querySelector("#documentShareFiltroNumero")?.value?.trim() || "",
            cliente: root.querySelector("#documentShareFiltroCliente")?.value?.trim() || "",
            data: root.querySelector("#documentShareFiltroData")?.value || ""
        };
    },

    formatarData(valor) {
        if (!valor) {
            return "sem data";
        }

        const partes = String(valor).slice(0, 10).split("-");
        return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valor;
    },

    escapar(valor) {
        return String(valor === undefined || valor === null ? "" : valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    escaparAtributo(valor) {
        return this.escapar(valor);
    }
};
