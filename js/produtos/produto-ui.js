const ProdutoUI = {
    elementos: {},
    callbacks: {},

    iniciar(callbacks = {}) {
        this.callbacks = callbacks;
        this.mapearElementos();
        this.vincularEventos();
        this.renderizarDetalhe(null);
    },

    mapearElementos() {
        this.elementos = {
            busca: document.getElementById("buscaProduto"),
            filtroCategoria: document.getElementById("filtroProdutoCategoria"),
            filtroStatus: document.getElementById("filtroProdutoStatus"),
            btnNovo: document.getElementById("btnNovoProduto"),
            aviso: document.getElementById("produtosAviso"),
            resumo: document.getElementById("produtosResumo"),
            tabelaCorpo: document.getElementById("produtosTabelaCorpo"),
            form: document.getElementById("formProduto"),
            produtoId: document.getElementById("produtoId"),
            formTitulo: document.getElementById("produtoFormTitulo"),
            regraCalculo: document.getElementById("produtoRegraCalculo"),
            detalheResumo: document.getElementById("produtoDetalheResumo"),
            detalheConteudo: document.getElementById("produtoDetalheConteudo")
        };
    },

    vincularEventos() {
        const {
            busca,
            filtroCategoria,
            filtroStatus,
            btnNovo,
            tabelaCorpo,
            form
        } = this.elementos;

        [busca, filtroCategoria, filtroStatus].forEach(campo => {
            if (campo) {
                campo.addEventListener("input", () => this.emitirFiltros());
                campo.addEventListener("change", () => this.emitirFiltros());
            }
        });

        if (btnNovo) {
            btnNovo.addEventListener("click", () => this.limparFormulario());
        }

        if (form) {
            form.addEventListener("submit", evento => {
                evento.preventDefault();

                if (typeof this.callbacks.aoSalvarProduto === "function") {
                    this.callbacks.aoSalvarProduto(this.obterDadosFormulario());
                }
            });

            form.addEventListener("reset", () => {
                window.setTimeout(() => {
                    this.elementos.produtoId.value = "";
                    if (this.elementos.formTitulo) {
                        this.elementos.formTitulo.textContent = "Cadastro de produto";
                    }
                }, 0);
            });
        }

        if (tabelaCorpo) {
            tabelaCorpo.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-produto-acao]");
                if (!botao) return;

                this.emitirAcao(botao.dataset.produtoAcao, botao.dataset.produtoId);
            });
        }

    },

    emitirFiltros() {
        if (typeof this.callbacks.aoFiltrarProdutos === "function") {
            this.callbacks.aoFiltrarProdutos(this.obterFiltros());
        }
    },

    emitirAcao(acao, id) {
        const mapa = {
            ver: "aoSelecionarProduto",
            editar: "aoEditarProduto",
            inativar: "aoInativarProduto"
        };
        const callback = mapa[acao];

        if (callback && typeof this.callbacks[callback] === "function") {
            this.callbacks[callback](id);
        }
    },

    obterFiltros() {
        return {
            busca: this.elementos.busca?.value || "",
            categoria: this.elementos.filtroCategoria?.value || "",
            status: this.elementos.filtroStatus?.value || ""
        };
    },

    obterDadosFormulario() {
        const dados = new FormData(this.elementos.form);
        const custo = this.numero(dados.get("custo"));

        return {
            id: String(dados.get("id") || "").trim(),
            nome: String(dados.get("nome") || "").trim(),
            categoria: dados.get("categoria"),
            descricao: String(dados.get("descricao") || "").trim(),
            unidade: dados.get("unidade"),
            unidadeVenda: dados.get("unidade"),
            unidadeCalculo: dados.get("unidade"),
            tipoCalculo: dados.get("regraCalculo") || this.tipoCalculoPorUnidade(dados.get("unidade")),
            regraCalculo: dados.get("regraCalculo") || this.tipoCalculoPorUnidade(dados.get("unidade")),
            custoUnitario: custo,
            custo,
            precoCusto: custo,
            ativo: dados.get("ativo") !== "false",
            observacoes: String(dados.get("observacoes") || "").trim()
        };
    },

    preencherFormulario(produto = {}) {
        if (!this.elementos.form) return;

        this.elementos.produtoId.value = produto.id || "";
        this.definirValor("produtoNome", produto.nome);
        this.definirValor("produtoCategoria", produto.categoria || "vidro");
        this.definirValor("produtoUnidade", this.normalizarUnidade(produto.unidade || produto.unidadeVenda || produto.unidadeCalculo || "unidade"));
        this.definirValor("produtoRegraCalculo", this.normalizarRegraCalculo(produto.regraCalculo || produto.tipoCalculo || "unidade"));
        this.definirValor("produtoCusto", produto.custoUnitario ?? produto.custo ?? produto.precoCusto ?? 0);
        this.definirValor("produtoAtivo", produto.ativo === false ? "false" : "true");
        this.definirValor("produtoDescricao", produto.descricao);
        this.definirValor("produtoObservacoes", produto.observacoes);

        if (this.elementos.formTitulo) {
            this.elementos.formTitulo.textContent = produto.id ? "Editar produto" : "Cadastro de produto";
        }

        this.elementos.form.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    limparFormulario() {
        if (!this.elementos.form) return;

        this.elementos.form.reset();
        this.elementos.produtoId.value = "";

        if (this.elementos.formTitulo) {
            this.elementos.formTitulo.textContent = "Cadastro de produto";
        }

        const campoNome = document.getElementById("produtoNome");
        if (campoNome) {
            campoNome.focus();
        }
    },

    renderizarLista(produtos = []) {
        const tabelaCorpo = this.elementos.tabelaCorpo;
        if (!tabelaCorpo) return;

        this.atualizarResumo(produtos.length);

        if (!produtos.length) {
            tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="6" class="cadastro-estado-vazio">Nenhum produto cadastrado.</td>
                </tr>
            `;
            return;
        }

        tabelaCorpo.innerHTML = produtos.map(produto => `
            <tr>
                <td>
                    <strong>${this.escapar(produto.nome || "Produto")}</strong>
                    <small>${this.escapar(produto.descricao || "Sem descricao")}</small>
                </td>
                <td>${this.escapar(this.rotuloCategoria(produto.categoria))}</td>
                <td>${this.escapar(this.rotuloUnidade(produto.unidade || produto.unidadeVenda || produto.unidadeCalculo || "-"))}</td>
                <td>${this.escapar(this.formatarMoeda(produto.custoUnitario ?? produto.custo ?? produto.precoCusto))}</td>
                <td><span class="cadastro-status ${this.classeStatus(produto.ativo)}">${this.escapar(this.rotuloStatus(produto.ativo))}</span></td>
                <td>
                    <div class="cadastro-tabela-acoes">
                        <button type="button" class="btn-pequeno" data-produto-acao="ver" data-produto-id="${this.escaparAtributo(produto.id)}">Ver</button>
                        <button type="button" class="btn-pequeno botao-claro" data-produto-acao="editar" data-produto-id="${this.escaparAtributo(produto.id)}">Editar</button>
                        <button type="button" class="btn-pequeno botao-claro" data-produto-acao="inativar" data-produto-id="${this.escaparAtributo(produto.id)}">Inativar</button>
                    </div>
                </td>
            </tr>
        `).join("");
    },

    renderizarDetalhe(produto) {
        const { detalheResumo, detalheConteudo } = this.elementos;

        if (!produto) {
            if (detalheResumo) detalheResumo.textContent = "Selecione um produto para visualizar.";
            if (detalheConteudo) detalheConteudo.innerHTML = `<p class="cadastro-placeholder">Nenhum produto selecionado.</p>`;
            return;
        }

        if (detalheResumo) {
            detalheResumo.textContent = `${produto.nome || "Produto"} atualizado em ${this.formatarData(produto.atualizadoEm)}.`;
        }

        if (detalheConteudo) {
            detalheConteudo.innerHTML = `
                <div class="cadastro-resumo-grid">
                    ${this.renderizarCampo("Categoria", this.rotuloCategoria(produto.categoria))}
                    ${this.renderizarCampo("Unidade", this.rotuloUnidade(produto.unidade || produto.unidadeVenda || produto.unidadeCalculo || "-"))}
                    ${this.renderizarCampo("Regra", this.rotuloTipoCalculo(produto.regraCalculo || produto.tipoCalculo))}
                    ${this.renderizarCampo("Custo unitario", this.formatarMoeda(produto.custoUnitario ?? produto.custo ?? produto.precoCusto))}
                    ${this.renderizarCampo("Status", this.rotuloStatus(produto.ativo))}
                </div>
                ${this.renderizarTextoLivre("Descricao", produto.descricao, "Sem descricao.")}
                ${this.renderizarTextoLivre("Observacoes", produto.observacoes, "Sem observacoes.")}
            `;
        }
    },

    renderizarCampo(rotulo, valor) {
        return `
            <div>
                <span>${this.escapar(rotulo)}</span>
                <strong>${this.escapar(valor)}</strong>
            </div>
        `;
    },

    renderizarTextoLivre(titulo, texto, vazio) {
        const conteudo = String(texto || "").trim();
        return `
            <section class="cadastro-detalhe-bloco">
                <h3>${this.escapar(titulo)}</h3>
                <p class="${conteudo ? "" : "cadastro-placeholder"}">${this.escapar(conteudo || vazio)}</p>
            </section>
        `;
    },

    mostrarAviso(mensagem = "", tipo = "info") {
        const aviso = this.elementos.aviso;
        if (!aviso) return;

        aviso.textContent = mensagem;
        aviso.className = mensagem ? `cadastro-aviso visivel ${tipo}` : "cadastro-aviso";
    },

    definirCarregando(carregando) {
        const botao = this.elementos.form?.querySelector("button[type='submit']");
        if (!botao) return;

        botao.disabled = carregando;
        botao.textContent = carregando ? "Salvando..." : "Salvar produto";
    },

    atualizarResumo(total) {
        if (!this.elementos.resumo) return;

        this.elementos.resumo.textContent = total === 1 ? "1 produto cadastrado" : `${total} produtos cadastrados`;
    },

    definirValor(id, valor) {
        const campo = document.getElementById(id);
        if (campo) campo.value = valor ?? "";
    },

    rotuloCategoria(categoria) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.rotuloCategoria === "function") {
            return ProdutoModel.rotuloCategoria(categoria);
        }

        return categoria || "";
    },

    rotuloStatus(ativo) {
        return ativo === false ? "Inativo" : "Ativo";
    },

    classeStatus(ativo) {
        return ativo === false ? "inativo" : "ativo";
    },

    tipoCalculoPorUnidade(unidade) {
        const valor = String(unidade || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        if (valor === "m2" || valor === "area_m2" || valor === "metro_quadrado") return "area_m2";
        if (valor === "m" || valor === "linear_m" || valor === "metro_linear") return "linear_m";
        if (valor === "hora") return "hora";
        return "unidade";
    },

    rotuloUnidade(unidade) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.rotuloUnidade === "function") {
            return ProdutoModel.rotuloUnidade(unidade);
        }

        return unidade || "";
    },

    normalizarUnidade(unidade) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.normalizarUnidade === "function") {
            return ProdutoModel.normalizarUnidade(unidade);
        }

        return unidade || "unidade";
    },

    normalizarRegraCalculo(regra) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.normalizarTipoCalculo === "function") {
            return ProdutoModel.normalizarTipoCalculo(regra);
        }

        return regra || "unidade";
    },

    rotuloTipoCalculo(tipoCalculo) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.rotuloTipoCalculo === "function") {
            return ProdutoModel.rotuloTipoCalculo(tipoCalculo);
        }

        return tipoCalculo || "";
    },

    numero(valor) {
        const numero = Number(String(valor ?? "").replace(",", "."));
        return Number.isFinite(numero) ? numero : 0;
    },

    formatarMoeda(valor) {
        return this.numero(valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    },

    formatarData(valor) {
        if (!valor) return "nao informado";
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return "nao informado";
        return data.toLocaleDateString("pt-BR");
    },

    escapar(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    escaparAtributo(valor) {
        return this.escapar(valor).replace(/`/g, "&#096;");
    }
};
