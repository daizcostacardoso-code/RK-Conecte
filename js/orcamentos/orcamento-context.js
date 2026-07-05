const OrcamentoContext = {
    criar(dados = {}) {
        const agora = this.agoraISO();

        return this.normalizar({
            cliente: null,
            projeto: null,
            servico: null,
            produtos: [],
            calculo: null,
            resultado: null,
            observacoes: {},
            condicoesComerciais: {},
            resumo: null,
            validacaoFinal: null,
            orcamentoPreparado: null,
            status: ORCAMENTO_STATE.INICIADO,
            historico: [],
            criadoEm: agora,
            atualizadoEm: agora,
            ...dados
        });
    },

    normalizar(dados = {}) {
        const agora = this.agoraISO();

        return {
            cliente: dados.cliente || null,
            projeto: dados.projeto || null,
            servico: dados.servico || null,
            produtos: Array.isArray(dados.produtos) ? dados.produtos : [],
            calculo: dados.calculo || null,
            resultado: dados.resultado || null,
            observacoes: this.normalizarObservacoes(dados.observacoes),
            condicoesComerciais: this.normalizarCondicoes(dados.condicoesComerciais),
            resumo: dados.resumo || null,
            validacaoFinal: dados.validacaoFinal || null,
            orcamentoPreparado: dados.orcamentoPreparado || null,
            status: this.normalizarStatus(dados.status),
            historico: Array.isArray(dados.historico) ? dados.historico : [],
            criadoEm: dados.criadoEm || agora,
            atualizadoEm: dados.atualizadoEm || agora
        };
    },

    atualizar(contexto = {}, alteracoes = {}, evento = null) {
        const atual = this.normalizar(contexto);
        const atualizado = this.normalizar({
            ...atual,
            ...alteracoes,
            criadoEm: atual.criadoEm,
            atualizadoEm: this.agoraISO()
        });

        if (!evento) {
            return atualizado;
        }

        return this.registrarEvento(atualizado, evento.tipo, evento.descricao, evento.dados);
    },

    registrarEvento(contexto = {}, tipo, descricao, dados = {}) {
        const atual = this.normalizar(contexto);
        const evento = {
            tipo: tipo || "evento",
            descricao: descricao || "",
            dados: dados || {},
            data: this.agoraISO()
        };

        return {
            ...atual,
            historico: [...atual.historico, evento],
            atualizadoEm: evento.data
        };
    },

    normalizarStatus(status) {
        if (typeof OrcamentoState !== "undefined" && OrcamentoState.existe(status)) {
            return status;
        }

        return ORCAMENTO_STATE.INICIADO;
    },

    normalizarObservacoes(observacoes = {}) {
        return {
            livre: String(observacoes?.livre || "").trim(),
            comerciais: String(observacoes?.comerciais || "").trim(),
            tecnicas: String(observacoes?.tecnicas || "").trim()
        };
    },

    normalizarCondicoes(condicoes = {}) {
        return {
            formaPagamento: String(condicoes?.formaPagamento || "").trim(),
            prazoEntrega: String(condicoes?.prazoEntrega || "").trim(),
            validadeProposta: String(condicoes?.validadeProposta || "").trim()
        };
    },

    agoraISO() {
        return new Date().toISOString();
    }
};
