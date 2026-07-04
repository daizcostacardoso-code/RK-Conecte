const DashboardService = {
    colecaoMemoria: "dashboard_projetos",
    memoryAdapter: null,

    indicadoresBase: [
        { id: "projetos", titulo: "Projetos", status: "", icone: "placeholder-projetos", cor: "placeholder-neutro" },
        { id: "em_orcamento", titulo: "Em orcamento", status: "em_orcamento", icone: "placeholder-orcamento", cor: "placeholder-comercial" },
        { id: "enviado", titulo: "Enviados", status: "enviado", icone: "placeholder-enviado", cor: "placeholder-info" },
        { id: "aprovado", titulo: "Aprovados", status: "aprovado", icone: "placeholder-aprovado", cor: "placeholder-sucesso" },
        { id: "em_producao", titulo: "Producao", status: "em_producao", icone: "placeholder-producao", cor: "placeholder-operacional" },
        { id: "em_instalacao", titulo: "Instalacao", status: "em_instalacao", icone: "placeholder-instalacao", cor: "placeholder-agenda" },
        { id: "concluido", titulo: "Concluidos", status: "concluido", icone: "placeholder-concluido", cor: "placeholder-finalizado" },
        { id: "cancelado", titulo: "Cancelados", status: "cancelado", icone: "placeholder-cancelado", cor: "placeholder-alerta" }
    ],

    async carregarDashboard() {
        const projetos = await this.obterProjetos();

        return DashboardModel.criar({
            indicadores: await this.obterIndicadores(projetos),
            projetosRecentes: this.obterProjetosRecentesDeLista(projetos),
            proximasInstalacoes: [],
            alertas: [],
            recebimentos: []
        });
    },

    async obterIndicadores(projetosBase) {
        const projetos = Array.isArray(projetosBase) ? projetosBase : await this.obterProjetos();
        const porStatus = DashboardUtils.agruparPorStatus(projetos);

        return this.indicadoresBase.map(indicador => ({
            id: indicador.id,
            titulo: indicador.titulo,
            quantidade: indicador.status ? porStatus[indicador.status] || 0 : projetos.length,
            icone: indicador.icone,
            cor: indicador.cor
        }));
    },

    async obterProjetos() {
        const projetos = await this.listarProjetosOrigem();
        const base = projetos.length ? projetos : await this.obterProjetosMemoria();

        return DashboardUtils
            .ordenarPorData(base, "datas.atualizacao")
            .map(projeto => this.prepararProjeto(projeto));
    },

    async obterProjetosRecentes(limite = 5) {
        const projetos = await this.obterProjetos();
        return this.obterProjetosRecentesDeLista(projetos, limite);
    },

    async obterProjetosPorStatus(status) {
        const projetos = await this.obterProjetos();
        return projetos.filter(projeto => projeto.status === status);
    },

    async obterResumo(projetosBase) {
        const projetos = Array.isArray(projetosBase) ? projetosBase : await this.obterProjetos();
        const porStatus = DashboardUtils.agruparPorStatus(projetos);

        return {
            totalProjetos: projetos.length,
            porStatus
        };
    },

    async listarProjetosOrigem() {
        if (typeof ProjetoService === "undefined" || typeof ProjetoService.listar !== "function") {
            return [];
        }

        try {
            const projetos = await ProjetoService.listar();
            return Array.isArray(projetos) ? projetos : [];
        } catch (erro) {
            console.warn("Nao foi possivel carregar Projetos pelo ProjetoService.", erro);
            return [];
        }
    },

    async obterProjetosMemoria() {
        const adapter = this.obterMemoryAdapter();
        if (!adapter) return this.criarProjetosSimulados();

        const existentes = await adapter.list(this.colecaoMemoria);
        if (existentes.length) {
            return existentes;
        }

        const projetos = this.criarProjetosSimulados();
        for (const projeto of projetos) {
            await adapter.save(this.colecaoMemoria, projeto.id, projeto);
        }

        return adapter.list(this.colecaoMemoria);
    },

    obterMemoryAdapter() {
        if (this.memoryAdapter) {
            return this.memoryAdapter;
        }

        if (typeof criarMemoryAdapter === "function") {
            this.memoryAdapter = criarMemoryAdapter();
            return this.memoryAdapter;
        }

        if (typeof MemoryAdapter !== "undefined") {
            this.memoryAdapter = {
                ...MemoryAdapter,
                store: {}
            };
            return this.memoryAdapter;
        }

        return null;
    },

    criarProjetosSimulados() {
        const agora = new Date();
        const dados = [
            this.criarDadosProjetoSimulado("PRJ-SIM-001", "Cliente exemplo", "Box de vidro", "em_orcamento", "Comercial", 1),
            this.criarDadosProjetoSimulado("PRJ-SIM-002", "Obra demonstrativa", "Esquadria", "enviado", "Comercial", 2),
            this.criarDadosProjetoSimulado("PRJ-SIM-003", "Instalacao modelo", "Guarda-corpo", "aprovado", "Operacional", 3)
        ];

        return dados.map((item, indice) => {
            const data = new Date(agora);
            data.setDate(agora.getDate() - indice);

            return this.criarProjetoPeloService({
                ...item,
                datas: {
                    criacao: data.toISOString(),
                    atualizacao: data.toISOString()
                }
            });
        });
    },

    criarDadosProjetoSimulado(numero, cliente, tipo, status, responsavel, diasAteInstalacao) {
        const previsao = new Date();
        previsao.setDate(previsao.getDate() + diasAteInstalacao);

        return {
            id: `dashboard_${numero.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
            numero,
            codigo: numero,
            titulo: tipo,
            status,
            cliente: {
                nome: cliente
            },
            comercial: {
                responsavel
            },
            operacional: {
                responsavel,
                previsaoInstalacao: previsao.toISOString()
            }
        };
    },

    criarProjetoPeloService(dados) {
        if (typeof ProjetoService !== "undefined" && typeof ProjetoService.criarManual === "function") {
            return ProjetoService.criarManual(dados, "Dashboard");
        }

        return {
            ...dados,
            origem: dados.origem || "dashboard",
            datas: dados.datas || {
                criacao: new Date().toISOString(),
                atualizacao: new Date().toISOString()
            }
        };
    },

    prepararProjeto(projeto = {}) {
        const status = projeto.status || "";

        return {
            id: projeto.id || "",
            numero: projeto.numero || projeto.codigo || projeto.id || "",
            cliente: projeto.cliente?.nome || "",
            tipo: projeto.tipo || projeto.titulo || projeto.origem || "",
            status,
            statusFormatado: DashboardUtils.formatarStatus(status),
            responsavel: projeto.comercial?.responsavel || projeto.operacional?.responsavel || "",
            ultimaAtualizacao: projeto.datas?.atualizacao || "",
            workflow: {
                proximosStatus: this.obterProximosStatus(status)
            }
        };
    },

    obterProjetosRecentesDeLista(projetos = [], limite = 5) {
        return DashboardUtils
            .ordenarPorData(projetos, "ultimaAtualizacao")
            .slice(0, limite);
    },

    obterProximosStatus(status) {
        if (typeof WorkflowEngine !== "undefined" && typeof WorkflowEngine.obterProximosEstados === "function") {
            return WorkflowEngine.obterProximosEstados(status);
        }

        return [];
    }
};
