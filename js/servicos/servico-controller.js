const ServicoController = {
    buscaTimer: null,

    iniciar() {
        ServicoUI.iniciar({
            aoNovoServico: () => this.prepararNovoServico(),
            aoBuscar: termo => this.agendarBusca(termo),
            aoVisualizarServico: id => this.visualizarServico(id)
        });

        this.listarServicos();
    },

    prepararNovoServico() {
        ServicoUI.renderizarDetalhe(null);
    },

    agendarBusca(termo) {
        window.clearTimeout(this.buscaTimer);
        this.buscaTimer = window.setTimeout(() => {
            this.listarServicos({ busca: termo });
        }, 180);
    },

    async listarServicos(filtros = {}) {
        ServicoUI.definirCarregando(true);
        const resultado = await this.executarListagem(filtros);
        ServicoUI.definirCarregando(false);

        if (!resultado.sucesso) {
            ServicoUI.renderizarLista([]);
            ServicoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return;
        }

        ServicoUI.mostrarAviso("");
        ServicoUI.renderizarLista(resultado.servicos || []);
    },

    async visualizarServico(id) {
        const resultado = await this.executarBusca(id);

        if (!resultado.sucesso) {
            ServicoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return;
        }

        ServicoUI.mostrarAviso("");
        ServicoUI.renderizarDetalhe(resultado.servico);
    },

    async executarListagem(filtros) {
        if (typeof ListarServicosUseCase !== "undefined") {
            return ListarServicosUseCase.executar(filtros, ServicoService);
        }

        if (typeof ServicoService !== "undefined") {
            return ServicoService.listarServicos(filtros);
        }

        return {
            sucesso: false,
            servicos: [],
            erros: ["Camada de Servi\u00e7os indispon\u00edvel para listar."]
        };
    },

    async executarBusca(id) {
        if (typeof BuscarServicoUseCase !== "undefined") {
            return BuscarServicoUseCase.executar(id, ServicoService);
        }

        if (typeof ServicoService !== "undefined") {
            return ServicoService.buscarServico(id);
        }

        return {
            sucesso: false,
            servico: null,
            erros: ["Camada de Servi\u00e7os indispon\u00edvel para buscar."]
        };
    },

    formatarErros(erros = []) {
        if (!Array.isArray(erros) || !erros.length) {
            return "N\u00e3o foi poss\u00edvel concluir a a\u00e7\u00e3o.";
        }

        return erros.join(" ");
    }
};

document.addEventListener("DOMContentLoaded", () => ServicoController.iniciar());
