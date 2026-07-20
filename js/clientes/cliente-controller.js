const ClienteController = {
    buscaTimer: null,

    iniciar() {
        this.configurarClienteService();

        ClienteUI.iniciar({
            aoNovoCliente: () => ClienteUI.mostrarAviso(""),
            aoBuscar: termo => this.agendarBusca(termo),
            aoCriarCliente: dados => this.criarCliente(dados),
            aoSelecionarCliente: id => this.selecionarCliente(id)
        });

        this.listarClientes();
    },

    configurarClienteService() {
        if (typeof ClienteService !== "undefined" && typeof ClienteService.configurar === "function") {
            ClienteService.configurar(ClienteRepository);
        }
    },

    agendarBusca(termo) {
        window.clearTimeout(this.buscaTimer);
        this.buscaTimer = window.setTimeout(() => {
            this.listarClientes({ busca: termo });
        }, 180);
    },

    async criarCliente(dados) {
        ClienteUI.definirCarregando(true);
        ClienteUI.mostrarAviso("");

        const resultado = await this.executarCriacao(dados);
        ClienteUI.definirCarregando(false);

        if (!resultado.sucesso) {
            ClienteUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return;
        }

        ClienteUI.limparFormulario();
        ClienteUI.mostrarAviso("Cliente cadastrado com sucesso.", "sucesso");
        await this.listarClientes({ busca: this.obterTermoBusca() });

        if (resultado.cliente?.id) {
            await this.selecionarCliente(resultado.cliente.id);
        }
    },

    async listarClientes(filtros = {}) {
        const resultado = await this.executarListagem(filtros);

        if (!resultado.sucesso) {
            ClienteUI.renderizarLista([]);
            ClienteUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return;
        }

        ClienteUI.renderizarLista(resultado.clientes || []);
    },

    async selecionarCliente(id) {
        const resultado = await this.executarBusca(id);

        if (!resultado.sucesso) {
            ClienteUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return;
        }

        this.salvarClienteAtual(resultado.cliente);
        ClienteUI.renderizarDetalhe(resultado.cliente);
    },

    async executarCriacao(dados) {
        if (typeof CriarClienteUseCase !== "undefined") {
            return CriarClienteUseCase.executar(dados, ClienteService);
        }

        if (typeof ClienteService !== "undefined") {
            return ClienteService.criarCliente(dados);
        }

        return this.respostaCamadaIndisponivel("criar");
    },

    async executarListagem(filtros) {
        if (typeof ListarClientesUseCase !== "undefined") {
            return ListarClientesUseCase.executar(filtros, ClienteService);
        }

        if (typeof ClienteService !== "undefined") {
            return ClienteService.listarClientes(filtros);
        }

        return {
            sucesso: false,
            clientes: [],
            erros: ["Camada de Clientes indisponível para listar."]
        };
    },

    async executarBusca(id) {
        if (typeof BuscarClienteUseCase !== "undefined") {
            return BuscarClienteUseCase.executar(id, ClienteService);
        }

        if (typeof ClienteService !== "undefined") {
            return ClienteService.buscarCliente(id);
        }

        return this.respostaCamadaIndisponivel("buscar");
    },

    criarClientesDemo() {
        if (typeof RKE2EDemoState !== "undefined" && typeof RKE2EDemoState.obterOuCriar === "function") {
            const estado = RKE2EDemoState.obterOuCriar();
            return estado.clienteSelecionado ? [estado.clienteSelecionado] : [];
        }

        return [];
    },

    buscarClienteDemo(id, resultadoOriginal = null) {
        const cliente = this.criarClientesDemo().find(item => item.id === id);

        if (cliente) {
            return {
                sucesso: true,
                cliente,
                erros: []
            };
        }

        return resultadoOriginal || this.respostaCamadaIndisponivel("buscar");
    },

    salvarClienteAtual(cliente = {}) {
        const appState = typeof AppStateService !== "undefined" ? AppStateService : null;

        if (appState && typeof appState.setState === "function") {
            appState.setState("clienteSelecionado", cliente);
        }

        if (typeof RKE2EDemoState !== "undefined" && typeof RKE2EDemoState.salvarFluxo === "function") {
            RKE2EDemoState.salvarFluxo({
                clienteSelecionado: cliente
            });
        }

        return true;
    },

    obterTermoBusca() {
        return document.getElementById("buscaCliente")?.value || "";
    },

    formatarErros(erros = []) {
        if (!Array.isArray(erros) || !erros.length) {
            return "Não foi possível concluir a ação.";
        }

        return erros.join(" ");
    },

    respostaCamadaIndisponivel(acao) {
        return {
            sucesso: false,
            cliente: null,
            erros: [`Camada de Clientes indisponível para ${acao}.`]
        };
    }
};

document.addEventListener("DOMContentLoaded", () => ClienteController.iniciar());
