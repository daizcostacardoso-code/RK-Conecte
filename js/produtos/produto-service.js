const ProdutoService = {
    repository: ProdutoRepository,

    configurar(repository) {
        this.repository = repository || ProdutoRepository;
    },

    sucesso(chave, valor, extras = {}) {
        return { sucesso: true, [chave]: valor, ...extras };
    },

    falha(error) {
        const mensagem = error?.message || String(error) || 'Erro inesperado.';
        return { sucesso: false, mensagem, erros: [mensagem] };
    },

    async listarProdutos(filtros = {}) {
        try {
            let produtos = await this.repository.listar();
            const busca = String(filtros.busca || '').trim().toLowerCase();
            const status = String(filtros.status || '').trim();

            if (busca) {
                produtos = produtos.filter(produto => String(produto.descricao || '').toLowerCase().includes(busca));
            }

            if (status === 'ativo') produtos = produtos.filter(produto => produto.ativo);
            if (status === 'inativo') produtos = produtos.filter(produto => !produto.ativo);
            if (filtros.ativo === true) produtos = produtos.filter(produto => produto.ativo);
            if (filtros.ativo === false) produtos = produtos.filter(produto => !produto.ativo);

            return this.sucesso('produtos', produtos);
        } catch (error) {
            return this.falha(error);
        }
    },

    async buscarProduto(id) {
        try {
            return this.sucesso('produto', await this.repository.buscarPorId(id));
        } catch (error) {
            return this.falha(error);
        }
    },

    async criarProduto(dados) {
        try {
            this.validar(dados);
            const produto = await this.repository.salvar(dados);
            return this.sucesso('produto', produto, { mensagem: produto.mensagem || 'Produto cadastrado com sucesso.' });
        } catch (error) {
            return this.falha(error);
        }
    },

    async atualizarProduto(id, dados) {
        try {
            this.validar(dados);
            const produto = await this.repository.atualizar(id, dados);
            return this.sucesso('produto', produto, { mensagem: produto.mensagem || 'Produto atualizado com sucesso.' });
        } catch (error) {
            return this.falha(error);
        }
    },

    async excluirProduto(id) {
        try {
            await this.repository.excluir(id);
            return { sucesso: true };
        } catch (error) {
            return this.falha(error);
        }
    },

    async listarUnidades() {
        try { return this.sucesso('unidades', await this.repository.listarUnidades()); }
        catch (error) { return this.falha(error); }
    },

    async listarCategoriasProduto() {
        try { return this.sucesso('categorias', await this.repository.listarCategoriasProduto()); }
        catch (error) { return this.falha(error); }
    },

    validar(dados = {}) {
        if (!String(dados.descricao || '').trim()) throw new Error('Descricao do produto e obrigatoria.');
        if (!Number(dados.categoria_id)) throw new Error('Categoria do produto e obrigatoria.');
        if (!Number(dados.unidade_id)) throw new Error('Unidade de medida e obrigatoria.');
        if (Number(dados.valor_custo) < 0) throw new Error('Valor de custo invalido.');
        if (Number(dados.valor_venda) < 0) throw new Error('Valor de venda invalido.');
    }
};

window.ProdutoService = ProdutoService;
