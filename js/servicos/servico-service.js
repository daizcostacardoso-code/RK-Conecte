const ServicoService = {
    repository: null,

    configurar(repository = ServicoRepository) {
        this.repository = repository;
        return this;
    },

    obterRepository() {
        return this.repository || ServicoRepository;
    },

    async criarServico(dados = {}) {
        try {
            const servico = ServicoFactory.criar(dados);
            const validacao = ServicoValidator.validar(servico);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    servico: null,
                    erros: validacao.erros
                };
            }

            const salvo = await this.obterRepository().salvarServico(servico);

            return {
                sucesso: true,
                servico: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao criar Servico.");
        }
    },

    async buscarServico(id) {
        try {
            if (!id) {
                return {
                    sucesso: false,
                    servico: null,
                    erros: ["Id do servico e obrigatorio."]
                };
            }

            const servico = await this.obterRepository().buscarServico(id);

            return {
                sucesso: !!servico,
                servico,
                erros: servico ? [] : ["Servico nao encontrado."]
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao buscar Servico.");
        }
    },

    async listarServicos(filtros = {}) {
        try {
            const servicos = await this.obterRepository().listarServicos();

            return {
                sucesso: true,
                servicos: this.filtrar(servicos, filtros),
                erros: []
            };
        } catch (erro) {
            return {
                sucesso: false,
                servicos: [],
                erros: [erro.message || "Erro ao listar Servicos."]
            };
        }
    },

    async atualizarServico(id, alteracoes = {}) {
        try {
            const resultadoBusca = await this.buscarServico(id);
            if (!resultadoBusca.sucesso) {
                return {
                    sucesso: false,
                    servico: null,
                    erros: resultadoBusca.erros
                };
            }

            const atualizado = ServicoModel.atualizar(resultadoBusca.servico, alteracoes);
            const validacao = ServicoValidator.validar(atualizado);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    servico: null,
                    erros: validacao.erros
                };
            }

            const salvo = await this.obterRepository().salvarServico(atualizado);

            return {
                sucesso: true,
                servico: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao atualizar Servico.");
        }
    },

    async desativarServico(id) {
        try {
            const resultadoBusca = await this.buscarServico(id);
            if (!resultadoBusca.sucesso) {
                return {
                    sucesso: false,
                    servico: null,
                    erros: resultadoBusca.erros
                };
            }

            const desativado = ServicoModel.desativar(resultadoBusca.servico);
            const salvo = await this.obterRepository().salvarServico(desativado);

            return {
                sucesso: true,
                servico: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao desativar Servico.");
        }
    },

    filtrar(servicos = [], filtros = {}) {
        const busca = String(filtros.busca || "").trim().toLowerCase();
        const categoria = filtros.categoria ? ServicoModel.normalizarCategoria(filtros.categoria) : "";
        const tipoCalculo = filtros.tipoCalculo ? ServicoModel.normalizarTipoCalculo(filtros.tipoCalculo) : "";
        const ativo = typeof filtros.ativo === "boolean"
            ? filtros.ativo
            : filtros.status === "ativo"
                ? true
                : filtros.status === "inativo"
                    ? false
                    : null;

        return servicos.filter(servico => {
            const dependencias = this.textosDependencias(servico.dependenciasPadrao);
            const categoriaOk = !categoria || servico.categoria === categoria;
            const tipoOk = !tipoCalculo || servico.tipoCalculo === tipoCalculo;
            const ativoOk = ativo === null || servico.ativo === ativo;
            const buscaOk = !busca || [
                servico.nome,
                servico.categoria,
                ServicoModel.rotuloCategoria(servico.categoria),
                servico.descricao,
                servico.tipoCalculo,
                ServicoModel.rotuloTipoCalculo(servico.tipoCalculo),
                servico.unidadeVenda,
                ...dependencias,
                ...(Array.isArray(servico.tiposItem) ? servico.tiposItem.flatMap(tipo => [
                    tipo.nome,
                    tipo.descricao,
                    tipo.observacoesTecnicas,
                    ...(tipo.subtipos || []),
                    ...this.textosDependencias(tipo.dependencias || tipo.dependenciasPadrao)
                ]) : [])
            ].some(valor => String(valor || "").toLowerCase().includes(busca));

            return categoriaOk && tipoOk && ativoOk && buscaOk;
        });
    },

    textosDependencias(dependencias = []) {
        if (!Array.isArray(dependencias)) {
            return [];
        }

        return dependencias.flatMap(dependencia => {
            if (typeof dependencia === "string") {
                return [dependencia];
            }

            return [
                dependencia.produtoNome,
                dependencia.categoria,
                dependencia.unidadeCalculo,
                dependencia.regraCalculo,
                dependencia.observacao
            ];
        }).filter(Boolean);
    },

    respostaErro(erro, mensagemPadrao) {
        return {
            sucesso: false,
            servico: null,
            erros: [erro.message || mensagemPadrao]
        };
    }
};
