const ORCAMENTO_STATE = Object.freeze({
    INICIADO: "INICIADO",
    CLIENTE_SELECIONADO: "CLIENTE_SELECIONADO",
    PROJETO_SELECIONADO: "PROJETO_SELECIONADO",
    SERVICO_SELECIONADO: "SERVICO_SELECIONADO",
    PRODUTOS_ADICIONADOS: "PRODUTOS_ADICIONADOS",
    CALCULADO: "CALCULADO",
    VALIDADO: "VALIDADO",
    FINALIZADO: "FINALIZADO"
});

const OrcamentoState = {
    valores: ORCAMENTO_STATE,

    fluxo: [
        ORCAMENTO_STATE.INICIADO,
        ORCAMENTO_STATE.CLIENTE_SELECIONADO,
        ORCAMENTO_STATE.PROJETO_SELECIONADO,
        ORCAMENTO_STATE.SERVICO_SELECIONADO,
        ORCAMENTO_STATE.PRODUTOS_ADICIONADOS,
        ORCAMENTO_STATE.CALCULADO,
        ORCAMENTO_STATE.VALIDADO,
        ORCAMENTO_STATE.FINALIZADO
    ],

    existe(estado) {
        return this.fluxo.includes(estado);
    },

    indice(estado) {
        return this.fluxo.indexOf(estado);
    },

    podeAvancar(estadoAtual, proximoEstado) {
        const atual = this.indice(estadoAtual);
        const proximo = this.indice(proximoEstado);

        if (atual < 0 || proximo < 0) {
            return false;
        }

        return proximo >= atual;
    },

    final(estado) {
        return estado === ORCAMENTO_STATE.FINALIZADO;
    }
};
