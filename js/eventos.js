const Eventos = {

    iniciar() {
        this.botaoAdicionar();
        this.botaoNovo();
        this.botaoPDF();
        this.camposCalculo();
        this.camposDesconto();
        this.camposOrcamento();
    },

    botaoAdicionar() {
        const btn = Util.$("btnAdicionarItem");

        if (!btn) return;

        btn.addEventListener("click", () => {
            Orcamento.adicionarItem();
        });
    },

    botaoNovo() {
        const btn = Util.$("btnNovoOrcamento");

        if (!btn) return;

        btn.addEventListener("click", () => {
            Orcamento.novo();
        });
    },

    botaoPDF() {
        const btn = Util.$("btnGerarPDF");

        if (!btn) return;

        btn.addEventListener("click", () => {
            PDF.gerar();
        });
    },

    camposCalculo() {
        const campos = [
            "tipoVidro",
            "espessura",
            "cor",
            "largura",
            "altura",
            "quantidade",
            "acessorios"
        ];

        campos.forEach(id => {
            const campo = Util.$(id);

            if (!campo) return;

            campo.addEventListener("input", () => {
                this.atualizarPrevia();
            });

            campo.addEventListener("change", () => {
                this.atualizarPrevia();
            });
        });
    },

    camposDesconto() {
        const campos = ["tipoDesconto", "desconto"];

        campos.forEach(id => {
            const campo = Util.$(id);

            if (!campo) return;

            campo.addEventListener("input", () => {
                Orcamento.atualizarTela();
                Orcamento.salvar();
            });

            campo.addEventListener("change", () => {
                Orcamento.atualizarTela();
                Orcamento.salvar();
            });
        });
    },

    camposOrcamento() {
        const campos = [
            "cliente",
            "telefone",
            "endereco",
            "observacoes"
        ];

        campos.forEach(id => {
            const campo = Util.$(id);

            if (!campo) return;

            campo.addEventListener("input", () => {
                Orcamento.salvar();
            });

            campo.addEventListener("change", () => {
                Orcamento.salvar();
            });
        });
    },

    atualizarPrevia() {
        const valores = Storage.carregar(Config.storage.valores, {});
        const item = Formulario.lerItem();

        if (!item.largura || !item.altura) {
            if (Util.$("area")) Util.$("area").value = "";
            if (Util.$("resultado")) Util.$("resultado").textContent = Util.moeda(0);
            return;
        }

        const calculado = Calculos.calcularItem(item, valores);

        Formulario.preencherCalculo(calculado);
    }

};
