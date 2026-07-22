const ClienteController = {
    buscaTimer: null,

    async iniciar() {
        this.configurarClienteService();

        ClienteUI.iniciar({
            aoNovoCliente: () => ClienteUI.mostrarAviso(""),
            aoBuscar: termo => this.agendarBusca(termo),
            aoCriarCliente: dados => this.criarCliente(dados),
            aoSelecionarCliente: id => this.selecionarCliente(id)
        });

        await this.listarClientes();
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
        ClienteUI.renderizarCarregamentoLista("Carregando clientes...");
        ClienteUI.mostrarAviso("Carregando clientes...", "info");
        const resultado = await this.executarListagem(filtros);

        if (!resultado.sucesso) {
            ClienteUI.renderizarLista([]);
            ClienteUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return;
        }

        ClienteUI.renderizarLista(resultado.clientes || []);
        ClienteUI.mostrarAviso("");
    },

    async selecionarCliente(id) {
        const resultado = await this.executarBusca(id);

        if (!resultado.sucesso) {
            ClienteUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return;
        }

        const cliente = await this.enriquecerClienteComercial(resultado.cliente);
        this.salvarClienteAtual(cliente);
        ClienteUI.renderizarDetalhe(cliente);
    },

    async enriquecerClienteComercial(cliente = {}) {
        const orcamentos = (await this.listarOrcamentosDoCliente(cliente))
            .sort((a, b) => String(a.atualizadoEmISO || a.dataEmissao || "").localeCompare(String(b.atualizadoEmISO || b.dataEmissao || "")));
        const historicoComercial = orcamentos.flatMap(orcamento => {
            return (Array.isArray(orcamento.historicoStatus) ? orcamento.historicoStatus : []).map(evento => ({
                id: evento.id,
                tipo: evento.acao,
                data: evento.realizadoEm,
                descricao: `${orcamento.numero || orcamento.id}: ${String(evento.acao || "atualizacao").replace(/_/g, " ")}`
            }));
        });

        return {
            ...cliente,
            orcamentos: orcamentos.map(orcamento => ({
                id: orcamento.id,
                numero: orcamento.numero,
                status: orcamento.status,
                data: orcamento.atualizadoEmISO || orcamento.dataEmissao || "",
                total: typeof OrcamentoAprovacaoModel !== "undefined" ? OrcamentoAprovacaoModel.obterTotal(orcamento) : 0
            })),
            historico: [...(Array.isArray(cliente.historico) ? cliente.historico : []), ...historicoComercial]
                .sort((a, b) => String(a.data || "").localeCompare(String(b.data || "")))
        };
    },

    async listarOrcamentosDoCliente(cliente = {}) {
        if (typeof DocumentPdfRepository === "undefined" || typeof DocumentPdfRepository.buscar !== "function") return [];
        const clienteId = String(cliente.id || "").trim();
        const nomeBusca = this.normalizarBusca(cliente.nome || cliente.nomeFantasia);
        const documentoBusca = String(cliente.cpfCnpj || "").replace(/\D/g, "");

        try {
            let resultado = clienteId ? await DocumentPdfRepository.buscar({ clienteId }) : null;
            if (!resultado?.sucesso || !resultado.registros?.length) {
                resultado = await DocumentPdfRepository.buscar({ cliente: cliente.nome || cliente.nomeFantasia || "" });
            }
            if (!resultado?.sucesso) return [];

            return (resultado.registros || []).filter(registro => {
                const idRegistro = String(registro.clienteId || registro.vinculos?.clienteId || registro.cliente?.id || "").trim();
                const documentoRegistro = String(registro.cliente?.documento || registro.cliente?.cpfCnpj || "").replace(/\D/g, "");
                const nomeRegistro = this.normalizarBusca(registro.clienteNome || registro.cliente?.nome);
                return (clienteId && idRegistro === clienteId)
                    || (documentoBusca && documentoRegistro === documentoBusca)
                    || (!!nomeBusca && nomeRegistro === nomeBusca);
            });
        } catch (erro) {
            console.warn("Não foi possível carregar o histórico comercial do cliente.", erro);
            return [];
        }
    },

    normalizarBusca(valor = "") {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
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

    salvarClienteAtual(cliente = {}) {
        const appState = typeof AppStateService !== "undefined" ? AppStateService : null;

        if (appState && typeof appState.setState === "function") {
            appState.setState("clienteSelecionado", cliente);
        }

        if (typeof RKDraftState !== "undefined" && typeof RKDraftState.salvarFluxo === "function") {
            RKDraftState.salvarFluxo({
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

document.addEventListener("DOMContentLoaded", () => {
    void (window.RKLoading?.initial
        ? RKLoading.initial(() => ClienteController.iniciar(), "Carregando clientes...")
        : ClienteController.iniciar());
});
