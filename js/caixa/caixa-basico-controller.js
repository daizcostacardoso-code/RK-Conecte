const CaixaBasicoController = {
    movimentos: [],
    edicaoId: "",

    async iniciar() {
        CaixaService.configurar();
        this.definirDataAtual();
        this.registrarEventos();
        await this.carregar();
    },

    registrarEventos() {
        document.getElementById("caixaBasicoForm")?.addEventListener("submit", evento => this.salvar(evento));
        document.getElementById("caixaBasicoLimpar")?.addEventListener("click", () => this.limparFormulario());
        document.getElementById("caixaBasicoFiltroTipo")?.addEventListener("change", () => this.renderizar());
        document.getElementById("caixaBasicoBusca")?.addEventListener("input", () => this.renderizar());
        document.getElementById("caixaBasicoTipo")?.addEventListener("change", evento => {
            const categoria = document.getElementById("caixaBasicoCategoria");
            if (!categoria) return;
            if (evento.target.value === "saida" && ["entrada", "venda"].includes(categoria.value)) categoria.value = "despesa";
            if (evento.target.value === "entrada" && ["despesa", "material", "funcionario", "transporte"].includes(categoria.value)) categoria.value = "entrada";
        });
        document.getElementById("caixaBasicoCorpo")?.addEventListener("click", evento => {
            const excluir = evento.target.closest("[data-caixa-excluir]");
            const editar = evento.target.closest("[data-caixa-editar]");
            if (excluir) this.excluir(excluir.dataset.caixaExcluir);
            if (editar) this.editar(editar.dataset.caixaEditar);
        });
    },

    async carregar() {
        try {
            this.movimentos = await CaixaService.listar();
            this.renderizar();
        } catch (erro) {
            this.movimentos = [];
            this.renderizar();
            this.mostrarAviso(erro.message || "Nao foi possivel carregar o caixa.", true);
        }
    },

    async salvar(evento) {
        evento.preventDefault();
        const dados = this.lerFormulario();
        const validacao = CaixaValidator.validar(dados);
        if (!validacao.valido) {
            this.mostrarAviso(validacao.erros.join(" "), true);
            return;
        }

        try {
            const editando = Boolean(this.edicaoId);
            const resultado = editando
                ? await CaixaService.atualizar(this.edicaoId, validacao.dados)
                : await CaixaService.salvar(validacao.dados);
            if (!resultado.sucesso) {
                this.mostrarAviso((resultado.erros || ["Nao foi possivel salvar o lancamento."]).join(" "), true);
                return;
            }
            this.movimentos = resultado.lista || await CaixaService.listar();
            this.limparFormulario();
            this.renderizar();
            this.mostrarAviso(editando ? "Lancamento atualizado no caixa." : "Lancamento registrado no caixa.");
        } catch (erro) {
            this.mostrarAviso(erro.message || "Nao foi possivel salvar o lancamento.", true);
        }
    },

    lerFormulario() {
        const tipo = document.getElementById("caixaBasicoTipo")?.value || "entrada";
        return {
            descricao: document.getElementById("caixaBasicoDescricao")?.value.trim() || "",
            tipo,
            categoria: document.getElementById("caixaBasicoCategoria")?.value || (tipo === "entrada" ? "entrada" : "despesa"),
            valor: Number(document.getElementById("caixaBasicoValor")?.value || 0),
            data: document.getElementById("caixaBasicoData")?.value || new Date().toISOString().slice(0, 10),
            formaPagamento: document.getElementById("caixaBasicoPagamento")?.value || "Nao informado",
            origem: "Caixa basico",
            status: "confirmado"
        };
    },

    limparFormulario() {
        this.edicaoId = "";
        document.getElementById("caixaBasicoForm")?.reset();
        const botao = document.querySelector("#caixaBasicoForm button[type='submit']");
        if (botao) botao.textContent = "Registrar lancamento";
        this.definirDataAtual();
        document.getElementById("caixaBasicoDescricao")?.focus();
    },

    definirDataAtual() {
        const campo = document.getElementById("caixaBasicoData");
        if (campo) campo.value = new Date().toISOString().slice(0, 10);
    },

    editar(id) {
        const item = this.movimentos.find((movimento, indice) => CaixaService.chave(movimento, indice) === String(id));
        if (!item) return;
        this.edicaoId = String(id);
        document.getElementById("caixaBasicoDescricao").value = item.descricao || "";
        document.getElementById("caixaBasicoTipo").value = item.tipo || "entrada";
        document.getElementById("caixaBasicoValor").value = Number(item.valor || 0);
        document.getElementById("caixaBasicoData").value = item.data || "";
        document.getElementById("caixaBasicoCategoria").value = item.categoria || "outros";
        document.getElementById("caixaBasicoPagamento").value = item.formaPagamento || "Nao informado";
        const botao = document.querySelector("#caixaBasicoForm button[type='submit']");
        if (botao) botao.textContent = "Salvar alteracoes";
        document.getElementById("caixaBasicoDescricao")?.focus();
    },

    filtrar() {
        const tipo = document.getElementById("caixaBasicoFiltroTipo")?.value || "";
        const busca = (document.getElementById("caixaBasicoBusca")?.value || "").trim().toLowerCase();
        return this.movimentos.filter(item => {
            if (item.status === "cancelado") return false;
            const tipoOk = !tipo || item.tipo === tipo;
            const buscaOk = !busca || [item.descricao, item.categoria, item.formaPagamento].some(valor => String(valor || "").toLowerCase().includes(busca));
            return tipoOk && buscaOk;
        });
    },

    renderizar() {
        const confirmados = this.movimentos.filter(item => item.status !== "cancelado");
        const entradas = confirmados.filter(item => item.tipo === "entrada").reduce((total, item) => total + Number(item.valor || 0), 0);
        const saidas = confirmados.filter(item => item.tipo === "saida").reduce((total, item) => total + Number(item.valor || 0), 0);
        const saldo = entradas - saidas;
        this.texto("caixaBasicoEntradas", this.moeda(entradas));
        this.texto("caixaBasicoSaidas", this.moeda(saidas));
        this.texto("caixaBasicoSaldo", this.moeda(saldo));
        document.querySelector(".caixa-basico-resumo-card.saldo")?.classList.toggle("negativo", saldo < 0);

        const filtrados = this.filtrar();
        this.texto("caixaBasicoContagem", `${filtrados.length} ${filtrados.length === 1 ? "lancamento" : "lancamentos"}.`);
        const corpo = document.getElementById("caixaBasicoCorpo");
        if (!corpo) return;
        if (!filtrados.length) {
            corpo.innerHTML = '<tr><td colspan="6" class="caixa-basico-vazio">Nenhum lancamento encontrado.</td></tr>';
            return;
        }
        corpo.innerHTML = filtrados.map(item => {
            const id = CaixaService.chave(item);
            const sinal = item.tipo === "entrada" ? "+" : "-";
            return `<tr><td>${this.escapar(this.data(item.data))}</td><td><strong>${this.escapar(item.descricao)}</strong><br><small>${this.escapar(item.formaPagamento)}</small></td><td>${this.escapar(this.rotuloCategoria(item.categoria))}</td><td><span class="caixa-basico-tipo ${this.escapar(item.tipo)}">${item.tipo === "entrada" ? "Entrada" : "Saida"}</span></td><td class="caixa-basico-valor ${this.escapar(item.tipo)}">${sinal} ${this.escapar(this.moeda(item.valor))}</td><td><button type="button" data-caixa-editar="${this.escaparAtributo(id)}">Editar</button> <button type="button" class="caixa-basico-excluir" data-caixa-excluir="${this.escaparAtributo(id)}">Cancelar</button></td></tr>`;
        }).join("");
    },

    async excluir(id) {
        if (!window.confirm("Cancelar este lancamento do caixa?")) return;
        try {
            const resultado = await CaixaService.excluir(id);
            if (!resultado.sucesso) {
                this.mostrarAviso("Nao foi possivel cancelar o lancamento.", true);
                return;
            }
            this.movimentos = resultado.lista || [];
            if (this.edicaoId === String(id)) this.limparFormulario();
            this.renderizar();
            this.mostrarAviso("Lancamento cancelado.");
        } catch (erro) {
            this.mostrarAviso(erro.message || "Nao foi possivel cancelar o lancamento.", true);
        }
    },

    mostrarAviso(mensagem, erro = false) {
        const aviso = document.getElementById("caixaBasicoAviso");
        if (!aviso) return;
        aviso.textContent = mensagem || "";
        aviso.className = `caixa-basico-aviso ${mensagem ? "visivel" : ""} ${erro ? "erro" : ""}`.trim();
    },

    texto(id, valor) { const elemento = document.getElementById(id); if (elemento) elemento.textContent = valor; },
    moeda(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); },
    data(valor) { const partes = String(valor || "").split("-"); return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : "-"; },
    rotuloCategoria(valor) { return String(valor || "Outros").replace(/_/g, " ").replace(/^./, letra => letra.toUpperCase()); },
    escapar(valor) { return String(valor ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); },
    escaparAtributo(valor) { return this.escapar(valor); }
};

document.addEventListener("DOMContentLoaded", () => CaixaBasicoController.iniciar());
window.CaixaBasicoController = CaixaBasicoController;
