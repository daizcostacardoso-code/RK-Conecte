const CaixaModel = {
    criar(dados = {}) {
        const data = this.normalizarData(dados.data || dados.data_movimento);
        const referencia = this.obterReferencia(data);
        const categoria = dados.categoria || (dados.tipo === "entrada" ? "entrada" : "despesa");
        const tipo = this.normalizarTipo(dados.tipo || (categoria === "entrada" ? "entrada" : "saida"));

        return {
            caixaId: String(dados.caixaId ?? dados.caixa_id ?? ""),
            descricao: dados.descricao || "",
            categoria,
            tipo,
            valor: this.normalizarNumero(dados.valor),
            data,
            formaPagamento: dados.formaPagamento ?? dados.forma_pagamento ?? "Nao informado",
            origem: dados.origem || "Manual",
            observacao: dados.observacao || "",
            responsavel: dados.responsavel || "",
            status: this.normalizarStatus(dados.status),
            mesReferencia: dados.mesReferencia ?? dados.mes_referencia ?? referencia.mesReferencia,
            anoReferencia: Number(dados.anoReferencia ?? dados.ano_referencia ?? referencia.anoReferencia) || referencia.anoReferencia,
            diaReferencia: Number(dados.diaReferencia ?? dados.dia_referencia ?? referencia.diaReferencia) || referencia.diaReferencia,
            clienteId: dados.clienteId ?? dados.cliente_id ?? "",
            orcamentoId: dados.orcamentoId ?? dados.orcamento_id ?? "",
            projetoId: dados.projetoId ?? dados.projeto_id ?? "",
            financeiroId: dados.financeiroId ?? dados.financeiro_id ?? "",
            recebimentoId: dados.recebimentoId ?? dados.recebimento_id ?? "",
            usuarioId: dados.usuarioId ?? dados.usuario_id ?? "",
            criadoEm: dados.criadoEm ?? dados.criado_em ?? "",
            atualizadoEm: dados.atualizadoEm ?? dados.atualizado_em ?? "",
            bloqueado: Boolean(dados.bloqueado || dados.financeiroId || dados.financeiro_id)
        };
    },

    normalizarLista(lista) {
        return (Array.isArray(lista) ? lista : []).map(movimento => this.criar(movimento));
    },

    ordenar(lista) {
        return this.normalizarLista(lista).sort((a, b) => {
            const dataA = `${a.data || ""} ${a.criadoEm || ""}`;
            const dataB = `${b.data || ""} ${b.criadoEm || ""}`;
            return String(dataB).localeCompare(String(dataA));
        });
    },

    chave(movimento = {}, indice = 0) {
        return String(movimento.caixaId || movimento.caixa_id || `caixa_${indice}`);
    },

    identidades(movimento = {}, indice = 0) {
        return [movimento.caixaId, movimento.caixa_id, `caixa_${indice}`].filter(Boolean).map(String);
    },

    normalizarTipo(tipo) {
        return String(tipo || "saida").toLowerCase() === "entrada" ? "entrada" : "saida";
    },

    normalizarStatus(status) {
        const valor = String(status || "confirmado").toLowerCase();
        if (valor.includes("pend")) return "pendente";
        if (valor.includes("cancel")) return "cancelado";
        return "confirmado";
    },

    normalizarData(data) {
        const texto = String(data || "").trim();
        const padraoIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (padraoIso && this.dataValida(padraoIso[1], padraoIso[2], padraoIso[3])) {
            return `${padraoIso[1]}-${padraoIso[2]}-${padraoIso[3]}`;
        }

        const padraoBrasileiro = texto.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
        if (padraoBrasileiro && this.dataValida(padraoBrasileiro[3], padraoBrasileiro[2], padraoBrasileiro[1])) {
            return `${padraoBrasileiro[3]}-${padraoBrasileiro[2]}-${padraoBrasileiro[1]}`;
        }

        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    },

    dataValida(ano, mes, dia) {
        const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
        return data.getFullYear() === Number(ano)
            && data.getMonth() === Number(mes) - 1
            && data.getDate() === Number(dia);
    },

    obterReferencia(data) {
        const [ano, mes, dia] = this.normalizarData(data).split("-");
        return { mesReferencia: `${ano}-${mes}`, anoReferencia: Number(ano), diaReferencia: Number(dia) };
    },

    normalizarNumero(valor) {
        if (valor === null || valor === undefined || valor === "") return 0;
        if (typeof Util !== "undefined" && Util && typeof Util.numero === "function") return Util.numero(valor);
        const numero = Number(String(valor).replace(/\./g, "").replace(",", "."));
        return Number.isFinite(numero) ? Number(numero.toFixed(2)) : 0;
    }
};

window.CaixaModel = CaixaModel;
