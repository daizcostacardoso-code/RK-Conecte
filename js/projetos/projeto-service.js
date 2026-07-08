const ProjetoService = {
    repository: null,

    configurar(repository = null) {
        this.repository = repository;
        return this;
    },

    obterRepository() {
        return this.repository || (typeof ProjetoRepository !== "undefined" ? ProjetoRepository : null);
    },

    criarManual(dados = {}, usuario = "Sistema") {
        return ProjetoModel.criar({
            ...dados,
            origem: dados.origem || "manual",
            usuario
        });
    },

    criarDeSolicitacao(solicitacao = {}, usuario = "Sistema") {
        return ProjetoModel.criar({
            origem: "site",
            status: typeof STATUS_PROJETO !== "undefined" ? STATUS_PROJETO.RASCUNHO : "rascunho",
            titulo: solicitacao.titulo || solicitacao.servico || "",
            cliente: {
                nome: solicitacao.nome || solicitacao.cliente?.nome || "",
                telefone: solicitacao.telefone || solicitacao.cliente?.telefone || "",
                email: solicitacao.email || solicitacao.cliente?.email || "",
                endereco: solicitacao.endereco || solicitacao.cliente?.endereco || ""
            },
            obra: {
                endereco: solicitacao.enderecoObra || solicitacao.endereco || "",
                observacoes: solicitacao.observacoes || ""
            },
            comercial: {
                canal: "site",
                observacoes: solicitacao.observacoes || ""
            },
            tags: ["site"],
            usuario
        });
    },

    async criarProjeto(dados = {}, usuario = "Interface Projetos") {
        try {
            const projeto = this.criarManual(dados, usuario);
            const validacao = this.validar(projeto);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    projeto: null,
                    erros: validacao.erros
                };
            }

            const salvo = await this.salvarProjetoRepository(projeto);
            this.dispararEvento("PROJETO_CRIADO", salvo);

            return {
                sucesso: true,
                projeto: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao criar Projeto.");
        }
    },

    async buscarProjeto(id) {
        try {
            if (!id) {
                return {
                    sucesso: false,
                    projeto: null,
                    erros: ["Id do projeto e obrigatorio."]
                };
            }

            const projeto = await this.carregar(id);

            return {
                sucesso: !!projeto,
                projeto,
                erros: projeto ? [] : ["Projeto nao encontrado."]
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao buscar Projeto.");
        }
    },

    async listarProjetos(filtros = {}) {
        try {
            const projetos = await this.listar();

            return {
                sucesso: true,
                projetos: this.filtrar(projetos, filtros),
                erros: []
            };
        } catch (erro) {
            return {
                sucesso: false,
                projetos: [],
                erros: [erro.message || "Erro ao listar Projetos."]
            };
        }
    },

    async atualizarProjeto(id, alteracoes = {}, usuario = "Interface Projetos") {
        try {
            const resultadoBusca = await this.buscarProjeto(id);

            if (!resultadoBusca.sucesso) {
                return {
                    sucesso: false,
                    projeto: null,
                    erros: resultadoBusca.erros
                };
            }

            const atualizado = ProjetoModel.atualizar(resultadoBusca.projeto, alteracoes, usuario);
            const validacao = this.validar(atualizado);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    projeto: null,
                    erros: validacao.erros
                };
            }

            const salvo = await this.salvarProjetoRepository(atualizado);
            this.dispararEvento("PROJETO_ATUALIZADO", salvo);

            return {
                sucesso: true,
                projeto: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao atualizar Projeto.");
        }
    },

    async desativarProjeto(id, usuario = "Interface Projetos") {
        return this.atualizarProjeto(id, {
            status: typeof STATUS_PROJETO !== "undefined" ? STATUS_PROJETO.CANCELADO : "cancelado"
        }, usuario);
    },

    async salvar(projeto) {
        if (this.obterRepository()) {
            const salvo = await this.salvarProjetoRepository(projeto);
            return {
                projeto: salvo,
                nuvem: false
            };
        }

        return ProjetoStorage.salvar(projeto);
    },

    async listar() {
        const repository = this.obterRepository();

        if (repository) {
            const projetos = await repository.listarProjetos();
            return projetos.map(projeto => ProjetoModel.normalizar(projeto));
        }

        return ProjetoStorage.listar();
    },

    async carregar(id) {
        const repository = this.obterRepository();

        if (repository) {
            const projeto = await repository.buscarProjeto(id);
            return projeto ? ProjetoModel.normalizar(projeto) : null;
        }

        return ProjetoStorage.carregar(id);
    },

    async alterarStatus(projeto, status, usuario = "Sistema", extras = {}) {
        const atualizado = ProjetoModel.atualizar(projeto, {
            ...extras,
            status
        }, usuario);

        return this.salvar(atualizado);
    },

    async registrarContato(projeto, contato = {}, usuario = "Sistema") {
        const atualizado = ProjetoModel.registrarContato(projeto, contato, usuario);
        return this.salvar(atualizado);
    },

    async vincularOrcamento(projeto, orcamento, usuario = "Sistema") {
        const atualizado = ProjetoModel.vincularOrcamento(projeto, orcamento, usuario);
        return this.salvar(atualizado);
    },

    filtrar(projetos = [], filtros = {}) {
        const busca = String(filtros.busca || "").trim().toLowerCase();
        const status = filtros.status ? ProjetoModel.normalizarStatus(filtros.status) : "";

        return projetos.filter(projeto => {
            const statusOk = !status || projeto.status === status;
            const responsavelOk = !filtros.responsavel || projeto.comercial?.responsavel === filtros.responsavel;
            const buscaOk = !busca || [
                projeto.codigo,
                projeto.numero,
                projeto.titulo,
                projeto.nome,
                projeto.cliente?.nome,
                projeto.clienteNome,
                projeto.cliente?.telefone,
                projeto.obra?.endereco,
                projeto.enderecoObra,
                projeto.cidade,
                projeto.tipoProjeto
            ].some(valor => String(valor || "").toLowerCase().includes(busca));

            return statusOk && responsavelOk && buscaOk;
        });
    },

    async salvarProjetoRepository(projeto = {}) {
        const repository = this.obterRepository();

        if (!repository) {
            const resultado = await ProjetoStorage.salvar(projeto);
            return resultado.projeto || projeto;
        }

        return repository.salvarProjeto(ProjetoModel.normalizar(projeto));
    },

    validar(projeto = {}) {
        if (typeof ProjetoValidator !== "undefined" && typeof ProjetoValidator.validar === "function") {
            return ProjetoValidator.validar(projeto);
        }

        return {
            valido: true,
            erros: []
        };
    },

    dispararEvento(tipo, projeto) {
        try {
            if (typeof EventBus !== "undefined" && typeof EventTypes !== "undefined" && EventTypes[tipo]) {
                EventBus.emit(EventTypes[tipo], {
                    projeto,
                    projetoId: projeto.id
                });
                return true;
            }
        } catch (erro) {
            console.warn("Nao foi possivel disparar evento de Projeto.", erro);
        }

        return false;
    },

    respostaErro(erro, mensagemPadrao) {
        return {
            sucesso: false,
            projeto: null,
            erros: [erro.message || mensagemPadrao]
        };
    }
};
