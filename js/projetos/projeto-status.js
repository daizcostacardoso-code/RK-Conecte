const STATUS_PROJETO = Object.freeze({
    RASCUNHO: "rascunho",
    EM_ORCAMENTO: "em_orcamento",
    ENVIADO: "enviado",
    APROVADO: "aprovado",
    EM_PRODUCAO: "em_producao",
    EM_INSTALACAO: "em_instalacao",
    FINALIZADO: "finalizado",
    CONCLUIDO: "concluido",
    CANCELADO: "cancelado"
});

const ETAPA_PROJETO = Object.freeze({
    COMERCIAL: "comercial",
    PRODUCAO: "producao",
    INSTALACAO: "instalacao",
    FINANCEIRO: "financeiro",
    FINALIZADO: "finalizado"
});

const ProjetoStatus = {
    rotulos: {
        rascunho: "Rascunho",
        em_orcamento: "Em orcamento",
        enviado: "Enviado",
        aprovado: "Aprovado",
        em_producao: "Em producao",
        em_instalacao: "Em instalacao",
        finalizado: "Finalizado",
        concluido: "Concluido",
        cancelado: "Cancelado"
    },

    etapasPorStatus: {
        rascunho: "comercial",
        em_orcamento: "comercial",
        enviado: "comercial",
        aprovado: "comercial",
        em_producao: "producao",
        em_instalacao: "instalacao",
        finalizado: "finalizado",
        concluido: "finalizado",
        cancelado: "finalizado"
    },

    todos() {
        return Object.values(STATUS_PROJETO);
    },

    valido(status) {
        return this.todos().includes(status);
    },

    rotulo(status) {
        return this.rotulos[status] || status || "";
    },

    etapaPorStatus(status) {
        return this.etapasPorStatus[status] || ETAPA_PROJETO.COMERCIAL;
    },

    finalizado(status) {
        return status === STATUS_PROJETO.FINALIZADO || status === STATUS_PROJETO.CONCLUIDO || status === STATUS_PROJETO.CANCELADO;
    }
};
