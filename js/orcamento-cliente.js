const OrcamentoCliente = {
    chaveSolicitacoes: Config.storage.solicitacoesSite,
    itens: [],
    valores: {},

    async iniciar() {
        await this.carregarValores();
        this.registrarEventos();
        this.atualizarPrevia();
        this.atualizarTabela();
    },

    async carregarValores() {
        try {
            if (typeof db !== "undefined" && db) {
                const doc = await db.collection("configuracoes").doc("valores").get();
                if (doc.exists) {
                    this.valores = doc.data() || {};
                    Storage.salvar(Config.storage.valores, this.valores);
                    return;
                }
            }
        } catch (erro) {
            console.warn("Não foi possível carregar valores da nuvem. Usando valores locais.", erro);
        }

        this.valores = Storage.carregar(Config.storage.valores, {});
    },

    registrarEventos() {
        const form = Util.$("formSolicitacaoOrcamento");
        if (form) {
            form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.enviarSolicitacao();
            });
        }

        const btnAdicionar = Util.$("btnAdicionarItemCliente");
        if (btnAdicionar) {
            btnAdicionar.addEventListener("click", () => this.adicionarItem());
        }

        const fecharPopup = Util.$("fecharPopupSolicitacao");
        if (fecharPopup) fecharPopup.addEventListener("click", () => this.fecharPopupSucesso());

        ["tipoVidro", "espessura", "cor", "largura", "altura", "quantidade"].forEach(id => {
            const campo = Util.$(id);
            if (!campo) return;
            campo.addEventListener("input", () => this.atualizarPrevia());
            campo.addEventListener("change", () => this.atualizarPrevia());
        });
    },

    lerItem() {
        return {
            tipoVidro: Util.$("tipoVidro")?.value || "",
            espessura: Util.$("espessura")?.value || "4",
            cor: Util.$("cor")?.value || "incolor",
            largura: Util.numero(Util.$("largura")?.value),
            altura: Util.numero(Util.$("altura")?.value),
            quantidade: Math.max(1, Util.numero(Util.$("quantidade")?.value || 1)),
            acessorios: 0
        };
    },

    lerCliente() {
        return {
            nome: Util.$("cliente")?.value.trim() || "",
            telefone: Util.$("telefone")?.value.trim() || "",
            email: Util.$("email")?.value.trim() || "",
            endereco: Util.$("endereco")?.value.trim() || ""
        };
    },

    atualizarPrevia() {
        const item = this.lerItem();

        if (!item.largura || !item.altura) {
            this.valorCampo("area", "");
            return;
        }

        const area = Calculos.calcularArea(item.largura, item.altura);
        this.valorCampo("area", `${Util.decimal(area, 3)} m²`);
    },

    adicionarItem() {
        const item = this.lerItem();

        if (!item.tipoVidro) {
            alert("Escolha o tipo do item.");
            return;
        }

        if (item.largura <= 0 || item.altura <= 0) {
            alert("Informe largura e altura maiores que zero.");
            return;
        }

        if (item.quantidade <= 0) {
            alert("Informe uma quantidade válida.");
            return;
        }

        const calculado = Calculos.calcularItem(item, this.valores);
        this.itens.push(calculado);
        this.limparItem();
        this.atualizarTabela();
        this.atualizarPrevia();
    },

    excluirItem(indice) {
        this.itens.splice(indice, 1);
        this.atualizarTabela();
    },

    atualizarTabela() {
        const tbody = document.querySelector("#tabelaItensCliente tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        this.itens.forEach((item, indice) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="item-numero">${indice + 1}</span></td>
                <td><strong>${item.tipoVidro || "Produto"}</strong></td>
                <td>${item.largura || "?"} × ${item.altura || "?"} cm</td>
                <td>${item.espessura || ""} mm</td>
                <td><span class="tag-cor">${item.cor || ""}</span></td>
                <td>${item.quantidade || 1}</td>
                <td>${Util.decimal(item.area, 3)} m²</td>
                <td><button type="button" class="btn-tabela-excluir" onclick="OrcamentoCliente.excluirItem(${indice})">Remover</button></td>
            `;
            tbody.appendChild(tr);
        });

        const total = this.itens.reduce((soma, item) => soma + Util.numero(item.total), 0);
        this.texto("totalItensCliente", String(this.itens.length));
    },

    limparItem() {
        ["tipoVidro", "largura", "altura", "area"].forEach(id => {
            const campo = Util.$(id);
            if (campo) campo.value = "";
        });

        const qtd = Util.$("quantidade");
        if (qtd) qtd.value = 1;
    },

    async enviarSolicitacao() {
        const btnEnviar = document.querySelector('#formSolicitacaoOrcamento button[type="submit"]');
        const mensagem = Util.$("mensagemSolicitacao");
        if (btnEnviar) {
            btnEnviar.disabled = true;
            btnEnviar.dataset.textoOriginal = btnEnviar.dataset.textoOriginal || btnEnviar.textContent;
            btnEnviar.textContent = "Enviando pedido...";
        }
        if (mensagem) {
            mensagem.textContent = "Enviando seu pedido, aguarde...";
            mensagem.classList.remove("erro");
        }

        try {
        const cliente = this.lerCliente();
        const observacoes = Util.$("observacoes")?.value || "";

        if (!cliente.nome || !cliente.telefone) {
            this.mostrarAviso("Informe nome e telefone para enviarmos o retorno.", true);
            return;
        }

        if (!this.itens.length) {
            this.mostrarAviso("Adicione pelo menos um produto ao orçamento antes de enviar.", true);
            return;
        }

        const subtotal = this.itens.reduce((soma, item) => soma + Util.numero(item.total), 0);
        const pedido = {
            origem: "orcamento_cliente",
            cliente,
            nome: cliente.nome,
            telefone: cliente.telefone,
            email: cliente.email,
            endereco: cliente.endereco,
            itens: this.itens,
            servico: this.itens.map(i => i.tipoVidro).join(", "),
            quantidadeItens: this.itens.length,
            subtotal: Util.arredondar(subtotal, 2),
            desconto: { tipo: "valor", valor: 0 },
            observacoes,
            descricao: observacoes,
            mensagem: this.montarMensagem(cliente, observacoes),
            data: Util.agora(),
            criadoEmISO: new Date().toISOString(),
            status: "Solicitado"
        };

        await this.salvarSolicitacao(pedido);

        this.itens = [];
        this.atualizarTabela();
        const form = Util.$("formSolicitacaoOrcamento");
        if (form) form.reset();
        this.atualizarPrevia();

        this.mostrarAviso("Pedido enviado com sucesso! A RK Vidraçaria recebeu suas informações.");
        this.mostrarPopupSucesso();
        } catch (erro) {
            console.error("Erro ao enviar pedido:", erro);
            this.mostrarAviso("Não foi possível enviar agora. Confira os campos e tente novamente.", true);
        } finally {
            if (btnEnviar) {
                btnEnviar.disabled = false;
                btnEnviar.textContent = btnEnviar.dataset.textoOriginal || "Enviar pedido para RK Vidraçaria";
            }
        }
    },

    async salvarSolicitacao(pedido) {
        const locais = Storage.carregar(this.chaveSolicitacoes, []);
        locais.push(pedido);
        Storage.salvar(this.chaveSolicitacoes, locais);

        try {
            if (typeof db === "undefined" || !db) throw new Error("Serviço temporariamente indisponível");
            const ref = await db.collection("solicitacoes_site").add(pedido);
            pedido.idFirestore = ref.id;
            locais[locais.length - 1] = pedido;
            Storage.salvar(this.chaveSolicitacoes, locais);
        } catch (erro) {
            console.warn("Não foi possível enviar para a nuvem. Pedido salvo localmente para teste.", erro);
            pedido.modoLocal = true;
            locais[locais.length - 1] = pedido;
            Storage.salvar(this.chaveSolicitacoes, locais);
        }
    },

    montarMensagem(cliente, observacoes) {
        const linhas = [
            `Cliente: ${cliente.nome}`,
            `Telefone: ${cliente.telefone}`,
            `Itens: ${this.itens.length}`,
            `Total estimado: ${Util.moeda(this.itens.reduce((soma, item) => soma + Util.numero(item.total), 0))}`
        ];

        this.itens.forEach((item, indice) => {
            linhas.push(`${indice + 1}. ${item.tipoVidro} ${item.altura}x${item.largura}cm | Qtd ${item.quantidade} | ${Util.moeda(item.total)}`);
        });

        if (observacoes) linhas.push(`Observações: ${observacoes}`);
        return linhas.join("\n");
    },

    mostrarAviso(texto, erro = false) {
        const mensagem = Util.$("mensagemSolicitacao");
        if (mensagem) {
            mensagem.textContent = texto;
            mensagem.classList.toggle("erro", !!erro);
        }
    },

    mostrarPopupSucesso() {
        const popup = Util.$("popupSolicitacao");
        if (!popup) return;
        popup.classList.add("ativo");
        window.setTimeout(() => popup.classList.remove("ativo"), 6000);
    },

    fecharPopupSucesso() {
        const popup = Util.$("popupSolicitacao");
        if (popup) popup.classList.remove("ativo");
    },

    valorCampo(id, valor) {
        const campo = Util.$(id);
        if (campo) campo.value = valor;
    },

    texto(id, valor) {
        const el = Util.$(id);
        if (el) el.textContent = valor;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    OrcamentoCliente.iniciar();
});
