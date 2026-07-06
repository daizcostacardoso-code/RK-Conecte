const OrcamentoContext = {
    criar(dados = {}) {
        const agora = this.agoraISO();

        return this.normalizar({
            cliente: null,
            projeto: null,
            servico: null,
            servicosSelecionados: [],
            produtos: [],
            calculo: null,
            resultado: null,
            ajustesFinanceiros: {},
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
            servicosSelecionados: this.normalizarServicosSelecionados(dados.servicosSelecionados || dados.servicos || dados.tiposServico),
            produtos: Array.isArray(dados.produtos) ? dados.produtos : [],
            calculo: dados.calculo || null,
            resultado: dados.resultado || null,
            ajustesFinanceiros: this.normalizarAjustesFinanceiros(dados.ajustesFinanceiros || dados.ajustes),
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
            formaPagamentoComplemento: String(condicoes?.formaPagamentoComplemento || "").trim(),
            prazoEntrega: String(condicoes?.prazoEntrega || "").trim(),
            prazoEntregaComplemento: String(condicoes?.prazoEntregaComplemento || "").trim(),
            validadeProposta: String(condicoes?.validadeProposta || "").trim()
        };
    },

    normalizarServicosSelecionados(servicos = []) {
        const lista = Array.isArray(servicos) ? servicos : (servicos ? [servicos] : []);
        const vistos = new Set();

        return lista
            .map(servico => {
                if (servico && typeof servico === "object") {
                    const id = this.slug(servico.id || servico.grupoServico || servico.categoria || servico.nome);
                    return {
                        id,
                        nome: String(servico.nome || servico.rotulo || servico.id || "").trim(),
                        plural: String(servico.plural || "").trim(),
                        itemSingular: String(servico.itemSingular || "").trim()
                    };
                }

                const id = this.slug(servico);
                return {
                    id,
                    nome: String(servico || "").trim(),
                    plural: "",
                    itemSingular: ""
                };
            })
            .filter(servico => {
                if (!servico.id || vistos.has(servico.id)) {
                    return false;
                }

                vistos.add(servico.id);
                return true;
            });
    },

    normalizarAjustesFinanceiros(ajustes = {}) {
        return {
            descontoTipo: this.normalizarTipoAjuste(ajustes?.descontoTipo || ajustes?.tipoDesconto || "sem"),
            descontoValor: this.numero(ajustes?.descontoValor ?? ajustes?.desconto, 0),
            acrescimoTipo: this.normalizarTipoAjuste(ajustes?.acrescimoTipo || ajustes?.tipoAcrescimo || "sem"),
            acrescimoValor: this.numero(ajustes?.acrescimoValor ?? ajustes?.acrescimo, 0),
            moeda: String(ajustes?.moeda || "BRL").trim()
        };
    },

    normalizarTipoAjuste(tipo) {
        const valor = this.slug(tipo || "sem");

        if (["valor", "fixo", "real", "reais"].includes(valor)) {
            return "valor";
        }

        if (["percentual", "porcentagem", "percent", "pct"].includes(valor)) {
            return "percentual";
        }

        return "sem";
    },

    numero(valor, padrao = 0) {
        if (valor === undefined || valor === null || valor === "") {
            return padrao;
        }

        const numero = Number(String(valor).replace(",", "."));
        return Number.isFinite(numero) ? numero : padrao;
    },

    slug(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    agoraISO() {
        return new Date().toISOString();
    }
};
