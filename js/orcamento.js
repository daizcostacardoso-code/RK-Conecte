const Orcamento = {
    resetando: false,

    estadoVazio() {
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

        const dados = {
            cliente: Formulario.lerCliente(),
            itens: Itens.todos(),
            desconto: Formulario.lerDesconto(),
            observacoes: Formulario.lerObservacoes(),
            rascunhoItem: null,
            atualizadoEm: Util.agora(),
            atualizadoEmISO: new Date().toISOString()
        };

        Storage.salvar(Config.storage.orcamentoAtual, dados);
        this.salvarNaNuvem(dados, false);
    },

    async salvarNaNuvem(dados, mostrarAviso = false) {
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
            return;
        }

        Itens.carregar(Array.isArray(dados.itens) ? dados.itens : []);

        if (dados.cliente) {
            if (Util.$("cliente")) Util.$("cliente").value = dados.cliente.nome || "";
            if (Util.$("telefone")) Util.$("telefone").value = dados.cliente.telefone || "";
            if (Util.$("endereco")) Util.$("endereco").value = dados.cliente.endereco || "";
        }

        if (dados.desconto) {
            if (Util.$("tipoDesconto")) Util.$("tipoDesconto").value = dados.desconto.tipo || "valor";
            if (Util.$("desconto")) Util.$("desconto").value = dados.desconto.valor || 0;
        }

        if (Util.$("observacoes")) {
            Util.$("observacoes").value = dados.observacoes || "";
        }

        if (dados.rascunhoItem) {
            this.preencherRascunhoItem(dados.rascunhoItem);
        }
    },

    preencherRascunhoItem(rascunho) {
        if (!rascunho) return;

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
            subtotal: 0,
            desconto: 0,
            total: 0
        });

        // Salva um estado vazio para impedir que um orçamento antigo volte ao recarregar a página.
        Storage.salvar(Config.storage.orcamentoAtual, this.estadoVazio());

        this.resetando = false;

        const primeiroCampo = Util.$("cliente");
        if (primeiroCampo) primeiroCampo.focus();
    },

    limparOrcamentoAtual() {
        this.resetarOrcamento();
    },

    limparFormulario() {
        const form = Util.$("formOrcamento") || document;

        ["cliente", "telefone", "endereco", "largura", "altura", "area", "valorVidro", "valorCor", "aluminio", "despesa", "acessorios", "desconto"].forEach(id => {
            const campo = Util.$(id);
            if (campo) campo.value = "";
        });

        form.querySelectorAll("textarea").forEach(campo => {
            campo.value = "";
        });

        if (Util.$("espessura")) Util.$("espessura").selectedIndex = 0;
        if (Util.$("cor")) Util.$("cor").selectedIndex = 0;
        if (Util.$("tipoVidro")) Util.$("tipoVidro").selectedIndex = 0;
        if (Util.$("tipoDesconto")) Util.$("tipoDesconto").value = "valor";

        if (Util.$("quantidade")) Util.$("quantidade").value = "1";
        if (Util.$("desconto")) Util.$("desconto").value = "0";
        if (Util.$("resultado")) Util.$("resultado").textContent = Util.moeda(0);
    }
};
