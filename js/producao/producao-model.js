const PRODUCAO_STATUS = Object.freeze({
    PENDENTE: "PENDENTE",
    PLANEJADA: "PLANEJADA",
    EM_PRODUCAO: "EM_PRODUCAO",
    FINALIZADA: "FINALIZADA"
});

const ProducaoModel = {
    status: PRODUCAO_STATUS,

    rotulosStatus: {
        PENDENTE: "Pendente",
        PLANEJADA: "Planejada",
        EM_PRODUCAO: "Em producao",
        FINALIZADA: "Finalizada"
    },

    transicoes: {
        PENDENTE: ["PLANEJADA"],
        PLANEJADA: ["EM_PRODUCAO"],
        EM_PRODUCAO: ["FINALIZADA"],
        FINALIZADA: []
    },

    criar(dados = {}) {
        const agora = this.agoraISO();

        const ordem = this.normalizar({
            ...dados,
            id: dados.id || this.criarId(),
            status: dados.status || PRODUCAO_STATUS.PENDENTE,
            dataCriacao: dados.dataCriacao || agora,
            dataAtualizacao: dados.dataAtualizacao || agora
        });

        if (!ordem.historico.length) {
            return this.adicionarEvento(
                ordem,
                "criada",
                "Ordem de producao criada",
                dados.usuario || "Sistema"
            );
        }

        return ordem;
    },

    normalizar(dados = {}) {
        const agora = this.agoraISO();

        return {
            id: this.texto(dados.id) || this.criarId(),
            projetoId: this.texto(dados.projetoId || dados.projeto?.id),
            status: this.normalizarStatus(dados.status),
            dataCriacao: dados.dataCriacao || dados.criadoEmISO || agora,
            dataAtualizacao: dados.dataAtualizacao || dados.atualizadoEmISO || agora,
            responsavel: this.texto(dados.responsavel),
            prioridade: this.texto(dados.prioridade || "MEDIA").toUpperCase(),
            observacoes: this.texto(dados.observacoes),
            historico: Array.isArray(dados.historico) ? dados.historico : []
        };
    },

    atualizar(ordem = {}, alteracoes = {}) {
        const anterior = this.normalizar(ordem);

        return this.normalizar({
            ...anterior,
            ...alteracoes,
            dataCriacao: anterior.dataCriacao,
            dataAtualizacao: this.agoraISO(),
            historico: [...anterior.historico]
        });
    },

    alterarStatus(ordem = {}, novoStatus, usuario = "Sistema") {
        const anterior = this.normalizar(ordem);
        const statusDestino = this.normalizarStatus(novoStatus);
        const atualizado = this.normalizar({
            ...anterior,
            status: statusDestino,
            dataCriacao: anterior.dataCriacao,
            dataAtualizacao: this.agoraISO(),
            historico: [...anterior.historico]
        });

        return this.adicionarEvento(
            atualizado,
            "status_alterado",
            `Status alterado de ${anterior.status} para ${statusDestino}`,
            usuario,
            {
                statusAnterior: anterior.status,
                statusDestino
            }
        );
    },

    adicionarEvento(ordem = {}, tipo, descricao, usuario = "Sistema", dados = {}) {
        const evento = this.criarEvento(tipo, descricao, usuario, dados);
        const historico = Array.isArray(ordem.historico) ? [...ordem.historico, evento] : [evento];

        return {
            ...ordem,
            historico,
            dataAtualizacao: evento.data
        };
    },

    criarEvento(tipo, descricao, usuario = "Sistema", dados = {}) {
        return {
            tipo: tipo || "evento",
            descricao: descricao || "",
            usuario: usuario || "Sistema",
            data: this.agoraISO(),
            dados: dados || {}
        };
    },

    normalizarStatus(status) {
        const valor = this.slug(status || PRODUCAO_STATUS.PENDENTE);
        const aliases = {
            PENDENTE: PRODUCAO_STATUS.PENDENTE,
            PLANEJADA: PRODUCAO_STATUS.PLANEJADA,
            PLANEJADO: PRODUCAO_STATUS.PLANEJADA,
            EM_PRODUCAO: PRODUCAO_STATUS.EM_PRODUCAO,
            PRODUCAO: PRODUCAO_STATUS.EM_PRODUCAO,
            INICIADA: PRODUCAO_STATUS.EM_PRODUCAO,
            INICIADO: PRODUCAO_STATUS.EM_PRODUCAO,
            FINALIZADA: PRODUCAO_STATUS.FINALIZADA,
            FINALIZADO: PRODUCAO_STATUS.FINALIZADA
        };

        return aliases[valor] || valor;
    },

    statusValido(status) {
        return Object.values(PRODUCAO_STATUS).includes(this.normalizarStatus(status));
    },

    podeTransicionar(statusAtual, novoStatus) {
        const origem = this.normalizarStatus(statusAtual);
        const destino = this.normalizarStatus(novoStatus);
        return (this.transicoes[origem] || []).includes(destino);
    },

    obterProximosStatus(statusAtual) {
        const origem = this.normalizarStatus(statusAtual);
        return [...(this.transicoes[origem] || [])];
    },

    rotuloStatus(status) {
        return this.rotulosStatus[this.normalizarStatus(status)] || status || "";
    },

    slug(valor) {
        return this.removerAcentos(valor)
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    removerAcentos(valor) {
        return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    texto(valor) {
        return String(valor || "").trim();
    },

    criarId(prefixo = "op") {
        return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

const OrdemProducaoModel = ProducaoModel;

function criarOrdemProducaoBase(dados = {}) {
    return ProducaoModel.criar(dados);
}
