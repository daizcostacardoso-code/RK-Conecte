const ProjetoVisualUI = {
    elementos: {},
    callbacks: {},

    configurar(controller) {
        this.controller = controller;
        return this;
    },

    iniciar(callbacks = {}) {
        this.callbacks = callbacks;
        this.mapearElementos();
        this.vincularEventos();
        this.renderizarDetalhe(null);
    },

    mapearElementos() {
        this.elementos = {
            busca: document.getElementById("buscaProjeto"),
            filtroStatus: document.getElementById("filtroProjetoStatus"),
            btnNovo: document.getElementById("btnNovoProjeto"),
            aviso: document.getElementById("projetosAviso"),
            resumo: document.getElementById("projetosResumo"),
            tabelaCorpo: document.getElementById("projetosTabelaCorpo"),
            form: document.getElementById("formProjeto"),
            projetoId: document.getElementById("projetoId"),
            formTitulo: document.getElementById("projetoFormTitulo"),
            detalheResumo: document.getElementById("projetoDetalheResumo"),
            detalheConteudo: document.getElementById("projetoDetalheConteudo")
        };
    },

    vincularEventos() {
        const { busca, filtroStatus, btnNovo, tabelaCorpo, form } = this.elementos;

        [busca, filtroStatus].forEach(campo => {
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

                if (typeof this.callbacks.aoSalvarProjeto === "function") {
                    this.callbacks.aoSalvarProjeto(this.obterDadosFormulario());
                }
            });

            form.addEventListener("reset", () => {
                window.setTimeout(() => {
                    this.elementos.projetoId.value = "";
                    if (this.elementos.formTitulo) {
                        this.elementos.formTitulo.textContent = "Cadastro de projeto";
                    }
                }, 0);
            });
        }

        if (tabelaCorpo) {
            tabelaCorpo.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-projeto-acao]");
                if (!botao) return;
                this.emitirAcao(botao.dataset.projetoAcao, botao.dataset.projetoId);
            });
        }
    },

    emitirFiltros() {
        if (typeof this.callbacks.aoFiltrarProjetos === "function") {
            this.callbacks.aoFiltrarProjetos(this.obterFiltros());
        }
    },

    emitirAcao(acao, id) {
        const mapa = {
            ver: "aoSelecionarProjeto",
            editar: "aoEditarProjeto",
            inativar: "aoInativarProjeto",
            usar: "aoUsarProjeto"
        };
        const callback = mapa[acao];

        if (callback && typeof this.callbacks[callback] === "function") {
            this.callbacks[callback](id);
        }
    },

    obterFiltros() {
        return {
            busca: this.elementos.busca?.value || "",
            status: this.elementos.filtroStatus?.value || ""
        };
    },

    obterDadosFormulario() {
        const dados = new FormData(this.elementos.form);

        return {
            id: String(dados.get("id") || "").trim(),
            nome: String(dados.get("nome") || "").trim(),
            titulo: String(dados.get("nome") || "").trim(),
            clienteId: String(dados.get("clienteId") || "").trim(),
            clienteNome: String(dados.get("clienteNome") || "").trim(),
            cliente: {
                id: String(dados.get("clienteId") || "").trim(),
                nome: String(dados.get("clienteNome") || "").trim()
            },
            descricao: String(dados.get("descricao") || "").trim(),
            enderecoObra: String(dados.get("enderecoObra") || "").trim(),
            cidade: String(dados.get("cidade") || "").trim(),
            obra: {
                endereco: String(dados.get("enderecoObra") || "").trim(),
                cidade: String(dados.get("cidade") || "").trim(),
                observacoes: String(dados.get("observacoes") || "").trim()
            },
            status: dados.get("status"),
            tipoProjeto: String(dados.get("tipoProjeto") || "").trim(),
            observacoes: String(dados.get("observacoes") || "").trim()
        };
    },

    preencherFormulario(projeto = {}) {
        if (!this.elementos.form) return;

        this.elementos.projetoId.value = projeto.id || "";
        this.definirValor("projetoNome", projeto.nome || projeto.titulo);
        this.definirValor("projetoClienteId", projeto.clienteId || projeto.cliente?.id);
        this.definirValor("projetoClienteNome", projeto.clienteNome || projeto.cliente?.nome);
        this.definirValor("projetoDescricao", projeto.descricao);
        this.definirValor("projetoEnderecoObra", projeto.enderecoObra || projeto.obra?.endereco);
        this.definirValor("projetoCidade", projeto.cidade || projeto.obra?.cidade || "Porto Seguro");
        this.definirValor("projetoStatus", projeto.status || "rascunho");
        this.definirValor("projetoTipoProjeto", projeto.tipoProjeto);
        this.definirValor("projetoObservacoes", projeto.observacoes || projeto.obra?.observacoes);

        if (this.elementos.formTitulo) {
            this.elementos.formTitulo.textContent = projeto.id ? "Editar projeto" : "Cadastro de projeto";
        }

        this.elementos.form.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    limparFormulario() {
        if (!this.elementos.form) return;

        this.elementos.form.reset();
        this.elementos.projetoId.value = "";

        if (this.elementos.formTitulo) {
            this.elementos.formTitulo.textContent = "Cadastro de projeto";
        }

        document.getElementById("projetoNome")?.focus();
    },

    renderizarLista(projetos = []) {
        const tabelaCorpo = this.elementos.tabelaCorpo;
        if (!tabelaCorpo) return;

        this.atualizarResumo(projetos.length);

        if (!projetos.length) {
            tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="6" class="cadastro-estado-vazio">Nenhum projeto cadastrado.</td>
                </tr>
            `;
            return;
        }

        tabelaCorpo.innerHTML = projetos.map(projeto => `
            <tr>
                <td>
                    <strong>${this.escapar(projeto.nome || projeto.titulo || "Projeto")}</strong>
                    <small>${this.escapar([projeto.padrao ? "Projeto padrao" : "", projeto.numero || projeto.codigo || projeto.id].filter(Boolean).join(" | "))}</small>
                </td>
                <td>${this.escapar(projeto.clienteNome || projeto.cliente?.nome || "-")}</td>
                <td>${this.escapar(projeto.cidade || projeto.obra?.cidade || "-")}</td>
                <td><span class="cadastro-status status-${this.escaparAtributo(projeto.status)}">${this.escapar(this.rotuloStatus(projeto.status))}</span></td>
                <td>${this.escapar(this.formatarData(projeto.atualizadoEm || projeto.datas?.atualizacao))}</td>
                <td>
                    <div class="cadastro-tabela-acoes">
                        <button type="button" class="btn-pequeno" data-projeto-acao="ver" data-projeto-id="${this.escaparAtributo(projeto.id)}">Ver</button>
                        <button type="button" class="btn-pequeno botao-claro" data-projeto-acao="editar" data-projeto-id="${this.escaparAtributo(projeto.id)}">Editar</button>
                        <button type="button" class="btn-pequeno botao-claro" data-projeto-acao="usar" data-projeto-id="${this.escaparAtributo(projeto.id)}">Usar</button>
                        <button type="button" class="btn-pequeno botao-claro" data-projeto-acao="inativar" data-projeto-id="${this.escaparAtributo(projeto.id)}">Inativar</button>
                    </div>
                </td>
            </tr>
        `).join("");
    },

    renderizarDetalhe(projeto) {
        const { detalheResumo, detalheConteudo } = this.elementos;

        if (!projeto) {
            if (detalheResumo) detalheResumo.textContent = "Selecione um projeto para visualizar.";
            if (detalheConteudo) detalheConteudo.innerHTML = `<p class="cadastro-placeholder">Nenhum projeto selecionado.</p>`;
            return;
        }

        if (detalheResumo) {
            detalheResumo.textContent = projeto.padrao
                ? "Projeto padrao pronto para orcamentos rapidos sem obra especifica."
                : `${projeto.nome || projeto.titulo || "Projeto"} pronto para selecao futura no orcamento.`;
        }

        if (detalheConteudo) {
            detalheConteudo.innerHTML = `
                <div class="cadastro-resumo-grid">
                    ${this.renderizarCampo("Cliente", projeto.clienteNome || projeto.cliente?.nome || "-")}
                    ${this.renderizarCampo("Status", this.rotuloStatus(projeto.status))}
                    ${this.renderizarCampo("Tipo", projeto.tipoProjeto || "-")}
                    ${this.renderizarCampo("Uso", projeto.padrao ? "Orcamento rapido" : projeto.generico ? "Projeto generico" : "Projeto especifico")}
                    ${this.renderizarCampo("Cidade", projeto.cidade || projeto.obra?.cidade || "-")}
                    ${this.renderizarCampo("Endereco", projeto.enderecoObra || projeto.obra?.endereco || "-")}
                    ${this.renderizarCampo("Atualizado", this.formatarData(projeto.atualizadoEm || projeto.datas?.atualizacao))}
                </div>
                <section class="cadastro-detalhe-bloco">
                    <h3>Descricao</h3>
                    <p>${this.escapar(projeto.descricao || projeto.observacoes || projeto.obra?.observacoes || "Sem descricao cadastrada.")}</p>
                </section>
                <div class="cadastro-detalhe-acoes">
                    <a class="botao cadastro-btn-principal" href="orcamento-inteligente.html">Seguir para or&ccedil;amento</a>
                </div>
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
        botao.textContent = carregando ? "Salvando..." : "Salvar projeto";
    },

    atualizarResumo(total) {
        if (!this.elementos.resumo) return;
        this.elementos.resumo.textContent = total === 1 ? "1 projeto cadastrado" : `${total} projetos cadastrados`;
    },

    definirValor(id, valor) {
        const campo = document.getElementById(id);
        if (campo) campo.value = valor ?? "";
    },

    rotuloStatus(status) {
        if (typeof ProjetoModel !== "undefined" && typeof ProjetoModel.rotuloStatus === "function") {
            return ProjetoModel.rotuloStatus(status);
        }

        return status || "";
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
