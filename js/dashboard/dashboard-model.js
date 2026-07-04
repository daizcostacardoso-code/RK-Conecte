const DashboardModel = {
    criar(dados = {}) {
        return {
            indicadores: this.normalizarLista(dados.indicadores),
            projetosRecentes: this.normalizarLista(dados.projetosRecentes),
            proximasInstalacoes: this.normalizarLista(dados.proximasInstalacoes),
            alertas: this.normalizarLista(dados.alertas),
            recebimentos: this.normalizarLista(dados.recebimentos)
        };
    },

    criarVazio() {
        return this.criar();
    },

    normalizarLista(lista) {
        return Array.isArray(lista) ? lista : [];
    }
};

function criarDashboardModel(dados = {}) {
    return DashboardModel.criar(dados);
}
