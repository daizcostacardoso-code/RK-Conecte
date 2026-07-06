const CaixaModel = {
    schemaVersion: 1,

    criar(dados = {}, indice = 0) {
        const agoraISO = new Date().toISOString();
        const criadoEmISO = this.normalizarISO(dados.criadoEmISO, agoraISO);
        const data = this.normalizarData(dados.data, criadoEmISO);
        const referencia = this.obterReferencia(data);
        const categoria = dados.categoria || (dados.tipo === "entrada" ? "entrada" : "despesa");
        const tipo = this.normalizarTipo(dados.tipo || (categoria === "entrada" ? "entrada" : "saida"));
        const status = this.normalizarStatus(dados.status);
        const idLocal = dados.idLocal || this.criarIdLocal(criadoEmISO, indice);
        const valor = this.normalizarNumero(dados.valor);

        return {
            idLocal,
            idFirestore: dados.idFirestore || "",
            descricao: dados.descricao || "",
            categoria,
            tipo,
            valor,
            data,
            formaPagamento: dados.formaPagamento || "Nao informado",
            origem: dados.origem || "Manual",
            observacao: dados.observacao || "",
            responsavel: dados.responsavel || "",
            status,
            mesReferencia: dados.mesReferencia || referencia.mesReferencia,
            anoReferencia: Number(dados.anoReferencia || referencia.anoReferencia) || referencia.anoReferencia,
            diaReferencia: Number(dados.diaReferencia || referencia.diaReferencia) || referencia.diaReferencia,
            clienteId: dados.clienteId || "",
            orcamentoId: dados.orcamentoId || "",
            usuarioId: dados.usuarioId || "",
            criadoEm: dados.criadoEm || this.agoraLocal(),
            criadoEmISO,
            atualizadoEmISO: dados.atualizadoEmISO || criadoEmISO,
            schemaVersion: Number(dados.schemaVersion || this.schemaVersion) || this.schemaVersion
        };
    },

    normalizarLista(lista) {
        return (Array.isArray(lista) ? lista : [])
            .map((movimento, indice) => this.criar(movimento, indice));
    },

    ordenar(lista) {
        return this.normalizarLista(lista).sort((a, b) => {
            const dataA = `${a.data || ""} ${a.criadoEmISO || ""}`;
            const dataB = `${b.data || ""} ${b.criadoEmISO || ""}`;
            return String(dataB).localeCompare(String(dataA));
        });
    },

    chave(movimento = {}, indice = 0) {
        return String(
            movimento.idFirestore ||
            movimento.idLocal ||
            movimento.criadoEmISO ||
            `caixa_${indice}`
        );
    },

    identidades(movimento = {}, indice = 0) {
        return [
            movimento.idFirestore,
            movimento.idLocal,
            movimento.criadoEmISO,
            `caixa_${indice}`
        ].filter(Boolean).map(String);
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

    normalizarData(data, fallbackISO = "") {
        const texto = String(data || "").slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

        const fallback = String(fallbackISO || "").slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(fallback)) return fallback;

        return new Date().toISOString().slice(0, 10);
    },

    normalizarISO(valor, fallbackISO = new Date().toISOString()) {
        const texto = String(valor || "");
        if (/^\d{4}-\d{2}-\d{2}T/.test(texto)) return texto;
        return fallbackISO;
    },

    obterReferencia(data) {
        const normalizada = this.normalizarData(data);
        const [ano, mes, dia] = normalizada.split("-");
        return {
            mesReferencia: `${ano}-${mes}`,
            anoReferencia: Number(ano),
            diaReferencia: Number(dia)
        };
    },

    criarIdLocal(criadoEmISO, indice = 0) {
        const base = String(criadoEmISO || new Date().toISOString()).replace(/[^0-9]/g, "");
        return `caixa_${base || Date.now()}_${indice}`;
    },

    normalizarNumero(valor) {
        if (valor === null || valor === undefined || valor === "") return 0;
        if (typeof Util !== "undefined" && Util && typeof Util.numero === "function") {
            return Util.numero(valor);
        }

        const numero = Number(String(valor).replace(/\./g, "").replace(",", "."));
        return Number.isFinite(numero) ? Number(numero.toFixed(2)) : 0;
    },

    agoraLocal() {
        if (typeof Util !== "undefined" && Util && typeof Util.agora === "function") {
            return Util.agora();
        }

        return new Date().toLocaleString("pt-BR");
    }
};

window.CaixaModel = CaixaModel;
