const OrcamentoInteligenteController = {
    contexto: null,
    etapaAtual: "cliente",
    etapas: ["cliente", "projeto", "servico", "produtos", "calculo", "resumo"],
    dados: {
        clientes: [],
        projetos: [],
        servicos: [],
        produtos: []
    },

    async iniciarTela() {
        OrcamentoInteligenteUI.iniciar();
        this.vincularEventos();
        await this.novoOrcamento();
    },

    vincularEventos() {
        const btnNovo = OrcamentoInteligenteUI.elementos.btnNovo;
        if (btnNovo) {
            btnNovo.addEventListener("click", () => this.novoOrcamento());
        }

        const modulo = OrcamentoInteligenteUI.elementos.modulo || document;
        modulo.addEventListener("submit", evento => this.processarFormulario(evento));
        modulo.addEventListener("click", evento => this.processarAcao(evento));
    },

    async novoOrcamento() {
        const resultado = await this.criarContexto();
        this.contexto = resultado.contexto;
        this.etapaAtual = "cliente";
        await this.carregarDados();
        this.renderizarEtapaAtual();
        this.atualizarResumo();

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

        if (tipo === "projeto") {
            await this.selecionarProjeto(dados.get("projetoId"));
            return;
        }

        if (tipo === "servico") {
            await this.selecionarServico(dados.get("servicoId"));
            return;
        }

        if (tipo === "produto") {
            await this.adicionarProduto(dados.get("produtoId"));
            return;
        }

        if (tipo === "calculo") {
            await this.calcularOrcamento(this.extrairDadosCalculo(dados));
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

        if (acao === "remover-produto") {
            await this.removerProduto(Number(botao.dataset.indice));
            return;
        }

        if (acao === "validar-orcamento") {
            await this.validarOrcamento();
            return;
        }

        if (acao === "finalizar-orcamento") {
            await this.finalizarOrcamento();
        }
    },

    async selecionarCliente(clienteId) {
        const cliente = this.obterClientePorId(clienteId);
        if (!cliente) {
            this.mostrarAviso("Cliente nao selecionado.", "erro");
            return;
        }

        const resultado = await OrcamentoOrchestrator.selecionarCliente(this.contexto, cliente);
        this.aplicarResultado(resultado, "projeto");
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
        this.aplicarResultado(resultado, "produtos");
    },

    async adicionarProduto(produtoId) {
        const produto = this.obterProdutoPorId(produtoId);
        if (!produto) {
            this.mostrarAviso("Produto nao selecionado.", "erro");
            return;
        }

        const resultado = await OrcamentoOrchestrator.adicionarProduto(this.contexto, produto);
        this.aplicarResultado(resultado, "produtos");
    },

    async removerProduto(indice) {
        const resultado = await OrcamentoOrchestrator.removerProduto(this.contexto, { indice });
        this.aplicarResultado(resultado, "produtos");
    },

    async calcularOrcamento(dadosCalculo = {}) {
        if (!this.contexto?.produtos?.length) {
            this.mostrarAviso("Sem produtos para calcular.", "erro");
            return;
        }

        const resultado = typeof CalcularOrcamentoUseCase !== "undefined"
            ? await CalcularOrcamentoUseCase.executar(this.contexto, dadosCalculo)
            : await OrcamentoOrchestrator.calcular(this.contexto, dadosCalculo);

        this.aplicarResultado(resultado, resultado.sucesso ? "resumo" : "calculo");
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

    async validarOrcamento() {
        const resultado = await OrcamentoOrchestrator.validar(this.contexto || {});
        this.contexto = resultado.contexto;
        this.renderizarEtapaAtual();
        this.atualizarResumo();

        if (!resultado.sucesso) {
            this.mostrarAviso(resultado.erros.join(" "), "erro");
        } else {
            this.mostrarAviso("Orcamento validado para finalizacao.", "info");
        }

        return resultado;
    },

    async finalizarOrcamento() {
        await this.atualizarComplementos(this.coletarComplementosDaTela(), { silencioso: true });

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
        }

        return resultado;
    },

    avancarEtapa() {
        const indice = this.etapas.indexOf(this.etapaAtual);
        const proxima = this.etapas[indice + 1];

        if (!proxima) return;

        const bloqueio = this.obterBloqueioEtapa(proxima);
        if (bloqueio) {
            this.mostrarAviso(bloqueio, "erro");
            return;
        }

        this.etapaAtual = proxima;
        this.renderizarEtapaAtual();
    },

    voltarEtapa() {
        const indice = this.etapas.indexOf(this.etapaAtual);
        const anterior = this.etapas[indice - 1];

        if (!anterior) return;

        this.etapaAtual = anterior;
        this.renderizarEtapaAtual();
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
        }
    },

    mostrarAviso(mensagem, tipo = "info") {
        OrcamentoInteligenteUI.mostrarAviso(mensagem, tipo);
    },

    async atualizarComplementos(complementos = {}, opcoes = {}) {
        const resultado = await OrcamentoOrchestrator.atualizarComplementos(this.contexto || {}, complementos);
        this.contexto = resultado.contexto;

        if (!opcoes.silencioso) {
            this.renderizarEtapaAtual();
            this.atualizarResumo();
            this.mostrarAviso("Complementos do orcamento atualizados.", "info");
        }

        return resultado;
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
        try {
            if (typeof ClienteService !== "undefined" && typeof ClienteService.listarClientes === "function") {
                const resultado = await ClienteService.listarClientes({ status: "ativo" });
                if (resultado.sucesso && resultado.clientes.length) {
                    return resultado.clientes;
                }
            }
        } catch (erro) {
            console.warn("Nao foi possivel listar Clientes para o fluxo guiado.", erro);
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

        return [];
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

        return this.criarProdutosApoio();
    },

    obterClientesDisponiveis() {
        return this.dados.clientes || [];
    },

    obterProjetosDisponiveis() {
        const projetos = this.dados.projetos || [];
        const cliente = this.contexto?.cliente || null;

        if (!cliente) return projetos;

        const filtrados = projetos.filter(projeto => this.projetoPertenceAoCliente(projeto, cliente));
        return filtrados.length ? filtrados : [this.criarProjetoApoio(cliente)];
    },

    obterServicosDisponiveis() {
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

    obterServicoPorId(id) {
        return this.obterPorId(this.obterServicosDisponiveis(), id);
    },

    obterProdutoPorId(id) {
        return this.obterPorId(this.obterProdutosDisponiveis(), id);
    },

    obterPorId(lista = [], id) {
        return (lista || []).find(item => item.id === id) || null;
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
        if (etapa === "produtos" && !contexto.servico) return "Servico nao selecionado.";
        if (etapa === "calculo" && !produtos.length) return "Sem produtos.";
        if (etapa === "resumo" && !contexto.resultado?.sucesso) return "Calculo pendente.";
        return "";
    },

    extrairDadosCalculo(dados) {
        return {
            tipoCalculo: dados.get("tipoCalculo"),
            quantidade: this.numero(dados.get("quantidade"), 1),
            largura: this.numero(dados.get("largura"), 0),
            altura: this.numero(dados.get("altura"), 0),
            comprimento: this.numero(dados.get("comprimento"), 0),
            valorUnitario: this.numero(dados.get("valorUnitario"), 0),
            observacoes: String(dados.get("observacoes") || "").trim()
        };
    },

    extrairComplementos(dados) {
        return {
            observacoes: {
                livre: dados.get("observacaoLivre"),
                comerciais: dados.get("observacoesComerciais"),
                tecnicas: dados.get("observacoesTecnicas")
            },
            condicoesComerciais: {
                formaPagamento: dados.get("formaPagamento"),
                prazoEntrega: dados.get("prazoEntrega"),
                validadeProposta: dados.get("validadeProposta")
            }
        };
    },

    coletarComplementosDaTela() {
        const form = document.querySelector("[data-orcamento-form='complementos']");
        if (!form) {
            return {
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
