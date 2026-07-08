const ProdutoController = {
    buscaTimer: null,

    async iniciar() {
        this.configurarProdutoService();

        ProdutoUI.iniciar({
            aoFiltrarProdutos: filtros => this.agendarBusca(filtros),
            aoSalvarProduto: dados => this.salvarProduto(dados),
            aoSelecionarProduto: id => this.selecionarProduto(id),
            aoEditarProduto: id => this.editarProduto(id),
            aoInativarProduto: id => this.inativarProduto(id)
        });

        await this.garantirProdutosBase();
        this.listarProdutos();
    },

    configurarProdutoService() {
        if (typeof ProdutoRepository !== "undefined" && !ProdutoRepository.adapter) {
            const adapter = typeof criarLocalStorageAdapter === "function"
                ? criarLocalStorageAdapter()
                : typeof criarMemoryAdapter === "function"
                    ? criarMemoryAdapter()
                    : null;

            if (adapter) {
                ProdutoRepository.configurar(adapter);
            }
        }

        if (typeof ProdutoService !== "undefined" && typeof ProdutoService.configurar === "function") {
            ProdutoService.configurar(ProdutoRepository);
        }
    },

    agendarBusca(filtros = {}) {
        window.clearTimeout(this.buscaTimer);
        this.buscaTimer = window.setTimeout(() => this.listarProdutos(filtros), 160);
    },

    async salvarProduto(dados = {}) {
        ProdutoUI.definirCarregando(true);
        ProdutoUI.mostrarAviso("");

        const resultado = dados.id
            ? await this.executarAtualizacao(dados.id, dados)
            : await this.executarCriacao(dados);

        ProdutoUI.definirCarregando(false);

        if (!resultado.sucesso) {
            ProdutoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ProdutoUI.mostrarAviso(dados.id ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.", "sucesso");
        ProdutoUI.limparFormulario();
        await this.listarProdutos(ProdutoUI.obterFiltros());
        await this.selecionarProduto(resultado.produto.id);
        return resultado;
    },

    async listarProdutos(filtros = {}) {
        const resultado = await this.executarListagem(filtros);

        if (!resultado.sucesso) {
            ProdutoUI.renderizarLista([]);
            ProdutoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ProdutoUI.renderizarLista(resultado.produtos || []);
        return resultado;
    },

    async selecionarProduto(id) {
        const resultado = await this.executarBusca(id);

        if (!resultado.sucesso) {
            ProdutoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ProdutoUI.renderizarDetalhe(resultado.produto);
        return resultado;
    },

    async editarProduto(id) {
        const resultado = await this.selecionarProduto(id);

        if (resultado.sucesso) {
            ProdutoUI.preencherFormulario(resultado.produto);
        }

        return resultado;
    },

    async inativarProduto(id) {
        const resultado = await this.executarExclusao(id);

        if (!resultado.sucesso) {
            ProdutoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ProdutoUI.mostrarAviso("Produto inativado.", "sucesso");
        await this.listarProdutos(ProdutoUI.obterFiltros());
        await this.selecionarProduto(id);
        return resultado;
    },

    async garantirProdutosBase() {
        const resultado = await this.executarListagem({});
        const existentes = resultado.sucesso ? resultado.produtos || [] : [];
        const idsExistentes = new Set(existentes.map(produto => produto.id));
        const bases = this.produtosBase().filter(produto => !idsExistentes.has(produto.id));

        if (!bases.length) {
            return false;
        }

        await Promise.all(bases.map(produto => this.executarCriacao(produto)));
        return true;
    },

    produtosBase() {
        return [
            this.produtoBase("prd_base_vidro_temperado_6mm", "Vidro temperado 6mm", "vidro", "m2", "area_m2", 140, "Vidro temperado para boxes, janelas e portas."),
            this.produtoBase("prd_base_vidro_temperado_8mm", "Vidro temperado 8mm", "vidro", "m2", "area_m2", 180, "Vidro temperado para boxes, guarda-corpo e instalacoes comerciais."),
            this.produtoBase("prd_base_trilho_box_8mm", "Trilho box 8mm", "aluminio_perfil", "metro_linear", "linear_m", 35, "Trilho superior/inferior para box 8mm."),
            this.produtoBase("prd_base_caixa_tampa_box", "Caixa/tampa box", "aluminio_perfil", "metro_linear", "linear_m", 30, "Conjunto caixa e tampa para box."),
            this.produtoBase("prd_base_perfil_lateral", "Perfil lateral", "aluminio_perfil", "metro_linear", "linear_altura", 25, "Perfil lateral para acabamento e fixacao."),
            this.produtoBase("prd_base_perfil_u", "Perfil U", "aluminio_perfil", "metro_linear", "perimetro", 24, "Perfil U para vidro fixo e fechamento."),
            this.produtoBase("prd_base_puxador", "Puxador", "acessorio", "unidade", "unidade", 55, "Puxador padrao para portas, boxes e espelhos."),
            this.produtoBase("prd_base_roldana", "Roldana", "ferragem", "unidade", "quantidade_fixa", 22, "Roldana para sistemas de correr."),
            this.produtoBase("prd_base_guia_box", "Guia de box", "acessorio", "unidade", "quantidade_fixa", 10, "Guia inferior para box."),
            this.produtoBase("prd_base_batente", "Batente", "acessorio", "unidade", "quantidade_fixa", 14, "Batente de fechamento."),
            this.produtoBase("prd_base_silicone_neutro", "Silicone neutro", "insumo", "unidade", "quantidade_fixa", 18, "Insumo de vedacao e acabamento."),
            this.produtoBase("prd_base_cola_uv", "Cola UV", "insumo", "unidade", "quantidade_fixa", 30, "Cola para aplicacoes especificas em vidro."),
            this.produtoBase("prd_base_vedacao", "Vedacao", "insumo", "metro_linear", "perimetro", 7, "Vedacao para box, janela e fechamento."),
            this.produtoBase("prd_base_instalacao", "Mao de obra instalacao box", "mao_de_obra", "hora", "hora", 50, "Mao de obra tecnica de instalacao.")
        ];
    },

    produtoBase(id, nome, categoria, unidade, regraCalculo, custoUnitario, descricao) {
        return {
            id,
            nome,
            categoria,
            descricao,
            unidade,
            unidadeVenda: unidade,
            unidadeCalculo: unidade,
            tipoCalculo: regraCalculo,
            regraCalculo,
            custoUnitario,
            custo: custoUnitario,
            precoCusto: custoUnitario,
            ativo: true,
            observacoes: "Produto base cadastrado para dependencias e custos futuros."
        };
    },

    executarCriacao(dados) {
        if (typeof CriarProdutoUseCase !== "undefined") {
            return CriarProdutoUseCase.executar(dados, ProdutoService);
        }

        return ProdutoService.criarProduto(dados);
    },

    executarAtualizacao(id, dados) {
        if (typeof AtualizarProdutoUseCase !== "undefined") {
            return AtualizarProdutoUseCase.executar(id, dados, ProdutoService);
        }

        return ProdutoService.atualizarProduto(id, dados);
    },

    executarExclusao(id) {
        if (typeof ExcluirProdutoUseCase !== "undefined") {
            return ExcluirProdutoUseCase.executar(id, ProdutoService);
        }

        return ProdutoService.desativarProduto(id);
    },

    executarListagem(filtros) {
        if (typeof ListarProdutosUseCase !== "undefined") {
            return ListarProdutosUseCase.executar(filtros, ProdutoService);
        }

        return ProdutoService.listarProdutos(filtros);
    },

    executarBusca(id) {
        if (typeof BuscarProdutoUseCase !== "undefined") {
            return BuscarProdutoUseCase.executar(id, ProdutoService);
        }

        return ProdutoService.buscarProduto(id);
    },

    formatarErros(erros = []) {
        if (!Array.isArray(erros) || !erros.length) {
            return "Nao foi possivel concluir a acao.";
        }

        return erros.join(" ");
    }
};

document.addEventListener("DOMContentLoaded", () => ProdutoController.iniciar());
