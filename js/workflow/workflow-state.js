const WORKFLOW_STATE = Object.freeze({
    RASCUNHO: "rascunho",
    EM_ORCAMENTO: "em_orcamento",
    ENVIADO: "enviado",
    APROVADO: "aprovado",
    EM_PRODUCAO: "em_producao",
    PRONTO_INSTALACAO: "pronto_instalacao",
    EM_INSTALACAO: "em_instalacao",
    AGUARDANDO_PAGAMENTO: "aguardando_pagamento",
    CONCLUIDO: "concluido",
    GARANTIA: "garantia",
    ARQUIVADO: "arquivado",
    CANCELADO: "cancelado"
});

const WorkflowState = {
    valores: WORKFLOW_STATE,

    rotulos: {
        rascunho: "Rascunho",
        em_orcamento: "Em orcamento",
        enviado: "Enviado",
        aprovado: "Aprovado",
        em_producao: "Em producao",
        pronto_instalacao: "Pronto para instalacao",
        em_instalacao: "Em instalacao",
        aguardando_pagamento: "Aguardando pagamento",
        concluido: "Concluido",
        garantia: "Garantia",
        arquivado: "Arquivado",
        cancelado: "Cancelado"
    },

    todos() {
        return Object.values(WORKFLOW_STATE);
    },

    existe(estado) {
        return this.todos().includes(estado);
    },

    rotulo(estado) {
        return this.rotulos[estado] || estado || "";
    },

    final(estado) {
        return estado === WORKFLOW_STATE.ARQUIVADO || estado === WORKFLOW_STATE.CANCELADO;
    }
};

