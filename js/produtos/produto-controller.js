const ProdutoController = {
    buscaTimer: null,

    async iniciar() {
        ProdutoService.configurar(ProdutoRepository);
        ProdutoUI.iniciar({
            aoFiltrarProdutos: filtros => this.agendarBusca(filtros),
            aoSalvarProduto: dados => this.salvarProduto(dados),
            aoEditarProduto: id => this.editarProduto(id),
            aoInativarProduto: id => this.inativarProduto(id)
        });

        await this.carregarCombos();
        await this.listarProdutos();
    },

    async carregarCombos() {
        const [unidades, categorias] = await Promise.all([
            ProdutoService.listarUnidades(),
            ProdutoService.listarCategoriasProduto()
        ]);

        if (unidades.sucesso) ProdutoUI.carregarUnidades(unidades.unidades || []);
        else ProdutoUI.mostrarAviso(this.formatarErros(unidades.erros), 'erro');

        if (categorias.sucesso) ProdutoUI.carregarCategorias(categorias.categorias || []);
        else ProdutoUI.mostrarAviso(this.formatarErros(categorias.erros), 'erro');
    },

    agendarBusca(filtros = {}) {
        clearTimeout(this.buscaTimer);
        this.buscaTimer = setTimeout(() => this.listarProdutos(filtros), 180);
    },

    async listarProdutos(filtros = ProdutoUI.obterFiltros()) {
        const resultado = await ProdutoService.listarProdutos(filtros);
        if (!resultado.sucesso) {
            ProdutoUI.renderizarLista([]);
            ProdutoUI.mostrarAviso(this.formatarErros(resultado.erros), 'erro');
            return resultado;
        }
        ProdutoUI.renderizarLista(resultado.produtos || []);
        return resultado;
    },

    async salvarProduto(dados = {}) {
        ProdutoUI.definirCarregando(true);
        ProdutoUI.mostrarAviso('Salvando produto...', 'info');

        try {
            const resultado = dados.id
                ? await ProdutoService.atualizarProduto(dados.id, dados)
                : await ProdutoService.criarProduto(dados);

            if (!resultado.sucesso) {
                ProdutoUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), 'erro');
                return resultado;
            }

            ProdutoUI.mostrarAviso(
                resultado.mensagem || (dados.id ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.'),
                'sucesso'
            );
            ProdutoUI.limparFormulario(false);
            await this.listarProdutos();
            return resultado;
        } catch (error) {
            const resultado = { sucesso: false, mensagem: error?.message || 'Nao foi possivel salvar o produto.', erros: [error?.message || 'Erro inesperado.'] };
            ProdutoUI.mostrarAviso(resultado.mensagem, 'erro');
            return resultado;
        } finally {
            ProdutoUI.definirCarregando(false);
        }
    },

    async editarProduto(id) {
        const resultado = await ProdutoService.buscarProduto(id);
        if (!resultado.sucesso) {
            ProdutoUI.mostrarAviso(this.formatarErros(resultado.erros), 'erro');
            return resultado;
        }
        ProdutoUI.preencherFormulario(resultado.produto);
        return resultado;
    },

    async inativarProduto(id) {
        const resultado = await ProdutoService.excluirProduto(id);
        if (!resultado.sucesso) ProdutoUI.mostrarAviso(this.formatarErros(resultado.erros), 'erro');
        else {
            ProdutoUI.mostrarAviso('Produto inativado.', 'sucesso');
            await this.listarProdutos();
        }
        return resultado;
    },

    formatarErros(erros = []) {
        return Array.isArray(erros) ? erros.join(' ') : String(erros || 'Erro inesperado.');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('formProduto')) {
        ProdutoController.iniciar();
    }
});

window.ProdutoController = ProdutoController;
