const ItemDependenciaUI = {
    callbacks: {},
    elementos: {},
    itens: [],
    produtos: [],

    iniciar(callbacks = {}) {
        this.callbacks = callbacks;
        this.elementos = {
            form: document.getElementById("formDependencia"),
            dependenciaId: document.getElementById("dependenciaId"),
            itemId: document.getElementById("dependenciaItemId"),
            produtoId: document.getElementById("dependenciaProdutoId"),
            quantidade: document.getElementById("dependenciaQuantidade"),
            obrigatorio: document.getElementById("dependenciaObrigatorio"),
            observacao: document.getElementById("dependenciaObservacao"),
            aviso: document.getElementById("dependenciasAviso"),
            tabelaCorpo: document.getElementById("dependenciasTabelaCorpo"),
            resumo: document.getElementById("dependenciasResumo"),
            formTitulo: document.getElementById("dependenciaFormTitulo")
        };

        this.vincularEventos();
        return true;
    },

    vincularEventos() {
        const { form, tabelaCorpo } = this.elementos;

        if (form) {
            form.addEventListener("submit", evento => {
                evento.preventDefault();
                this.callbacks.aoSalvarDependencia?.(this.obterDadosFormulario());
            });

            form.addEventListener("reset", () => {
                setTimeout(() => this.limparFormulario(false), 0);
            });
        }

        if (tabelaCorpo) {
            tabelaCorpo.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-dependencia-acao]");
                if (!botao) return;
                if (botao.dataset.dependenciaAcao === "editar") this.callbacks.aoEditarDependencia?.(botao.dataset.dependenciaId);
                if (botao.dataset.dependenciaAcao === "remover") {
                    const confirmado = window.confirm("Deseja remover esta dependencia?");
                    if (confirmado) this.callbacks.aoRemoverDependencia?.(botao.dataset.dependenciaId);
                }
            });
        }
    },

    carregarItens(itens = []) {
        this.itens = Array.isArray(itens) ? itens : [];
        const select = this.elementos.itemId;
        if (!select) return;

        const valorAtual = select.value;
        select.innerHTML = '<option value="">Selecione</option>' + this.itens
            .filter(item => item.ativo === undefined || item.ativo === 1 || item.ativo === true)
            .map(item => `<option value="${this.escaparAtributo(item.item_id)}">${this.escapar(item.descricao || item.nome || item.item_id)}</option>`)
            .join("");

        if (valorAtual && this.itens.some(item => String(item.item_id) === String(valorAtual))) {
            select.value = valorAtual;
        }
    },

    carregarProdutos(produtos = []) {
        this.produtos = Array.isArray(produtos) ? produtos : [];
        const select = this.elementos.produtoId;
        if (!select) return;

        const valorAtual = select.value;
        select.innerHTML = '<option value="">Selecione</option>' + this.produtos
            .filter(produto => produto.ativo === undefined || produto.ativo === 1 || produto.ativo === true)
            .map(produto => `<option value="${this.escaparAtributo(produto.produto_id)}">${this.escapar(produto.descricao || produto.nome || produto.produto_id)}</option>`)
            .join("");

        if (valorAtual && this.produtos.some(produto => String(produto.produto_id) === String(valorAtual))) {
            select.value = valorAtual;
        }
    },

    obterDadosFormulario() {
        const { dependenciaId, itemId, produtoId, quantidade, obrigatorio, observacao } = this.elementos;
        return {
            id: String(dependenciaId?.value || "").trim(),
            dependencia_id: String(dependenciaId?.value || "").trim(),
            item_id: Number(itemId?.value || 0),
            produto_id: Number(produtoId?.value || 0),
            quantidade: Number(quantidade?.value || 1),
            obrigatorio: String(obrigatorio?.value || "true") === "true",
            observacao: String(observacao?.value || "").trim()
        };
    },

    preencherFormulario(dependencia = {}) {
        this.definirValor("dependenciaId", dependencia.dependencia_id || dependencia.id || "");
        this.definirValor("dependenciaItemId", dependencia.item_id || "");
        this.definirValor("dependenciaProdutoId", dependencia.produto_id || "");
        this.definirValor("dependenciaQuantidade", dependencia.quantidade || 1);
        this.definirValor("dependenciaObrigatorio", dependencia.obrigatorio ? "true" : "false");
        this.definirValor("dependenciaObservacao", dependencia.observacao || "");
        if (this.elementos.formTitulo) this.elementos.formTitulo.textContent = "Editar dependencia";
        this.elementos.form?.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    limparFormulario(focar = true) {
        this.elementos.form?.reset();
        if (this.elementos.dependenciaId) this.elementos.dependenciaId.value = "";
        this.definirValor("dependenciaQuantidade", 1);
        this.definirValor("dependenciaObrigatorio", "true");
        if (this.elementos.formTitulo) this.elementos.formTitulo.textContent = "Cadastro de dependencia";
        if (focar) this.elementos.itemId?.focus();
    },

    renderizarLista(dependencias = []) {
        const corpo = this.elementos.tabelaCorpo;
        if (!corpo) return;
        this.atualizarResumo(dependencias.length);

        if (!dependencias.length) {
            corpo.innerHTML = '<tr><td class="cadastro-estado-vazio" colspan="6">Nenhuma dependencia cadastrada.</td></tr>';
            return;
        }

        corpo.innerHTML = dependencias.map(dependencia => `
            <tr>
                <td>${this.escapar(dependencia.dependencia_id || dependencia.id || "")}</td>
                <td>${this.escapar(dependencia.item_descricao || this.rotuloItem(dependencia.item_id) || "-")}</td>
                <td>${this.escapar(dependencia.produto_descricao || this.rotuloProduto(dependencia.produto_id) || "-")}</td>
                <td>${this.escapar(this.formatarQuantidade(dependencia.quantidade, dependencia.produto_unidade_sigla))}</td>
                <td>${dependencia.obrigatorio ? "Sim" : "Nao"}</td>
                <td>
                    <div class="cadastro-tabela-acoes">
                        <button type="button" class="btn-pequeno botao-claro" data-dependencia-acao="editar" data-dependencia-id="${this.escaparAtributo(dependencia.dependencia_id || dependencia.id)}">Editar</button>
                        <button type="button" class="btn-pequeno botao-claro" data-dependencia-acao="remover" data-dependencia-id="${this.escaparAtributo(dependencia.dependencia_id || dependencia.id)}">Remover</button>
                    </div>
                </td>
            </tr>
        `).join("");
    },

    definirCarregando(carregando) {
        const botao = this.elementos.form?.querySelector('button[type="submit"]');
        if (botao) {
            botao.disabled = !!carregando;
            botao.textContent = carregando ? "Salvando..." : "Salvar dependencia";
        }
    },

    mostrarAviso(mensagem = "", tipo = "info") {
        const aviso = this.elementos.aviso;
        if (!aviso) return;
        aviso.textContent = mensagem;
        aviso.className = mensagem ? `cadastro-aviso visivel ${tipo}` : "cadastro-aviso";
        aviso.setAttribute("aria-live", tipo === "erro" ? "assertive" : "polite");
    },

    atualizarResumo(total) {
        if (this.elementos.resumo) {
            this.elementos.resumo.textContent = `${total} ${total === 1 ? "dependencia cadastrada" : "dependencias cadastradas"}`;
        }
    },

    definirValor(id, valor) {
        const el = document.getElementById(id);
        if (el) el.value = valor ?? "";
    },

    rotuloItem(itemId) {
        const item = this.itens.find(valor => String(valor.item_id) === String(itemId));
        return item ? item.descricao : "";
    },

    rotuloProduto(produtoId) {
        const produto = this.produtos.find(valor => String(valor.produto_id) === String(produtoId));
        return produto ? produto.descricao : "";
    },

    formatarQuantidade(quantidade, unidade) {
        const numero = Number(quantidade || 0);
        const texto = Number.isFinite(numero)
            ? numero.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })
            : "0";
        return unidade ? `${texto} ${unidade}` : texto;
    },

    escapar(valor) {
        return String(valor ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
    },

    escaparAtributo(valor) {
        return this.escapar(valor).replace(/'/g, "&#39;");
    }
};

window.ItemDependenciaUI = ItemDependenciaUI;
