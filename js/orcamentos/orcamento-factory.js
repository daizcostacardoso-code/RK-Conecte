const OrcamentoFactory = {
    criar(dados = {}) {
        return this.criarContextoInicial(dados);
    },

    criarContextoInicial(dados = {}) {
        const contexto = OrcamentoContext.criar({
            ...dados,
            status: dados.status || ORCAMENTO_STATE.INICIADO
        });

        if (contexto.historico.length) {
            return contexto;
        }

        return OrcamentoContext.registrarEvento(
            contexto,
            "orcamento_iniciado",
            "Contexto de orcamento iniciado.",
            {
                status: contexto.status
            }
        );
    }
};
