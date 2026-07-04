const Orcamento = {
    resetando: false,
    dadosAtuais: null,

    estadoVazio() {
        if (typeof OrcamentoModel !== "undefined") {
            return OrcamentoModel.normalizar({
                itens: [],
                totais: Calculos.calcularTotais([], {}),
                historico: []
            });
        }

        return {
            cliente: {
                nome: "",
                telefone: "",
                endereco: ""
            },
            itens: [],
            desconto: {
                tipo: "valor",
                valor: 0
            },
            observacoes: "",
            rascunhoItem: null,
            atualizadoEm: Util.agora()
        };
    },

    async iniciar() {
        await this.carregar();
        this.atualizarTela();
    },

    adicionarItem() {
        const valores = Storage.carregar(Config.storage.valores, {});
        const itemFormulario = Formulario.lerItem();

        if (!itemFormulario.tipoVidro) {
            alert("Informe o tipo de vidro.");
            return;
        }

        if (itemFormulario.largura <= 0 || itemFormulario.altura <= 0) {
            alert("Informe largura e altura maiores que zero.");
            return;
        }

        if (itemFormulario.quantidade <= 0) {
            alert("Informe uma quantidade válida.");
            return;
        }

        const itemCalculado = Calculos.calcularItem(itemFormulario, valores);

        Itens.adicionar(itemCalculado);

        Formulario.limparItem();

        this.atualizarTela();
        this.salvar();
    },

    removerItem(indice) {
        Itens.remover(indice);

        this.atualizarTela();
        this.salvar();
    },

    atualizarTela() {
        Tabela.atualizar();

        const totais = Calculos.calcularTotais(
            Itens.todos(),
            Formulario.lerDesconto()
        );

        Formulario.preencherTotais(totais);
    },

    salvar() {
        if (this.resetando) return;

        const dados = typeof OrcamentoModel !== "undefined"
            ? OrcamentoModel.montar(this.dadosAtuais || {})
            : {
                cliente: Formulario.lerCliente(),
                itens: Itens.todos(),
                desconto: Formulario.lerDesconto(),
                observacoes: Formulario.lerObservacoes(),
                rascunhoItem: null,
                atualizadoEm: Util.agora(),
                atualizadoEmISO: new Date().toISOString()
            };

        this.dadosAtuais = dados;
        if (typeof OrcamentoUI !== "undefined") {
            OrcamentoUI.valor("dataAtualizacao", OrcamentoUI.formatarDataHora(dados.datas?.atualizacao));
        }

        Storage.salvar(Config.storage.orcamentoAtual, dados);
        this.salvarNaNuvem(dados, false);
    },

    async salvarNaNuvem(dados, mostrarAviso = false) {
        if (typeof OrcamentoStorage !== "undefined") {
            const salvo = await OrcamentoStorage.salvarAtual(dados);

            if (!salvo && mostrarAviso) {
                alert("Não foi possível salvar o orçamento na nuvem. Ele ficou salvo neste dispositivo.");
            }

            return salvo;
        }

        try {
            if (typeof db === "undefined" || !db) {
                throw new Error("Firebase não carregado. Verifique firebase-config.js.");
            }

            await db.collection("orcamentos")
                .doc("atual")
                .set(dados, { merge: true });

            return true;
        } catch (erro) {
            console.error("Erro ao salvar orçamento no Firestore:", erro);

            if (mostrarAviso) {
                alert("Não foi possível salvar o orçamento na nuvem. Ele ficou salvo neste dispositivo.");
            }

            return false;
        }
    },

    async carregarDaNuvem() {
        if (typeof OrcamentoStorage !== "undefined") {
            return OrcamentoStorage.carregarAtual();
        }

        try {
            if (typeof db === "undefined" || !db) {
                throw new Error("Firebase não carregado. Verifique firebase-config.js.");
            }

            const documento = await db.collection("orcamentos")
                .doc("atual")
                .get();

            if (!documento.exists) return null;

            return documento.data();
        } catch (erro) {
            console.error("Erro ao carregar orçamento do Firestore:", erro);
            return null;
        }
    },

    async carregar() {
        let dados = await this.carregarDaNuvem();

        if (dados) {
            Storage.salvar(Config.storage.orcamentoAtual, dados);
        } else {
            dados = Storage.carregar(Config.storage.orcamentoAtual, null);
        }

        if (!dados) {
            Itens.carregar([]);
            this.dadosAtuais = this.estadoVazio();
            if (typeof OrcamentoUI !== "undefined") {
                OrcamentoUI.preencherFormulario(this.dadosAtuais);
            }
            return;
        }

        const normalizado = typeof OrcamentoModel !== "undefined" ? OrcamentoModel.normalizar(dados) : dados;
        this.dadosAtuais = normalizado;

        Itens.carregar(Array.isArray(normalizado.itens) ? normalizado.itens : []);

        if (typeof OrcamentoUI !== "undefined") {
            OrcamentoUI.preencherFormulario(normalizado);
            if (normalizado.rascunhoItem) {
                this.preencherRascunhoItem(normalizado.rascunhoItem);
            }
            return;
        }

        if (normalizado.cliente) {
            if (Util.$("cliente")) Util.$("cliente").value = normalizado.cliente.nome || "";
            if (Util.$("telefone")) Util.$("telefone").value = normalizado.cliente.telefone || "";
            if (Util.$("endereco")) Util.$("endereco").value = normalizado.cliente.endereco || "";
        }

        if (normalizado.desconto) {
            if (Util.$("tipoDesconto")) Util.$("tipoDesconto").value = normalizado.desconto.tipo || "valor";
            if (Util.$("desconto")) Util.$("desconto").value = normalizado.desconto.valor || 0;
        }

        if (Util.$("observacoes")) {
            Util.$("observacoes").value = normalizado.observacoes || "";
        }

        if (normalizado.rascunhoItem) {
            this.preencherRascunhoItem(normalizado.rascunhoItem);
        }
    },

    preencherRascunhoItem(rascunho) {
        if (!rascunho) return;

        if (Util.$("categoria") && rascunho.categoria) {
            Util.$("categoria").value = rascunho.categoria;
        }

        if (Util.$("descricaoItem") && rascunho.descricao) {
            Util.$("descricaoItem").value = rascunho.descricao;
        }

        const tipo = Util.$("tipoVidro");
        if (tipo && rascunho.tipoVidro) {
            const existeOpcao = Array.from(tipo.options).some(opcao => opcao.value === rascunho.tipoVidro);
            tipo.value = existeOpcao ? rascunho.tipoVidro : "Outro";
        }

        if (Util.$("largura") && rascunho.largura) {
            Util.$("largura").value = rascunho.largura;
        }

        if (Util.$("altura") && rascunho.altura) {
            Util.$("altura").value = rascunho.altura;
        }

        if (Util.$("quantidade") && rascunho.quantidade) {
            Util.$("quantidade").value = rascunho.quantidade;
        }

        if (Util.$("acessorios") && rascunho.acessorios) {
            Util.$("acessorios").value = rascunho.acessorios;
        }

        if (Util.$("valorM2") && rascunho.valorM2) {
            Util.$("valorM2").value = rascunho.valorM2;
        }

        if (Util.$("valorFerragens") && (rascunho.valorFerragens || rascunho.acessorios)) {
            Util.$("valorFerragens").value = rascunho.valorFerragens || rascunho.acessorios;
        }

        if (Util.$("valorServico") && rascunho.valorServico) {
            Util.$("valorServico").value = rascunho.valorServico;
        }

        if (Util.$("observacoesItem") && rascunho.observacoes) {
            Util.$("observacoesItem").value = rascunho.observacoes;
        }

        if (typeof Eventos !== "undefined" && Eventos.atualizarPrevia) {
            Eventos.atualizarPrevia();
        }
    },

    novo() {
        if (!confirm("Deseja iniciar um novo orçamento?")) {
            return;
        }

        this.resetarOrcamento();
    },

    resetarOrcamento() {
        this.resetando = true;

        // Apaga qualquer orçamento salvo no navegador.
        Storage.remover(Config.storage.orcamentoAtual);

        if (typeof db !== "undefined" && db) {
            db.collection("orcamentos").doc("atual").set(this.estadoVazio(), { merge: true })
                .catch(erro => console.error("Erro ao limpar orçamento na nuvem:", erro));
        }

        // Limpa a lista em memória e força o array vazio.
        Itens.limpar();
        Itens.carregar([]);

        // Limpa campos, tabela e totais.
        this.limparFormulario();
        Tabela.atualizar();
        Formulario.preencherTotais({
            quantidadeItens: 0,
            areaTotalM2: 0,
            subtotal: 0,
            desconto: 0,
            descontoTotal: 0,
            total: 0,
            totalFinal: 0
        });

        // Salva um estado vazio para impedir que um orçamento antigo volte ao recarregar a página.
        this.dadosAtuais = this.estadoVazio();
        Storage.salvar(Config.storage.orcamentoAtual, this.dadosAtuais);

        if (typeof OrcamentoUI !== "undefined") {
            OrcamentoUI.preencherFormulario(this.dadosAtuais);
        }

        this.resetando = false;

        const primeiroCampo = Util.$("cliente");
        if (primeiroCampo) primeiroCampo.focus();
    },

    limparOrcamentoAtual() {
        this.resetarOrcamento();
    },

    limparFormulario() {
        const form = Util.$("formOrcamento") || document;

        ["numeroOrcamento", "dataCriacao", "dataValidade", "vendedor", "cliente", "telefone", "email", "endereco", "enderecoObra", "largura", "altura", "area", "descricaoItem", "valorM2", "valorFerragens", "valorServico", "totalItem", "valorVidro", "valorCor", "aluminio", "despesa", "acessorios", "desconto", "descontoValor", "descontoPercentual", "acrescimo", "instalacao", "frete", "entradaPagamento", "parcelasPagamento", "custoVidro", "custoFerragens", "custoMaoObra", "custoTransporte", "comissao", "lucroBruto", "margemLucro"].forEach(id => {
            const campo = Util.$(id);
            if (campo) campo.value = "";
        });

        form.querySelectorAll("textarea").forEach(campo => {
            campo.value = "";
        });

        if (Util.$("espessura")) Util.$("espessura").selectedIndex = 0;
        if (Util.$("cor")) Util.$("cor").selectedIndex = 0;
        if (Util.$("categoria")) Util.$("categoria").selectedIndex = 0;
        if (Util.$("tipoVidro")) Util.$("tipoVidro").selectedIndex = 0;
        if (Util.$("tipoDesconto")) Util.$("tipoDesconto").value = "valor";
        if (Util.$("statusOrcamento")) Util.$("statusOrcamento").value = "rascunho";
        if (Util.$("formaPagamento")) Util.$("formaPagamento").value = "";

        if (Util.$("quantidade")) Util.$("quantidade").value = "1";
        if (Util.$("desconto")) Util.$("desconto").value = "0";
        if (Util.$("descontoValor")) Util.$("descontoValor").value = "0";
        if (Util.$("descontoPercentual")) Util.$("descontoPercentual").value = "0";
        if (Util.$("acrescimo")) Util.$("acrescimo").value = "0";
        if (Util.$("instalacao")) Util.$("instalacao").value = "0";
        if (Util.$("frete")) Util.$("frete").value = "0";
        if (Util.$("entradaPagamento")) Util.$("entradaPagamento").value = "0";
        if (Util.$("parcelasPagamento")) Util.$("parcelasPagamento").value = "1";
        if (Util.$("custoVidro")) Util.$("custoVidro").value = "0";
        if (Util.$("custoFerragens")) Util.$("custoFerragens").value = "0";
        if (Util.$("custoMaoObra")) Util.$("custoMaoObra").value = "0";
        if (Util.$("custoTransporte")) Util.$("custoTransporte").value = "0";
        if (Util.$("comissao")) Util.$("comissao").value = "0";
        if (Util.$("resultado")) Util.$("resultado").textContent = Util.moeda(0);
    }
};
