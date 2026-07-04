const DashboardController = {
    service: null,
    estado: null,
    inicializado: false,
    listeners: [],

    configurar(service = DashboardService) {
        this.service = service;
        return this;
    },

    async inicializar(opcoes = {}) {
        this.configurar(opcoes.service || this.service || DashboardService);
        this.estado = await this.service.carregarDashboard();
        this.inicializado = true;
        this.notificar("inicializado", this.estado);
        return this.estado;
    },

    async atualizar() {
        if (!this.service) {
            this.configurar();
        }

        this.estado = await this.service.carregarDashboard();
        this.notificar("atualizado", this.estado);
        return this.estado;
    },

    async refresh() {
        return this.atualizar();
    },

    renderizar(renderizador) {
        if (typeof renderizador === "function") {
            renderizador(this.estado || DashboardModel.criarVazio());
        }

        return this.estado;
    },

    obterEstado() {
        return this.estado || DashboardModel.criarVazio();
    },

    aoAtualizar(callback) {
        if (typeof callback === "function") {
            this.listeners.push(callback);
        }

        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    },

    notificar(evento, estado) {
        this.listeners.forEach(listener => listener({
            evento,
            estado,
            data: new Date().toISOString()
        }));
    }
};

async function inicializarDashboard(opcoes = {}) {
    return DashboardController.inicializar(opcoes);
}
