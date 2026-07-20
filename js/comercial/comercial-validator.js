const ComercialValidator = {
    validarDocumento(documento = null) {
        const erros = [];

        if (!documento || typeof documento !== "object") {
            return {
                valido: false,
                erros: ["Documento Comercial e obrigatorio."]
            };
        }

        if (typeof DocumentService !== "undefined" && typeof DocumentService.validarDocumento === "function") {
            const validacaoDocumento = DocumentService.validarDocumento(documento);

            if (!validacaoDocumento.valido) {
                erros.push(...validacaoDocumento.erros);
            }
        }

        if (typeof DocumentRenderer !== "undefined" && typeof DocumentRenderer.prepararVisualizacao === "function") {
            const visualizacao = DocumentRenderer.prepararVisualizacao(documento);

            if (!visualizacao.sucesso) {
                erros.push(...visualizacao.erros);
            }
        }

        return {
            valido: erros.length === 0,
            erros: this.errosUnicos(erros)
        };
    },

    validarSolicitacao(documento = null, statusAtual = COMERCIAL_STATUS.RASCUNHO) {
        const erros = [];
        const status = this.normalizarStatus(statusAtual);

        this.adicionarErrosDocumento(documento, erros);

        if (status === COMERCIAL_STATUS.APROVADO) {
            erros.push("Documento Comercial aprovado nao pode solicitar nova aprovacao.");
        }

        if (status === COMERCIAL_STATUS.EM_REVISAO) {
            erros.push("Documento Comercial ja esta em revisao.");
        }

        if (status !== COMERCIAL_STATUS.RASCUNHO) {
            erros.push("Solicitacao de aprovacao permitida apenas para rascunho.");
        }

        return this.resposta(erros);
    },

    validarAprovacao(documento = null, statusAtual = COMERCIAL_STATUS.RASCUNHO) {
        const erros = [];
        const status = this.normalizarStatus(statusAtual);

        this.adicionarErrosDocumento(documento, erros);

        if (status === COMERCIAL_STATUS.APROVADO) {
            erros.push("Documento Comercial ja aprovado nao pode ser aprovado novamente.");
        }

        if (status !== COMERCIAL_STATUS.EM_REVISAO) {
            erros.push("Documento Comercial precisa estar em revisao para ser aprovado.");
        }

        return this.resposta(erros);
    },

    validarReprovacao(documento = null, statusAtual = COMERCIAL_STATUS.RASCUNHO) {
        const erros = [];
        const status = this.normalizarStatus(statusAtual);

        if (!documento || typeof documento !== "object") {
            erros.push("Nao e permitido reprovar documento inexistente.");
            return this.resposta(erros);
        }

        this.adicionarErrosDocumento(documento, erros);

        if (status !== COMERCIAL_STATUS.EM_REVISAO) {
            erros.push("Documento Comercial precisa estar em revisao para ser reprovado.");
        }

        return this.resposta(erros);
    },

    validarVoltarRevisao(documento = null, statusAtual = COMERCIAL_STATUS.RASCUNHO) {
        const erros = [];
        const status = this.normalizarStatus(statusAtual);

        this.adicionarErrosDocumento(documento, erros);

        if (![COMERCIAL_STATUS.APROVADO, COMERCIAL_STATUS.REPROVADO].includes(status)) {
            erros.push("Voltar para revisao exige documento aprovado ou reprovado.");
        }

        return this.resposta(erros);
    },

    validarTransicao(statusAtual = COMERCIAL_STATUS.RASCUNHO, statusDestino = COMERCIAL_STATUS.RASCUNHO) {
        const origem = this.normalizarStatus(statusAtual);
        const destino = this.normalizarStatus(statusDestino);
        const transicoes = {
            [COMERCIAL_STATUS.RASCUNHO]: [COMERCIAL_STATUS.EM_REVISAO],
            [COMERCIAL_STATUS.EM_REVISAO]: [COMERCIAL_STATUS.APROVADO, COMERCIAL_STATUS.REPROVADO],
            [COMERCIAL_STATUS.APROVADO]: [COMERCIAL_STATUS.EM_REVISAO],
            [COMERCIAL_STATUS.REPROVADO]: [COMERCIAL_STATUS.EM_REVISAO]
        };

        return {
            valido: (transicoes[origem] || []).includes(destino),
            origem,
            destino,
            proximos: [...(transicoes[origem] || [])]
        };
    },

    adicionarErrosDocumento(documento = null, erros = []) {
        const validacaoDocumento = this.validarDocumento(documento);

        if (!validacaoDocumento.valido) {
            erros.push(...validacaoDocumento.erros);
        }
    },

    normalizarStatus(status = COMERCIAL_STATUS.RASCUNHO) {
        if (typeof ComercialModel !== "undefined" && typeof ComercialModel.normalizarStatus === "function") {
            return ComercialModel.normalizarStatus(status);
        }

        const valor = String(status || "").trim().toUpperCase();
        return Object.values(COMERCIAL_STATUS).includes(valor) ? valor : COMERCIAL_STATUS.RASCUNHO;
    },

    resposta(erros = []) {
        return {
            valido: erros.length === 0,
            erros: this.errosUnicos(erros)
        };
    },

    errosUnicos(erros = []) {
        return [...new Set(erros.filter(Boolean))];
    }
};
