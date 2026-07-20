const ProdutoRepository = {
    configurar() {
        return this;
    },

    async request(path, options = {}) {
        let resposta = null;

        try {
            resposta = await RKFirestoreStore.fetch(path, {
                headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
                ...options
            });
        } catch (_) {
            throw new Error("Nao foi possivel acessar os dados.");
        }

        let dados = null;
        try { dados = await resposta.json(); } catch (_) { dados = null; }

        if (!resposta.ok) {
            const mensagem = dados?.mensagem || dados?.message || dados?.erro || dados?.error || 'Nao foi possivel concluir a operacao.';
            throw new Error(mensagem);
        }

        return dados;
    },

    normalizarLista(resposta) {
        if (Array.isArray(resposta)) return resposta;
        if (Array.isArray(resposta?.dados)) return resposta.dados;
        if (Array.isArray(resposta?.produtos)) return resposta.produtos;
        if (Array.isArray(resposta?.unidades)) return resposta.unidades;
        if (Array.isArray(resposta?.categorias)) return resposta.categorias;
        if (Array.isArray(resposta?.data)) return resposta.data;
        return [];
    },

    extrairLista(resposta) {
        return this.normalizarLista(resposta);
    },

    extrairObjeto(resposta) {
        if (resposta?.dados && !Array.isArray(resposta.dados)) return resposta.dados;
        if (resposta?.produto) return resposta.produto;
        if (resposta?.data && !Array.isArray(resposta.data)) return resposta.data;
        return resposta || {};
    },

    normalizarProduto(produto = {}) {
        const id = produto.produto_id ?? produto.id;
        return {
            ...produto,
            id: id != null ? String(id) : '',
            produto_id: id,
            categoria_id: produto.categoria_id ?? '',
            unidade_id: produto.unidade_id ?? '',
            unidade_sigla: produto.unidade_sigla || produto.sigla || produto.unidade || '',
            descricao: produto.descricao || produto.nome || '',
            valor_custo: Number(produto.valor_custo ?? produto.custo ?? produto.custoUnitario ?? 0),
            valor_venda: Number(produto.valor_venda ?? produto.valorVenda ?? produto.precoVenda ?? 0),
            ativo: produto.ativo === true || produto.ativo === 1 || produto.ativo === '1'
        };
    },

    normalizarParaFirestore(produto = {}) {
        return {
            categoria_id: Number(produto.categoria_id || produto.categoriaId || 0),
            unidade_id: Number(produto.unidade_id || produto.unidadeId || 0),
            descricao: String(produto.descricao || produto.nome || '').trim(),
            valor_custo: Number(produto.valor_custo ?? produto.valorCusto ?? 0),
            valor_venda: Number(produto.valor_venda ?? produto.valorVenda ?? 0),
            ativo: produto.ativo === true || produto.ativo === 1 || produto.ativo === 'true' || produto.ativo === '1'
        };
    },

    async listar(filtros = {}) {
        const params = new URLSearchParams();
        if (filtros.busca) params.set('busca', filtros.busca);
        if (filtros.status) params.set('status', filtros.status);
        const query = params.toString() ? `?${params.toString()}` : '';
        const resposta = await this.request(`/produtos${query}`);
        return this.extrairLista(resposta).map(produto => this.normalizarProduto(produto));
    },

    async buscarPorId(id) {
        const resposta = await this.request(`/produtos/${encodeURIComponent(id)}`);
        return this.normalizarProduto(this.extrairObjeto(resposta));
    },

    async salvar(produto) {
        const resposta = await this.request('/produtos', {
            method: 'POST',
            body: JSON.stringify(this.normalizarParaFirestore(produto))
        });
        return this.normalizarProduto({
            ...produto,
            produto_id: resposta.produto_id || resposta.id || resposta.insertId,
            mensagem: resposta.mensagem || 'Produto cadastrado com sucesso.'
        });
    },

    async atualizar(id, produto) {
        const resposta = await this.request(`/produtos/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(this.normalizarParaFirestore(produto))
        });
        return this.normalizarProduto({
            ...produto,
            produto_id: id,
            mensagem: resposta.mensagem || 'Produto atualizado com sucesso.'
        });
    },

    async excluir(id) {
        await this.request(`/produtos/${encodeURIComponent(id)}`, { method: 'DELETE' });
        return true;
    },

    async listarUnidades() {
        const resposta = await this.request('/unidades');
        return this.extrairLista(resposta);
    },

    async listarCategoriasProduto() {
        const resposta = await this.request('/categorias/produtos');
        return this.extrairLista(resposta);
    }
};

window.ProdutoRepository = ProdutoRepository;
