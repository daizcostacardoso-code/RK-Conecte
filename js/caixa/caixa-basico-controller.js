const CaixaBasicoController = {
    movimentos: [],
    financeiros: [],
    financeiroSelecionado: null,
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
        document.getElementById("financeiroBusca")?.addEventListener("input", () => this.renderizarFinanceiro());
        document.getElementById("financeiroCorpo")?.addEventListener("click", evento => {
            const botao = evento.target.closest("[data-financeiro-projeto]");
            if (botao) this.abrirRecebimento(botao.dataset.financeiroProjeto);
        });
        document.getElementById("financeiroRecebimentoForm")?.addEventListener("submit", evento => this.registrarRecebimento(evento));
        document.getElementById("financeiroFechar")?.addEventListener("click", () => this.fecharRecebimento());
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
            const [movimentos, financeiro] = await Promise.all([
                CaixaService.listar(),
                FinanceiroOperacionalRepository.sincronizarProjetos(window.RKAuth?.obterSessao?.())
            ]);
            this.movimentos = movimentos;
            this.financeiros = financeiro.sucesso ? financeiro.financeiros : [];
            this.renderizar();
            this.renderizarFinanceiro();
            if (!financeiro.sucesso) this.mostrarAviso((financeiro.erros || []).join(" "), true);
        } catch (erro) {
            this.movimentos = [];
            this.financeiros = [];
            this.renderizar();
            this.renderizarFinanceiro();
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
        if (item.bloqueado) {
            this.mostrarAviso("Recebimentos de projetos devem ser administrados pelo controle financeiro.", true);
            return;
        }
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
            const acoes = item.bloqueado
                ? '<small>Vinculado ao projeto</small>'
                : `<button type="button" data-caixa-editar="${this.escaparAtributo(id)}">Editar</button> <button type="button" class="caixa-basico-excluir" data-caixa-excluir="${this.escaparAtributo(id)}">Cancelar</button>`;
            return `<tr><td>${this.escapar(this.data(item.data))}</td><td><strong>${this.escapar(item.descricao)}</strong><br><small>${this.escapar(item.formaPagamento)}</small></td><td>${this.escapar(this.rotuloCategoria(item.categoria))}</td><td><span class="caixa-basico-tipo ${this.escapar(item.tipo)}">${item.tipo === "entrada" ? "Entrada" : "Saida"}</span></td><td class="caixa-basico-valor ${this.escapar(item.tipo)}">${sinal} ${this.escapar(this.moeda(item.valor))}</td><td>${acoes}</td></tr>`;
        }).join("");
    },

    renderizarFinanceiro() {
        const ativos = this.financeiros.filter(item => item.status !== "cancelado");
        const contratado = ativos.reduce((total, item) => total + item.valorContratadoCentavos, 0);
        const recebido = ativos.reduce((total, item) => total + item.valorRecebidoCentavos, 0);
        const pendente = ativos.reduce((total, item) => total + item.saldoCentavos, 0);
        this.texto("financeiroContratado", FinanceiroOperacionalModel.moeda(contratado));
        this.texto("financeiroRecebido", FinanceiroOperacionalModel.moeda(recebido));
        this.texto("financeiroPendente", FinanceiroOperacionalModel.moeda(pendente));

        const busca = (document.getElementById("financeiroBusca")?.value || "").trim().toLowerCase();
        const itens = this.financeiros.filter(item => !busca || [item.projetoNumero, item.projetoId, item.orcamentoNumero, item.clienteNome].some(valor => String(valor || "").toLowerCase().includes(busca)));
        const corpo = document.getElementById("financeiroCorpo");
        if (!corpo) return;
        if (!itens.length) {
            corpo.innerHTML = '<tr><td colspan="7" class="caixa-basico-vazio">Nenhum projeto financeiro encontrado.</td></tr>';
            return;
        }
        corpo.innerHTML = itens.map(item => {
            const bloqueado = ["quitado", "cancelado"].includes(item.status);
            return `<tr><td><strong>${this.escapar(item.projetoNumero || item.projetoId)}</strong><br><small>Orçamento ${this.escapar(item.orcamentoNumero || "-")}</small></td><td>${this.escapar(item.clienteNome || "Cliente não informado")}</td><td>${this.escapar(FinanceiroOperacionalModel.moeda(item.valorContratadoCentavos))}</td><td>${this.escapar(FinanceiroOperacionalModel.moeda(item.valorRecebidoCentavos))}</td><td>${this.escapar(FinanceiroOperacionalModel.moeda(item.saldoCentavos))}</td><td><span class="financeiro-status ${this.escapar(item.status)}">${this.escapar(this.rotuloFinanceiro(item.status))}</span></td><td><button type="button" class="financeiro-registrar" data-financeiro-projeto="${this.escaparAtributo(item.projetoId)}" ${bloqueado ? "disabled" : ""}>Registrar</button></td></tr>`;
        }).join("");
    },

    abrirRecebimento(projetoId) {
        const financeiro = this.financeiros.find(item => item.projetoId === String(projetoId));
        if (!financeiro || ["quitado", "cancelado"].includes(financeiro.status)) return;
        this.financeiroSelecionado = financeiro;
        const formulario = document.getElementById("financeiroRecebimentoForm");
        if (formulario) formulario.hidden = false;
        this.texto("financeiroProjetoSelecionado", `${financeiro.projetoNumero || financeiro.projetoId} · ${financeiro.clienteNome || "Cliente"}`);
        this.texto("financeiroSaldoSelecionado", `Saldo disponível: ${FinanceiroOperacionalModel.moeda(financeiro.saldoCentavos)}`);
        const data = document.getElementById("financeiroData");
        const valor = document.getElementById("financeiroValor");
        if (data) data.value = new Date().toISOString().slice(0, 10);
        if (valor) { valor.value = financeiro.saldo.toFixed(2); valor.max = financeiro.saldo.toFixed(2); valor.focus(); }
        formulario?.scrollIntoView({ behavior: "smooth", block: "center" });
    },

    fecharRecebimento() {
        this.financeiroSelecionado = null;
        const formulario = document.getElementById("financeiroRecebimentoForm");
        formulario?.reset();
        if (formulario) formulario.hidden = true;
    },

    async registrarRecebimento(evento) {
        evento.preventDefault();
        const financeiro = this.financeiroSelecionado;
        if (!financeiro) return this.mostrarAviso("Selecione um projeto para registrar o recebimento.", true);
        const dados = {
            valor: document.getElementById("financeiroValor")?.value || "",
            data: document.getElementById("financeiroData")?.value || "",
            formaPagamento: document.getElementById("financeiroPagamento")?.value || "Não informado",
            observacao: document.getElementById("financeiroObservacao")?.value.trim() || ""
        };
        const botao = document.querySelector("#financeiroRecebimentoForm button[type='submit']");
        if (botao) { botao.disabled = true; botao.textContent = "Registrando..."; }
        try {
            const resultado = await FinanceiroOperacionalRepository.registrarRecebimento(
                financeiro.projetoId,
                dados,
                window.RKAuth?.obterSessao?.()
            );
            if (!resultado.sucesso) return this.mostrarAviso((resultado.erros || []).join(" "), true);
            this.fecharRecebimento();
            await this.carregar();
            this.mostrarAviso("Recebimento registrado e incluído no caixa.");
        } catch (erro) {
            this.mostrarAviso(erro.message || "Não foi possível registrar o recebimento.", true);
        } finally {
            if (botao) { botao.disabled = false; botao.textContent = "Confirmar recebimento"; }
        }
    },

    async excluir(id) {
        const item = this.movimentos.find((movimento, indice) => CaixaService.chave(movimento, indice) === String(id));
        if (item?.bloqueado) return this.mostrarAviso("Recebimentos vinculados não podem ser cancelados pelo caixa.", true);
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
    rotuloFinanceiro(valor) { return ({ pendente: "Pendente", parcial: "Parcial", quitado: "Quitado", cancelado: "Cancelado" })[valor] || "Pendente"; },
    escapar(valor) { return String(valor ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); },
    escaparAtributo(valor) { return this.escapar(valor); }
};

document.addEventListener("DOMContentLoaded", () => CaixaBasicoController.iniciar());
window.CaixaBasicoController = CaixaBasicoController;
