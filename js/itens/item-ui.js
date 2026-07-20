const CadastroItemUI = {
    callbacks: {},
    elementos: {},
    categorias: [],

    iniciar(callbacks = {}) {
        this.callbacks = callbacks;
        this.elementos = {
            form: document.getElementById("formItem"),
            itemId: document.getElementById("itemId"),
            categoriaId: document.getElementById("itemCategoriaId"),
            descricao: document.getElementById("itemDescricao"),
            ativo: document.getElementById("itemAtivo"),
            aviso: document.getElementById("itensAviso"),
            tabelaCorpo: document.getElementById("itensTabelaCorpo"),
            resumo: document.getElementById("itensResumo"),
            formTitulo: document.getElementById("itemFormTitulo")
        };

        this.vincularEventos();
        return true;
    },

    vincularEventos() {
        const { form, tabelaCorpo } = this.elementos;

        if (form) {
            form.addEventListener("submit", evento => {
                evento.preventDefault();
                this.callbacks.aoSalvarItem?.(this.obterDadosFormulario());
            });

            form.addEventListener("reset", () => {
                setTimeout(() => this.limparFormulario(false), 0);
            });
        }

        if (tabelaCorpo) {
            tabelaCorpo.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-item-acao]");
                if (!botao) return;
                if (botao.dataset.itemAcao === "editar") this.callbacks.aoEditarItem?.(botao.dataset.itemId);
                if (botao.dataset.itemAcao === "inativar") {
                    const confirmado = window.confirm("Deseja inativar este item?");
                    if (confirmado) this.callbacks.aoInativarItem?.(botao.dataset.itemId);
                }
            });
        }
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
            .map(categoria => `<option value="${this.escaparAtributo(categoria.categoria_item_id)}">${this.escapar(categoria.descricao || categoria.nome || categoria.categoria_item_id)}</option>`)
            .join("");

        if (valorAtual && ativas.some(categoria => String(categoria.categoria_item_id) === String(valorAtual))) {
            select.value = valorAtual;
            return;
        }

        if (!select.value && ativas.length) {
            select.value = ativas[0].categoria_item_id;
        }
    },

    obterDadosFormulario() {
        const { itemId, categoriaId, descricao, ativo } = this.elementos;
        return {
            id: String(itemId?.value || "").trim(),
            item_id: String(itemId?.value || "").trim(),
            categoria_item_id: Number(categoriaId?.value || 0),
            descricao: String(descricao?.value || "").trim(),
            ativo: String(ativo?.value || "true") === "true"
        };
    },

    preencherFormulario(item = {}) {
        this.definirValor("itemId", item.item_id || item.id || "");
        this.definirValor("itemCategoriaId", item.categoria_item_id || this.categorias[0]?.categoria_item_id || "");
        this.definirValor("itemDescricao", item.descricao || "");
        this.definirValor("itemAtivo", item.ativo ? "true" : "false");
        if (this.elementos.formTitulo) this.elementos.formTitulo.textContent = "Editar item";
        this.elementos.form?.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    limparFormulario(focar = true) {
        this.elementos.form?.reset();
        if (this.elementos.itemId) this.elementos.itemId.value = "";
        if (this.elementos.categoriaId && !this.elementos.categoriaId.value) {
            this.elementos.categoriaId.value = this.categorias[0]?.categoria_item_id || "";
        }
        this.definirValor("itemAtivo", "true");
        if (this.elementos.formTitulo) this.elementos.formTitulo.textContent = "Cadastro de item";
        if (focar) this.elementos.descricao?.focus();
    },

    renderizarLista(itens = []) {
        const corpo = this.elementos.tabelaCorpo;
        if (!corpo) return;
        this.atualizarResumo(itens.length);

        if (!itens.length) {
            corpo.innerHTML = '<tr><td class="cadastro-estado-vazio" colspan="5">Nenhum item cadastrado.</td></tr>';
            return;
        }

        corpo.innerHTML = itens.map(item => `
            <tr>
                <td>${this.escapar(item.item_id || item.id || "")}</td>
                <td>${this.escapar(item.categoria_descricao || this.rotuloCategoria(item.categoria_item_id) || "-")}</td>
                <td><strong>${this.escapar(item.descricao || "")}</strong></td>
                <td><span class="cadastro-status ${item.ativo ? "ativo" : "inativo"}">${item.ativo ? "Ativo" : "Inativo"}</span></td>
                <td>
                    <div class="cadastro-tabela-acoes">
                        <button type="button" class="btn-pequeno botao-claro" data-item-acao="editar" data-item-id="${this.escaparAtributo(item.item_id || item.id)}">Editar</button>
                        ${item.ativo ? `<button type="button" class="btn-pequeno botao-claro" data-item-acao="inativar" data-item-id="${this.escaparAtributo(item.item_id || item.id)}">Inativar</button>` : ""}
                    </div>
                </td>
            </tr>
        `).join("");
    },

    definirCarregando(carregando) {
        const botao = this.elementos.form?.querySelector('button[type="submit"]');
        if (botao) {
            botao.disabled = !!carregando;
            botao.textContent = carregando ? "Salvando..." : "Salvar item";
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
            this.elementos.resumo.textContent = `${total} ${total === 1 ? "item cadastrado" : "itens cadastrados"}`;
        }
    },

    definirValor(id, valor) {
        const el = document.getElementById(id);
        if (el) el.value = valor ?? "";
    },

    rotuloCategoria(categoriaItemId) {
        const categoria = this.categorias.find(item => String(item.categoria_item_id) === String(categoriaItemId));
        return categoria ? categoria.descricao : "";
    },

    escapar(valor) {
        return String(valor ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
    },

    escaparAtributo(valor) {
        return this.escapar(valor).replace(/'/g, "&#39;");
    }
};

window.CadastroItemUI = CadastroItemUI;
