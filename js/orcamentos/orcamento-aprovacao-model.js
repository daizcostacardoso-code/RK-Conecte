const OrcamentoAprovacaoStatus = Object.freeze({
    RASCUNHO: "rascunho",
    EMITIDO: "emitido",
    ENVIADO: "enviado",
    APROVADO: "aprovado",
    RECUSADO: "recusado",
    EXPIRADO: "expirado",
    CANCELADO: "cancelado"
});

const OrcamentoAprovacaoModel = {
    status: OrcamentoAprovacaoStatus,

    normalizarRegistro(registro = {}) {
        const base = this.copiar(registro);
        const status = this.normalizarStatus(base.status || base.aprovacao?.status);
        const aprovacao = this.normalizarAprovacao(base.aprovacao, status);
        const historicoOriginal = Array.isArray(base.historicoStatus) ? base.historicoStatus : [];
        const historicoStatus = historicoOriginal.length
            ? historicoOriginal.map(item => this.normalizarHistorico(item, status))
            : [this.criarHistorico({
                statusAnterior: null,
                statusAtual: status,
                acao: "orcamento_normalizado",
                observacao: "Registro anterior compatibilizado com o fluxo comercial.",
                realizadoEm: base.criadoEmISO || base.dataEmissao || this.agoraISO(),
                origem: "normalizacao"
            })];

        return {
            ...base,
            status,
            aprovacao,
            historicoStatus,
            atualizadoEmISO: this.dataISO(base.atualizadoEmISO || base.atualizadoEm || base.criadoEmISO || base.dataEmissao) || this.agoraISO()
        };
    },

    normalizarStatus(valor, padrao = OrcamentoAprovacaoStatus.EMITIDO) {
        const chave = this.chave(valor);
        const mapa = {
            rascunho: OrcamentoAprovacaoStatus.RASCUNHO,
            emitido: OrcamentoAprovacaoStatus.EMITIDO,
            enviado: OrcamentoAprovacaoStatus.ENVIADO,
            aprovado: OrcamentoAprovacaoStatus.APROVADO,
            recusado: OrcamentoAprovacaoStatus.RECUSADO,
            reprovado: OrcamentoAprovacaoStatus.RECUSADO,
            expirado: OrcamentoAprovacaoStatus.EXPIRADO,
            cancelado: OrcamentoAprovacaoStatus.CANCELADO,
            em_revisao: OrcamentoAprovacaoStatus.ENVIADO,
            finalizado: OrcamentoAprovacaoStatus.EMITIDO,
            calculado: OrcamentoAprovacaoStatus.EMITIDO,
            preparado: OrcamentoAprovacaoStatus.EMITIDO
        };
        return mapa[chave] || padrao;
    },

    normalizarAprovacao(aprovacao = {}, status = OrcamentoAprovacaoStatus.EMITIDO) {
        const origem = aprovacao && typeof aprovacao === "object" ? aprovacao : {};
        const statusAprovacao = this.statusDaAprovacao(status, origem.status);
        return {
            ...origem,
            status: statusAprovacao,
            aprovadoEm: this.dataISO(origem.aprovadoEm) || null,
            recusadoEm: this.dataISO(origem.recusadoEm) || null,
            canceladoEm: this.dataISO(origem.canceladoEm) || null,
            aprovadoPor: this.normalizarUsuario(origem.aprovadoPor),
            recusadoPor: this.normalizarUsuario(origem.recusadoPor),
            canceladoPor: this.normalizarUsuario(origem.canceladoPor),
            observacao: this.texto(origem.observacao),
            motivoRecusa: this.texto(origem.motivoRecusa),
            valorAprovadoCentavos: this.centavos(origem.valorAprovadoCentavos),
            versaoOrcamento: Math.max(1, Number.parseInt(origem.versaoOrcamento, 10) || 1)
        };
    },

    statusDaAprovacao(status, valorAtual = "") {
        if (status === OrcamentoAprovacaoStatus.APROVADO) return "aprovado";
        if (status === OrcamentoAprovacaoStatus.RECUSADO) return "recusado";
        if (status === OrcamentoAprovacaoStatus.CANCELADO) return "cancelado";
        const atual = this.chave(valorAtual);
        return ["aprovado", "recusado", "cancelado"].includes(atual) ? atual : "pendente";
    },

    criarHistorico(dados = {}) {
        return {
            id: this.texto(dados.id) || this.identificador(),
            statusAnterior: dados.statusAnterior === null ? null : this.normalizarStatus(dados.statusAnterior),
            statusAtual: this.normalizarStatus(dados.statusAtual),
            acao: this.texto(dados.acao),
            observacao: this.texto(dados.observacao),
            realizadoEm: this.dataISO(dados.realizadoEm) || this.agoraISO(),
            realizadoPor: this.normalizarUsuario(dados.realizadoPor),
            origem: this.texto(dados.origem) || "sistema"
        };
    },

    normalizarHistorico(item = {}, statusPadrao = OrcamentoAprovacaoStatus.EMITIDO) {
        return this.criarHistorico({
            ...item,
            statusAnterior: item.statusAnterior === null ? null : (item.statusAnterior || statusPadrao),
            statusAtual: item.statusAtual || statusPadrao,
            realizadoEm: item.realizadoEm || item.data,
            realizadoPor: item.realizadoPor || { uid: item.usuario || "", nome: item.usuario || "", email: "" }
        });
    },

    limparDecisaoParaNovaVersao(aprovacao = {}) {
        const atual = this.normalizarAprovacao(aprovacao);
        return {
            ...atual,
            status: "pendente",
            aprovadoEm: null,
            recusadoEm: null,
            canceladoEm: null,
            aprovadoPor: null,
            recusadoPor: null,
            canceladoPor: null,
            observacao: "",
            motivoRecusa: "",
            valorAprovadoCentavos: 0,
            versaoOrcamento: atual.versaoOrcamento + 1
        };
    },

    obterCliente(registro = {}) {
        return registro.cliente || registro.documento?.dados?.cliente || registro.dados?.cliente || {};
    },

    obterItens(registro = {}) {
        const itens = registro.itens || registro.documento?.dados?.produtos || registro.dados?.produtos || [];
        return Array.isArray(itens) ? itens : [];
    },

    obterTotal(registro = {}) {
        const totais = registro.totais || registro.documento?.dados?.totais || registro.dados?.totais || {};
        const valor = registro.total ?? registro.totalGeral ?? registro.valorTotal ?? registro.totalFinal
            ?? totais.totalGeral ?? totais.totalFinal ?? totais.total;
        return this.numero(valor);
    },

    normalizarUsuario(usuario = null) {
        if (!usuario || typeof usuario !== "object") return null;
        return {
            uid: this.texto(usuario.uid || usuario.id || usuario.usuario),
            nome: this.texto(usuario.nome || usuario.nomeUsuario || usuario.usuario),
            email: this.texto(usuario.email)
        };
    },

    centavos(valor) {
        const numero = this.numero(valor);
        return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : 0;
    },

    valorEmCentavos(valor) {
        return Math.max(0, Math.round(this.numero(valor) * 100));
    },

    numero(valor) {
        if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
        const texto = this.texto(valor);
        if (!texto) return 0;
        const normalizado = texto.includes(",")
            ? texto.replace(/\./g, "").replace(",", ".")
            : texto;
        const numero = Number(normalizado);
        return Number.isFinite(numero) ? numero : 0;
    },

    dataISO(valor) {
        if (!valor) return "";
        if (typeof valor?.toDate === "function") return this.dataISO(valor.toDate());
        const data = new Date(valor);
        return Number.isNaN(data.getTime()) ? "" : data.toISOString();
    },

    chave(valor) {
        return this.texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    texto(valor) {
        return String(valor === undefined || valor === null ? "" : valor).trim();
    },

    copiar(valor) {
        if (Array.isArray(valor)) return valor.map(item => this.copiar(item));
        if (valor && Object.prototype.toString.call(valor) === "[object Object]") {
            return Object.keys(valor).reduce((copia, chave) => {
                copia[chave] = this.copiar(valor[chave]);
                return copia;
            }, {});
        }
        return valor;
    },

    identificador() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
        return `hist_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

if (typeof window !== "undefined") {
    window.OrcamentoAprovacaoStatus = OrcamentoAprovacaoStatus;
    window.OrcamentoAprovacaoModel = OrcamentoAprovacaoModel;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { OrcamentoAprovacaoStatus, OrcamentoAprovacaoModel };
}
