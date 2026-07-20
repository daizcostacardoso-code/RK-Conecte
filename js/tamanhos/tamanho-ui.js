const TamanhoPadraoUI = {
    callbacks: {},
    elementos: {},
    itens: [],

    iniciar(callbacks = {}) {
        this.callbacks = callbacks;
        this.elementos = {
            form: document.getElementById("formTamanho"),
            tamanhoId: document.getElementById("tamanhoId"),
            itemId: document.getElementById("tamanhoItemId"),
            descricao: document.getElementById("tamanhoDescricao"),
            largura: document.getElementById("tamanhoLargura"),
            altura: document.getElementById("tamanhoAltura"),
            ativo: document.getElementById("tamanhoAtivo"),
            aviso: document.getElementById("tamanhosAviso"),
            tabelaCorpo: document.getElementById("tamanhosTabelaCorpo"),
            resumo: document.getElementById("tamanhosResumo"),
            formTitulo: document.getElementById("tamanhoFormTitulo")
        };

        this.vincularEventos();
        return true;
    },

    vincularEventos() {
        const { form, tabelaCorpo } = this.elementos;

        if (form) {
            form.addEventListener("submit", evento => {
                evento.preventDefault();
                this.callbacks.aoSalvarTamanho?.(this.obterDadosFormulario());
            });

            form.addEventListener("reset", () => {
                setTimeout(() => this.limparFormulario(false), 0);
            });
        }

        if (tabelaCorpo) {
            tabelaCorpo.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-tamanho-acao]");
                if (!botao) return;
                if (botao.dataset.tamanhoAcao === "editar") this.callbacks.aoEditarTamanho?.(botao.dataset.tamanhoId);
                if (botao.dataset.tamanhoAcao === "inativar") {
                    const confirmado = window.confirm("Deseja inativar este tamanho padrao?");
                    if (confirmado) this.callbacks.aoInativarTamanho?.(botao.dataset.tamanhoId);
                }
            });
        }
    },

    carregarItens(itens = []) {
        this.itens = Array.isArray(itens) ? itens : [];
        const select = this.elementos.itemId;
        if (!select) return;

        const valorAtual = select.value;
        const ativos = this.itens.filter(item => (
            item.ativo === undefined ||
            item.ativo === 1 ||
            item.ativo === true
        ));

        select.innerHTML = '<option value="">Selecione</option>' + ativos
            .map(item => `<option value="${this.escaparAtributo(item.item_id)}">${this.escapar(item.descricao || item.nome || item.item_id)}</option>`)
            .join("");

        if (valorAtual && ativos.some(item => String(item.item_id) === String(valorAtual))) {
            select.value = valorAtual;
            return;
        }

        if (!select.value && ativos.length) {
            select.value = ativos[0].item_id;
        }
    },

    obterDadosFormulario() {
        const { tamanhoId, itemId, descricao, largura, altura, ativo } = this.elementos;
        return {
            id: String(tamanhoId?.value || "").trim(),
            tamanho_id: String(tamanhoId?.value || "").trim(),
            item_id: Number(itemId?.value || 0),
            descricao: String(descricao?.value || "").trim(),
            largura: Number(largura?.value || 0),
            altura: Number(altura?.value || 0),
            ativo: String(ativo?.value || "true") === "true"
        };
    },

    preencherFormulario(tamanho = {}) {
        this.definirValor("tamanhoId", tamanho.tamanho_id || tamanho.id || "");
        this.definirValor("tamanhoItemId", tamanho.item_id || this.itens[0]?.item_id || "");
        this.definirValor("tamanhoDescricao", tamanho.descricao || "");
        this.definirValor("tamanhoLargura", tamanho.largura || "");
        this.definirValor("tamanhoAltura", tamanho.altura || "");
        this.definirValor("tamanhoAtivo", tamanho.ativo ? "true" : "false");
        if (this.elementos.formTitulo) this.elementos.formTitulo.textContent = "Editar tamanho padrao";
        this.elementos.form?.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    limparFormulario(focar = true) {
        this.elementos.form?.reset();
        if (this.elementos.tamanhoId) this.elementos.tamanhoId.value = "";
        if (this.elementos.itemId && !this.elementos.itemId.value) {
            this.elementos.itemId.value = this.itens[0]?.item_id || "";
        }
        this.definirValor("tamanhoAtivo", "true");
        if (this.elementos.formTitulo) this.elementos.formTitulo.textContent = "Cadastro de tamanho padrao";
        if (focar) this.elementos.descricao?.focus();
    },

    renderizarLista(tamanhos = []) {
        const corpo = this.elementos.tabelaCorpo;
        if (!corpo) return;
        this.atualizarResumo(tamanhos.length);

        if (!tamanhos.length) {
            corpo.innerHTML = '<tr><td class="cadastro-estado-vazio" colspan="7">Nenhum tamanho padrao cadastrado.</td></tr>';
            return;
        }

        corpo.innerHTML = tamanhos.map(tamanho => `
            <tr>
                <td>${this.escapar(tamanho.tamanho_id || tamanho.id || "")}</td>
                <td>${this.escapar(tamanho.item_descricao || this.rotuloItem(tamanho.item_id) || "-")}</td>
                <td><strong>${this.escapar(tamanho.descricao || "")}</strong></td>
                <td>${this.escapar(this.formatarMedida(tamanho.altura))}</td>
                <td>${this.escapar(this.formatarMedida(tamanho.largura))}</td>
                <td><span class="cadastro-status ${tamanho.ativo ? "ativo" : "inativo"}">${tamanho.ativo ? "Ativo" : "Inativo"}</span></td>
                <td>
                    <div class="cadastro-tabela-acoes">
                        <button type="button" class="btn-pequeno botao-claro" data-tamanho-acao="editar" data-tamanho-id="${this.escaparAtributo(tamanho.tamanho_id || tamanho.id)}">Editar</button>
                        ${tamanho.ativo ? `<button type="button" class="btn-pequeno botao-claro" data-tamanho-acao="inativar" data-tamanho-id="${this.escaparAtributo(tamanho.tamanho_id || tamanho.id)}">Inativar</button>` : ""}
                    </div>
                </td>
            </tr>
        `).join("");
    },

    definirCarregando(carregando) {
        const botao = this.elementos.form?.querySelector('button[type="submit"]');
        if (botao) {
            botao.disabled = !!carregando;
            botao.textContent = carregando ? "Salvando..." : "Salvar tamanho";
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
            this.elementos.resumo.textContent = `${total} ${total === 1 ? "tamanho cadastrado" : "tamanhos cadastrados"}`;
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

    formatarMedida(valor) {
        const numero = Number(valor || 0);
        if (!Number.isFinite(numero)) return "0,00";
        return `${numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cm`;
    },

    escapar(valor) {
        return String(valor ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
    },

    escaparAtributo(valor) {
        return this.escapar(valor).replace(/'/g, "&#39;");
    }
};

window.TamanhoPadraoUI = TamanhoPadraoUI;
