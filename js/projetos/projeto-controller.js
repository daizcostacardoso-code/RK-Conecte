const ProjetoVisualController = {
    estado: {
        projetos: [],
        projetoSelecionado: null
    },

    async iniciar() {
        if (typeof ProjetoVisualUI !== "undefined") {
            ProjetoVisualUI.configurar(this);
        }

        await this.carregar();
        return this.renderizar();
    },

    async carregar() {
        const projetos = await this.listarProjetos();
        const projetoSelecionado = this.obterProjetoSelecionado(projetos);

        this.estado = {
            projetos,
            projetoSelecionado
        };

        if (projetoSelecionado) {
            this.salvarProjetoAtual(projetoSelecionado);
        }

        return this.estado;
    },

    async listarProjetos() {
        try {
            if (typeof ProjetoService !== "undefined" && typeof ProjetoService.listar === "function") {
                const projetos = await ProjetoService.listar();
                if (Array.isArray(projetos) && projetos.length) {
                    return projetos;
                }
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Projetos pelo ProjetoService.", erro);
        }

        return this.projetosDemo();
    },

    selecionarProjeto(id) {
        const projeto = (this.estado.projetos || []).find(item => item.id === id) || null;

        if (!projeto) {
            return false;
        }

        this.estado.projetoSelecionado = projeto;
        this.salvarProjetoAtual(projeto);
        this.renderizar();
        return true;
    },

    obterProjetoSelecionado(projetos = []) {
        const appState = this.obterAppStateService();
        const selecionado = appState && typeof appState.getItem === "function"
            ? appState.getItem("projetoSelecionado") || appState.getItem("projetoAtual")
            : null;

        if (selecionado?.id) {
            return projetos.find(projeto => projeto.id === selecionado.id) || selecionado;
        }

        return projetos[0] || null;
    },

    salvarProjetoAtual(projeto = {}) {
        const appState = this.obterAppStateService();

        if (appState && typeof appState.setState === "function") {
            appState.setState("projetoSelecionado", projeto);
            appState.setState("projetoAtual", projeto);
            if (projeto.cliente) {
                appState.setState("clienteSelecionado", projeto.cliente);
            }
        }

        if (typeof RKE2EDemoState !== "undefined" && typeof RKE2EDemoState.salvarFluxo === "function") {
            RKE2EDemoState.salvarFluxo({
                projetoSelecionado: projeto,
                projetoAtual: projeto,
                clienteSelecionado: projeto.cliente || null
            });
        }

        return true;
    },

    projetosDemo() {
        const estadoDemo = typeof RKE2EDemoState !== "undefined" && typeof RKE2EDemoState.obterOuCriar === "function"
            ? RKE2EDemoState.obterOuCriar()
            : null;

        if (estadoDemo?.projetoSelecionado) {
            return [estadoDemo.projetoSelecionado];
        }

        const agora = new Date().toISOString();
        return [{
            id: "prj_demo_e2e",
            numero: "PRJ-DEMO-001",
            codigo: "PRJ-DEMO-001",
            titulo: "Box banheiro - Cliente Demo RK",
            status: "aprovado",
            prioridade: "MEDIA",
            cliente: {
                id: "cli_demo_e2e",
                nome: "Cliente Demo RK",
                telefone: "7399819768",
                email: "cliente.demo@rk.local"
            },
            obra: {
                endereco: "Rua Demo, 123",
                cidade: "Porto Seguro"
            },
            comercial: {
                responsavel: "Equipe Comercial",
                valorEstimado: 1260
            },
            operacional: {
                responsavel: "Equipe Producao"
            },
            datas: {
                criacao: agora,
                atualizacao: agora
            },
            tags: ["demo", "e2e"]
        }];
    },

    renderizar() {
        if (typeof ProjetoVisualUI !== "undefined" && typeof ProjetoVisualUI.renderizar === "function") {
            return ProjetoVisualUI.renderizar(this.estado);
        }

        return false;
    },

    obterAppStateService() {
        if (typeof AppStateService !== "undefined" && AppStateService) {
            return AppStateService;
        }

        if (typeof AppState !== "undefined" && AppState) {
            return AppState;
        }

        return null;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    ProjetoVisualController.iniciar();
});
