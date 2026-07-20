const PdfValidator = {
    validar(dados = {}) {
        const modelo = typeof PdfModel !== "undefined" ? PdfModel.criar(dados) : dados;
        const erros = [];

        this.validarCliente(modelo.cliente, erros);
        this.validarServico(modelo.servico, erros);
        this.validarProdutos(modelo.produtos, erros);
        this.validarTotais(modelo.totais, erros);

        return {
            valido: erros.length === 0,
            erros
        };
    },

    validarCliente(cliente = {}, erros = []) {
        if (!cliente || !cliente.nome) {
            erros.push("Cliente e obrigatorio para preparar o PDF Comercial.");
        }
    },

    validarServico(servico = {}, erros = []) {
        if (!servico || !servico.nome) {
            erros.push("Servico e obrigatorio para preparar o PDF Comercial.");
        }
    },

    validarProdutos(produtos = [], erros = []) {
        if (!Array.isArray(produtos) || !produtos.length) {
            erros.push("Pelo menos um produto e obrigatorio para preparar o PDF Comercial.");
        }
    },

    validarTotais(totais = {}, erros = []) {
        if (!totais || !totais.totalInformado || typeof totais.totalGeral !== "number") {
            erros.push("Totais do orcamento sao obrigatorios para preparar o PDF Comercial.");
            return;
        }

        if (totais.totalGeral < 0) {
            erros.push("Total geral do PDF Comercial nao pode ser negativo.");
        }
    }
};
