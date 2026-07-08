const ProdutoService = {
    repository: null,

    configurar(repository = ProdutoRepository) {
        this.repository = repository;
        return this;
    },

    obterRepository() {
        return this.repository || ProdutoRepository;
    },

    async criarProduto(dados = {}) {
        try {
            const produto = ProdutoFactory.criar(dados);
            const validacao = ProdutoValidator.validar(produto);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    produto: null,
                    erros: validacao.erros
                };
            }

            const salvo = await this.obterRepository().salvarProduto(produto);

            return {
                sucesso: true,
                produto: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao criar Produto.");
        }
    },

    async buscarProduto(id) {
        try {
            if (!id) {
                return {
                    sucesso: false,
                    produto: null,
                    erros: ["Id do produto e obrigatorio."]
                };
            }

            const produto = await this.obterRepository().buscarProduto(id);

            return {
                sucesso: !!produto,
                produto,
                erros: produto ? [] : ["Produto nao encontrado."]
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao buscar Produto.");
        }
    },

    async listarProdutos(filtros = {}) {
        try {
            const produtos = await this.obterRepository().listarProdutos();

            return {
                sucesso: true,
                produtos: this.filtrar(produtos, filtros),
                erros: []
            };
        } catch (erro) {
            return {
                sucesso: false,
                produtos: [],
                erros: [erro.message || "Erro ao listar Produtos."]
            };
        }
    },

    async atualizarProduto(id, alteracoes = {}) {
        try {
            const resultadoBusca = await this.buscarProduto(id);
            if (!resultadoBusca.sucesso) {
                return {
                    sucesso: false,
                    produto: null,
                    erros: resultadoBusca.erros
                };
            }

            const atualizado = ProdutoModel.atualizar(resultadoBusca.produto, alteracoes);
            const validacao = ProdutoValidator.validar(atualizado);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    produto: null,
                    erros: validacao.erros
                };
            }

            const salvo = await this.obterRepository().salvarProduto(atualizado);

            return {
                sucesso: true,
                produto: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao atualizar Produto.");
        }
    },

    async desativarProduto(id) {
        try {
            const resultadoBusca = await this.buscarProduto(id);
            if (!resultadoBusca.sucesso) {
                return {
                    sucesso: false,
                    produto: null,
                    erros: resultadoBusca.erros
                };
            }

            const desativado = ProdutoModel.desativar(resultadoBusca.produto);
            const salvo = await this.obterRepository().salvarProduto(desativado);

            return {
                sucesso: true,
                produto: salvo,
                erros: []
            };
        } catch (erro) {
            return this.respostaErro(erro, "Erro ao desativar Produto.");
        }
    },

    filtrar(produtos = [], filtros = {}) {
        const busca = String(filtros.busca || "").trim().toLowerCase();
        const categoria = filtros.categoria ? ProdutoModel.normalizarCategoria(filtros.categoria) : "";
        const tipoCalculo = filtros.tipoCalculo ? ProdutoModel.normalizarTipoCalculo(filtros.tipoCalculo) : "";
        const ativo = typeof filtros.ativo === "boolean"
            ? filtros.ativo
            : filtros.status === "ativo"
                ? true
                : filtros.status === "inativo"
                    ? false
                    : null;

        return produtos.filter(produto => {
            const categoriaOk = !categoria || produto.categoria === categoria;
            const tipoOk = !tipoCalculo || produto.tipoCalculo === tipoCalculo;
            const ativoOk = ativo === null || produto.ativo === ativo;
            const buscaOk = !busca || [
                produto.nome,
                produto.categoria,
                ProdutoModel.rotuloCategoria(produto.categoria),
                produto.descricao,
                produto.tipoCalculo,
                ProdutoModel.rotuloTipoCalculo(produto.tipoCalculo),
                produto.custoUnitario,
                produto.custo,
                produto.unidadeVenda,
                produto.unidade,
                produto.unidadeCalculo,
                produto.observacoes
            ].some(valor => String(valor || "").toLowerCase().includes(busca));

            return categoriaOk && tipoOk && ativoOk && buscaOk;
        });
    },

    respostaErro(erro, mensagemPadrao) {
        return {
            sucesso: false,
            produto: null,
            erros: [erro.message || mensagemPadrao]
        };
    }
};
