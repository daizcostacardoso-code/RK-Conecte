const ServicoController = {
    buscaTimer: null,
    produtosDisponiveis: [],

    async iniciar() {
        this.configurarServicoService();

        ServicoUI.iniciar({
            aoFiltrarServicos: filtros => this.agendarBusca(filtros),
            aoSalvarServico: dados => this.salvarServico(dados),
            aoSelecionarServico: id => this.selecionarServico(id),
            aoEditarServico: id => this.editarServico(id),
            aoInativarServico: id => this.inativarServico(id)
        });

        this.produtosDisponiveis = await this.listarProdutosAtivos();
        ServicoUI.definirProdutosDisponiveis(this.produtosDisponiveis);
        await this.listarServicos();
    },

    async recarregarProdutosDisponiveis() {
        this.produtosDisponiveis = await this.listarProdutosAtivos();

        if (typeof ServicoUI !== "undefined" && typeof ServicoUI.definirProdutosDisponiveis === "function") {
            ServicoUI.definirProdutosDisponiveis(this.produtosDisponiveis);
        }

        return this.produtosDisponiveis;
    },

    configurarServicoService() {
        if (typeof ServicoRepository !== "undefined" && !ServicoRepository.adapter) {
            const adapter = typeof criarFirestoreAdapter === "function"
                ? criarFirestoreAdapter()
                : typeof FirestoreAdapter !== "undefined"
                    ? FirestoreAdapter
                    : null;

            if (adapter) {
                ServicoRepository.configurar(adapter);
            }
        }

        if (typeof ServicoService !== "undefined" && typeof ServicoService.configurar === "function") {
            ServicoService.configurar(ServicoRepository);
        }

        if (typeof ProdutoService !== "undefined" && typeof ProdutoService.configurar === "function") {
            ProdutoService.configurar(ProdutoRepository);
        }
    },

    agendarBusca(filtros = {}) {
        window.clearTimeout(this.buscaTimer);
        this.buscaTimer = window.setTimeout(() => this.listarServicos(filtros), 160);
    },

    async garantirServicosBase() {
        const resultado = await this.executarListagem({});
        const existentes = resultado.sucesso ? resultado.servicos || [] : [];
        const idsExistentes = new Set(existentes.map(servico => servico.id));
        const bases = this.servicosBase().filter(servico => !idsExistentes.has(servico.id));

        if (!bases.length) {
            return false;
        }

        await Promise.all(bases.map(servico => this.executarCriacao(servico)));
        return true;
    },

    async listarProdutosAtivos() {
        if (typeof ProdutoService === "undefined" || typeof ProdutoService.listarProdutos !== "function") {
            return [];
        }

        const resultado = await ProdutoService.listarProdutos({ status: "ativo" });
        return resultado.sucesso ? resultado.produtos : [];
    },

    async salvarServico(dados = {}) {
        ServicoUI.definirCarregando(true);
        ServicoUI.mostrarAviso("");

        const resultado = dados.id
            ? await this.executarAtualizacao(dados.id, dados)
            : await this.executarCriacao(dados);

        ServicoUI.definirCarregando(false);

        if (!resultado.sucesso) {
            ServicoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ServicoUI.mostrarAviso(dados.id ? "Item atualizado com sucesso." : "Item cadastrado com sucesso.", "sucesso");
        ServicoUI.limparFormulario();
        await this.listarServicos(ServicoUI.obterFiltros());
        await this.selecionarServico(resultado.servico.id);
        return resultado;
    },

    async listarServicos(filtros = {}) {
        ServicoUI.renderizarCarregamentoLista("Carregando itens...");
        ServicoUI.mostrarAviso("Carregando itens...", "info");
        const resultado = await this.executarListagem(filtros);

        if (!resultado.sucesso) {
            ServicoUI.renderizarLista([]);
            ServicoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ServicoUI.renderizarLista(resultado.servicos || []);
        ServicoUI.mostrarAviso("");
        return resultado;
    },

    async selecionarServico(id) {
        const resultado = await this.executarBusca(id);

        if (!resultado.sucesso) {
            ServicoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ServicoUI.renderizarDetalhe(resultado.servico);
        return resultado;
    },

    async editarServico(id) {
        const resultado = await this.selecionarServico(id);

        if (resultado.sucesso) {
            ServicoUI.preencherFormulario(resultado.servico);
        }

        return resultado;
    },

    async inativarServico(id) {
        const resultado = await this.executarExclusao(id);

        if (!resultado.sucesso) {
            ServicoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ServicoUI.mostrarAviso("Item inativado.", "sucesso");
        await this.listarServicos(ServicoUI.obterFiltros());
        await this.selecionarServico(id);
        return resultado;
    },

    executarCriacao(dados) {
        if (typeof CriarServicoUseCase !== "undefined") {
            return CriarServicoUseCase.executar(dados, ServicoService);
        }

        return ServicoService.criarServico(dados);
    },

    executarAtualizacao(id, dados) {
        if (typeof AtualizarServicoUseCase !== "undefined") {
            return AtualizarServicoUseCase.executar(id, dados, ServicoService);
        }

        return ServicoService.atualizarServico(id, dados);
    },

    executarExclusao(id) {
        if (typeof ExcluirServicoUseCase !== "undefined") {
            return ExcluirServicoUseCase.executar(id, ServicoService);
        }

        return ServicoService.desativarServico(id);
    },

    executarListagem(filtros) {
        if (typeof ListarServicosUseCase !== "undefined") {
            return ListarServicosUseCase.executar(filtros, ServicoService);
        }

        return ServicoService.listarServicos(filtros);
    },

    executarBusca(id) {
        if (typeof BuscarServicoUseCase !== "undefined") {
            return BuscarServicoUseCase.executar(id, ServicoService);
        }

        return ServicoService.buscarServico(id);
    },

    servicosBase() {
        return [
            {
                id: "srv_macro_instalacao",
                nome: "Instalacao",
                categoria: "instalacao",
                descricao: "Macro categoria para instalar box, janelas, portas, espelhos, fachadas, guarda-corpo e vidro fixo.",
                tipoCalculo: "personalizado",
                unidadeVenda: "servico",
                dependenciasPadrao: this.dependenciasPorNome(["Vidro temperado 8mm", "Instalacao"]),
                tiposItem: [
                    this.tipoServico("instalacao_box_frontal", "Instalacao de box frontal", "Box frontal com vidro temperado, perfis, roldanas, puxador e vedacao.", 2, ["Vidro temperado 8mm", "Trilho box 8mm", "Caixa/tampa box", "Perfil lateral", "Perfil U", "Puxador", "Roldana", "Guia de box", "Batente", "Silicone neutro", "Vedacao", "Instalacao"], "Conferir prumo, folgas, nivelamento e cura do silicone."),
                    this.tipoServico("instalacao_janela", "Instalacao de janela", "Instalacao de janela de vidro com perfis e ferragens.", 3, ["Vidro temperado 8mm", "Trilho box 8mm", "Roldana", "Perfil lateral", "Vedacao", "Instalacao"], "Confirmar sentido de abertura e esquadro do vao."),
                    this.tipoServico("instalacao_porta", "Instalacao de porta", "Instalacao de porta de abrir ou correr em vidro.", 3, ["Vidro temperado 8mm", "Perfil lateral", "Puxador", "Vedacao", "Instalacao"], "Validar fechadura, puxador e folgas de giro/correr."),
                    this.tipoServico("instalacao_espelho", "Instalacao de espelho", "Instalacao de espelho com acabamento e fixacao.", 1.5, ["Vidro temperado 6mm", "Cola UV", "Instalacao"], "Verificar substrato, alinhamento e pontos de fixacao."),
                    this.tipoServico("instalacao_fachada", "Instalacao de fachada", "Instalacao de fachada e fechamento comercial.", 6, ["Vidro temperado 8mm", "Perfil U", "Perfil lateral", "Silicone neutro", "Vedacao", "Instalacao"], "Exigir conferencia tecnica antes da producao."),
                    this.tipoServico("instalacao_guarda_corpo", "Instalacao de guarda-corpo", "Instalacao de guarda-corpo em vidro temperado.", 5, ["Vidro temperado 8mm", "Perfil U", "Silicone neutro", "Instalacao"], "Validar altura final e ancoragem."),
                    this.tipoServico("instalacao_vidro_fixo", "Instalacao de vidro fixo", "Instalacao de vidro fixo em perfil ou baguete.", 2, ["Vidro temperado 8mm", "Perfil U", "Silicone neutro", "Vedacao", "Instalacao"], "Conferir folga tecnica e acabamento.")
                ],
                tamanhosPadrao: [
                    this.tamanho("porta_abrir_80x210", "Porta de abrir", "210 x 80 cm", 80, 210),
                    this.tamanho("porta_abrir_90x210", "Porta de abrir", "210 x 90 cm", 90, 210),
                    this.tamanho("porta_abrir_100x210", "Porta de abrir", "210 x 100 cm", 100, 210),
                    this.tamanho("porta_correr_120x210", "Porta de correr", "210 x 120 cm", 120, 210),
                    this.tamanho("porta_correr_150x210", "Porta de correr", "210 x 150 cm", 150, 210),
                    this.tamanho("porta_correr_180x210", "Porta de correr", "210 x 180 cm", 180, 210),
                    this.tamanho("janela_2_100x100", "Janela 2 folhas", "100 x 100 cm", 100, 100),
                    this.tamanho("janela_2_120x100", "Janela 2 folhas", "100 x 120 cm", 120, 100),
                    this.tamanho("janela_2_150x110", "Janela 2 folhas", "110 x 150 cm", 150, 110),
                    this.tamanho("janela_4_200x110", "Janela 4 folhas", "110 x 200 cm", 200, 110),
                    this.tamanho("janela_4_250x120", "Janela 4 folhas", "120 x 250 cm", 250, 120),
                    this.tamanho("janela_4_300x120", "Janela 4 folhas", "120 x 300 cm", 300, 120),
                    this.tamanho("box_frontal_120x190", "Box frontal", "190 x 120 cm", 120, 190),
                    this.tamanho("box_frontal_140x190", "Box frontal", "190 x 140 cm", 140, 190),
                    this.tamanho("box_frontal_160x190", "Box frontal", "190 x 160 cm", 160, 190)
                ],
                ativo: true
            },
            this.servicoMacro("srv_macro_manutencao", "Manutencao", "manutencao", "Manutencoes e reparos em sistemas existentes.", [
                this.tipoServico("troca_roldana", "Troca de roldana", "Substituicao de roldanas em box, janela ou porta de correr.", 1, ["Roldana", "Instalacao"], "Conferir trilho e alinhamento apos troca."),
                this.tipoServico("troca_vidro", "Troca de vidro", "Remocao e instalacao de novo vidro.", 2.5, ["Vidro temperado 8mm", "Silicone neutro", "Vedacao", "Instalacao"], "Confirmar medidas antes de produzir o vidro."),
                this.tipoServico("ajuste_porta", "Ajuste de porta", "Regulagem de porta de abrir ou correr.", 1, ["Instalacao"], "Verificar folgas, roldanas, puxador e fechamento."),
                this.tipoServico("reparo_box", "Reparo de box", "Reparo geral de box com troca de acessorios.", 1.5, ["Roldana", "Guia de box", "Batente", "Silicone neutro", "Instalacao"], "Avaliar necessidade de trocar perfis."),
                this.tipoServico("vedacao", "Vedacao", "Aplicacao ou substituicao de vedacao.", 1, ["Silicone neutro", "Vedacao", "Instalacao"], "Limpar a superficie antes da aplicacao."),
                this.tipoServico("revisao_geral", "Revisao geral", "Revisao tecnica de conjunto instalado.", 1.5, ["Instalacao"], "Registrar pontos de atencao para orcamento complementar.")
            ]),
            this.servicoMacro("srv_macro_limpeza", "Limpeza", "limpeza", "Limpezas tecnicas e acabamento pos-instalacao.", [
                this.tipoServico("limpeza_pos_obra", "Limpeza pos-obra", "Limpeza tecnica de vidro e perfis apos obra.", 1.5, ["Instalacao"], "Nao usar abrasivos em vidro ou aluminio."),
                this.tipoServico("limpeza_box", "Limpeza de box", "Limpeza e revisao visual de box.", 1, ["Instalacao"], "Sinalizar manchas, folgas ou vedacao comprometida.")
            ]),
            this.servicoMacro("srv_macro_medicao", "Medicao tecnica", "medicao_tecnica", "Visita para conferencia de medidas e viabilidade tecnica.", [
                this.tipoServico("medicao_box", "Medicao tecnica de box", "Medicao detalhada para box.", 1, ["Instalacao"], "Registrar altura, largura, prumo, esquadro e pontos hidraulicos."),
                this.tipoServico("medicao_fachada", "Medicao tecnica de fachada", "Medicao detalhada para fachada ou fechamento.", 2, ["Instalacao"], "Registrar condicoes de fixacao e acesso.")
            ]),
            this.servicoMacro("srv_macro_remocao", "Remocao", "remocao", "Remocoes e desmontagens antes de instalacao ou descarte.", [
                this.tipoServico("remocao_box", "Remocao de box", "Remocao segura de box existente.", 1, ["Instalacao"], "Proteger loucas, piso e metais."),
                this.tipoServico("remocao_vidro", "Remocao de vidro", "Remocao segura de vidro existente.", 1.5, ["Instalacao"], "Avaliar risco de quebra e descarte.")
            ]),
            this.servicoMacro("srv_macro_outros", "Outros", "outros", "Servicos sob medida ou nao classificados.", [
                this.tipoServico("outro_servico", "Outro servico", "Servico personalizado definido pelo usuario.", 1, ["Instalacao"], "Descrever escopo tecnico antes de orcar.")
            ])
        ];
    },

    servicoMacro(id, nome, categoria, descricao, tiposItem) {
        return {
            id,
            nome,
            categoria,
            descricao,
            tipoCalculo: "personalizado",
            unidadeVenda: "servico",
            dependenciasPadrao: this.dependenciasPorNome(["Instalacao"]),
            tiposItem,
            tamanhosPadrao: [],
            ativo: true
        };
    },

    tipoServico(id, nome, descricao, tempoMedio, produtos, observacoesTecnicas = "") {
        const dependencias = this.dependenciasPorNome(produtos)
            .map(dependencia => this.ajustarQuantidadeDependencia(dependencia, tempoMedio));

        return {
            id,
            nome,
            descricao,
            tempoMedio,
            unidadeTempo: "hora",
            ativo: true,
            dependencias,
            dependenciasPadrao: dependencias,
            observacoesTecnicas
        };
    },

    ajustarQuantidadeDependencia(dependencia, tempoMedio) {
        if (!dependencia) {
            return dependencia;
        }

        const regra = this.normalizarTexto(dependencia.regraCalculo);
        const unidade = this.normalizarTexto(dependencia.unidadeCalculo);
        const quantidadePadrao = regra === "hora" || unidade === "hora"
            ? Number(tempoMedio || 1)
            : dependencia.quantidadePadrao;
        const custoEstimado = this.calcularCustoEstimado(dependencia.custoUnitario, quantidadePadrao);

        return {
            ...dependencia,
            quantidadePadrao,
            custoEstimado
        };
    },

    dependenciasPorNome(nomes = []) {
        return nomes
            .map(nome => this.dependenciaPorNome(nome))
            .filter(Boolean);
    },

    dependenciaPorNome(nome, quantidadePadrao = 1) {
        const produto = this.produtosDisponiveis.find(item => this.normalizarTexto(item.nome) === this.normalizarTexto(nome))
            || this.produtosDisponiveis.find(item => this.normalizarTexto(item.nome).includes(this.normalizarTexto(nome)));

        if (!produto || produto.ativo === false) {
            return null;
        }

        return {
            produtoId: produto.id,
            produtoNome: produto.nome,
            categoria: produto.categoria,
            unidadeCalculo: produto.unidadeCalculo || produto.unidade || produto.unidadeVenda,
            regraCalculo: produto.regraCalculo || produto.tipoCalculo,
            quantidadePadrao,
            custoUnitario: this.obterCustoProduto(produto),
            custoEstimado: this.calcularCustoEstimado(this.obterCustoProduto(produto), quantidadePadrao),
            obrigatoria: true,
            observacao: ""
        };
    },

    obterCustoProduto(produto = {}) {
        return this.numero(produto.custoUnitario ?? produto.custo ?? produto.precoCusto);
    },

    calcularCustoEstimado(custoUnitario, quantidadePadrao) {
        return Number((this.numero(custoUnitario) * this.numero(quantidadePadrao)).toFixed(2));
    },

    tamanho(id, modeloRelacionado, nome, larguraCm, alturaCm) {
        return {
            id,
            tipoItem: modeloRelacionado,
            modeloRelacionado,
            nome,
            larguraCm,
            alturaCm,
            ativo: true
        };
    },

    normalizarTexto(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    numero(valor) {
        const numero = Number(String(valor ?? "").replace(",", "."));
        return Number.isFinite(numero) ? numero : 0;
    },

    formatarErros(erros = []) {
        if (!Array.isArray(erros) || !erros.length) {
            return "Nao foi possivel concluir a acao.";
        }

        return erros.join(" ");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("formServico")) {
        void (window.RKLoading?.initial
            ? RKLoading.initial(() => ServicoController.iniciar(), "Carregando servicos e produtos...")
            : ServicoController.iniciar());
    }
});
