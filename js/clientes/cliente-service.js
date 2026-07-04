const ClienteService = {
    repository: null,

    configurar(repository = ClienteRepository) {
        this.repository = repository;
        return this;
    },

    obterRepository() {
        return this.repository || ClienteRepository;
    },

    async criarCliente(dados = {}) {
        try {
            const cliente = ClienteFactory.criar(dados);
            const validacao = ClienteValidator.validar(cliente);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    cliente: null,
                    erros: validacao.erros
                };
            }

            const salvo = await this.obterRepository().salvarCliente(cliente);

            return {
                sucesso: true,
                cliente: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao criar Cliente.");
        }
    },

    async buscarCliente(id) {
        try {
            if (!id) {
                return {
                    sucesso: false,
                    cliente: null,
                    erros: ["Id do cliente e obrigatorio."]
                };
            }

            const cliente = await this.obterRepository().buscarCliente(id);

            return {
                sucesso: !!cliente,
                cliente,
                erros: cliente ? [] : ["Cliente nao encontrado."]
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao buscar Cliente.");
        }
    },

    async listarClientes(filtros = {}) {
        try {
            const clientes = await this.obterRepository().listarClientes();

            return {
                sucesso: true,
                clientes: this.filtrar(clientes, filtros),
                erros: []
            };
        } catch (erro) {
            return {
                sucesso: false,
                clientes: [],
                erros: [erro.message || "Erro ao listar Clientes."]
            };
        }
    },

    async atualizarCliente(id, alteracoes = {}, usuario = "Sistema") {
        try {
            const resultadoBusca = await this.buscarCliente(id);
            if (!resultadoBusca.sucesso) {
                return {
                    sucesso: false,
                    cliente: null,
                    erros: resultadoBusca.erros
                };
            }

            const atualizado = ClienteModel.atualizar(resultadoBusca.cliente, alteracoes, usuario);
            const validacao = ClienteValidator.validar(atualizado);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    cliente: null,
                    erros: validacao.erros
                };
            }

            const salvo = await this.obterRepository().salvarCliente(atualizado);

            return {
                sucesso: true,
                cliente: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao atualizar Cliente.");
        }
    },

    async desativarCliente(id, usuario = "Sistema") {
        try {
            const resultadoBusca = await this.buscarCliente(id);
            if (!resultadoBusca.sucesso) {
                return {
                    sucesso: false,
                    cliente: null,
                    erros: resultadoBusca.erros
                };
            }

            const desativado = ClienteModel.desativar(resultadoBusca.cliente, usuario);
            const salvo = await this.obterRepository().salvarCliente(desativado);

            return {
                sucesso: true,
                cliente: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao desativar Cliente.");
        }
    },

    filtrar(clientes = [], filtros = {}) {
        const busca = String(filtros.busca || "").trim().toLowerCase();
        const status = filtros.status || "";
        const tipoPessoa = filtros.tipoPessoa || "";

        return clientes.filter(cliente => {
            const statusOk = !status || cliente.status === status;
            const tipoOk = !tipoPessoa || cliente.tipoPessoa === tipoPessoa;
            const buscaOk = !busca || [
                cliente.nome,
                cliente.nomeFantasia,
                cliente.cpfCnpj,
                cliente.telefonePrincipal,
                cliente.telefoneSecundario,
                cliente.email
            ].some(valor => String(valor || "").toLowerCase().includes(busca));

            return statusOk && tipoOk && buscaOk;
        });
    },

    respostaErro(erro, mensagemPadrao) {
        return {
            sucesso: false,
            cliente: null,
            erros: [erro.message || mensagemPadrao]
        };
    }
};
