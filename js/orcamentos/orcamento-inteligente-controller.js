const OrcamentoInteligenteController = {
    contexto: null,
    etapaAtual: "cliente",
    etapas: ["cliente", "projeto", "servico", "produtos", "revisao", "calculo", "resumo"],
    timerAtualizacao: null,
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
        produtos: []
    },

    async iniciarTela() {
        document.documentElement.classList.add("orcamento-inteligente-html");
        this.configurarClienteService();
        this.configurarCatalogosService();
        OrcamentoInteligenteUI.iniciar();
        this.vincularEventos();
        await this.novoOrcamento();
    },

    configurarClienteService() {
        if (
            typeof ClienteRepository !== "undefined" &&
            typeof criarMemoryAdapter === "function" &&
            !ClienteRepository.adapter
        ) {
            ClienteRepository.configurar(criarMemoryAdapter());
        }

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
            if (typeof criarLocalStorageAdapter === "function") {
                return criarLocalStorageAdapter();
            }

            if (typeof criarMemoryAdapter === "function") {
                return criarMemoryAdapter();
            }

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

        if (typeof ProdutoRepository !== "undefined" && !ProdutoRepository.adapter) {
            const adapter = criarAdapter();
            if (adapter) {
                ProdutoRepository.configurar(adapter);
            }
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
            btnNovo.addEventListener("click", () => this.novoOrcamento());
        }

        const modulo = OrcamentoInteligenteUI.elementos.modulo || document;
        modulo.addEventListener("submit", evento => this.processarFormulario(evento));
        modulo.addEventListener("click", evento => this.processarAcao(evento));
        modulo.addEventListener("input", evento => this.processarAlteracaoTempoReal(evento));
        modulo.addEventListener("change", evento => this.processarAlteracaoTempoReal(evento));

        window.addEventListener("scroll", () => this.processarScrollFluxo(), { passive: true });
        window.addEventListener("resize", () => {
            this.sincronizarEtapaPorScroll();
            this.agendarEncaixeScroll();
        }, { passive: true });
    },

    async novoOrcamento() {
        const resultado = await this.criarContexto();
        this.contexto = resultado.contexto;
        this.etapaAtual = "cliente";
        await this.carregarDados();
        this.aplicarDemoInicial();
        this.renderizarEtapaAtual();
        this.atualizarResumo();
        this.sincronizarFluxo();

        if (!resultado.sucesso) {
            OrcamentoInteligenteUI.mostrarAviso(resultado.erros.join(" "), "erro");
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
            await this.selecionarProjeto(dados.get("projetoId"));
            return;
        }

        if (tipo === "servico") {
            await this.selecionarServicos(dados.getAll("servicoIds"));
            return;
        }

        if (tipo === "produto") {
            await this.adicionarItemProjeto(this.extrairDadosItem(dados));
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
            await this.novoOrcamento();
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

    processarAlteracaoTempoReal(evento) {
        const alvo = evento.target;
        if (!alvo || !alvo.closest) return;

        const alteraItens = alvo.closest("[data-orcamento-itens]");
        const alteraComplementos = alvo.closest("[data-orcamento-form='complementos']");

        if (alvo.matches("#orcamentoProdutoSelect")) {
            this.preencherItemPorProduto(alvo);
        }

        if (evento.type === "change" && alvo.matches("#orcamentoClienteSelect")) {
            void this.selecionarCliente(alvo.value);
            return;
        }

        if (evento.type === "change" && alvo.matches("#orcamentoProjetoSelect")) {
            void this.selecionarProjeto(alvo.value);
            return;
        }

        if (evento.type === "change" && alvo.matches("[data-orcamento-form='servico'] input[name='servicoIds']")) {
            const form = alvo.closest("[data-orcamento-form='servico']");
            const selecionados = Array.from(form?.querySelectorAll("input[name='servicoIds']:checked") || [])
                .map(item => item.value)
                .filter(Boolean);

            if (!selecionados.length) {
                this.mostrarAviso("Selecione pelo menos um tipo de servico.", "erro");
                return;
            }

            void this.selecionarServicos(selecionados);
            return;
        }

        if (alvo.closest("[data-orcamento-form='produto']")) {
            this.atualizarFormularioItem(alvo.closest("[data-orcamento-form='produto']"));
        }

        if (alvo.closest("[data-orcamento-item]") && (
            alvo.matches("[name='tipoItem']")
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
            const projetoAtual = this.contexto?.projeto || null;
            const projetoAtualDisponivel = projetoAtual
                ? this.obterProjetosDisponiveis().some(projeto => this.mesmaEntidade(projeto, projetoAtual))
                : false;

            if (!projetoAtualDisponivel) {
                const projetoPadrao = this.obterProjetoPadraoParaCliente(cliente);
                const comProjetoPadrao = await OrcamentoOrchestrator.selecionarProjeto(this.contexto, projetoPadrao);
                this.aplicarResultado(comProjetoPadrao, "projeto");
                return;
            }

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

        const projetoPadrao = this.obterProjetoPadraoParaCliente(cliente);
        if (projetoPadrao) {
            const comProjetoPadrao = await OrcamentoOrchestrator.selecionarProjeto(resultado.contexto, projetoPadrao);
            this.aplicarResultado(comProjetoPadrao, "projeto");
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

    async selecionarProjeto(projetoId) {
        const projeto = this.obterProjetoPorId(projetoId);
        if (!projeto) {
            this.mostrarAviso("Projeto nao selecionado.", "erro");
            return;
        }

        const resultado = await OrcamentoOrchestrator.selecionarProjeto(this.contexto, projeto);
        this.aplicarResultado(resultado, "servico");
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
        this.garantirNumeroOrcamento();

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
                this.irParaCompartilhamento();
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

        const numero = this.garantirNumeroOrcamento();
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

        if (typeof RKE2EDemoState !== "undefined" && typeof RKE2EDemoState.salvarFluxo === "function") {
            RKE2EDemoState.salvarFluxo({
                orcamentoAtual: this.contexto,
                documentoAtual: resultado.documento
            });
        }

        await this.persistirDocumentoGerado(resultado.documento);
        if (!opcoes.silencioso) {
            this.mostrarAviso("Documento Comercial gerado e enviado para compartilhamento.", "info");
        }
        return resultado;
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
        this.renderizarEtapaAtual();
        this.rolarParaEtapaAtual();
    },

    voltarEtapa() {
        const indice = this.etapas.indexOf(this.etapaAtual);
        const anterior = this.etapas[indice - 1];

        if (!anterior) return;

        this.etapaAtual = anterior;
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
                produtos: this.obterProdutosDisponiveis()
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

        if (resultado.sucesso && proximaEtapa) {
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
            this.sincronizarEtapaPorScroll();
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

    garantirNumeroOrcamento() {
        const existente = this.normalizarNumeroOrcamento(
            this.contexto?.numero
            || this.contexto?.orcamentoNumero
            || this.contexto?.orcamentoPreparado?.numero
            || this.contexto?.orcamentoPreparado?.orcamentoNumero
        );

        if (existente) {
            return existente;
        }

        const numero = this.gerarNumeroOrcamento();
        this.contexto = typeof OrcamentoContext !== "undefined" && typeof OrcamentoContext.atualizar === "function"
            ? OrcamentoContext.atualizar(this.contexto || {}, { numero })
            : {
                ...(this.contexto || {}),
                numero
            };

        return numero;
    },

    gerarNumeroOrcamento() {
        const chave = typeof Config !== "undefined" ? Config.storage?.numeroOrcamento : "";
        let numero = 1;

        if (chave && typeof Storage !== "undefined" && typeof Storage.carregar === "function") {
            numero = Number(Storage.carregar(chave, 1));
        }

        if (!Number.isFinite(numero) || numero < 1) {
            numero = 1;
        }

        if (chave && typeof Storage !== "undefined" && typeof Storage.salvar === "function") {
            Storage.salvar(chave, numero + 1);
        }

        return String(numero).padStart(6, "0");
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

    aplicarDemoInicial() {
        if (typeof RKE2EDemoState === "undefined" || typeof RKE2EDemoState.carregar !== "function") {
            return false;
        }

        const estado = RKE2EDemoState.carregar();
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

        if (typeof RKE2EDemoState !== "undefined" && typeof RKE2EDemoState.salvarFluxo === "function") {
            RKE2EDemoState.salvarFluxo({
                clientes: this.obterClientesParaPersistir(contexto.cliente),
                clienteSelecionado: contexto.cliente || null,
                projetoSelecionado: contexto.projeto || null,
                projetoAtual: contexto.projeto || null,
                orcamentoAtual: contexto
            });
        }

        return true;
    },

    contextoComResumo() {
        return {
            ...(this.contexto || {}),
            resumo: this.gerarResumo()
        };
    },

    async carregarDados() {
        const [clientes, projetos, servicos, produtos] = await Promise.all([
            this.listarClientes(),
            this.listarProjetos(),
            this.listarServicos(),
            this.listarProdutos()
        ]);

        this.dados = {
            clientes,
            projetos,
            servicos,
            produtos
        };
    },

    async listarClientes() {
        const clientesDemo = this.obterClientesDemo();

        try {
            if (typeof ClienteService !== "undefined" && typeof ClienteService.listarClientes === "function") {
                const resultado = await ClienteService.listarClientes({ status: "ativo" });
                if (resultado.sucesso && resultado.clientes.length) {
                    return this.unirClientes(resultado.clientes, clientesDemo);
                }
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Clientes para o fluxo guiado.", erro);
        }

        if (clientesDemo.length) {
            return clientesDemo;
        }

        return this.criarClientesApoio();
    },

    async listarProjetos() {
        try {
            if (typeof ProjetoService !== "undefined" && typeof ProjetoService.listar === "function") {
                const projetos = await ProjetoService.listar();
                return Array.isArray(projetos) ? projetos : [];
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Projetos para o fluxo guiado.", erro);
        }

        const demo = this.obterEstadoDemo();
        return demo?.projetoSelecionado ? [demo.projetoSelecionado] : [];
    },

    async listarServicos() {
        try {
            if (typeof ServicoService !== "undefined" && typeof ServicoService.listarServicos === "function") {
                const resultado = await ServicoService.listarServicos({ ativo: true });
                if (resultado.sucesso && resultado.servicos.length) {
                    return resultado.servicos;
                }
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Servicos para o fluxo guiado.", erro);
        }

        const demo = this.obterEstadoDemo();
        if (demo?.orcamentoAtual?.servico) {
            return [demo.orcamentoAtual.servico];
        }

        return this.criarServicosApoio();
    },

    async listarProdutos() {
        try {
            if (typeof ProdutoService !== "undefined" && typeof ProdutoService.listarProdutos === "function") {
                const resultado = await ProdutoService.listarProdutos({ ativo: true });
                if (resultado.sucesso && resultado.produtos.length) {
                    return resultado.produtos;
                }
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Produtos para o fluxo guiado.", erro);
        }

        const demo = this.obterEstadoDemo();
        if (Array.isArray(demo?.orcamentoAtual?.produtos) && demo.orcamentoAtual.produtos.length) {
            return demo.orcamentoAtual.produtos;
        }

        return this.criarProdutosApoio();
    },

    obterEstadoDemo() {
        if (typeof RKE2EDemoState !== "undefined" && typeof RKE2EDemoState.carregar === "function") {
            return RKE2EDemoState.carregar();
        }

        return null;
    },

    obterClientesDemo() {
        const demo = this.obterEstadoDemo();
        const clientes = Array.isArray(demo?.clientes) ? demo.clientes : [];
        return this.unirClientes(clientes, demo?.clienteSelecionado ? [demo.clienteSelecionado] : []);
    },

    persistirClientesFluxo(clienteAtual = null) {
        if (typeof RKE2EDemoState === "undefined" || typeof RKE2EDemoState.salvarFluxo !== "function") {
            return false;
        }

        RKE2EDemoState.salvarFluxo({
            clientes: this.obterClientesParaPersistir(clienteAtual),
            clienteSelecionado: clienteAtual || this.contexto?.cliente || null
        });

        return true;
    },

    obterClientesParaPersistir(clienteAtual = null) {
        const atual = clienteAtual ? [clienteAtual] : [];
        return this.unirClientes(atual, this.dados.clientes || [], this.obterClientesDemo());
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
        const tipoItem = container.querySelector("[name='tipoItem']")?.value || "";
        const tipoConfig = this.obterTipoItemConfig(grupoServico, tipoItem);
        const subtipoSelect = container.querySelector("[name='subtipoItem']");
        const dependencias = this.obterDependenciasItem(grupoServico, tipoItem);
        const dependenciasCampo = container.querySelector("[data-item-dependencias]");
        const descricao = container.querySelector("[name='descricao']");
        const tipoDimensaoCampo = container.querySelector("[name='tipoDimensao']");
        const tamanhoCampo = container.querySelector("[name='tamanhoPadraoSelecionado']");
        const larguraCampo = container.querySelector("[name='larguraCm']");
        const alturaCampo = container.querySelector("[name='alturaCm']");
        const engenhariaCampo = container.querySelector("[data-engenharia-campo]");
        const percentualCampo = container.querySelector("[name='percentualEngenharia']");
        const tipoDimensao = this.normalizarTipoDimensao(tipoDimensaoCampo?.value, grupoServico);

        if (subtipoSelect && tipoConfig?.subtipos?.length) {
            const valorAtual = subtipoSelect.value;
            subtipoSelect.innerHTML = tipoConfig.subtipos.map(subtipo => `<option value="${OrcamentoInteligenteUI.escapar(subtipo)}">${OrcamentoInteligenteUI.escapar(subtipo)}</option>`).join("");
            subtipoSelect.value = tipoConfig.subtipos.includes(valorAtual) ? valorAtual : tipoConfig.subtipos[0];
        }

        if (descricao && descricao !== document.activeElement && (!descricao.value || descricao.dataset.autogerada === "true")) {
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
            if (percentualCampo) percentualCampo.value = 0;
        }

        if (larguraCampo) larguraCampo.readOnly = tipoDimensao === "padrao";
        if (alturaCampo) alturaCampo.readOnly = tipoDimensao === "padrao";
        if (engenhariaCampo) engenhariaCampo.classList.toggle("orcamento-inteligente-campo-oculto", tipoDimensao !== "engenharia");

        return true;
    },

    obterPorId(lista = [], id) {
        return (lista || []).find(item => item.id === id) || null;
    },

    mesmaEntidade(atual = {}, proxima = {}) {
        if (!atual || !proxima) return false;
        if (atual.id && proxima.id) return atual.id === proxima.id;
        return Boolean(atual.nome && proxima.nome && atual.nome === proxima.nome);
    },

    irParaCompartilhamento() {
        window.location.assign("compartilhar-documento.html");
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
        if (etapa === "servico" && !contexto.projeto) return "Projeto nao selecionado.";
        if (etapa === "produtos" && !this.obterServicosSelecionados(contexto).length) return "Servico nao selecionado.";
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
            Number(item.larguraCm || 0) <= 0
            || Number(item.alturaCm || 0) <= 0
            || Number(item.quantidade || 0) <= 0
            || Number(item.valorUnitario || 0) < 0
            || !String(item.descricao || "").trim()
        ));

        return invalido ? "Revise medidas, quantidade, valor e descricao dos itens." : "";
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
        const grupoServico = String(dados.get("grupoServico") || "").trim();
        const tipoItem = String(dados.get("tipoItem") || "").trim();
        const tipoDimensao = this.normalizarTipoDimensao(dados.get("tipoDimensao"), grupoServico);
        const tamanhoPadraoSelecionado = String(dados.get("tamanhoPadraoSelecionado") || "").trim();
        const medidasPadrao = tipoDimensao === "padrao"
            ? this.obterTamanhoPadrao(grupoServico, tamanhoPadraoSelecionado)
            : null;
        const tipoConfig = this.obterTipoItemConfig(grupoServico, tipoItem);
        const subtipoItem = String(dados.get("subtipoItem") || "").trim();

        return {
            produtoId: dados.get("produtoId"),
            grupoServico,
            grupoServicoNome: this.obterServicoConfig(grupoServico)?.nome || grupoServico,
            tipoItem,
            tipoItemNome: tipoConfig?.nome || tipoItem,
            subtipoItem,
            descricao: dados.get("descricao"),
            dependencias: this.obterDependenciasItem(grupoServico, tipoItem),
            tipoDimensao,
            tamanhoPadraoSelecionado: medidasPadrao?.id || "",
            tamanhoPadraoNome: medidasPadrao?.nome || "",
            larguraCm: medidasPadrao?.larguraCm ?? this.numero(dados.get("larguraCm"), 0),
            alturaCm: medidasPadrao?.alturaCm ?? this.numero(dados.get("alturaCm"), 0),
            quantidade: this.numero(dados.get("quantidade"), 1),
            unidade: dados.get("unidade") || "m2",
            valorUnitario: this.numero(dados.get("valorUnitario"), 0),
            percentualEngenharia: tipoDimensao === "engenharia" ? this.numero(dados.get("percentualEngenharia"), 0) : 0,
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
        return Array.from(document.querySelectorAll("[data-orcamento-item]")).map(item => ({
            itemId: item.dataset.itemId,
            produtoId: item.dataset.produtoId,
            id: item.dataset.produtoId,
            nome: item.dataset.nome,
            categoria: item.dataset.categoria,
            subcategoria: item.dataset.subcategoria,
            grupoServico: item.querySelector("[name='grupoServico']")?.value || item.dataset.grupoServico || item.dataset.categoria,
            grupoServicoNome: item.dataset.grupoServicoNome || "",
            tipoItem: item.querySelector("[name='tipoItem']")?.value || item.dataset.tipoItem || item.dataset.subcategoria,
            tipoItemNome: item.querySelector("[name='tipoItem']")?.selectedOptions?.[0]?.textContent || item.dataset.tipoItemNome || "",
            subtipoItem: item.querySelector("[name='subtipoItem']")?.value || "",
            dependencias: this.obterDependenciasItem(
                item.querySelector("[name='grupoServico']")?.value || item.dataset.grupoServico || item.dataset.categoria,
                item.querySelector("[name='tipoItem']")?.value || item.dataset.tipoItem || item.dataset.subcategoria
            ),
            tipoDimensao: this.normalizarTipoDimensao(
                item.querySelector("[name='tipoDimensao']")?.value || item.dataset.tipoDimensao,
                item.querySelector("[name='grupoServico']")?.value || item.dataset.grupoServico || item.dataset.categoria
            ),
            tamanhoPadraoSelecionado: item.querySelector("[name='tamanhoPadraoSelecionado']")?.value || "",
            tipoCalculo: item.dataset.tipoCalculo || "area_m2",
            descricao: item.querySelector("[name='descricao']")?.value || "",
            larguraCm: this.numero(item.querySelector("[name='larguraCm']")?.value, 0),
            alturaCm: this.numero(item.querySelector("[name='alturaCm']")?.value, 0),
            quantidade: this.numero(item.querySelector("[name='quantidade']")?.value, 1),
            unidade: item.querySelector("[name='unidade']")?.value || "m2",
            valorUnitario: this.numero(item.querySelector("[name='valorUnitario']")?.value, 0),
            percentualEngenharia: this.normalizarTipoDimensao(
                item.querySelector("[name='tipoDimensao']")?.value || item.dataset.tipoDimensao,
                item.querySelector("[name='grupoServico']")?.value || item.dataset.grupoServico || item.dataset.categoria
            ) === "engenharia"
                ? this.numero(item.querySelector("[name='percentualEngenharia']")?.value, 0)
                : 0,
            observacoes: item.querySelector("[name='observacoes']")?.value || ""
        }));
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

    normalizarNumeroOrcamento(valor) {
        return String(valor || "").trim();
    },

    criarClientesApoio() {
        return [
            this.normalizarClienteApoio({
                id: "cli_apoio_guiado",
                nome: "Cliente balcao",
                tipoPessoa: "fisica",
                telefonePrincipal: "7399819768",
                email: "cliente@exemplo.local"
            })
        ];
    },

    criarServicosApoio() {
        return [
            this.normalizarServicoApoio({
                id: "srv_apoio_box",
                nome: "Box de banheiro",
                categoria: "box",
                descricao: "Servico comercial temporario para fluxo guiado.",
                tipoCalculo: "area_m2",
                unidadeVenda: "m2",
                ativo: true
            }),
            this.normalizarServicoApoio({
                id: "srv_apoio_espelho",
                nome: "Espelho sob medida",
                categoria: "espelho",
                descricao: "Servico comercial temporario para fluxo guiado.",
                tipoCalculo: "area_m2",
                unidadeVenda: "m2",
                ativo: true
            })
        ];
    },

    criarProdutosApoio() {
        return [
            this.normalizarProdutoApoio({
                id: "prd_apoio_vidro_temperado",
                nome: "Vidro temperado 8mm",
                categoria: "vidro",
                subcategoria: "temperado",
                unidadeVenda: "m2",
                tipoCalculo: "area_m2",
                precoVenda: 420,
                ativo: true
            }),
            this.normalizarProdutoApoio({
                id: "prd_apoio_kit_box",
                nome: "Kit ferragens box",
                categoria: "ferragem",
                unidadeVenda: "unidade",
                tipoCalculo: "unidade",
                precoVenda: 180,
                ativo: true
            })
        ];
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

    criarProjetoApoio(cliente = {}) {
        const dados = {
            id: `prj_apoio_${cliente.id || "cliente"}`,
            numero: "PRJ-APOIO",
            codigo: "PRJ-APOIO",
            titulo: `Orcamento guiado - ${cliente.nome || "Cliente"}`,
            status: "rascunho",
            cliente: {
                id: cliente.id || "",
                nome: cliente.nome || "",
                telefone: cliente.telefonePrincipal || "",
                email: cliente.email || ""
            },
            obra: {
                endereco: "A definir",
                cidade: "Porto Seguro"
            }
        };

        return typeof ProjetoModel !== "undefined" && typeof ProjetoModel.normalizar === "function"
            ? ProjetoModel.normalizar(dados)
            : dados;
    },

    normalizarClienteApoio(dados) {
        return typeof ClienteModel !== "undefined" && typeof ClienteModel.normalizar === "function"
            ? ClienteModel.normalizar(dados)
            : dados;
    },

    normalizarServicoApoio(dados) {
        return typeof ServicoModel !== "undefined" && typeof ServicoModel.normalizar === "function"
            ? ServicoModel.normalizar(dados)
            : dados;
    },

    normalizarProdutoApoio(dados) {
        return typeof ProdutoModel !== "undefined" && typeof ProdutoModel.normalizar === "function"
            ? ProdutoModel.normalizar(dados)
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
    OrcamentoInteligenteController.iniciarTela();
});
