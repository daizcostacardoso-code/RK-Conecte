const ProdutoUI = {
    callbacks: {},
    elementos: {},
    categorias: [],
    unidades: [],

    iniciar(callbacks = {}) {
        this.callbacks = callbacks;
        this.elementos = {
            form: document.getElementById('formProduto'),
            produtoId: document.getElementById('produtoId'),
            categoriaId: document.getElementById('produtoCategoriaId'),
            unidadeId: document.getElementById('produtoUnidadeId'),
            descricao: document.getElementById('produtoDescricao'),
            valorCusto: document.getElementById('produtoValorCusto'),
            valorVenda: document.getElementById('produtoValorVenda'),
            ativo: document.getElementById('produtoAtivo'),
            busca: document.getElementById('buscaProduto'),
            filtroStatus: document.getElementById('filtroProdutoStatus'),
            aviso: document.getElementById('produtosAviso'),
            tabelaCorpo: document.getElementById('produtosTabelaCorpo'),
            resumo: document.getElementById('produtosResumo'),
            formTitulo: document.getElementById('produtoFormTitulo')
        };

        this.vincularEventos();
        return true;
    },

    vincularEventos() {
        const { form, busca, filtroStatus, tabelaCorpo } = this.elementos;

        [busca, filtroStatus].forEach(campo => {
            if (!campo) return;
            campo.addEventListener('input', () => this.emitirFiltros());
            campo.addEventListener('change', () => this.emitirFiltros());
        });

        if (form) {
            form.addEventListener('submit', evento => {
                evento.preventDefault();
                this.callbacks.aoSalvarProduto?.(this.obterDadosFormulario());
            });

            form.addEventListener('reset', () => {
                setTimeout(() => this.limparFormulario(false), 0);
            });
        }

        if (tabelaCorpo) {
            tabelaCorpo.addEventListener('click', evento => {
                const botao = evento.target.closest('[data-produto-acao]');
                if (!botao) return;
                if (botao.dataset.produtoAcao === 'editar') this.callbacks.aoEditarProduto?.(botao.dataset.produtoId);
                if (botao.dataset.produtoAcao === 'inativar') {
                    const confirmado = window.confirm('Deseja inativar este produto?');
                    if (confirmado) this.callbacks.aoInativarProduto?.(botao.dataset.produtoId);
                }
            });
        }
    },

    carregarUnidades(unidades = []) {
        this.unidades = unidades;
        const select = this.elementos.unidadeId;
        if (!select) return;
        select.innerHTML = '<option value="">Selecione</option>' + unidades
            .filter(unidade => unidade.ativo === undefined || unidade.ativo === 1 || unidade.ativo === true)
            .map(unidade => `<option value="${this.escaparAtributo(unidade.unidade_id)}">${this.escapar(unidade.sigla || unidade.descricao || unidade.unidade_id)}</option>`)
            .join('');
    },

    carregarCategorias(categorias = []) {
        this.categorias = Array.isArray(categorias) ? categorias : [];
        const select = this.elementos.categoriaId;
        if (!select) return;

        const valorAtual = select.value;
        const ativas = this.categorias.filter(categoria => (
            categoria.ativo === undefined ||
            categoria.ativo === 1 ||
            categoria.ativo === true
        ));

        select.innerHTML = '<option value="">Selecione</option>' + ativas
            .map(categoria => `<option value="${this.escaparAtributo(categoria.categoria_id)}">${this.escapar(categoria.descricao || categoria.nome || categoria.categoria_id)}</option>`)
            .join('');

        if (valorAtual && ativas.some(categoria => String(categoria.categoria_id) === String(valorAtual))) {
            select.value = valorAtual;
            return;
        }

        if (!select.value && ativas.length) {
            select.value = ativas[0].categoria_id;
        }
    },

    obterDadosFormulario() {
        const { produtoId, categoriaId, unidadeId, descricao, valorCusto, valorVenda, ativo } = this.elementos;
        const categoriaPadrao = categoriaId?.value || this.categorias[0]?.categoria_id || '';
        return {
            id: String(produtoId?.value || '').trim(),
            produto_id: String(produtoId?.value || '').trim(),
            categoria_id: Number(categoriaPadrao || 0),
            unidade_id: Number(unidadeId?.value || 0),
            descricao: String(descricao?.value || '').trim(),
            valor_custo: Number(valorCusto?.value || 0),
            valor_venda: Number(valorVenda?.value || 0),
            ativo: String(ativo?.value || 'true') === 'true'
        };
    },

    obterFiltros() {
        return {
            busca: this.elementos.busca?.value || '',
            status: this.elementos.filtroStatus?.value || ''
        };
    },

    preencherFormulario(produto = {}) {
        this.definirValor('produtoId', produto.produto_id || produto.id || '');
        this.definirValor('produtoCategoriaId', produto.categoria_id || this.categorias[0]?.categoria_id || '');
        this.definirValor('produtoUnidadeId', produto.unidade_id || '');
        this.definirValor('produtoDescricao', produto.descricao || '');
        this.definirValor('produtoValorCusto', produto.valor_custo ?? 0);
        this.definirValor('produtoValorVenda', produto.valor_venda ?? 0);
        this.definirValor('produtoAtivo', produto.ativo ? 'true' : 'false');
        if (this.elementos.formTitulo) this.elementos.formTitulo.textContent = 'Editar produto';
        this.elementos.form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    limparFormulario(focar = true) {
        this.elementos.form?.reset();
        if (this.elementos.produtoId) this.elementos.produtoId.value = '';
        if (this.elementos.categoriaId && !this.elementos.categoriaId.value) {
            this.elementos.categoriaId.value = this.categorias[0]?.categoria_id || '';
        }
        this.definirValor('produtoAtivo', 'true');
        if (this.elementos.formTitulo) this.elementos.formTitulo.textContent = 'Cadastro de produto';
        if (focar) this.elementos.descricao?.focus();
    },

    renderizarLista(produtos = []) {
        const corpo = this.elementos.tabelaCorpo;
        if (!corpo) return;
        this.atualizarResumo(produtos.length);

        if (!produtos.length) {
            corpo.innerHTML = '<tr><td class="cadastro-estado-vazio" colspan="7">Nenhum produto cadastrado.</td></tr>';
            return;
        }

        corpo.innerHTML = produtos.map(produto => `
            <tr>
                <td>${this.escapar(produto.produto_id || produto.id || '')}</td>
                <td>${this.escapar(produto.unidade_sigla || this.rotuloUnidade(produto.unidade_id) || '-')}</td>
                <td><strong>${this.escapar(produto.descricao || '')}</strong></td>
                <td>${this.formatarMoeda(produto.valor_custo)}</td>
                <td>${this.formatarMoeda(produto.valor_venda)}</td>
                <td><span class="cadastro-status ${produto.ativo ? 'ativo' : 'inativo'}">${produto.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <div class="cadastro-tabela-acoes">
                        <button type="button" class="btn-pequeno botao-claro" data-produto-acao="editar" data-produto-id="${this.escaparAtributo(produto.produto_id || produto.id)}">Editar</button>
                        ${produto.ativo ? `<button type="button" class="btn-pequeno botao-claro" data-produto-acao="inativar" data-produto-id="${this.escaparAtributo(produto.produto_id || produto.id)}">Inativar</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderizarDetalhe() {},

    definirCarregando(carregando) {
        const botao = this.elementos.form?.querySelector('button[type="submit"]');
        if (botao) {
            botao.disabled = !!carregando;
            botao.textContent = carregando ? 'Salvando...' : 'Salvar produto';
        }
    },

    mostrarAviso(mensagem = '', tipo = 'info') {
        const aviso = this.elementos.aviso;
        if (!aviso) return;
        aviso.textContent = mensagem;
        aviso.className = mensagem ? `cadastro-aviso visivel ${tipo}` : 'cadastro-aviso';
        aviso.setAttribute('aria-live', tipo === 'erro' ? 'assertive' : 'polite');
    },

    atualizarResumo(total) {
        if (this.elementos.resumo) {
            this.elementos.resumo.textContent = `${total} ${total === 1 ? 'produto cadastrado' : 'produtos cadastrados'}`;
        }
    },

    emitirFiltros() { this.callbacks.aoFiltrarProdutos?.(this.obterFiltros()); },

    definirValor(id, valor) {
        const el = document.getElementById(id);
        if (el) el.value = valor ?? '';
    },

    rotuloUnidade(unidadeId) {
        const unidade = this.unidades.find(u => String(u.unidade_id) === String(unidadeId));
        return unidade ? (unidade.sigla || unidade.descricao) : '';
    },

    formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    escapar(valor) {
        return String(valor ?? '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
    },

    escaparAtributo(valor) { return this.escapar(valor).replace(/'/g, '&#39;'); }
};

window.ProdutoUI = ProdutoUI;
