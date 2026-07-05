const ConversaoValidator = {
    validarConversao(documento = null, opcoes = {}) {
        const erros = [];
        const documentoNormalizado = this.normalizarDocumento(documento);

        this.validarDocumento(documentoNormalizado, erros);
        this.validarDocumentoAprovado(documentoNormalizado, opcoes, erros);
        this.validarDuplicidade(documentoNormalizado, opcoes, erros);

        return {
            valido: erros.length === 0,
            erros: this.errosUnicos(erros)
        };
    },

    validarDocumento(documento = null, erros = []) {
        if (!documento || typeof documento !== "object") {
            erros.push("Documento Comercial e obrigatorio para conversao.");
            return;
        }

        if (documento.tipo !== "DOCUMENTO_COMERCIAL") {
            erros.push("Conversao aceita apenas Documento Comercial.");
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

    validarDocumentoAprovado(documento = null, opcoes = {}, erros = []) {
        if (!documento) {
            return;
        }

        const statusComercial = this.obterStatusComercial(documento, opcoes);

        if (statusComercial !== "APROVADO") {
            erros.push("Documento Comercial precisa estar APROVADO para conversao em Projeto.");
        }
    },

    validarDuplicidade(documento = null, opcoes = {}, erros = []) {
        if (!documento) {
            return;
        }

        const documentoOrigem = ConversaoModel.criarDocumentoOrigem(documento);
        const conversaoAtual = this.obterConversaoAtual(opcoes);
        const documentoAtual = conversaoAtual.documentoOrigem || {};
        const mesmoDocumento = documentoAtual.id && documentoAtual.id === documentoOrigem.id;

        if (conversaoAtual.convertido && mesmoDocumento) {
            erros.push("Documento Comercial ja foi convertido em Projeto.");
        }

        if (conversaoAtual.projetoAtual && mesmoDocumento) {
            erros.push("Ja existe Projeto gerado para este Documento Comercial.");
        }
    },

    obterStatusComercial(documento = null, opcoes = {}) {
        if (opcoes.statusComercial) {
            return this.normalizarStatus(opcoes.statusComercial);
        }

        if (opcoes.comercial?.statusComercial) {
            return this.normalizarStatus(opcoes.comercial.statusComercial);
        }

        if (documento?.comercial?.statusComercial) {
            return this.normalizarStatus(documento.comercial.statusComercial);
        }

        if (documento?.metadados?.comercial?.statusComercial) {
            return this.normalizarStatus(documento.metadados.comercial.statusComercial);
        }

        if (typeof ComercialService !== "undefined" && typeof ComercialService.obterRegistroAtual === "function") {
            const comercial = ComercialService.obterRegistroAtual(documento, opcoes);
            return this.normalizarStatus(comercial.statusComercial);
        }

        return "RASCUNHO";
    },

    obterConversaoAtual(opcoes = {}) {
        if (opcoes.conversao) {
            return opcoes.conversao;
        }

        const appStateService = this.obterAppStateService();

        if (!appStateService || typeof appStateService.getItem !== "function") {
            return {};
        }

        const configuracoes = appStateService.getItem("configuracoes") || {};
        return configuracoes.conversao || {};
    },

    normalizarDocumento(documento = null) {
        if (typeof ComercialService !== "undefined" && typeof ComercialService.normalizarDocumento === "function") {
            return ComercialService.normalizarDocumento(documento);
        }

        if (documento?.documento && documento.documento.tipo === "DOCUMENTO_COMERCIAL") {
            return documento.documento;
        }

        return documento;
    },

    normalizarStatus(status = "RASCUNHO") {
        if (typeof ComercialModel !== "undefined" && typeof ComercialModel.normalizarStatus === "function") {
            return ComercialModel.normalizarStatus(status);
        }

        return String(status || "RASCUNHO").trim().toUpperCase();
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

    errosUnicos(erros = []) {
        return [...new Set(erros.filter(Boolean))];
    }
};
