const OrcamentoInteligenteController = {
    contexto: null,
    etapaAtual: "cliente",
    etapas: ["cliente", "projeto", "produtos", "revisao", "calculo", "resumo"],
    timerAtualizacao: null,
    timerPersistenciaRascunho: null,
    chaveRascunho: "rk_orcamento_inteligente_em_andamento_v1",
    formularioNovoItemPendente: null,
    scrollRaf: null,
    rolagemProgramatica: false,
    timerRolagemProgramatica: null,
    timerEncaixeScroll: null,
    ultimoScrollY: 0,
    direcaoRolagem: 1,
    etapaEmPreparacao: "",
    dados: {
        clientes: [],
        projetos: [],
        servicos: [],
        produtos: [],
        itens: [],
        tamanhos: [],
        dependencias: []
    },
    errosCatalogoItens: [],

    async iniciarTela() {
        document.documentElement.classList.add("orcamento-inteligente-html");
        this.configurarClienteService();
        this.configurarCatalogosService();
        OrcamentoInteligenteUI.iniciar();
        this.vincularEventos();
        await this.novoOrcamento({ restaurar: true });
    },

    configurarClienteService() {
        if (
            typeof ClienteRepository !== "undefined" &&
            typeof ClienteService !== "undefined" &&
            typeof ClienteService.configurar === "function"
        ) {
            ClienteService.configurar(ClienteRepository);
        }

        return true;
    },

    configurarCatalogosService() {
        const criarAdapter = () => {
            if (typeof criarFirestoreAdapter === "function") return criarFirestoreAdapter();
            if (typeof FirestoreAdapter !== "undefined") return FirestoreAdapter;
            return null;
        };

        if (typeof ServicoRepository !== "undefined" && !ServicoRepository.adapter) {
            const adapter = criarAdapter();
            if (adapter) {
                ServicoRepository.configurar(adapter);
            }
        }

        if (
            typeof ServicoRepository !== "undefined" &&
            typeof ServicoService !== "undefined" &&
            typeof ServicoService.configurar === "function"
        ) {
            ServicoService.configurar(ServicoRepository);
        }

        if (
            typeof ProdutoRepository !== "undefined" &&
            typeof ProdutoService !== "undefined" &&
            typeof ProdutoService.configurar === "function"
        ) {
            ProdutoService.configurar(ProdutoRepository);
        }

        return true;
    },

    vincularEventos() {
        const btnNovo = OrcamentoInteligenteUI.elementos.btnNovo;
        if (btnNovo) {
            btnNovo.addEventListener("click", () => this.novoOrcamento({ limparRascunho: true }));
        }

        const modulo = OrcamentoInteligenteUI.elementos.modulo || document;
        document.addEventListener("click", evento => this.processarCliqueGlobal(evento), true);
        document.addEventListener("keydown", evento => {
            if (evento.key === "Escape") {
                OrcamentoInteligenteUI.fecharMenusConfiguracoes();
            }
        });
        modulo.addEventListener("submit", evento => this.processarFormulario(evento));
        modulo.addEventListener("pointerdown", evento => this.processarToqueCampoNumerico(evento));
        modulo.addEventListener("click", evento => this.processarAcao(evento));
        modulo.addEventListener("focusin", evento => this.processarFocoCampo(evento));
        modulo.addEventListener("input", evento => this.processarAlteracaoTempoReal(evento));
        modulo.addEventListener("change", evento => this.processarAlteracaoTempoReal(evento));

        window.addEventListener("resize", () => {
            OrcamentoInteligenteUI.exibirSecaoAtual(this.etapaAtual);
            this.atualizarLimiteTimelineMobile();
        }, { passive: true });

        window.addEventListener("scroll", () => this.atualizarLimiteTimelineMobile(), { passive: true });
        window.addEventListener("beforeunload", () => this.persistirRascunho());
    },

    async novoOrcamento(opcoes = {}) {
        if (opcoes.limparRascunho) {
            this.limparRascunho();
        }

        const resultado = await this.criarContexto();
        this.contexto = resultado.contexto;
        this.etapaAtual = "cliente";
        const restaurado = opcoes.restaurar ? this.restaurarRascunho() : false;

        // Monta a interface imediatamente. O carregamento dos catalogos nao deve
        // bloquear o estilo nem os formularios quando o Firestore estiver indisponivel.
        this.renderizarEtapaAtual();
        this.atualizarResumo();
        OrcamentoInteligenteUI.definirCarregamento(true, "Carregando dados...");

        try {
            await this.carregarDadosComTempoLimite();
        } catch (erro) {
            console.warn("Nao foi possivel carregar os dados remotos do orcamento.", erro);
            this.errosCatalogoItens.push("Dados remotos indisponiveis. Use o preenchimento manual.");
        } finally {
            OrcamentoInteligenteUI.definirCarregamento(false);
        }
        if (!restaurado && !opcoes.limparRascunho) {
            this.aplicarRascunhoInicial();
        }
        this.renderizarEtapaAtual();
        this.restaurarFormularioNovoItem();
        this.atualizarResumo();
        this.sincronizarFluxo();
        this.atualizarLimiteTimelineMobile();

        if (!resultado.sucesso) {
            OrcamentoInteligenteUI.mostrarAviso(resultado.erros.join(" "), "erro");
        } else if (this.errosCatalogoItens.length) {
            this.mostrarAviso("Nao foi possivel carregar todos os itens prontos. Voce ainda pode preencher o item manualmente.", "erro");
        }
    },

    async processarFormulario(evento) {
        const form = evento.target.closest("[data-orcamento-form]");
        if (!form) return;

        evento.preventDefault();
        const tipo = form.dataset.orcamentoForm;
        const dados = new FormData(form);

        if (tipo === "cliente") {
            await this.selecionarCliente(dados.get("clienteId"));
            return;
        }

        if (tipo === "cliente-novo") {
            await this.criarClienteRapido(this.extrairNovoCliente(dados));
            return;
        }

        if (tipo === "projeto") {
            await this.salvarDescricaoProjeto(dados.get("projetoDescricao"), { proximaEtapa: "produtos" });
            return;
        }

        if (tipo === "produto") {
            await this.processarAdicionarItem(form);
            return;
        }

        if (tipo === "calculo") {
            await this.atualizarItensDaTela({ renderizar: true });
            return;
        }

        if (tipo === "complementos") {
            await this.atualizarComplementos(this.extrairComplementos(dados));
        }
    },

    async processarAcao(evento) {
        this.limparCampoNumericoSeZerado(evento.target);
        const botao = evento.target.closest("[data-orcamento-action]");
        if (!botao) return;

        const acao = botao.dataset.orcamentoAction;

        if (acao === "avancar") {
            this.avancarEtapa();
            return;
        }

        if (acao === "voltar") {
            this.voltarEtapa();
            return;
        }

        if (acao === "ir-etapa") {
            this.irParaEtapa(botao.dataset.orcamentoEtapa);
            return;
        }

        if (acao === "novo-orcamento") {
            await this.novoOrcamento({ limparRascunho: true });
            return;
        }

        if (acao === "adicionar-item") {
            evento.preventDefault();
            await this.processarAdicionarItem(botao);
            return;
        }

        if (acao === "remover-produto") {
            await this.removerProduto(Number(botao.dataset.indice));
            return;
        }

        if (acao === "validar-orcamento") {
            await this.validarOrcamento();
            return;
        }

        if (acao === "gerar-documento") {
            await this.gerarDocumentoComercial();
            return;
        }

        if (acao === "finalizar-orcamento") {
            await this.finalizarOrcamento();
        }
    },

    processarCliqueGlobal(evento) {
        const gatilhoConfiguracoes = evento.target?.closest?.("[data-orcamento-configuracoes-gatilho]");
        if (gatilhoConfiguracoes) {
            evento.preventDefault();
            OrcamentoInteligenteUI.alternarMenuConfiguracoes(gatilhoConfiguracoes);
            return;
        }

        const configuracoes = evento.target?.closest?.(".orcamento-inteligente-configuracoes");
        const limparOrcamento = evento.target?.closest?.("[data-orcamento-action='novo-orcamento']");
        if (limparOrcamento) {
            OrcamentoInteligenteUI.fecharMenusConfiguracoes();
            if (!limparOrcamento.closest(".orcamento-inteligente-modulo")) {
                evento.preventDefault();
                evento.stopPropagation();
                void this.novoOrcamento({ limparRascunho: true });
            }
            return;
        }

        if (!configuracoes) {
            OrcamentoInteligenteUI.fecharMenusConfiguracoes();
        }

        const botao = evento.target?.closest?.("[data-orcamento-action='adicionar-item']");
        if (!botao || !botao.closest(".orcamento-inteligente-modulo")) {
            return;
        }

        evento.preventDefault();
        evento.stopPropagation();
        void this.processarAdicionarItem(botao).catch(erro => {
            console.error("Nao foi possivel adicionar o item ao orcamento.", erro);
            this.mostrarAviso("Nao foi possivel adicionar o item. Revise os campos e tente novamente.", "erro");
        });
    },

    async processarAdicionarItem(botao) {
        const form = botao?.matches?.("[data-orcamento-form='produto']")
            ? botao
            : botao?.closest?.("[data-orcamento-form='produto']");

        if (!form) {
            this.mostrarAviso("Formulario de item nao encontrado.", "erro");
            return;
        }

        const dadosItem = this.extrairDadosItem(new FormData(form));
        const erro = this.validarDadosItemParaAdicionar(dadosItem);

        if (erro) {
            this.mostrarAviso(erro, "erro");
            return;
        }

        await this.adicionarItemProjeto(dadosItem);
    },

    validarDadosItemParaAdicionar(dadosItem = {}) {
        if (dadosItem.itemProntoId && this.obterTamanhosItemPronto(dadosItem.itemProntoId).length && !dadosItem.tamanhoPadraoSelecionado) {
            return "Campo obrigatorio: selecione a descricao do tamanho do item.";
        }

        if (!String(dadosItem.descricao || "").trim()) {
            return "Campo obrigatorio: informe a descricao do item.";
        }

        if (Number(dadosItem.alturaCm || 0) <= 0 || Number(dadosItem.larguraCm || 0) <= 0) {
            return "Campo obrigatorio: informe altura e largura do item.";
        }

        if (Number(dadosItem.quantidade || 0) <= 0) {
            return "Campo obrigatorio: informe a quantidade do item.";
        }

        if (Number(dadosItem.valorUnitario || 0) <= 0) {
            return "Campo obrigatorio: informe o valor unitario do item.";
        }

        if (Number(dadosItem.valorAdicional || 0) > 0 && !String(dadosItem.descricaoAdicional || "").trim()) {
            return "Campo obrigatorio: informe a descricao do adicional.";
        }

        return "";
    },

    processarFocoCampo(evento) {
        this.limparCampoNumericoSeZerado(evento.target);
    },

    processarToqueCampoNumerico(evento) {
        this.limparCampoNumericoSeZerado(evento.target);
    },

    limparCampoNumericoSeZerado(campo) {
        if (!campo?.matches?.("input[type='number']") || campo.readOnly || campo.disabled) {
            return false;
        }

        if (this.ehValorNumericoZerado(campo.value)) {
            campo.value = "";
            return true;
        }

        return false;
    },

    ehValorNumericoZerado(valor) {
        const texto = String(valor ?? "").trim();
        if (!texto) return false;

        const numero = Number(texto.replace(",", "."));
        return Number.isFinite(numero) && numero === 0;
    },

    atualizarObrigatoriedadeAdicional(container) {
        const valor = container?.querySelector?.("[name='valorAdicional']");
        const descricao = container?.querySelector?.("[name='descricaoAdicional']");
        if (!valor || !descricao) return;

        const obrigatoria = this.numero(valor.value, 0) > 0;
        descricao.required = obrigatoria;
        descricao.setAttribute("aria-required", obrigatoria ? "true" : "false");
    },

    processarAlteracaoTempoReal(evento) {
        const alvo = evento.target;
        if (!alvo || !alvo.closest) return;

        if (alvo.closest("[data-orcamento-form]")) {
            this.agendarPersistenciaRascunho();
        }

        const alteraItens = alvo.closest("[data-orcamento-itens]");
        const alteraComplementos = alvo.closest("[data-orcamento-form='complementos']");

        if (alvo.matches("#orcamentoProdutoSelect")) {
            this.preencherItemPorProduto(alvo);
        }

        if (evento.type === "change" && alvo.matches("#orcamentoClienteSelect")) {
            void this.selecionarCliente(alvo.value);
            return;
        }

        if (evento.type === "change" && alvo.matches("[data-orcamento-form='projeto'] [name='projetoDescricao']")) {
            void this.salvarDescricaoProjeto(alvo.value, { renderizar: false, silencioso: true });
            return;
        }

        if (evento.type === "change" && alvo.matches("[name='itemProntoId']")) {
            this.preencherItemPronto(alvo);
        }

        if (alvo.closest("[data-orcamento-form='produto']")) {
            this.atualizarFormularioItem(alvo.closest("[data-orcamento-form='produto']"));
        }

        const containerAdicional = alvo.closest("[data-orcamento-form='produto'], [data-orcamento-item]");
        if (containerAdicional && (alvo.matches("[name='valorAdicional']") || alvo.matches("[name='descricaoAdicional']"))) {
            this.atualizarObrigatoriedadeAdicional(containerAdicional);
        }

        if (alvo.closest("[data-orcamento-item]") && (
            alvo.matches("[name='itemProntoId']")
            || alvo.matches("[name='tipoItem']")
            || alvo.matches("[name='tipoDimensao']")
            || alvo.matches("[name='tamanhoPadraoSelecionado']")
        )) {
            this.atualizarFormularioItem(alvo.closest("[data-orcamento-item]"));
        }

        if (!alteraItens && !alteraComplementos) {
            return;
        }

        window.clearTimeout(this.timerAtualizacao);
        this.timerAtualizacao = window.setTimeout(async () => {
            if (alteraItens) {
                await this.atualizarItensDaTela({ renderizar: false, silencioso: true });
            }

            if (alteraComplementos) {
                await this.atualizarComplementos(this.coletarComplementosDaTela(), {
                    renderizar: false,
                    silencioso: true
                });
            }
        }, 160);
    },

    async selecionarCliente(clienteId) {
        const cliente = this.obterClientePorId(clienteId);
        if (!cliente) {
            this.mostrarAviso("Cliente nao selecionado.", "erro");
            return;
        }

        if (this.mesmaEntidade(this.contexto?.cliente, cliente)) {
            this.mostrarAviso("Cliente ja estava selecionado.", "info");
            this.renderizarEtapaAtual();
            this.atualizarResumo();
            return;
        }

        const resultado = await OrcamentoOrchestrator.selecionarCliente(this.contexto, cliente);
        if (!resultado.sucesso) {
            this.aplicarResultado(resultado, "projeto");
            return;
        }

        this.aplicarResultado(resultado, "projeto");
    },

    async criarClienteRapido(dadosCliente = {}) {
        if (!dadosCliente.nome || !dadosCliente.telefonePrincipal) {
            this.mostrarAviso("Informe nome e telefone/WhatsApp do novo cliente.", "erro");
            return {
                sucesso: false,
                cliente: null,
                erros: ["Nome e telefone sao obrigatorios."]
            };
        }

        const novoCliente = this.prepararDadosNovoCliente(dadosCliente);
        const resultado = typeof CriarClienteUseCase !== "undefined" && typeof CriarClienteUseCase.executar === "function"
            ? await CriarClienteUseCase.executar(novoCliente)
            : await ClienteService.criarCliente(novoCliente);

        if (!resultado.sucesso) {
            this.mostrarAviso(resultado.erros.join(" "), "erro");
            return resultado;
        }

        const cliente = resultado.cliente;
        const jaExiste = this.dados.clientes.some(item => item.id === cliente.id);

        this.dados.clientes = jaExiste
            ? [cliente, ...this.dados.clientes.filter(item => item.id !== cliente.id)]
            : [cliente, ...this.dados.clientes];
        this.persistirClientesFluxo(cliente);

        await this.selecionarCliente(cliente.id);
        this.mostrarAviso("Novo cliente cadastrado e selecionado.", "info");

        return resultado;
    },

    preencherItemPorProduto(select) {
        const produto = this.obterProdutoPorId(select.value);
        const form = select.closest("[data-orcamento-form='produto']");

        if (!produto || !form) {
            return false;
        }

        const descricao = form.querySelector("[name='descricao']");
        const unidade = form.querySelector("[name='unidade']");
        const valorUnitario = form.querySelector("[name='valorUnitario']");

        if (descricao && !descricao.value) {
            descricao.value = produto.nome || produto.descricao || "";
        }

        if (unidade && produto.unidadeVenda) {
            unidade.value = this.normalizarUnidadeProduto(produto.unidadeVenda);
        }

        if (valorUnitario && !valorUnitario.value && produto.precoVenda) {
            valorUnitario.value = produto.precoVenda;
        }

        return true;
    },

    preencherItemPronto(select) {
        const container = select?.closest("[data-orcamento-form='produto'], [data-orcamento-item]");
        if (!container) return false;

        const itemPronto = this.obterItemProntoPorId(select.value);
        const tipoItemCampo = container.querySelector("[name='tipoItem']");
        const tipoItemNomeCampo = container.querySelector("[name='tipoItemNome']");
        const subtipoCampo = container.querySelector("[name='subtipoItem']");
        const grupoNomeCampo = container.querySelector("[name='grupoServicoNome']");
        const descricaoCampo = container.querySelector("[name='descricao']");
        const alturaCampo = container.querySelector("[name='alturaCm']");
        const larguraCampo = container.querySelector("[name='larguraCm']");
        const tamanhoCampo = container.querySelector("[name='tamanhoPadraoSelecionado']");
        const tipoDimensaoCampo = container.querySelector("[name='tipoDimensao']");
        const dependenciasCampo = container.querySelector("[data-item-dependencias]");

        if (!itemPronto) {
            if (tipoItemCampo) tipoItemCampo.value = "item_manual";
            if (tipoItemNomeCampo) tipoItemNomeCampo.value = "";
            if (subtipoCampo) subtipoCampo.value = "";
            if (grupoNomeCampo) grupoNomeCampo.value = "Itens";
            if (tipoDimensaoCampo) tipoDimensaoCampo.value = "engenharia";
            if (descricaoCampo?.dataset.itemPronto === "true") {
                descricaoCampo.value = "";
                descricaoCampo.dataset.autogerada = "false";
                delete descricaoCampo.dataset.itemPronto;
            }
            this.atualizarCampoDescricaoTamanhoItem(container, "", "");
            if (tamanhoCampo) tamanhoCampo.value = "";
            if (dependenciasCampo) dependenciasCampo.textContent = "Dependencias a definir";
            return true;
        }

        const itemId = itemPronto.id || itemPronto.itemId || itemPronto.item_id || "";
        const categoria = itemPronto.categoriaDescricao || itemPronto.categoria_descricao || "";
        const descricao = itemPronto.descricao || itemPronto.nome || "";
        const tamanho = this.atualizarCampoDescricaoTamanhoItem(container, itemId, tamanhoCampo?.value) || this.obterTamanhosItemPronto(itemId)[0] || null;
        const dependencias = this.obterDependenciasItemPronto(itemId);

        if (tipoItemCampo) tipoItemCampo.value = `item_${itemId}`;
        if (tipoItemNomeCampo) tipoItemNomeCampo.value = descricao;
        if (subtipoCampo) subtipoCampo.value = categoria;
        if (grupoNomeCampo) grupoNomeCampo.value = categoria || "Itens";
        if (tipoDimensaoCampo) tipoDimensaoCampo.value = tamanho ? "padrao" : "engenharia";

        if (descricaoCampo) {
            descricaoCampo.value = this.rotuloTamanhoPadrao(tamanho) || descricao || descricaoCampo.value || "";
            descricaoCampo.dataset.autogerada = "true";
            descricaoCampo.dataset.itemPronto = "true";
        }

        if (tamanho) {
            if (tamanhoCampo) tamanhoCampo.value = tamanho.id || "";
            if (alturaCampo) alturaCampo.value = Number(tamanho.alturaCm || 0).toFixed(2);
            if (larguraCampo) larguraCampo.value = Number(tamanho.larguraCm || 0).toFixed(2);
        }

        if (dependenciasCampo) {
            dependenciasCampo.textContent = dependencias.length ? dependencias.join(", ") : "Dependencias a definir";
        }

        return true;
    },

    atualizarCampoDescricaoTamanhoItem(container, itemId = "", selecionadoId = "") {
        const campo = container?.querySelector("[data-tamanho-item-pronto-campo]");
        const select = container?.querySelector("[data-tamanho-item-pronto]");
        if (!campo || !select) return null;

        const tamanhos = itemId ? this.obterTamanhosItemPronto(itemId) : [];
        const selecionado = tamanhos.find(tamanho => String(tamanho.id || tamanho.tamanhoId || "") === String(selecionadoId || ""))
            || (tamanhos.length === 1 ? tamanhos[0] : null);

        campo.classList.toggle("orcamento-inteligente-campo-oculto", !itemId);
        select.disabled = !itemId;
        select.required = Boolean(itemId && tamanhos.length);
        select.innerHTML = [
            `<option value="">Selecione a descricao</option>`,
            ...tamanhos.map(tamanho => {
                const id = tamanho.id || tamanho.tamanhoId || "";
                const selected = selecionado && String(id) === String(selecionado.id || selecionado.tamanhoId || "") ? " selected" : "";
                return `<option value="${OrcamentoInteligenteUI.escapar(id)}"${selected}>${OrcamentoInteligenteUI.escapar(this.rotuloTamanhoPadrao(tamanho))}</option>`;
            })
        ].join("");

        if (selecionado) {
            select.value = selecionado.id || selecionado.tamanhoId || "";
        } else if (!itemId) {
            select.value = "";
        }

        return selecionado;
    },

    rotuloTamanhoPadrao(tamanho = {}) {
        if (!tamanho) return "";
        const nome = String(tamanho.nome || tamanho.descricao || "").trim();
        if (nome) return nome;

        const altura = this.numero(tamanho.alturaCm ?? tamanho.altura, 0);
        const largura = this.numero(tamanho.larguraCm ?? tamanho.largura, 0);
        return altura || largura ? `${altura} x ${largura} cm` : "";
    },

    async selecionarProjeto(projetoId) {
        if (!projetoId) {
            return this.salvarDescricaoProjeto("", { proximaEtapa: "produtos" });
        }

        const projeto = this.obterProjetoPorId(projetoId);
        if (!projeto) {
            this.mostrarAviso("Projeto nao selecionado.", "erro");
            return;
        }

        const resultado = await OrcamentoOrchestrator.selecionarProjeto(this.contexto, projeto);
        this.aplicarResultado(resultado, "produtos");
    },

    async salvarDescricaoProjeto(descricao = "", opcoes = {}) {
        const texto = String(descricao || "").trim();
        const projeto = texto ? {
            id: "",
            numero: "",
            nome: texto,
            titulo: texto,
            descricao: texto,
            status: "",
            endereco: "",
            manualOrcamento: true
        } : null;

        this.contexto = OrcamentoContext.atualizar(this.contexto || {}, {
            projeto,
            resumo: null,
            validacaoFinal: null,
            orcamentoPreparado: null
        });
        this.garantirServicoPadrao();

        if (opcoes.proximaEtapa && !this.estaEmMobile()) {
            this.etapaAtual = opcoes.proximaEtapa;
        }

        if (opcoes.renderizar === false) {
            OrcamentoInteligenteUI.atualizarEstadoEtapas(this.contextoComResumo(), this.etapaAtual);
            this.atualizarResumo();
        } else {
            this.renderizarEtapaAtual();
            this.atualizarResumo();
        }

        this.sincronizarFluxo();

        if (!opcoes.silencioso && texto) {
            this.mostrarAviso("Descricao do projeto salva.", "info");
        }

        return {
            sucesso: true,
            projeto,
            erros: []
        };
    },

    async selecionarServico(servicoId) {
        const servico = this.obterServicoPorId(servicoId);
        if (!servico) {
            this.mostrarAviso("Servico nao selecionado.", "erro");
            return;
        }

        const resultado = await OrcamentoOrchestrator.selecionarServico(this.contexto, servico);
        this.aplicarResultado(resultado, "");
    },

    async selecionarServicos(servicoIds = []) {
        const ids = Array.isArray(servicoIds) ? servicoIds.filter(Boolean) : [];

        if (!ids.length) {
            this.mostrarAviso("Selecione pelo menos um tipo de servico.", "erro");
            return;
        }

        const resultado = typeof OrcamentoOrchestrator.selecionarServicos === "function"
            ? await OrcamentoOrchestrator.selecionarServicos(this.contexto, ids)
            : await OrcamentoOrchestrator.selecionarServico(this.contexto, ids[0]);

        this.aplicarResultado(resultado, "");

        if (resultado.sucesso) {
            this.mostrarAviso("Tipo de servico selecionado. Avance pela timeline quando estiver pronto.", "info");
        }
    },

    async adicionarProduto(dadosItem = {}) {
        const produto = this.obterProdutoPorId(dadosItem.produtoId);
        if (!produto) {
            this.mostrarAviso("Produto nao selecionado.", "erro");
            return;
        }

        const resultado = await OrcamentoOrchestrator.adicionarProduto(this.contexto, {
            ...dadosItem,
            produto
        });
        this.aplicarResultado(resultado, "produtos");
    },

    async adicionarItemProjeto(dadosItem = {}) {
        this.garantirServicoPadrao();
        const produto = dadosItem.produtoId
            ? this.obterProdutoPorId(dadosItem.produtoId)
            : this.montarProdutoReferencial(dadosItem);

        if (!produto) {
            this.mostrarAviso("Tipo do item nao selecionado.", "erro");
            return;
        }

        const resultado = await OrcamentoOrchestrator.adicionarProduto(this.contexto, {
            ...dadosItem,
            produto
        });
        this.aplicarResultado(resultado, "produtos");
    },

    async removerProduto(indice) {
        const resultado = await OrcamentoOrchestrator.removerProduto(this.contexto, { indice });
        const possuiProdutos = Array.isArray(resultado.contexto?.produtos) && resultado.contexto.produtos.length > 0;
        this.aplicarResultado(resultado, possuiProdutos ? "revisao" : "produtos");
    },

    async calcularOrcamento(dadosCalculo = {}) {
        if (!this.contexto?.produtos?.length) {
            this.mostrarAviso("Sem produtos para calcular.", "erro");
            return;
        }

        this.garantirServicoPadrao();
        const resultado = typeof CalcularOrcamentoUseCase !== "undefined"
            ? await CalcularOrcamentoUseCase.executar(this.contexto, dadosCalculo)
            : await OrcamentoOrchestrator.calcular(this.contexto, dadosCalculo);

        this.aplicarResultado(resultado, "calculo");
    },

    async atualizarItensDaTela(opcoes = {}) {
        const itens = this.coletarItensDaTela();

        if (!itens.length) {
            return null;
        }

        this.garantirServicoPadrao();
        const resultado = await OrcamentoOrchestrator.atualizarItens(this.contexto || {}, { itens });
        this.contexto = resultado.contexto;

        if (opcoes.renderizar) {
            this.renderizarEtapaAtual();
        } else {
            OrcamentoInteligenteUI.atualizarIndicadoresItens(this.contextoComResumo());
        }

        this.atualizarResumo();
        this.sincronizarFluxo();

        if (!resultado.sucesso && !opcoes.silencioso) {
            this.mostrarAviso(resultado.erros.join(" "), "erro");
        }

        return resultado;
    },

    atualizarResumo() {
        OrcamentoInteligenteUI.renderizarResumo(this.contextoComResumo());
    },

    gerarResumo() {
        if (typeof OrcamentoOrchestrator !== "undefined" && typeof OrcamentoOrchestrator.montarResumo === "function") {
            return OrcamentoOrchestrator.montarResumo(this.contexto || {});
        }

        return (this.contexto || {}).resumo || null;
    },

    async validarOrcamento(opcoes = {}) {
        this.garantirServicoPadrao();
        const resultado = await OrcamentoOrchestrator.validar(this.contexto || {});
        this.contexto = resultado.contexto;
        if (opcoes.renderizar !== false) {
            this.renderizarEtapaAtual();
        }
        this.atualizarResumo();

        if (!resultado.sucesso && !opcoes.silencioso) {
            this.mostrarAviso(resultado.erros.join(" "), "erro");
        } else if (resultado.sucesso && !opcoes.silencioso) {
            this.mostrarAviso("Orcamento validado para finalizacao.", "info");
            this.sincronizarFluxo();
        } else if (resultado.sucesso) {
            this.sincronizarFluxo();
        }

        return resultado;
    },

    async finalizarOrcamento() {
        await this.atualizarItensDaTela({ renderizar: false, silencioso: true });
        await this.atualizarComplementos(this.coletarComplementosDaTela(), { silencioso: true });
        if (this.contexto?.projeto && this.contexto.projeto.manualOrcamento !== true) {
            this.contexto = OrcamentoContext.atualizar(this.contexto, {
                projeto: null,
                resumo: null,
                orcamentoPreparado: null
            });
        }
        try {
            await this.garantirNumeroOrcamento();
        } catch (erro) {
            const mensagem = erro?.message || "Nao foi possivel reservar o numero do orcamento.";
            this.mostrarAviso(mensagem, "erro");
            return { sucesso: false, erros: [mensagem] };
        }

        const validacao = await this.validarOrcamento();
        if (!validacao.sucesso) {
            return validacao;
        }

        const resultado = await OrcamentoOrchestrator.finalizar(this.contexto || {});
        this.contexto = resultado.contexto;
        this.etapaAtual = "resumo";
        this.renderizarEtapaAtual();
        this.atualizarResumo();

        if (!resultado.sucesso) {
            this.mostrarAviso(resultado.erros.join(" "), "erro");
        } else {
            this.mostrarAviso("Orcamento finalizado e preparado para PDF comercial.", "info");
            this.sincronizarFluxo();
            const documento = await this.gerarDocumentoComercial({ finalizarSeNecessario: false, silencioso: true });
            if (documento?.sucesso) {
                this.irParaCompartilhamento(documento.documento, documento.persistencia?.registro);
            }
        }

        return resultado;
    },

    async gerarDocumentoComercial(opcoes = {}) {
        await this.atualizarItensDaTela({ renderizar: false, silencioso: true });
        await this.atualizarComplementos(this.coletarComplementosDaTela(), { silencioso: true });

        if (!this.contexto?.orcamentoPreparado && opcoes.finalizarSeNecessario !== false) {
            const finalizacao = await this.finalizarOrcamento();
            if (!finalizacao?.sucesso) {
                return finalizacao;
            }
        }

        if (typeof DocumentService === "undefined" || typeof DocumentService.prepararExportacao !== "function") {
            this.mostrarAviso("DocumentService indisponivel para gerar Documento Comercial.", "erro");
            return {
                sucesso: false,
                documento: null,
                erros: ["DocumentService indisponivel."]
            };
        }

        let numero = "";
        try {
            numero = await this.garantirNumeroOrcamento();
        } catch (erro) {
            const mensagem = erro?.message || "Nao foi possivel reservar o numero do orcamento.";
            this.mostrarAviso(mensagem, "erro");
            return { sucesso: false, documento: null, erros: [mensagem] };
        }
        this.sincronizarNumeroPreparado(numero);

        const resultado = DocumentService.prepararExportacao(this.contexto);

        if (!resultado.sucesso) {
            this.mostrarAviso(resultado.erros.join(" "), "erro");
            return resultado;
        }

        const appState = this.obterAppStateService();

        if (appState && typeof appState.setState === "function") {
            appState.setState("orcamentoAtual", this.contexto);
            appState.setState("documentoAtual", resultado.documento);
        }

        if (typeof RKDraftState !== "undefined" && typeof RKDraftState.salvarFluxo === "function") {
            RKDraftState.salvarFluxo({
                orcamentoAtual: this.contexto,
                documentoAtual: resultado.documento
            });
        }

        const persistencia = await this.persistirDocumentoGerado(resultado.documento);
        if (!opcoes.silencioso) {
            this.mostrarAviso("Documento Comercial gerado e enviado para compartilhamento.", "info");
        }
        return {
            ...resultado,
            persistencia
        };
    },

    avancarEtapa() {
        const indice = this.etapas.indexOf(this.etapaAtual);
        const proxima = this.etapas[indice + 1];

        if (!proxima) return;

        const bloqueio = this.obterBloqueioEtapa(proxima);
        if (bloqueio) {
            this.mostrarAviso(bloqueio, "erro", { destaque: true });
            return;
        }

        this.etapaAtual = proxima;
        this.persistirRascunho();
        this.renderizarEtapaAtual();
        this.rolarParaEtapaAtual();
    },

    voltarEtapa() {
        const indice = this.etapas.indexOf(this.etapaAtual);
        const anterior = this.etapas[indice - 1];

        if (!anterior) return;

        this.etapaAtual = anterior;
        this.persistirRascunho();
        this.renderizarEtapaAtual();
        this.rolarParaEtapaAtual();
    },

    irParaEtapa(etapa) {
        if (!this.etapas.includes(etapa)) {
            return false;
        }

        const bloqueio = this.obterBloqueioAteEtapa(etapa);
        if (bloqueio.mensagem) {
            this.mostrarAviso(bloqueio.mensagem, "erro", { destaque: true });
            return false;
        }

        this.etapaAtual = etapa;
        this.persistirRascunho();
        this.renderizarEtapaAtual();
        this.rolarParaEtapaAtual();
        return true;
    },

    renderizarEtapaAtual() {
        OrcamentoInteligenteUI.renderizarEtapaAtual(
            this.contextoComResumo(),
            {
                clientes: this.obterClientesDisponiveis(),
                projetos: this.obterProjetosDisponiveis(),
                servicos: this.obterServicosDisponiveis(),
                produtos: this.obterProdutosDisponiveis(),
                itens: this.obterItensDisponiveis(),
                tamanhos: this.obterTamanhosPadraoDisponiveis(),
                dependencias: this.obterDependenciasDisponiveis()
            },
            this.etapaAtual
        );
        this.rolarParaEtapaAtual();
        this.prepararEtapaAoEntrar(this.etapaAtual);
    },

    atualizarEtapa(status) {
        if (this.contexto && status) {
            this.contexto = OrcamentoContext.atualizar(this.contexto, { status });
        }

        this.renderizarEtapaAtual();
    },

    aplicarResultado(resultado, proximaEtapa) {
        this.contexto = resultado.contexto;
        if (resultado.sucesso) {
            this.garantirServicoPadrao();
        }

        if (resultado.sucesso && proximaEtapa && !this.estaEmMobile()) {
            this.etapaAtual = proximaEtapa;
        }

        this.renderizarEtapaAtual();
        this.atualizarResumo();

        if (!resultado.sucesso) {
            this.mostrarAviso(resultado.erros.join(" "), "erro");
        } else {
            this.sincronizarFluxo();
            this.prepararEtapaAoEntrar(this.etapaAtual);
        }
    },

    processarScrollFluxo() {
        const scrollAtual = window.scrollY || 0;
        this.direcaoRolagem = scrollAtual >= this.ultimoScrollY ? 1 : -1;
        this.ultimoScrollY = scrollAtual;
        this.sincronizarEtapaPorScroll();
        this.agendarEncaixeScroll();
    },

    sincronizarEtapaPorScroll() {
        if (!this.estaEmMobile() || this.rolagemProgramatica || this.scrollRaf) {
            return;
        }

        this.scrollRaf = window.requestAnimationFrame(() => {
            this.scrollRaf = null;

            const etapaVisivel = this.obterEtapaVisivelPorScroll();
            if (!etapaVisivel || etapaVisivel === this.etapaAtual) {
                return;
            }

            const bloqueio = this.obterBloqueioAteEtapa(etapaVisivel);
            if (bloqueio.mensagem) {
                this.etapaAtual = bloqueio.etapaPermitida;
                OrcamentoInteligenteUI.atualizarEstadoEtapas(this.contextoComResumo(), this.etapaAtual);
                OrcamentoInteligenteUI.exibirSecaoAtual(this.etapaAtual);
                this.mostrarAviso(bloqueio.mensagem, "erro", { destaque: true });
                this.rolarParaEtapa(this.etapaAtual);
                return;
            }

            this.etapaAtual = etapaVisivel;
            OrcamentoInteligenteUI.atualizarEstadoEtapas(this.contextoComResumo(), this.etapaAtual);
            OrcamentoInteligenteUI.exibirSecaoAtual(this.etapaAtual);
            this.prepararEtapaAoEntrar(this.etapaAtual);
        });
    },

    obterEtapaVisivelPorScroll() {
        const secoes = this.obterSecoesFluxo();
        if (!secoes.length) return "";

        const alturaHeader = this.alturaHeaderMobile();
        const marcador = alturaHeader + ((window.innerHeight - alturaHeader) * 0.42);
        let melhor = null;
        let menorDistancia = Number.POSITIVE_INFINITY;

        secoes.forEach(secao => {
            const rect = secao.getBoundingClientRect();
            const visivel = rect.bottom > alturaHeader + 12 && rect.top < window.innerHeight - 12;

            if (!visivel) {
                return;
            }

            if (rect.top <= marcador && rect.bottom >= marcador) {
                melhor = secao;
                menorDistancia = 0;
                return;
            }

            const centro = rect.top + (rect.height / 2);
            const distancia = Math.abs(centro - marcador);
            if (distancia < menorDistancia) {
                melhor = secao;
                menorDistancia = distancia;
            }
        });

        return melhor?.dataset.orcamentoSecao || "";
    },

    obterSecoesFluxo() {
        return Array.from(document.querySelectorAll("[data-orcamento-secao]"))
            .filter(secao => this.etapas.includes(secao.dataset.orcamentoSecao));
    },

    obterBloqueioAteEtapa(etapa) {
        const indiceAlvo = this.etapas.indexOf(etapa);
        if (indiceAlvo <= 0) {
            return { mensagem: "", etapaPermitida: this.etapas[0] };
        }

        for (let indice = 1; indice <= indiceAlvo; indice += 1) {
            const etapaAtual = this.etapas[indice];
            const mensagem = this.obterBloqueioEtapa(etapaAtual);

            if (mensagem) {
                return {
                    mensagem,
                    etapaPermitida: this.etapas[indice - 1] || this.etapas[0]
                };
            }
        }

        return { mensagem: "", etapaPermitida: etapa };
    },

    agendarEncaixeScroll() {
        if (!this.estaEmMobile() || this.rolagemProgramatica) {
            return;
        }

        window.clearTimeout(this.timerEncaixeScroll);
        this.timerEncaixeScroll = window.setTimeout(() => this.encaixarEtapaPorScroll(), 130);
    },

    encaixarEtapaPorScroll() {
        if (!this.estaEmMobile() || this.rolagemProgramatica) {
            return;
        }

        const etapaVisivel = this.obterEtapaVisivelPorScroll();
        if (!etapaVisivel) return;

        const bloqueio = this.obterBloqueioAteEtapa(etapaVisivel);
        const etapaDestino = bloqueio.mensagem ? bloqueio.etapaPermitida : etapaVisivel;

        this.etapaAtual = etapaDestino;
        OrcamentoInteligenteUI.atualizarEstadoEtapas(this.contextoComResumo(), this.etapaAtual);
        OrcamentoInteligenteUI.exibirSecaoAtual(this.etapaAtual);
        this.rolarParaEtapa(this.etapaAtual);
        this.prepararEtapaAoEntrar(this.etapaAtual);

        if (bloqueio.mensagem) {
            this.mostrarAviso(bloqueio.mensagem, "erro", { destaque: true });
        }
    },

    rolarParaEtapaAtual() {
        this.rolarParaEtapa(this.etapaAtual);
    },

    rolarParaEtapa(etapa) {
        if (!this.estaEmMobile()) {
            return;
        }

        const secao = document.querySelector(`[data-orcamento-secao="${etapa}"]`);
        if (!secao) return;

        window.clearTimeout(this.timerRolagemProgramatica);
        this.rolagemProgramatica = true;
        const topo = window.scrollY + secao.getBoundingClientRect().top - this.alturaHeaderMobile();
        window.scrollTo({
            top: Math.max(0, topo),
            behavior: "smooth"
        });

        this.timerRolagemProgramatica = window.setTimeout(() => {
            this.rolagemProgramatica = false;
        }, 700);
    },

    async prepararEtapaAoEntrar(etapa) {
        if (!["calculo", "resumo"].includes(etapa) || this.etapaEmPreparacao === etapa) {
            return null;
        }

        this.etapaEmPreparacao = etapa;

        try {
            if (this.coletarItensDaTela().length) {
                await this.atualizarItensDaTela({ renderizar: false, silencioso: true });
            }

            if (etapa === "resumo") {
                await this.atualizarComplementos(this.coletarComplementosDaTela(), {
                    renderizar: false,
                    silencioso: true
                });

                if (this.contexto?.resultado?.sucesso) {
                    await this.validarOrcamento({ renderizar: false, silencioso: true });
                }
            }
        } finally {
            this.etapaEmPreparacao = "";
        }

        return this.contexto;
    },

    alturaHeaderMobile() {
        const header = document.querySelector("body.orcamento-inteligente-page > header");
        if (!header) return 82;

        return Math.max(58, Math.round(header.getBoundingClientRect().height));
    },

    estaEmMobile() {
        return typeof window !== "undefined"
            && typeof window.matchMedia === "function"
            && window.matchMedia("(max-width: 820px)").matches;
    },

    mostrarAviso(mensagem, tipo = "info", opcoes = {}) {
        OrcamentoInteligenteUI.mostrarAviso(mensagem, tipo, opcoes);
    },

    prepararDadosNovoCliente(dadosCliente = {}) {
        const agora = new Date().toISOString();
        const id = this.gerarIdNovoCliente();

        return {
            ...dadosCliente,
            id,
            status: "ativo",
            dataCadastro: agora,
            ultimaAtualizacao: agora,
            projetos: [],
            orcamentos: [],
            historico: [],
            timeline: []
        };
    },

    gerarIdNovoCliente() {
        if (typeof ClienteModel !== "undefined" && typeof ClienteModel.criarId === "function") {
            return ClienteModel.criarId("cli");
        }

        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return `cli_${crypto.randomUUID()}`;
        }

        return `cli_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    async garantirNumeroOrcamento() {
        const existente = this.normalizarNumeroOrcamento(
            this.contexto?.numero
            || this.contexto?.orcamentoNumero
            || this.contexto?.orcamentoPreparado?.numero
            || this.contexto?.orcamentoPreparado?.orcamentoNumero
        );

        if (existente) {
            return existente;
        }

        const numero = await this.gerarNumeroOrcamento();
        this.contexto = typeof OrcamentoContext !== "undefined" && typeof OrcamentoContext.atualizar === "function"
            ? OrcamentoContext.atualizar(this.contexto || {}, { numero })
            : {
                ...(this.contexto || {}),
                numero
            };

        return numero;
    },

    async gerarNumeroOrcamento() {
        const chave = typeof Config !== "undefined" ? Config.storage?.numeroOrcamento : "";
        const sequenciador = typeof RKFirestoreStore !== "undefined"
            ? RKFirestoreStore.reservarNumeroOrcamento
            : null;

        if (typeof sequenciador !== "function") {
            throw new Error("Contador central de orcamentos indisponivel. Verifique a conexao e tente novamente.");
        }

        try {
            const numero = await sequenciador.call(RKFirestoreStore);
            const sequencia = Number(String(numero).replace(/\D/g, ""));
            if (chave && Number.isSafeInteger(sequencia) && typeof Storage !== "undefined" && typeof Storage.salvar === "function") {
                Storage.salvar(chave, sequencia + 1);
            }
            return numero;
        } catch (erro) {
            console.error("Erro ao reservar numero central do orcamento:", erro);
            throw new Error("Nao foi possivel reservar o numero do orcamento no banco. Verifique a conexao e tente novamente.");
        }
    },

    sincronizarNumeroPreparado(numero = "") {
        const numeroNormalizado = this.normalizarNumeroOrcamento(numero);

        if (!numeroNormalizado || !this.contexto?.orcamentoPreparado) {
            return false;
        }

        this.contexto = OrcamentoContext.atualizar(this.contexto || {}, {
            numero: numeroNormalizado,
            orcamentoPreparado: {
                ...this.contexto.orcamentoPreparado,
                numero: numeroNormalizado,
                orcamentoNumero: numeroNormalizado
            }
        });

        return true;
    },

    async persistirDocumentoGerado(documento = null) {
        if (!documento || typeof DocumentPdfRepository === "undefined" || !DocumentPdfRepository) {
            return null;
        }

        const numero = this.normalizarNumeroOrcamento(
            this.contexto?.numero
            || documento?.dados?.metadados?.numeroOrcamento
            || documento?.metadados?.numeroOrcamento
        );

        try {
            return await DocumentPdfRepository.salvar(documento, {
                numero,
                origem: "ORCAMENTO_INTELIGENTE"
            });
        } catch (erro) {
            console.error("Erro ao salvar documento comercial gerado:", erro);
            return null;
        }
    },

    async atualizarComplementos(complementos = {}, opcoes = {}) {
        const resultado = await OrcamentoOrchestrator.atualizarComplementos(this.contexto || {}, complementos);
        this.contexto = resultado.contexto;

        if (opcoes.renderizar !== false && !opcoes.silencioso) {
            this.renderizarEtapaAtual();
            this.mostrarAviso("Complementos do orcamento atualizados.", "info");
        } else if (opcoes.renderizar === false) {
            OrcamentoInteligenteUI.atualizarTotais(this.contextoComResumo());
        }

        this.atualizarResumo();
        this.sincronizarFluxo();

        return resultado;
    },

    aplicarRascunhoInicial() {
        if (typeof RKDraftState === "undefined" || typeof RKDraftState.carregar !== "function") {
            return false;
        }

        const estado = RKDraftState.carregar();
        if (!estado || !this.contexto) {
            return false;
        }

        this.contexto = {
            ...this.contexto,
            cliente: estado.clienteSelecionado || this.contexto.cliente,
            projeto: estado.projetoSelecionado || estado.projetoAtual || this.contexto.projeto
        };

        return true;
    },

    sincronizarFluxo() {
        const contexto = this.contexto || {};
        const appState = this.obterAppStateService();

        if (appState && typeof appState.setState === "function") {
            if (contexto.cliente) appState.setState("clienteSelecionado", contexto.cliente);
            if (contexto.projeto) {
                appState.setState("projetoSelecionado", contexto.projeto);
                appState.setState("projetoAtual", contexto.projeto);
            }
            appState.setState("orcamentoAtual", contexto);
        }

        if (typeof RKDraftState !== "undefined" && typeof RKDraftState.salvarFluxo === "function") {
            RKDraftState.salvarFluxo({
                clienteSelecionado: contexto.cliente || null,
                projetoSelecionado: contexto.projeto || null,
                projetoAtual: contexto.projeto || null,
                orcamentoAtual: contexto
            });
        }

        this.persistirRascunho();

        return true;
    },

    agendarPersistenciaRascunho() {
        window.clearTimeout(this.timerPersistenciaRascunho);
        this.timerPersistenciaRascunho = window.setTimeout(() => this.persistirRascunho(), 120);
    },

    persistirRascunho() {
        if (!this.contexto || typeof localStorage === "undefined") return false;

        try {
            localStorage.setItem(this.chaveRascunho, JSON.stringify({
                contexto: this.contexto,
                etapaAtual: this.etapaAtual,
                formularioNovoItem: this.capturarFormularioNovoItem(),
                atualizadoEm: new Date().toISOString()
            }));
            return true;
        } catch (erro) {
            console.warn("Nao foi possivel salvar o rascunho do orcamento.", erro);
            return false;
        }
    },

    restaurarRascunho() {
        if (typeof localStorage === "undefined") return false;

        try {
            const salvo = JSON.parse(localStorage.getItem(this.chaveRascunho) || "null");
            if (!salvo?.contexto || typeof salvo.contexto !== "object") return false;

            this.contexto = typeof OrcamentoContext !== "undefined" && typeof OrcamentoContext.normalizar === "function"
                ? OrcamentoContext.normalizar(salvo.contexto)
                : salvo.contexto;
            this.etapaAtual = this.etapas.includes(salvo.etapaAtual) ? salvo.etapaAtual : "cliente";
            this.formularioNovoItemPendente = salvo.formularioNovoItem || null;
            return true;
        } catch (erro) {
            console.warn("Nao foi possivel restaurar o rascunho do orcamento.", erro);
            return false;
        }
    },

    limparRascunho() {
        window.clearTimeout(this.timerPersistenciaRascunho);
        this.formularioNovoItemPendente = null;
        try {
            localStorage.removeItem(this.chaveRascunho);
        } catch (erro) {
            console.warn("Nao foi possivel limpar o rascunho do orcamento.", erro);
        }
    },

    capturarFormularioNovoItem() {
        const form = document.querySelector("[data-orcamento-novo-item]");
        if (!form) return this.formularioNovoItemPendente;

        return Array.from(form.elements).reduce((campos, campo) => {
            if (!campo.name || campo.type === "button" || campo.type === "submit") return campos;
            campos[campo.name] = campo.type === "checkbox" ? campo.checked : campo.value;
            return campos;
        }, {});
    },

    restaurarFormularioNovoItem() {
        const valores = this.formularioNovoItemPendente;
        const form = document.querySelector("[data-orcamento-novo-item]");
        if (!form || !valores) return false;

        const aplicarValores = () => {
            Object.entries(valores).forEach(([nome, valor]) => {
                const campo = Array.from(form.elements).find(elemento => elemento.name === nome);
                if (!campo) return;
                if (campo.type === "checkbox") campo.checked = Boolean(valor);
                else campo.value = valor ?? "";
            });
        };

        aplicarValores();
        const itemPronto = form.querySelector("[name='itemProntoId']");
        if (itemPronto?.value) this.preencherItemPronto(itemPronto);
        aplicarValores();
        this.atualizarFormularioItem(form);
        this.atualizarObrigatoriedadeAdicional(form);
        this.formularioNovoItemPendente = null;
        return true;
    },

    atualizarLimiteTimelineMobile() {
        if (!this.estaEmMobile()) {
            document.body?.style.removeProperty("--orcamento-mobile-timeline-bottom");
            return;
        }

        const rodape = document.querySelector("body.orcamento-inteligente-page > footer");
        if (!rodape) return;
        const distanciaRodape = Math.max(0, window.innerHeight - rodape.getBoundingClientRect().top);
        const recuo = distanciaRodape > 0 ? distanciaRodape + 8 : 12;
        document.body.style.setProperty("--orcamento-mobile-timeline-bottom", `${recuo}px`);
    },

    contextoComResumo() {
        return {
            ...(this.contexto || {}),
            resumo: this.gerarResumo()
        };
    },

    async carregarDados() {
        this.errosCatalogoItens = [];
        const [clientes, projetos, servicos, produtos, itens, tamanhos, dependencias] = await Promise.all([
            this.listarClientes(),
            this.listarProjetos(),
            this.listarServicos(),
            this.listarProdutos(),
            this.listarItensFirestore(),
            this.listarTamanhosPadraoFirestore(),
            this.listarDependenciasFirestore()
        ]);

        this.dados = {
            clientes,
            projetos,
            servicos,
            produtos,
            itens,
            tamanhos,
            dependencias
        };
    },

    async carregarDadosComTempoLimite(limiteMs = 12000) {
        let timer = null;
        const limite = new Promise((_, rejeitar) => {
            timer = window.setTimeout(() => rejeitar(new Error("Tempo limite ao carregar dados.")), limiteMs);
        });

        try {
            return await Promise.race([this.carregarDados(), limite]);
        } finally {
            window.clearTimeout(timer);
        }
    },

    async listarClientes() {
        try {
            if (typeof ClienteService !== "undefined" && typeof ClienteService.listarClientes === "function") {
                const resultado = await ClienteService.listarClientes({ status: "ativo" });
                if (resultado.sucesso) return resultado.clientes || [];
                throw new Error(resultado.erros?.join(" ") || "Falha ao listar clientes.");
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Clientes para o fluxo guiado.", erro);
            this.errosCatalogoItens.push("Nao foi possivel carregar os clientes.");
        }
        return [];
    },

    async listarProjetos() {
        try {
            if (typeof ProjetoService !== "undefined" && typeof ProjetoService.listar === "function") {
                const projetos = await ProjetoService.listar();
                return Array.isArray(projetos) ? projetos : [];
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Projetos para o fluxo guiado.", erro);
            this.errosCatalogoItens.push("Nao foi possivel carregar os projetos.");
        }
        return [];
    },

    async listarServicos() {
        try {
            if (typeof ServicoService !== "undefined" && typeof ServicoService.listarServicos === "function") {
                const resultado = await ServicoService.listarServicos({ ativo: true });
                if (resultado.sucesso) return resultado.servicos || [];
                throw new Error(resultado.erros?.join(" ") || "Falha ao listar itens.");
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Servicos para o fluxo guiado.", erro);
            this.errosCatalogoItens.push("Nao foi possivel carregar os itens.");
        }
        return [];
    },

    async listarProdutos() {
        try {
            if (typeof ProdutoService !== "undefined" && typeof ProdutoService.listarProdutos === "function") {
                const resultado = await ProdutoService.listarProdutos({ ativo: true });
                if (resultado.sucesso) return resultado.produtos || [];
                throw new Error(resultado.erros?.join(" ") || "Falha ao listar produtos.");
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Produtos para o fluxo guiado.", erro);
            this.errosCatalogoItens.push("Nao foi possivel carregar os produtos.");
        }
        return [];
    },

    async listarItensFirestore() {
        const dados = await this.buscarListaFirestore("/itens?status=ativo", "itens", "Nao foi possivel carregar os itens prontos.");
        return dados.map(item => this.normalizarItemFirestore(item)).filter(item => item.id);
    },

    async listarTamanhosPadraoFirestore() {
        const dados = await this.buscarListaFirestore("/tamanhos-padrao?status=ativo", "tamanhos", "Nao foi possivel carregar os tamanhos padrao.");
        return dados.map(tamanho => this.normalizarTamanhoFirestore(tamanho)).filter(tamanho => tamanho.id && tamanho.itemId);
    },

    async listarDependenciasFirestore() {
        const dados = await this.buscarListaFirestore("/item-dependencias", "dependencias", "Nao foi possivel carregar as dependencias dos itens.");
        return dados.map(dependencia => this.normalizarDependenciaFirestore(dependencia)).filter(dependencia => dependencia.id && dependencia.itemId);
    },

    async buscarListaFirestore(caminho, chave, mensagemFalha) {
        try {
            const resposta = await RKFirestoreStore.fetch(caminho);
            const corpo = await resposta.json().catch(() => null);

            if (!resposta.ok || corpo?.ok === false) {
                throw new Error(corpo?.mensagem || mensagemFalha || "Falha ao consultar os dados.");
            }

            return this.normalizarListaFirestore(corpo, chave);
        } catch (erro) {
            console.warn(mensagemFalha, erro);
            this.errosCatalogoItens.push(mensagemFalha || "Nao foi possivel consultar os dados.");
            return [];
        } finally {}
    },

    normalizarListaFirestore(resposta, chave = "") {
        if (Array.isArray(resposta)) return resposta;
        if (Array.isArray(resposta?.dados)) return resposta.dados;
        if (chave && Array.isArray(resposta?.[chave])) return resposta[chave];
        if (Array.isArray(resposta?.itens)) return resposta.itens;
        if (Array.isArray(resposta?.produtos)) return resposta.produtos;
        if (Array.isArray(resposta?.tamanhos)) return resposta.tamanhos;
        if (Array.isArray(resposta?.dependencias)) return resposta.dependencias;
        return [];
    },

    normalizarItemFirestore(item = {}) {
        const id = String(item.item_id ?? item.itemId ?? item.id ?? "").trim();
        const categoriaDescricao = String(item.categoria_descricao ?? item.categoriaDescricao ?? item.categoria ?? "").trim();
        const descricao = String(item.descricao ?? item.nome ?? "").trim();

        return {
            ...item,
            id,
            itemId: id,
            item_id: id,
            categoriaItemId: String(item.categoria_item_id ?? item.categoriaItemId ?? "").trim(),
            categoriaDescricao,
            categoria_descricao: categoriaDescricao,
            nome: descricao,
            descricao,
            ativo: item.ativo !== 0 && item.ativo !== "0" && item.ativo !== false
        };
    },

    normalizarTamanhoFirestore(tamanho = {}) {
        const id = String(tamanho.tamanho_id ?? tamanho.tamanhoId ?? tamanho.id ?? "").trim();
        const itemId = String(tamanho.item_id ?? tamanho.itemId ?? "").trim();
        const alturaCm = this.numero(tamanho.alturaCm ?? tamanho.altura, 0);
        const larguraCm = this.numero(tamanho.larguraCm ?? tamanho.largura, 0);
        const nome = String(tamanho.descricao || tamanho.nome || `${alturaCm} x ${larguraCm} cm`).trim();

        return {
            ...tamanho,
            id,
            tamanhoId: id,
            tamanho_id: id,
            itemId,
            item_id: itemId,
            nome,
            descricao: nome,
            alturaCm,
            larguraCm,
            altura: alturaCm,
            largura: larguraCm,
            ativo: tamanho.ativo !== 0 && tamanho.ativo !== "0" && tamanho.ativo !== false
        };
    },

    normalizarDependenciaFirestore(dependencia = {}) {
        const id = String(dependencia.dependencia_id ?? dependencia.dependenciaId ?? dependencia.id ?? "").trim();
        const itemId = String(dependencia.item_id ?? dependencia.itemId ?? "").trim();
        const produtoId = String(dependencia.produto_id ?? dependencia.produtoId ?? "").trim();
        const produtoDescricao = String(dependencia.produto_descricao ?? dependencia.produtoDescricao ?? dependencia.descricao ?? "").trim();
        const unidade = String(dependencia.produto_unidade_sigla ?? dependencia.unidade ?? "").trim();
        const quantidade = this.numero(dependencia.quantidade, 0);
        const quantidadeTexto = quantidade > 0 ? `${quantidade}${unidade ? ` ${unidade}` : ""}` : "";
        const rotulo = produtoDescricao
            ? `${produtoDescricao}${quantidadeTexto ? ` (${quantidadeTexto})` : ""}`
            : "";

        return {
            ...dependencia,
            id,
            dependenciaId: id,
            dependencia_id: id,
            itemId,
            item_id: itemId,
            produtoId,
            produto_id: produtoId,
            produtoDescricao,
            produto_descricao: produtoDescricao,
            quantidade,
            unidade,
            rotulo
        };
    },

    persistirClientesFluxo(clienteAtual = null) {
        if (typeof RKDraftState === "undefined" || typeof RKDraftState.salvarFluxo !== "function") {
            return false;
        }

        RKDraftState.salvarFluxo({
            clienteSelecionado: clienteAtual || this.contexto?.cliente || null
        });

        return true;
    },

    unirClientes(...listas) {
        const mapa = new Map();

        listas.flat().filter(Boolean).forEach(cliente => {
            const id = cliente.id || this.gerarIdNovoCliente();
            mapa.set(id, {
                ...cliente,
                id
            });
        });

        return Array.from(mapa.values());
    },

    obterAppStateService() {
        if (typeof AppStateService !== "undefined" && AppStateService) {
            return AppStateService;
        }

        if (typeof AppState !== "undefined" && AppState) {
            return AppState;
        }

        return null;
    },

    obterClientesDisponiveis() {
        return this.dados.clientes || [];
    },

    obterProjetosDisponiveis() {
        const projetos = this.dados.projetos || [];
        const cliente = this.contexto?.cliente || null;

        if (!cliente) return projetos;

        const filtrados = projetos.filter(projeto => this.projetoPertenceAoCliente(projeto, cliente));
        return this.unirProjetos([this.criarProjetoPadrao(cliente)], filtrados);
    },

    obterServicosDisponiveis() {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterServicosBase === "function") {
            return OrcamentoItemConfig.obterServicosBase();
        }

        return this.dados.servicos || [];
    },

    obterProdutosDisponiveis() {
        return this.dados.produtos || [];
    },

    obterItensDisponiveis() {
        return this.dados.itens || [];
    },

    obterTamanhosPadraoDisponiveis() {
        return this.dados.tamanhos || [];
    },

    obterDependenciasDisponiveis() {
        return this.dados.dependencias || [];
    },

    obterClientePorId(id) {
        return this.obterPorId(this.obterClientesDisponiveis(), id);
    },

    obterProjetoPorId(id) {
        return this.obterPorId(this.obterProjetosDisponiveis(), id);
    },

    obterProjetoPadraoParaCliente(cliente = {}) {
        const projetos = this.dados.projetos || [];
        const filtrados = projetos.filter(projeto => this.projetoPertenceAoCliente(projeto, cliente));

        return filtrados.find(projeto => (
            projeto.padrao === true ||
            this.normalizarChave(projeto.nome || projeto.titulo) === "projeto_padrao"
        )) || this.criarProjetoPadrao(cliente);
    },

    obterServicoPorId(id) {
        return this.obterPorId(this.obterServicosDisponiveis(), id);
    },

    obterProdutoPorId(id) {
        return this.obterPorId(this.obterProdutosDisponiveis(), id);
    },

    obterItemProntoPorId(id) {
        return this.obterPorId(this.obterItensDisponiveis(), String(id || ""));
    },

    obterTamanhosItemPronto(itemId) {
        const id = String(itemId || "");
        return this.obterTamanhosPadraoDisponiveis().filter(tamanho => String(tamanho.itemId || tamanho.item_id || "") === id);
    },

    obterTamanhoItemPronto(itemId, tamanhoId) {
        const id = String(tamanhoId || "");
        return this.obterTamanhosItemPronto(itemId).find(tamanho => String(tamanho.id || tamanho.tamanhoId || "") === id) || null;
    },

    obterDependenciasItemPronto(itemId) {
        const id = String(itemId || "");
        return this.obterDependenciasDisponiveis()
            .filter(dependencia => String(dependencia.itemId || dependencia.item_id || "") === id)
            .map(dependencia => dependencia.rotulo || dependencia.produtoDescricao || dependencia.produto_descricao || "")
            .filter(Boolean);
    },

    garantirServicoPadrao() {
        if (!this.contexto) return null;
        if (this.obterServicosSelecionados(this.contexto).length) return this.contexto;

        const servico = this.obterServicoPorId("outros") || {
            id: "outros",
            nome: "Itens",
            plural: "Itens",
            itemSingular: "item",
            tipoCalculo: "ORCAMENTO_ITENS"
        };

        this.contexto = OrcamentoContext.atualizar(this.contexto, {
            servico,
            servicosSelecionados: [servico]
        });

        return this.contexto;
    },

    obterServicosSelecionados(contexto = this.contexto || {}) {
        if (Array.isArray(contexto.servicosSelecionados) && contexto.servicosSelecionados.length) {
            return contexto.servicosSelecionados;
        }

        return contexto.servico ? [contexto.servico] : [];
    },

    obterServicoConfig(grupoServico) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterServico === "function") {
            return OrcamentoItemConfig.obterServico(grupoServico);
        }

        return this.obterServicoPorId(grupoServico);
    },

    obterTipoItemConfig(grupoServico, tipoItem) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterTipoItem === "function") {
            return OrcamentoItemConfig.obterTipoItem(grupoServico, tipoItem);
        }

        return null;
    },

    obterTamanhoPadrao(grupoServico, tamanhoId) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterTamanhoPadrao === "function") {
            return OrcamentoItemConfig.obterTamanhoPadrao(grupoServico, tamanhoId);
        }

        return null;
    },

    obterDependenciasItem(grupoServico, tipoItem) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterDependencias === "function") {
            return OrcamentoItemConfig.obterDependencias(grupoServico, tipoItem);
        }

        return [];
    },

    normalizarTipoDimensao(tipoDimensao, grupoServico) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.normalizarTipoDimensao === "function") {
            return OrcamentoItemConfig.normalizarTipoDimensao(tipoDimensao, grupoServico);
        }

        const valor = this.normalizarValor(tipoDimensao);
        return valor === "padrao" ? "padrao" : "engenharia";
    },

    montarProdutoReferencial(dadosItem = {}) {
        if (dadosItem.itemProntoId || dadosItem.tipoItem === "item_manual" || String(dadosItem.tipoItem || "").startsWith("item_")) {
            const itemId = String(dadosItem.itemProntoId || dadosItem.itemCadastroId || "").trim();
            const descricao = String(dadosItem.tipoItemNome || dadosItem.descricao || "Item sob medida").trim();

            return {
                id: itemId ? `item_${itemId}` : `item_manual_${this.normalizarChave(descricao) || Date.now()}`,
                nome: descricao,
                descricao,
                categoria: dadosItem.grupoServico || "outros",
                subcategoria: dadosItem.tipoItem || "item_manual",
                unidadeVenda: dadosItem.unidade || "m2",
                tipoCalculo: "area_m2",
                precoVenda: dadosItem.valorUnitario || 0,
                ativo: true
            };
        }

        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.montarProdutoReferencial === "function") {
            return OrcamentoItemConfig.montarProdutoReferencial(dadosItem.grupoServico, dadosItem.tipoItem);
        }

        return {
            id: `cfg_${dadosItem.grupoServico || "outros"}_${dadosItem.tipoItem || "item"}`,
            nome: dadosItem.tipoItemNome || dadosItem.descricao || "Item sob medida",
            categoria: dadosItem.grupoServico || "outros",
            subcategoria: dadosItem.tipoItem || "",
            unidadeVenda: "m2",
            tipoCalculo: "area_m2",
            precoVenda: dadosItem.valorUnitario || 0,
            ativo: true
        };
    },

    atualizarFormularioItem(container) {
        if (!container) return false;

        const grupoServico = container.querySelector("[name='grupoServico']")?.value || container.dataset.grupoServico || "";
        const itemProntoSelect = container.querySelector("[name='itemProntoId']");
        const itemPronto = this.obterItemProntoPorId(itemProntoSelect?.value);
        const tipoItem = container.querySelector("[name='tipoItem']")?.value || "";
        const tipoItemCampo = container.querySelector("[name='tipoItem']");
        const tipoItemNomeCampo = container.querySelector("[name='tipoItemNome']");
        const subtipoSelect = container.querySelector("[name='subtipoItem']");
        const dependenciasCampo = container.querySelector("[data-item-dependencias]");
        const descricao = container.querySelector("[name='descricao']");
        const tipoDimensaoCampo = container.querySelector("[name='tipoDimensao']");
        const tamanhoCampo = container.querySelector("[name='tamanhoPadraoSelecionado']");
        const larguraCampo = container.querySelector("[name='larguraCm']");
        const alturaCampo = container.querySelector("[name='alturaCm']");
        let tipoDimensao = this.normalizarTipoDimensao(tipoDimensaoCampo?.value, grupoServico);
        let tipoConfig = null;
        let dependencias = [];

        if (itemPronto) {
            const itemId = itemPronto.id || itemPronto.itemId || itemPronto.item_id || "";
            const categoria = itemPronto.categoriaDescricao || itemPronto.categoria_descricao || "";
            const descricaoItem = itemPronto.descricao || itemPronto.nome || "";
            const tamanhoItem = this.atualizarCampoDescricaoTamanhoItem(container, itemId, tamanhoCampo?.value);

            if (tipoItemCampo) tipoItemCampo.value = `item_${itemId}`;
            if (tipoItemNomeCampo) tipoItemNomeCampo.value = descricaoItem;
            if (subtipoSelect) subtipoSelect.value = categoria;
            if (descricao && descricao !== document.activeElement && (!descricao.value || descricao.dataset.autogerada === "true")) {
                descricao.value = this.rotuloTamanhoPadrao(tamanhoItem) || descricaoItem;
                descricao.dataset.autogerada = "true";
                descricao.dataset.itemPronto = "true";
            }
            if (tamanhoItem) {
                tipoDimensao = "padrao";
                if (tipoDimensaoCampo) tipoDimensaoCampo.value = "padrao";
                if (tamanhoCampo) tamanhoCampo.value = tamanhoItem.id || tamanhoItem.tamanhoId || "";
                if (larguraCampo) larguraCampo.value = Number(tamanhoItem.larguraCm || tamanhoItem.largura || 0).toFixed(2);
                if (alturaCampo) alturaCampo.value = Number(tamanhoItem.alturaCm || tamanhoItem.altura || 0).toFixed(2);
            } else if (tipoDimensaoCampo) {
                tipoDimensao = "engenharia";
                tipoDimensaoCampo.value = "engenharia";
            }

            dependencias = this.obterDependenciasItemPronto(itemId);
        } else if (tipoItem && tipoItem !== "item_manual" && !String(tipoItem).startsWith("item_")) {
            tipoConfig = this.obterTipoItemConfig(grupoServico, tipoItem);
            dependencias = this.obterDependenciasItem(grupoServico, tipoItem);
        } else {
            this.atualizarCampoDescricaoTamanhoItem(container, "", "");
        }

        if (subtipoSelect?.tagName === "SELECT" && tipoConfig?.subtipos?.length) {
            const valorAtual = subtipoSelect.value;
            subtipoSelect.innerHTML = tipoConfig.subtipos.map(subtipo => `<option value="${OrcamentoInteligenteUI.escapar(subtipo)}">${OrcamentoInteligenteUI.escapar(subtipo)}</option>`).join("");
            subtipoSelect.value = tipoConfig.subtipos.includes(valorAtual) ? valorAtual : tipoConfig.subtipos[0];
        }

        if (!itemPronto && tipoConfig && descricao && descricao !== document.activeElement && (!descricao.value || descricao.dataset.autogerada === "true")) {
            descricao.value = [tipoConfig?.nome || "", subtipoSelect?.value || ""].filter(Boolean).join(" - ");
            descricao.dataset.autogerada = "true";
        }

        if (dependenciasCampo) {
            dependenciasCampo.textContent = dependencias.length ? dependencias.join(", ") : "Dependencias a definir";
        }

        if (tipoDimensaoCampo) {
            tipoDimensaoCampo.value = tipoDimensao;
        }

        if (tamanhoCampo) {
            tamanhoCampo.closest("[data-tamanho-padrao-campo]")?.classList.toggle("orcamento-inteligente-campo-oculto", tipoDimensao !== "padrao");
        }

        if (tipoDimensao === "padrao") {
            const tamanho = this.obterTamanhoPadrao(grupoServico, tamanhoCampo?.value);
            if (tamanho) {
                if (tamanhoCampo) tamanhoCampo.value = tamanho.id;
                if (larguraCampo) larguraCampo.value = tamanho.larguraCm;
                if (alturaCampo) alturaCampo.value = tamanho.alturaCm;
            }
        }

        if (larguraCampo) larguraCampo.readOnly = tipoDimensao === "padrao";
        if (alturaCampo) alturaCampo.readOnly = tipoDimensao === "padrao";

        return true;
    },

    obterPorId(lista = [], id) {
        const procurado = String(id || "");
        return (lista || []).find(item => String(item.id || item.itemId || item.item_id || "") === procurado) || null;
    },

    mesmaEntidade(atual = {}, proxima = {}) {
        if (!atual || !proxima) return false;
        if (atual.id && proxima.id) return atual.id === proxima.id;
        return Boolean(atual.nome && proxima.nome && atual.nome === proxima.nome);
    },

    irParaCompartilhamento(documento = null, registro = null) {
        const numero = this.normalizarNumeroOrcamento(
            registro?.numero
            || this.contexto?.numero
            || documento?.dados?.metadados?.numeroOrcamento
            || documento?.metadados?.numeroOrcamento
        );

        try {
            sessionStorage.setItem("rk_documento_preview_atual", JSON.stringify({
                numero,
                documento,
                registroId: registro?.id || "",
                criadoEm: new Date().toISOString()
            }));
        } catch (erro) {
            console.warn("Nao foi possivel preparar a transferencia direta para o preview.", erro);
        }

        const parametros = new URLSearchParams({ preview: "pdf" });
        if (numero) parametros.set("numero", numero);
        if (registro?.id) parametros.set("registro", registro.id);
        window.location.assign(`arquivos.html?${parametros.toString()}`);
    },

    projetoPertenceAoCliente(projeto = {}, cliente = {}) {
        const clienteProjeto = projeto.cliente || {};
        return clienteProjeto.id === cliente.id
            || (!!clienteProjeto.nome && clienteProjeto.nome === cliente.nome)
            || (!!projeto.clienteId && projeto.clienteId === cliente.id);
    },

    obterBloqueioEtapa(etapa) {
        const contexto = this.contexto || {};
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];

        if (etapa === "projeto" && !contexto.cliente) return "Cliente nao selecionado.";
        if (etapa === "revisao" && !produtos.length) return "Sem produtos.";
        if (etapa === "calculo" && !produtos.length) return "Sem produtos.";
        if (["calculo", "resumo"].includes(etapa)) {
            const pendenciaItem = this.obterPendenciaItensDaTela();
            if (pendenciaItem) return pendenciaItem;
        }
        if (etapa === "resumo" && !contexto.resultado?.sucesso) return "Calculo pendente.";
        return "";
    },

    obterPendenciaItensDaTela() {
        const itens = this.coletarItensDaTela();
        if (!itens.length) {
            return "";
        }

        const invalido = itens.find(item => (
            !String(item.descricao || "").trim()
            || Number(item.larguraCm || 0) <= 0
            || Number(item.alturaCm || 0) <= 0
            || Number(item.quantidade || 0) <= 0
            || Number(item.valorUnitario || 0) <= 0
            || (Number(item.valorAdicional || 0) > 0 && !String(item.descricaoAdicional || "").trim())
        ));

        return invalido ? "Revise descricao, medidas, quantidade, valores e a descricao de adicionais dos itens." : "";
    },

    extrairDadosCalculo(dados) {
        return {
            itens: this.coletarItensDaTela(),
            observacoes: String(dados.get("observacoes") || "").trim()
        };
    },

    extrairNovoCliente(dados) {
        const endereco = String(dados.get("endereco") || "").trim();
        const cidade = String(dados.get("cidade") || "").trim();

        return {
            tipoPessoa: "fisica",
            nome: String(dados.get("nome") || "").trim(),
            telefonePrincipal: String(dados.get("telefone") || "").trim(),
            email: String(dados.get("email") || "").trim(),
            observacoes: String(dados.get("observacoes") || "").trim(),
            enderecos: endereco || cidade
                ? [{
                    tipo: "principal",
                    logradouro: endereco,
                    cidade: cidade || "Porto Seguro",
                    estado: "BA"
                }]
                : []
        };
    },

    extrairDadosItem(dados) {
        const itemProntoId = String(dados.get("itemProntoId") || "").trim();
        const itemPronto = this.obterItemProntoPorId(itemProntoId);
        const grupoServico = String(dados.get("grupoServico") || "outros").trim();
        const tipoItem = String(dados.get("tipoItem") || (itemProntoId ? `item_${itemProntoId}` : "item_manual")).trim();
        const tipoDimensao = this.normalizarTipoDimensao(dados.get("tipoDimensao"), grupoServico);
        const tamanhoPadraoSelecionado = String(dados.get("tamanhoPadraoSelecionado") || "").trim();
        const tamanhoItemPronto = itemProntoId
            ? this.obterTamanhoItemPronto(itemProntoId, tamanhoPadraoSelecionado)
            : null;
        const medidasPadrao = tamanhoItemPronto || (tipoDimensao === "padrao"
            ? this.obterTamanhoPadrao(grupoServico, tamanhoPadraoSelecionado)
            : null);
        const descricaoTamanho = this.rotuloTamanhoPadrao(medidasPadrao);
        const descricaoItemPronto = String(itemPronto?.descricao || itemPronto?.nome || "").trim();
        const categoriaItem = itemPronto?.categoriaDescricao || itemPronto?.categoria_descricao || String(dados.get("subtipoItem") || "").trim();
        const descricaoInformada = String(dados.get("descricao") || "").trim();
        const tipoItemNome = String(dados.get("tipoItemNome") || descricaoItemPronto || descricaoInformada || descricaoTamanho).trim();
        const descricao = descricaoInformada || descricaoTamanho || descricaoItemPronto;
        const dependencias = itemProntoId ? this.obterDependenciasItemPronto(itemProntoId) : [];

        return {
            produtoId: dados.get("produtoId"),
            itemProntoId,
            itemCadastroId: itemProntoId,
            grupoServico,
            grupoServicoNome: String(dados.get("grupoServicoNome") || categoriaItem || "Itens").trim(),
            tipoItem,
            tipoItemNome,
            subtipoItem: categoriaItem,
            descricao,
            dependencias,
            tipoDimensao,
            tamanhoPadraoSelecionado: medidasPadrao?.id || medidasPadrao?.tamanhoId || tamanhoPadraoSelecionado,
            tamanhoPadraoNome: this.rotuloTamanhoPadrao(medidasPadrao),
            larguraCm: medidasPadrao?.larguraCm ?? medidasPadrao?.largura ?? this.numero(dados.get("larguraCm"), 0),
            alturaCm: medidasPadrao?.alturaCm ?? medidasPadrao?.altura ?? this.numero(dados.get("alturaCm"), 0),
            quantidade: this.numero(dados.get("quantidade"), 1),
            unidade: dados.get("unidade") || "m2",
            valorUnitario: this.numero(dados.get("valorUnitario"), 0),
            valorAdicional: this.numero(dados.get("valorAdicional"), 0),
            descricaoAdicional: "Ferragens/Acessórios",
            valorAluminio: this.numero(dados.get("valorAluminio"), 0),
            valorJato: this.numero(dados.get("valorJato"), 0),
            observacoes: dados.get("observacoes")
        };
    },

    extrairComplementos(dados) {
        const possui = (...campos) => campos.some(campo => dados.has(campo));
        const complementos = {};

        if (possui("descontoTipo", "descontoValor", "acrescimoTipo", "acrescimoValor")) {
            complementos.ajustesFinanceiros = {
                descontoTipo: dados.get("descontoTipo"),
                descontoValor: this.numero(dados.get("descontoValor"), 0),
                acrescimoTipo: dados.get("acrescimoTipo"),
                acrescimoValor: this.numero(dados.get("acrescimoValor"), 0)
            };
        }

        if (possui("observacaoLivre", "observacoesComerciais", "observacoesTecnicas")) {
            complementos.observacoes = {
                livre: dados.get("observacaoLivre"),
                comerciais: dados.get("observacoesComerciais"),
                tecnicas: dados.get("observacoesTecnicas")
            };
        }

        if (possui("formaPagamento", "formaPagamentoComplemento", "prazoEntrega", "prazoEntregaComplemento", "validadeProposta")) {
            complementos.condicoesComerciais = {
                formaPagamento: dados.get("formaPagamento"),
                formaPagamentoComplemento: dados.get("formaPagamentoComplemento"),
                prazoEntrega: dados.get("prazoEntrega"),
                prazoEntregaComplemento: dados.get("prazoEntregaComplemento"),
                validadeProposta: dados.get("validadeProposta")
            };
        }

        return complementos;
    },

    coletarItensDaTela() {
        return Array.from(document.querySelectorAll("[data-orcamento-item]")).map(item => {
            const itemProntoId = item.querySelector("[name='itemProntoId']")?.value || item.dataset.itemProntoId || "";
            const itemPronto = this.obterItemProntoPorId(itemProntoId);
            const grupoServico = item.querySelector("[name='grupoServico']")?.value || item.dataset.grupoServico || item.dataset.categoria || "outros";
            const tipoDimensao = this.normalizarTipoDimensao(
                item.querySelector("[name='tipoDimensao']")?.value || item.dataset.tipoDimensao,
                grupoServico
            );
            const tipoItem = item.querySelector("[name='tipoItem']")?.value
                || item.dataset.tipoItem
                || (itemProntoId ? `item_${itemProntoId}` : "item_manual");
            const tipoItemNome = item.querySelector("[name='tipoItemNome']")?.value
                || item.dataset.tipoItemNome
                || itemPronto?.descricao
                || itemPronto?.nome
                || "Item sob medida";
            const subtipoItem = item.querySelector("[name='subtipoItem']")?.value
                || item.dataset.subtipoItem
                || itemPronto?.categoriaDescricao
                || itemPronto?.categoria_descricao
                || "";
            const tamanhoPadraoSelecionado = item.querySelector("[name='tamanhoPadraoSelecionado']")?.value || "";
            const tamanhoPadrao = itemProntoId ? this.obterTamanhoItemPronto(itemProntoId, tamanhoPadraoSelecionado) : null;
            const descricao = String(item.querySelector("[name='descricao']")?.value || "").trim();

            return {
                itemId: item.dataset.itemId,
                produtoId: item.dataset.produtoId,
                id: item.dataset.produtoId,
                itemProntoId,
                itemCadastroId: itemProntoId,
                nome: item.dataset.nome || tipoItemNome || "Item sob medida",
                categoria: item.dataset.categoria || grupoServico,
                subcategoria: item.dataset.subcategoria || tipoItem,
                grupoServico,
                grupoServicoNome: item.querySelector("[name='grupoServicoNome']")?.value || item.dataset.grupoServicoNome || subtipoItem || "Itens",
                tipoItem,
                tipoItemNome,
                subtipoItem,
                dependencias: itemProntoId ? this.obterDependenciasItemPronto(itemProntoId) : [],
                tipoDimensao,
                tamanhoPadraoSelecionado,
                tamanhoPadraoNome: this.rotuloTamanhoPadrao(tamanhoPadrao),
                tipoCalculo: item.dataset.tipoCalculo || "area_m2",
                descricao,
                larguraCm: this.numero(tamanhoPadrao?.larguraCm ?? tamanhoPadrao?.largura ?? item.querySelector("[name='larguraCm']")?.value, 0),
                alturaCm: this.numero(tamanhoPadrao?.alturaCm ?? tamanhoPadrao?.altura ?? item.querySelector("[name='alturaCm']")?.value, 0),
                quantidade: this.numero(item.querySelector("[name='quantidade']")?.value, 1),
                unidade: item.querySelector("[name='unidade']")?.value || "m2",
                valorUnitario: this.numero(item.querySelector("[name='valorUnitario']")?.value, 0),
                valorAdicional: this.numero(item.querySelector("[name='valorAdicional']")?.value, 0),
                descricaoAdicional: "Ferragens/Acessórios",
                valorAluminio: this.numero(item.querySelector("[name='valorAluminio']")?.value, 0),
                valorJato: this.numero(item.querySelector("[name='valorJato']")?.value, 0),
                observacoes: item.querySelector("[name='observacoes']")?.value || ""
            };
        });
    },

    coletarComplementosDaTela() {
        const form = document.querySelector("[data-orcamento-form='complementos']");
        if (!form) {
            return {
                ajustesFinanceiros: {},
                observacoes: {},
                condicoesComerciais: {}
            };
        }

        return this.extrairComplementos(new FormData(form));
    },

    numero(valor, padrao = 0) {
        if (valor === undefined || valor === null || valor === "") {
            return padrao;
        }

        const numero = Number(String(valor).replace(",", "."));
        return Number.isFinite(numero) ? numero : padrao;
    },

    normalizarUnidadeProduto(unidade) {
        const valor = String(unidade || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");

        if (["m2", "area_m2", "metro_quadrado"].includes(valor)) return "m2";
        if (["m", "linear_m", "metro_linear"].includes(valor)) return "m";
        return "un";
    },

    normalizarValor(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    normalizarChave(valor) {
        return this.normalizarValor(valor);
    },

    normalizarNumeroOrcamento(valor) {
        return String(valor || "").trim();
    },

    unirProjetos(...listas) {
        const mapa = new Map();

        listas.flat().filter(Boolean).forEach(projeto => {
            const id = projeto.id || this.normalizarChave(projeto.nome || projeto.titulo || projeto.codigo);
            if (!id || mapa.has(id)) return;
            mapa.set(id, {
                ...projeto,
                id
            });
        });

        return Array.from(mapa.values());
    },

    criarProjetoPadrao(cliente = {}) {
        const clienteId = cliente.id || this.normalizarChave(cliente.nome || "cliente");
        const dados = {
            id: `prj_padrao_${clienteId || "cliente"}`,
            numero: "PRJ-PADRAO",
            codigo: "PRJ-PADRAO",
            titulo: "Projeto padrao",
            nome: "Projeto padrao",
            status: "rascunho",
            tipoProjeto: "Projeto padrao",
            padrao: true,
            generico: true,
            ativo: true,
            cliente: {
                id: cliente.id || "",
                nome: cliente.nome || "",
                telefone: cliente.telefonePrincipal || cliente.telefone || "",
                email: cliente.email || ""
            },
            obra: {
                endereco: "A definir",
                cidade: "Porto Seguro"
            },
            descricao: "Projeto padrao para orcamentos rapidos sem obra ou ambiente especifico.",
            observacoes: "Criado automaticamente como apoio do fluxo guiado."
        };

        return typeof ProjetoModel !== "undefined" && typeof ProjetoModel.normalizar === "function"
            ? ProjetoModel.normalizar(dados)
            : dados;
    },

    async criarContexto() {
        if (typeof CriarOrcamentoUseCase !== "undefined") {
            return CriarOrcamentoUseCase.executar();
        }

        if (typeof OrcamentoOrchestrator !== "undefined" && typeof OrcamentoOrchestrator.iniciar === "function") {
            return OrcamentoOrchestrator.iniciar();
        }

        if (typeof OrcamentoFactory !== "undefined" && typeof OrcamentoFactory.criar === "function") {
            return {
                sucesso: true,
                contexto: OrcamentoFactory.criar(),
                erros: [],
                detalhes: {}
            };
        }

        return {
            sucesso: false,
            contexto: {
                status: "INICIADO",
                produtos: [],
                historico: [],
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString()
            },
            erros: ["Orquestrador de orcamento indisponivel."],
            detalhes: {}
        };
    }
};

document.addEventListener("DOMContentLoaded", () => {
    void (window.RKLoading?.initial
        ? RKLoading.initial(() => OrcamentoInteligenteController.iniciarTela(), "Carregando catalogos e configuracoes...")
        : OrcamentoInteligenteController.iniciarTela());
});
