const EventListenerRegistry = {
    registrado: false,

    registrarListenersBase() {
        if (this.registrado) {
            return false;
        }

        this.registrado = true;

        this.registrarTimeline();
        this.registrarDashboard();
        this.registrarFinanceiro();
        this.registrarProducao();

        return true;
    },

    registrarTimeline() {
        // Futuro: Timeline podera ouvir eventos como projeto.status_alterado
        // e projeto.evento_adicionado para montar a linha do tempo do Projeto.
        return true;
    },

    registrarDashboard() {
        // Futuro: Dashboard podera reagir a projeto.criado, projeto.aprovado
        // e instalacao.concluida para atualizar filas de trabalho e alertas.
        return true;
    },

    registrarFinanceiro() {
        // Futuro: Financeiro podera ouvir projeto.aprovado e
        // financeiro.pagamento_recebido para atualizar saldo e pendencias.
        return true;
    },

    registrarProducao() {
        // Futuro: Producao podera ouvir projeto.aprovado e
        // projeto.status_alterado para preparar ordens de producao.
        return true;
    }
};

function registrarListenersBase() {
    return EventListenerRegistry.registrarListenersBase();
}

