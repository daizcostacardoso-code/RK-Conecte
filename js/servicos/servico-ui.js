const ServicoUI = {
    elementos: {},
    callbacks: {},
    categorias: [
        "box",
        "espelho",
        "guarda_corpo",
        "cobertura",
        "fachada",
        "porta",
        "janela",
        "fechamento",
        "manutencao",
        "projeto_personalizado"
    ],

    iniciar(callbacks = {}) {
        this.callbacks = callbacks;
        this.mapearElementos();
        this.vincularEventos();
        this.renderizarCategorias();
        this.renderizarDetalhe(null);
    },

    mapearElementos() {
        this.elementos = {
            busca: document.getElementById("buscaServico"),
            btnNovo: document.getElementById("btnNovoServico"),
            aviso: document.getElementById("servicosAviso"),
            resumo: document.getElementById("servicosResumo"),
            categorias: document.getElementById("servicosCategorias"),
            lista: document.getElementById("servicosLista"),
            detalheResumo: document.getElementById("servicoDetalheResumo"),
            detalheConteudo: document.getElementById("servicoDetalheConteudo"),
            produtosSugeridos: document.getElementById("servicoProdutosSugeridos"),
            ferragensSugeridas: document.getElementById("servicoFerragensSugeridas"),
            camposObrigatorios: document.getElementById("servicoCamposObrigatorios"),
            fluxoOrcamento: document.getElementById("servicoFluxoOrcamento")
        };
    },

    vincularEventos() {
        const { busca, btnNovo, lista } = this.elementos;

        if (busca) {
            busca.addEventListener("input", () => {
                if (typeof this.callbacks.aoBuscar === "function") {
                    this.callbacks.aoBuscar(busca.value);
                }
            });
        }

        if (btnNovo) {
            btnNovo.addEventListener("click", () => {
                this.mostrarAviso("Cadastro de novo servi\u00e7o preparado para etapa futura.", "info");
                if (typeof this.callbacks.aoNovoServico === "function") {
                    this.callbacks.aoNovoServico();
                }
            });
        }

        if (lista) {
            lista.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-servico-acao]");
                if (!botao) return;

                const acao = botao.dataset.servicoAcao;
                const id = botao.dataset.servicoId;

                if (acao === "visualizar" && typeof this.callbacks.aoVisualizarServico === "function") {
                    this.callbacks.aoVisualizarServico(id);
                    return;
                }

                this.mostrarAviso(this.mensagemPlaceholder(acao), "info");
            });
        }
    },

    renderizarCategorias() {
        const container = this.elementos.categorias;
        if (!container) return;

        container.innerHTML = this.obterCategorias().map(categoria => `
            <article class="servico-categoria-card">
                <span>${this.escapar(this.rotuloCategoria(categoria))}</span>
            </article>
        `).join("");
    },

    renderizarLista(servicos = []) {
        const lista = this.elementos.lista;
        if (!lista) return;

        this.atualizarResumo(servicos.length);

        if (!servicos.length) {
            lista.innerHTML = `<p class="servicos-estado-vazio">Nenhum servi\u00e7o cadastrado.</p>`;
            return;
        }

        lista.innerHTML = servicos.map(servico => this.criarCardServico(servico)).join("");
    },

    criarCardServico(servico = {}) {
        return `
            <article class="servico-card">
                <div class="servico-card-topo">
                    <div>
                        <h3>${this.escapar(servico.nome || "Servi\u00e7o sem nome")}</h3>
                        <span>${this.escapar(this.rotuloCategoria(servico.categoria))}</span>
                    </div>
                    <span class="servico-status ${this.classeStatus(servico.ativo)}">${this.escapar(this.rotuloStatus(servico.ativo))}</span>
                </div>

                <p class="servico-descricao">${this.escapar(this.resumirDescricao(servico.descricao))}</p>

                <dl class="servico-meta-grid">
                    <div>
                        <dt>Categoria</dt>
                        <dd>${this.escapar(this.rotuloCategoria(servico.categoria))}</dd>
                    </div>
                    <div>
                        <dt>Tipo de c&aacute;lculo</dt>
                        <dd>${this.escapar(this.rotuloTipoCalculo(servico.tipoCalculo))}</dd>
                    </div>
                    <div>
                        <dt>Tempo estimado</dt>
                        <dd>${this.escapar(servico.tempoEstimado || "N\u00e3o informado")}</dd>
                    </div>
                    <div>
                        <dt>Status</dt>
                        <dd>${this.escapar(this.rotuloStatus(servico.ativo))}</dd>
                    </div>
                </dl>

                <div class="servico-acoes">
                    <button type="button" class="btn-pequeno" data-servico-acao="visualizar" data-servico-id="${this.escaparAtributo(servico.id)}">Visualizar</button>
                    <button type="button" class="btn-pequeno botao-claro" data-servico-acao="editar" data-servico-id="${this.escaparAtributo(servico.id)}">Editar</button>
                    <button type="button" class="btn-pequeno botao-claro" data-servico-acao="orcamento" data-servico-id="${this.escaparAtributo(servico.id)}">Iniciar or&ccedil;amento</button>
                </div>
            </article>
        `;
    },

    renderizarDetalhe(servico) {
        const { detalheResumo, detalheConteudo } = this.elementos;

        if (!servico) {
            if (detalheResumo) {
                detalheResumo.textContent = "Selecione um servi\u00e7o para visualizar.";
            }

            if (detalheConteudo) {
                detalheConteudo.innerHTML = `
                    <p class="servico-placeholder">Nenhum servi\u00e7o selecionado.</p>
                `;
            }

            this.renderizarPreparacao(null);
            return;
        }

        if (detalheResumo) {
            detalheResumo.textContent = `${servico.nome || "Servi\u00e7o"} pronto para consulta comercial.`;
        }

        if (detalheConteudo) {
            detalheConteudo.innerHTML = `
                <dl class="servico-detalhe-lista">
                    <div>
                        <dt>Nome</dt>
                        <dd>${this.escapar(servico.nome || "N\u00e3o informado")}</dd>
                    </div>
                    <div>
                        <dt>Categoria</dt>
                        <dd>${this.escapar(this.rotuloCategoria(servico.categoria))}</dd>
                    </div>
                    <div>
                        <dt>Tipo de c&aacute;lculo</dt>
                        <dd>${this.escapar(this.rotuloTipoCalculo(servico.tipoCalculo))}</dd>
                    </div>
                    <div>
                        <dt>Tempo estimado</dt>
                        <dd>${this.escapar(servico.tempoEstimado || "N\u00e3o informado")}</dd>
                    </div>
                    <div>
                        <dt>Status</dt>
                        <dd>${this.escapar(this.rotuloStatus(servico.ativo))}</dd>
                    </div>
                    <div>
                        <dt>Descri&ccedil;&atilde;o resumida</dt>
                        <dd>${this.escapar(this.resumirDescricao(servico.descricao))}</dd>
                    </div>
                </dl>
            `;
        }

        this.renderizarPreparacao(servico);
    },

    renderizarPreparacao(servico) {
        this.renderizarListaPreparada(
            this.elementos.produtosSugeridos,
            servico?.produtosSugeridos,
            "Produtos sugeridos"
        );
        this.renderizarListaPreparada(
            this.elementos.ferragensSugeridas,
            servico?.ferragensSugeridas,
            "Ferragens sugeridas"
        );
        this.renderizarListaPreparada(
            this.elementos.camposObrigatorios,
            servico?.camposObrigatorios,
            "Campos obrigat\u00f3rios"
        );

        if (this.elementos.fluxoOrcamento) {
            this.elementos.fluxoOrcamento.innerHTML = `<p>Fluxo do or\u00e7amento preparado para integra\u00e7\u00e3o futura.</p>`;
        }
    },

    renderizarListaPreparada(container, itens, rotulo) {
        if (!container) return;

        const lista = Array.isArray(itens) ? itens.filter(Boolean) : [];

        if (!lista.length) {
            container.innerHTML = `<p>${this.escapar(rotulo)} preparados para etapa futura.</p>`;
            return;
        }

        container.innerHTML = `
            <ul>
                ${lista.map(item => `<li>${this.escapar(item)}</li>`).join("")}
            </ul>
        `;
    },

    atualizarResumo(total) {
        if (!this.elementos.resumo) return;

        this.elementos.resumo.textContent = total === 1
            ? "1 servi\u00e7o cadastrado"
            : `${total} servi\u00e7os cadastrados`;
    },

    mostrarAviso(mensagem = "", tipo = "info") {
        const aviso = this.elementos.aviso;
        if (!aviso) return;

        aviso.textContent = mensagem;
        aviso.className = mensagem ? `servicos-aviso visivel ${tipo}` : "servicos-aviso";
    },

    definirCarregando(carregando) {
        const lista = this.elementos.lista;
        if (!lista) return;

        lista.setAttribute("aria-busy", carregando ? "true" : "false");
    },

    mensagemPlaceholder(acao) {
        const mensagens = {
            editar: "Edi\u00e7\u00e3o de servi\u00e7o preparada para etapa futura.",
            orcamento: "Iniciar or\u00e7amento preparado como placeholder."
        };

        return mensagens[acao] || "A\u00e7\u00e3o preparada para etapa futura.";
    },

    resumirDescricao(descricao) {
        const texto = String(descricao || "").trim();
        if (!texto) return "Descri\u00e7\u00e3o n\u00e3o informada.";

        return texto.length > 140 ? `${texto.slice(0, 137)}...` : texto;
    },

    rotuloCategoria(categoria) {
        if (typeof ServicoModel !== "undefined" && typeof ServicoModel.rotuloCategoria === "function") {
            return this.rotuloVisual(ServicoModel.rotuloCategoria(categoria));
        }

        return this.rotuloVisual(categoria || "N\u00e3o informado");
    },

    rotuloTipoCalculo(tipoCalculo) {
        if (typeof ServicoModel !== "undefined" && typeof ServicoModel.rotuloTipoCalculo === "function") {
            return this.rotuloVisual(ServicoModel.rotuloTipoCalculo(tipoCalculo));
        }

        return this.rotuloVisual(tipoCalculo || "N\u00e3o informado");
    },

    obterCategorias() {
        if (typeof ServicoModel !== "undefined" && ServicoModel.categorias) {
            const categoriasDominio = Object.keys(ServicoModel.categorias);
            const categoriasOrdenadas = this.categorias.filter(categoria => categoriasDominio.includes(categoria));
            const categoriasRestantes = categoriasDominio.filter(categoria => !categoriasOrdenadas.includes(categoria));
            return [...categoriasOrdenadas, ...categoriasRestantes];
        }

        return this.categorias;
    },

    rotuloVisual(rotulo) {
        const rotulos = {
            "Manutencao": "Manuten\u00e7\u00e3o",
            "Area (m2)": "\u00c1rea (m\u00b2)"
        };

        return rotulos[rotulo] || rotulo;
    },

    rotuloStatus(ativo) {
        return ativo === false ? "Inativo" : "Ativo";
    },

    classeStatus(ativo) {
        return ativo === false ? "inativo" : "ativo";
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
