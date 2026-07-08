const ServicoUI = {
    elementos: {},
    callbacks: {},
    tiposAtuais: [],
    dependenciasAtuais: [],
    tipoDependenciasAtuais: [],
    tamanhosAtuais: [],
    produtosDisponiveis: [],

    iniciar(callbacks = {}) {
        this.callbacks = callbacks;
        this.mapearElementos();
        this.vincularEventos();
        this.renderizarProdutosDisponiveis();
        this.renderizarTipos();
        this.renderizarDependencias();
        this.renderizarTipoDependencias();
        this.renderizarTamanhos();
        this.renderizarDetalhe(null);
    },

    definirProdutosDisponiveis(produtos = []) {
        this.produtosDisponiveis = Array.isArray(produtos)
            ? produtos.filter(produto => produto && produto.ativo !== false)
            : [];
        this.renderizarProdutosDisponiveis();
    },

    mapearElementos() {
        this.elementos = {
            busca: document.getElementById("buscaServico"),
            filtroCategoria: document.getElementById("filtroServicoCategoria"),
            filtroStatus: document.getElementById("filtroServicoStatus"),
            btnNovo: document.getElementById("btnNovoServico"),
            aviso: document.getElementById("servicosAviso"),
            resumo: document.getElementById("servicosResumo"),
            tabelaCorpo: document.getElementById("servicosTabelaCorpo"),
            form: document.getElementById("formServico"),
            servicoId: document.getElementById("servicoId"),
            formTitulo: document.getElementById("servicoFormTitulo"),
            tipoNome: document.getElementById("servicoTipoNome"),
            tipoDescricao: document.getElementById("servicoTipoDescricao"),
            tipoTempoMedio: document.getElementById("servicoTipoTempoMedio"),
            tipoUnidadeTempo: document.getElementById("servicoTipoUnidadeTempo"),
            tipoObservacoesTecnicas: document.getElementById("servicoTipoObservacoesTecnicas"),
            tipoDependenciaSelect: document.getElementById("servicoTipoDependenciaSelect"),
            tipoQuantidadePadrao: document.getElementById("servicoTipoQuantidadePadrao"),
            tipoObrigatoria: document.getElementById("servicoTipoObrigatoria"),
            tipoDependenciaObservacao: document.getElementById("servicoTipoDependenciaObservacao"),
            btnAdicionarTipoDependencia: document.getElementById("btnAdicionarServicoTipoDependencia"),
            tipoDependenciasLista: document.getElementById("servicoTipoDependenciasLista"),
            btnAdicionarTipo: document.getElementById("btnAdicionarServicoTipo"),
            tiposLista: document.getElementById("servicoTiposLista"),
            dependenciaInput: document.getElementById("servicoDependenciaInput"),
            dependenciaQuantidade: document.getElementById("servicoDependenciaQuantidade"),
            dependenciaObservacao: document.getElementById("servicoDependenciaObservacao"),
            btnAdicionarDependencia: document.getElementById("btnAdicionarServicoDependencia"),
            dependenciasLista: document.getElementById("servicoDependenciasLista"),
            tamanhoModelo: document.getElementById("servicoTamanhoModelo"),
            tamanhoNome: document.getElementById("servicoTamanhoNome"),
            tamanhoLargura: document.getElementById("servicoTamanhoLargura"),
            tamanhoAltura: document.getElementById("servicoTamanhoAltura"),
            btnAdicionarTamanho: document.getElementById("btnAdicionarServicoTamanho"),
            tamanhosLista: document.getElementById("servicoTamanhosLista"),
            detalheResumo: document.getElementById("servicoDetalheResumo"),
            detalheConteudo: document.getElementById("servicoDetalheConteudo")
        };
    },

    vincularEventos() {
        const {
            busca,
            filtroCategoria,
            filtroStatus,
            btnNovo,
            tabelaCorpo,
            form,
            btnAdicionarTipo,
            tiposLista,
            btnAdicionarTipoDependencia,
            tipoDependenciasLista,
            btnAdicionarDependencia,
            dependenciasLista,
            btnAdicionarTamanho,
            tamanhosLista
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

                if (typeof this.callbacks.aoSalvarServico === "function") {
                    this.callbacks.aoSalvarServico(this.obterDadosFormulario());
                }
            });

            form.addEventListener("reset", () => {
                window.setTimeout(() => {
                    this.elementos.servicoId.value = "";
                    this.tiposAtuais = [];
                    this.dependenciasAtuais = [];
                    this.tipoDependenciasAtuais = [];
                    this.tamanhosAtuais = [];
                    this.renderizarTipos();
                    this.renderizarDependencias();
                    this.renderizarTipoDependencias();
                    this.renderizarTamanhos();
                    if (this.elementos.formTitulo) {
                        this.elementos.formTitulo.textContent = "Cadastro de servico";
                    }
                }, 0);
            });
        }

        if (tabelaCorpo) {
            tabelaCorpo.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-servico-acao]");
                if (!botao) return;
                this.emitirAcao(botao.dataset.servicoAcao, botao.dataset.servicoId);
            });
        }

        if (btnAdicionarTipo) {
            btnAdicionarTipo.addEventListener("click", () => this.adicionarTipo());
        }

        if (btnAdicionarTipoDependencia) {
            btnAdicionarTipoDependencia.addEventListener("click", () => this.adicionarTipoDependencia());
        }

        if (tiposLista) {
            tiposLista.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-remover-servico-tipo]");
                if (!botao) return;
                this.removerTipo(Number(botao.dataset.removerServicoTipo));
            });
        }

        if (tipoDependenciasLista) {
            tipoDependenciasLista.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-remover-servico-tipo-dependencia]");
                if (!botao) return;
                this.removerTipoDependencia(Number(botao.dataset.removerServicoTipoDependencia));
            });
        }

        if (btnAdicionarDependencia) {
            btnAdicionarDependencia.addEventListener("click", () => this.adicionarDependencia());
        }

        if (dependenciasLista) {
            dependenciasLista.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-remover-servico-dependencia]");
                if (!botao) return;
                this.removerDependencia(Number(botao.dataset.removerServicoDependencia));
            });
        }

        if (btnAdicionarTamanho) {
            btnAdicionarTamanho.addEventListener("click", () => this.adicionarTamanho());
        }

        if (tamanhosLista) {
            tamanhosLista.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-remover-servico-tamanho]");
                if (!botao) return;
                this.removerTamanho(Number(botao.dataset.removerServicoTamanho));
            });
        }
    },

    emitirFiltros() {
        if (typeof this.callbacks.aoFiltrarServicos === "function") {
            this.callbacks.aoFiltrarServicos(this.obterFiltros());
        }
    },

    emitirAcao(acao, id) {
        const mapa = {
            ver: "aoSelecionarServico",
            editar: "aoEditarServico",
            inativar: "aoInativarServico"
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

        return {
            id: String(dados.get("id") || "").trim(),
            nome: String(dados.get("nome") || "").trim(),
            categoria: dados.get("categoria"),
            descricao: String(dados.get("descricao") || "").trim(),
            tipoCalculo: dados.get("tipoCalculo") || "area_m2",
            unidadeVenda: dados.get("unidadeVenda") || "m2",
            ativo: dados.get("ativo") !== "false",
            tiposItem: this.tiposAtuais.map(tipo => ({ ...tipo })),
            dependenciasPadrao: this.dependenciasAtuais.map(dependencia => ({ ...dependencia })),
            tamanhosPadrao: this.tamanhosAtuais.map(tamanho => ({ ...tamanho })),
            observacoes: String(dados.get("observacoes") || "").trim()
        };
    },

    preencherFormulario(servico = {}) {
        if (!this.elementos.form) return;

        this.elementos.servicoId.value = servico.id || "";
        this.definirValor("servicoNome", servico.nome);
        this.definirValor("servicoCategoria", this.normalizarCategoriaServico(servico.categoria || "instalacao"));
        this.definirValor("servicoTipoCalculo", servico.tipoCalculo || "personalizado");
        this.definirValor("servicoUnidadeVenda", servico.unidadeVenda || "servico");
        this.definirValor("servicoAtivo", servico.ativo === false ? "false" : "true");
        this.definirValor("servicoDescricao", servico.descricao);
        this.definirValor("servicoObservacoes", servico.observacoes);
        this.tiposAtuais = Array.isArray(servico.tiposItem) ? servico.tiposItem.map(tipo => ({ ...tipo })) : [];
        this.dependenciasAtuais = Array.isArray(servico.dependenciasPadrao) ? servico.dependenciasPadrao.map(dependencia => ({ ...dependencia })) : [];
        this.tipoDependenciasAtuais = [];
        this.tamanhosAtuais = Array.isArray(servico.tamanhosPadrao) ? servico.tamanhosPadrao.map(tamanho => ({ ...tamanho })) : [];
        this.renderizarTipos();
        this.renderizarDependencias();
        this.renderizarTipoDependencias();
        this.renderizarTamanhos();

        if (this.elementos.formTitulo) {
            this.elementos.formTitulo.textContent = servico.id ? "Editar servico" : "Cadastro de servico";
        }

        this.elementos.form.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    limparFormulario() {
        if (!this.elementos.form) return;

        this.elementos.form.reset();
        this.elementos.servicoId.value = "";
        this.tiposAtuais = [];
        this.dependenciasAtuais = [];
        this.tipoDependenciasAtuais = [];
        this.tamanhosAtuais = [];
        this.renderizarTipos();
        this.renderizarDependencias();
        this.renderizarTipoDependencias();
        this.renderizarTamanhos();

        if (this.elementos.formTitulo) {
            this.elementos.formTitulo.textContent = "Cadastro de servico";
        }

        document.getElementById("servicoNome")?.focus();
    },

    renderizarLista(servicos = []) {
        const tabelaCorpo = this.elementos.tabelaCorpo;
        if (!tabelaCorpo) return;

        this.atualizarResumo(servicos.length);

        if (!servicos.length) {
            tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="6" class="cadastro-estado-vazio">Nenhum servico cadastrado.</td>
                </tr>
            `;
            return;
        }

        tabelaCorpo.innerHTML = servicos.map(servico => `
            <tr>
                <td>
                    <strong>${this.escapar(servico.nome || "Servico")}</strong>
                    <small>${this.escapar(servico.descricao || "Sem descricao")}</small>
                </td>
                <td>${this.escapar(this.rotuloCategoria(servico.categoria))}</td>
                <td>${this.escapar(String(Array.isArray(servico.tiposItem) ? servico.tiposItem.length : 0))}</td>
                <td>${this.escapar(String(Array.isArray(servico.tamanhosPadrao) ? servico.tamanhosPadrao.length : 0))}</td>
                <td><span class="cadastro-status ${this.classeStatus(servico.ativo)}">${this.escapar(this.rotuloStatus(servico.ativo))}</span></td>
                <td>
                    <div class="cadastro-tabela-acoes">
                        <button type="button" class="btn-pequeno" data-servico-acao="ver" data-servico-id="${this.escaparAtributo(servico.id)}">Ver</button>
                        <button type="button" class="btn-pequeno botao-claro" data-servico-acao="editar" data-servico-id="${this.escaparAtributo(servico.id)}">Editar</button>
                        <button type="button" class="btn-pequeno botao-claro" data-servico-acao="inativar" data-servico-id="${this.escaparAtributo(servico.id)}">Inativar</button>
                    </div>
                </td>
            </tr>
        `).join("");
    },

    renderizarDetalhe(servico) {
        const { detalheResumo, detalheConteudo } = this.elementos;

        if (!servico) {
            if (detalheResumo) detalheResumo.textContent = "Selecione um servico para visualizar.";
            if (detalheConteudo) detalheConteudo.innerHTML = `<p class="cadastro-placeholder">Nenhum servico selecionado.</p>`;
            return;
        }

        if (detalheResumo) {
            detalheResumo.textContent = `${servico.nome || "Servico"} pronto para o catalogo comercial.`;
        }

        if (detalheConteudo) {
            detalheConteudo.innerHTML = `
                <div class="cadastro-resumo-grid">
                    ${this.renderizarCampo("Macro servico", this.rotuloCategoria(servico.categoria))}
                    ${this.renderizarCampo("Tipos", String(Array.isArray(servico.tiposItem) ? servico.tiposItem.length : 0))}
                    ${this.renderizarCampo("Dependencias", String(Array.isArray(servico.dependenciasPadrao) ? servico.dependenciasPadrao.length : 0))}
                    ${this.renderizarCampo("Custo padrao", this.formatarMoeda(this.somarCustosDependencias(servico.dependenciasPadrao)))}
                    ${this.renderizarCampo("Status", this.rotuloStatus(servico.ativo))}
                </div>
                ${this.renderizarListaTexto("Dependencias padrao", servico.dependenciasPadrao, "Nenhuma dependencia cadastrada.")}
                ${this.renderizarTiposDetalhe(servico.tiposItem)}
                ${this.renderizarTamanhosDetalhe(servico.tamanhosPadrao)}
            `;
        }
    },

    adicionarTipo() {
        const nome = String(this.elementos.tipoNome?.value || "").trim();
        if (!nome) return;

        this.tiposAtuais.push({
            id: this.criarSlug(nome),
            nome,
            descricao: String(this.elementos.tipoDescricao?.value || "").trim(),
            subtipos: [],
            dependencias: this.tipoDependenciasAtuais.map(dependencia => ({ ...dependencia })),
            dependenciasPadrao: this.tipoDependenciasAtuais.map(dependencia => ({ ...dependencia })),
            tempoMedio: this.numero(this.elementos.tipoTempoMedio?.value),
            unidadeTempo: this.elementos.tipoUnidadeTempo?.value || "hora",
            ativo: true,
            observacoesTecnicas: String(this.elementos.tipoObservacoesTecnicas?.value || "").trim()
        });

        this.elementos.tipoNome.value = "";
        this.elementos.tipoDescricao.value = "";
        this.elementos.tipoTempoMedio.value = "";
        this.elementos.tipoUnidadeTempo.value = "hora";
        this.elementos.tipoObservacoesTecnicas.value = "";
        this.tipoDependenciasAtuais = [];
        this.renderizarTipoDependencias();
        this.renderizarTipos();
    },

    adicionarTipoDependencia() {
        const dependencia = this.obterDependenciaSelecionada({
            select: this.elementos.tipoDependenciaSelect,
            quantidade: this.elementos.tipoQuantidadePadrao,
            obrigatoria: this.elementos.tipoObrigatoria,
            observacao: this.elementos.tipoDependenciaObservacao
        });

        if (!dependencia) {
            this.mostrarAviso("Selecione um produto ativo para adicionar como dependencia.", "erro");
            return;
        }

        if (!this.tipoDependenciasAtuais.some(item => item.produtoId === dependencia.produtoId)) {
            this.tipoDependenciasAtuais.push(dependencia);
        }

        this.limparCamposDependenciaTipo();
        this.renderizarTipoDependencias();
    },

    removerTipoDependencia(indice) {
        if (indice < 0) return;
        this.tipoDependenciasAtuais.splice(indice, 1);
        this.renderizarTipoDependencias();
    },

    removerTipo(indice) {
        if (indice < 0) return;
        this.tiposAtuais.splice(indice, 1);
        this.renderizarTipos();
    },

    renderizarTipos() {
        const lista = this.elementos.tiposLista;
        if (!lista) return;

        if (!this.tiposAtuais.length) {
            lista.innerHTML = `<p class="cadastro-placeholder">Nenhum tipo de servico.</p>`;
            return;
        }

        lista.innerHTML = this.tiposAtuais.map((tipo, indice) => `
            <div class="cadastro-lista-item">
                <div>
                    <strong>${this.escapar(tipo.nome || "Tipo")}</strong>
                    <small>${this.escapar(this.resumoTipo(tipo))}</small>
                </div>
                <button type="button" class="btn-pequeno botao-claro" data-remover-servico-tipo="${indice}">Remover</button>
            </div>
        `).join("");
    },

    adicionarDependencia() {
        const dependencia = this.obterDependenciaSelecionada({
            select: this.elementos.dependenciaInput,
            quantidade: this.elementos.dependenciaQuantidade,
            observacao: this.elementos.dependenciaObservacao
        });

        if (!dependencia) {
            this.mostrarAviso("Selecione um produto ativo para adicionar como dependencia.", "erro");
            return;
        }

        if (!this.dependenciasAtuais.some(item => item.produtoId === dependencia.produtoId)) {
            this.dependenciasAtuais.push(dependencia);
        }

        this.limparCamposDependenciaPadrao();
        this.renderizarDependencias();
    },

    removerDependencia(indice) {
        if (indice < 0) return;
        this.dependenciasAtuais.splice(indice, 1);
        this.renderizarDependencias();
    },

    renderizarDependencias() {
        const lista = this.elementos.dependenciasLista;
        if (!lista) return;

        if (!this.dependenciasAtuais.length) {
            lista.innerHTML = `<span class="cadastro-chip-vazio">Sem dependencias</span>`;
            return;
        }

        lista.innerHTML = this.dependenciasAtuais.map((dependencia, indice) => `
            <span class="cadastro-chip">
                ${this.escapar(this.rotuloDependencia(dependencia))}
                <button type="button" data-remover-servico-dependencia="${indice}" aria-label="Remover dependencia">x</button>
            </span>
        `).join("");
    },

    renderizarTipoDependencias() {
        const lista = this.elementos.tipoDependenciasLista;
        if (!lista) return;

        if (!this.tipoDependenciasAtuais.length) {
            lista.innerHTML = `<span class="cadastro-chip-vazio">Sem dependencias para este tipo</span>`;
            return;
        }

        lista.innerHTML = this.tipoDependenciasAtuais.map((dependencia, indice) => `
            <span class="cadastro-chip">
                ${this.escapar(this.rotuloDependencia(dependencia))}
                <button type="button" data-remover-servico-tipo-dependencia="${indice}" aria-label="Remover dependencia">x</button>
            </span>
        `).join("");
    },

    renderizarProdutosDisponiveis() {
        const selects = [
            this.elementos.dependenciaInput,
            this.elementos.tipoDependenciaSelect
        ].filter(Boolean);

        const options = [
            `<option value="">Selecione um produto ativo</option>`,
            ...this.produtosDisponiveis.map(produto => (
                `<option value="${this.escaparAtributo(produto.id)}">${this.escapar(produto.nome || "Produto")} - ${this.escapar(this.rotuloCategoriaProduto(produto.categoria))} - ${this.escapar(this.formatarCustoProduto(produto))}</option>`
            ))
        ].join("");

        selects.forEach(select => {
            const valorAtual = select.value;
            select.innerHTML = options;
            if (valorAtual && this.produtosDisponiveis.some(produto => produto.id === valorAtual)) {
                select.value = valorAtual;
            }
        });
    },

    obterDependenciaSelecionada({ select, quantidade, obrigatoria, observacao } = {}) {
        const produtoId = String(select?.value || "").trim();
        const produto = this.produtosDisponiveis.find(item => item.id === produtoId);

        if (!produto || produto.ativo === false) {
            return null;
        }

        const quantidadePadrao = this.numero(quantidade?.value || 1) || 1;
        const custoUnitario = this.obterCustoProduto(produto);

        return {
            produtoId: produto.id,
            produtoNome: produto.nome || "",
            categoria: produto.categoria || "",
            unidadeCalculo: produto.unidadeCalculo || produto.unidade || produto.unidadeVenda || "",
            regraCalculo: produto.regraCalculo || produto.tipoCalculo || "",
            quantidadePadrao,
            custoUnitario,
            custoEstimado: this.calcularCustoEstimado(custoUnitario, quantidadePadrao),
            obrigatoria: obrigatoria ? obrigatoria.value !== "false" : true,
            observacao: String(observacao?.value || "").trim()
        };
    },

    limparCamposDependenciaPadrao() {
        if (this.elementos.dependenciaInput) this.elementos.dependenciaInput.value = "";
        if (this.elementos.dependenciaQuantidade) this.elementos.dependenciaQuantidade.value = "";
        if (this.elementos.dependenciaObservacao) this.elementos.dependenciaObservacao.value = "";
    },

    limparCamposDependenciaTipo() {
        if (this.elementos.tipoDependenciaSelect) this.elementos.tipoDependenciaSelect.value = "";
        if (this.elementos.tipoQuantidadePadrao) this.elementos.tipoQuantidadePadrao.value = "";
        if (this.elementos.tipoObrigatoria) this.elementos.tipoObrigatoria.value = "true";
        if (this.elementos.tipoDependenciaObservacao) this.elementos.tipoDependenciaObservacao.value = "";
    },

    resumoTipo(tipo = {}) {
        const dependencias = this.textosDependencias(tipo.dependencias || tipo.dependenciasPadrao);
        const tempo = this.formatarTempo(tipo);
        return [
            tipo.descricao,
            tempo,
            dependencias.length ? `Dependencias: ${dependencias.join(", ")}` : "Sem dependencias"
        ].filter(Boolean).join(" | ");
    },

    textosDependencias(dependencias = []) {
        if (!Array.isArray(dependencias)) {
            return [];
        }

        return dependencias.map(dependencia => this.rotuloDependencia(dependencia)).filter(Boolean);
    },

    adicionarTamanho() {
        const tipoItem = String(this.elementos.tamanhoModelo?.value || "").trim();
        const nome = String(this.elementos.tamanhoNome?.value || "").trim();
        const larguraCm = this.numero(this.elementos.tamanhoLargura?.value);
        const alturaCm = this.numero(this.elementos.tamanhoAltura?.value);

        if (!nome && (!larguraCm || !alturaCm)) {
            return;
        }

        this.tamanhosAtuais.push({
            id: `tam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            tipoItem,
            nome: nome || `${larguraCm} x ${alturaCm} cm`,
            larguraCm,
            alturaCm,
            ativo: true,
            areaM2: this.calcularAreaM2(larguraCm, alturaCm)
        });

        this.elementos.tamanhoModelo.value = "";
        this.elementos.tamanhoNome.value = "";
        this.elementos.tamanhoLargura.value = "";
        this.elementos.tamanhoAltura.value = "";
        this.renderizarTamanhos();
    },

    removerTamanho(indice) {
        if (indice < 0) return;
        this.tamanhosAtuais.splice(indice, 1);
        this.renderizarTamanhos();
    },

    renderizarTamanhos() {
        const lista = this.elementos.tamanhosLista;
        if (!lista) return;

        if (!this.tamanhosAtuais.length) {
            lista.innerHTML = `<p class="cadastro-placeholder">Nenhum tamanho padrao.</p>`;
            return;
        }

        lista.innerHTML = this.tamanhosAtuais.map((tamanho, indice) => `
            <div class="cadastro-lista-item">
                <div>
                    <strong>${this.escapar(tamanho.nome || "Tamanho")}</strong>
                    <small>${this.escapar(`${tamanho.tipoItem || "Modelo"} - ${tamanho.larguraCm || 0} x ${tamanho.alturaCm || 0} cm - ${this.calcularAreaM2(tamanho.larguraCm, tamanho.alturaCm)} m2`)}</small>
                </div>
                <button type="button" class="btn-pequeno botao-claro" data-remover-servico-tamanho="${indice}">Remover</button>
            </div>
        `).join("");
    },

    renderizarCampo(rotulo, valor) {
        return `
            <div>
                <span>${this.escapar(rotulo)}</span>
                <strong>${this.escapar(valor)}</strong>
            </div>
        `;
    },

    renderizarListaTexto(titulo, lista = [], vazio) {
        const itens = Array.isArray(lista) ? lista.filter(Boolean) : [];

        return `
            <section class="cadastro-detalhe-bloco">
                <h3>${this.escapar(titulo)}</h3>
                ${itens.length
                    ? `<div class="cadastro-chip-lista">${itens.map(item => `<span class="cadastro-chip-estatico">${this.escapar(this.rotuloDependencia(item))}</span>`).join("")}</div>`
                    : `<p class="cadastro-placeholder">${this.escapar(vazio)}</p>`}
            </section>
        `;
    },

    renderizarTiposDetalhe(tipos = []) {
        const itens = Array.isArray(tipos) ? tipos : [];

        return `
            <section class="cadastro-detalhe-bloco">
                <h3>Tipos de servico</h3>
                ${itens.length
                    ? itens.map(tipo => `
                        <div class="cadastro-lista-item">
                            <div>
                                <strong>${this.escapar(tipo.nome || "Tipo")}</strong>
                                <small>${this.escapar(this.resumoTipo(tipo))}</small>
                                ${this.renderizarDependenciasPorCategoria(tipo.dependencias || tipo.dependenciasPadrao)}
                                ${tipo.observacoesTecnicas ? `<p class="cadastro-observacao-tecnica">${this.escapar(tipo.observacoesTecnicas)}</p>` : ""}
                            </div>
                        </div>
                    `).join("")
                    : `<p class="cadastro-placeholder">Nenhum tipo de servico.</p>`}
            </section>
        `;
    },

    renderizarDependenciasPorCategoria(dependencias = []) {
        const grupos = this.agruparDependenciasPorCategoria(dependencias);
        const categorias = Object.keys(grupos);

        if (!categorias.length) {
            return "";
        }

        return `
            <div class="cadastro-dependencias-tecnicas">
                ${categorias.map(categoria => `
                    <div>
                        <span>${this.escapar(this.rotuloGrupoDependencia(categoria))}</span>
                        <strong>${this.escapar(grupos[categoria].map(dep => this.rotuloDependencia(dep)).join(", "))}</strong>
                    </div>
                `).join("")}
            </div>
        `;
    },

    agruparDependenciasPorCategoria(dependencias = []) {
        const grupos = {};
        const mapa = {
            vidro: "vidros",
            aluminio_perfil: "aluminios",
            perfil: "aluminios",
            ferragem: "ferragens",
            acessorio: "acessorios",
            insumo: "insumos",
            mao_de_obra: "mao_de_obra",
            kit: "kits",
            acabamento: "acabamentos",
            outro: "outros"
        };

        (Array.isArray(dependencias) ? dependencias : []).forEach(dependencia => {
            const categoria = typeof dependencia === "string" ? "outros" : dependencia.categoria || "outros";
            const chave = mapa[this.normalizarValor(categoria)] || "outros";
            grupos[chave] = grupos[chave] || [];
            grupos[chave].push(dependencia);
        });

        return grupos;
    },

    renderizarTamanhosDetalhe(tamanhos = []) {
        const itens = Array.isArray(tamanhos) ? tamanhos : [];

        return `
            <section class="cadastro-detalhe-bloco">
                <h3>Tamanhos padrao</h3>
                ${itens.length
                    ? itens.map(tamanho => `
                        <div class="cadastro-lista-item">
                            <div>
                                <strong>${this.escapar(tamanho.nome || "Tamanho")}</strong>
                                <small>${this.escapar(`${tamanho.tipoItem || "Modelo"} - ${tamanho.larguraCm || 0} x ${tamanho.alturaCm || 0} cm - ${this.calcularAreaM2(tamanho.larguraCm, tamanho.alturaCm)} m2`)}</small>
                            </div>
                        </div>
                    `).join("")
                    : `<p class="cadastro-placeholder">Nenhum tamanho padrao.</p>`}
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
        botao.textContent = carregando ? "Salvando..." : "Salvar servico";
    },

    atualizarResumo(total) {
        if (!this.elementos.resumo) return;
        this.elementos.resumo.textContent = total === 1 ? "1 servico cadastrado" : `${total} servicos cadastrados`;
    },

    definirValor(id, valor) {
        const campo = document.getElementById(id);
        if (campo) campo.value = valor ?? "";
    },

    listaTexto(valor) {
        return String(valor || "")
            .split(/[\n,;|]+/)
            .map(item => item.trim())
            .filter(Boolean);
    },

    rotuloDependencia(dependencia = {}) {
        if (typeof dependencia === "string") {
            return dependencia;
        }

        const quantidade = this.numero(dependencia.quantidadePadrao);
        const unidade = dependencia.unidadeCalculo ? ` ${this.rotuloUnidadeProduto(dependencia.unidadeCalculo)}` : "";
        const quantidadeTexto = quantidade ? `${quantidade}${unidade}` : "";
        const custo = dependencia.custoEstimado ?? this.calcularCustoEstimado(
            dependencia.custoUnitario ?? dependencia.custo,
            quantidade || 1
        );
        const detalhes = [
            quantidadeTexto,
            custo ? this.formatarMoeda(custo) : ""
        ].filter(Boolean).join(" - ");

        return `${dependencia.produtoNome || dependencia.nome || dependencia.produtoId || "Produto"}${detalhes ? ` (${detalhes})` : ""}`;
    },

    obterCustoProduto(produto = {}) {
        return this.numero(produto.custoUnitario ?? produto.custo ?? produto.precoCusto);
    },

    formatarCustoProduto(produto = {}) {
        const unidade = produto.unidadeCalculo || produto.unidade || produto.unidadeVenda;
        const rotuloUnidade = unidade ? `/${this.rotuloUnidadeProduto(unidade)}` : "";
        return `${this.formatarMoeda(this.obterCustoProduto(produto))}${rotuloUnidade}`;
    },

    calcularCustoEstimado(custoUnitario, quantidadePadrao) {
        return Number((this.numero(custoUnitario) * this.numero(quantidadePadrao)).toFixed(2));
    },

    somarCustosDependencias(dependencias = []) {
        if (!Array.isArray(dependencias)) {
            return 0;
        }

        return dependencias.reduce((total, dependencia) => {
            if (!dependencia || typeof dependencia !== "object") {
                return total;
            }

            const custoEstimado = dependencia.custoEstimado ?? this.calcularCustoEstimado(
                dependencia.custoUnitario ?? dependencia.custo,
                dependencia.quantidadePadrao || 1
            );

            return total + this.numero(custoEstimado);
        }, 0);
    },

    formatarTempo(tipo = {}) {
        const tempo = this.numero(tipo.tempoMedio);
        if (!tempo) return "";
        const unidade = this.rotuloUnidadeTempo(tipo.unidadeTempo);
        return `${tempo} ${unidade}${tempo === 1 ? "" : "s"}`;
    },

    rotuloUnidadeTempo(unidadeTempo) {
        if (typeof ServicoModel !== "undefined" && typeof ServicoModel.rotuloUnidadeTempo === "function") {
            return ServicoModel.rotuloUnidadeTempo(unidadeTempo);
        }

        return unidadeTempo || "hora";
    },

    rotuloCategoriaProduto(categoria) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.rotuloCategoria === "function") {
            return ProdutoModel.rotuloCategoria(categoria);
        }

        return categoria || "";
    },

    rotuloUnidadeProduto(unidade) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.rotuloUnidade === "function") {
            return ProdutoModel.rotuloUnidade(unidade);
        }

        return unidade || "";
    },

    rotuloGrupoDependencia(categoria) {
        const mapa = {
            vidros: "Vidros usados",
            aluminios: "Aluminios/perfis usados",
            ferragens: "Ferragens usadas",
            acessorios: "Acessorios",
            insumos: "Insumos",
            mao_de_obra: "Mao de obra",
            kits: "Kits",
            acabamentos: "Acabamentos",
            outros: "Outros"
        };

        return mapa[categoria] || categoria || "";
    },

    normalizarValor(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    criarSlug(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") || `tipo_${Date.now()}`;
    },

    rotuloCategoria(categoria) {
        if (typeof ServicoModel !== "undefined" && typeof ServicoModel.rotuloCategoria === "function") {
            return ServicoModel.rotuloCategoria(categoria);
        }

        return categoria || "";
    },

    normalizarCategoriaServico(categoria) {
        if (typeof ServicoModel !== "undefined" && typeof ServicoModel.normalizarCategoria === "function") {
            return ServicoModel.normalizarCategoria(categoria);
        }

        return categoria || "instalacao";
    },

    rotuloTipoCalculo(tipoCalculo) {
        if (typeof ServicoModel !== "undefined" && typeof ServicoModel.rotuloTipoCalculo === "function") {
            return ServicoModel.rotuloTipoCalculo(tipoCalculo);
        }

        return tipoCalculo || "";
    },

    rotuloStatus(ativo) {
        return ativo === false ? "Inativo" : "Ativo";
    },

    classeStatus(ativo) {
        return ativo === false ? "inativo" : "ativo";
    },

    calcularAreaM2(larguraCm, alturaCm) {
        const largura = this.numero(larguraCm);
        const altura = this.numero(alturaCm);
        return largura > 0 && altura > 0 ? Number(((largura * altura) / 10000).toFixed(4)) : 0;
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
