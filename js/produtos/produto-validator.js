const ProdutoValidator = {
    validar(produto = {}) {
        const erros = [];

        if (!produto || typeof produto !== "object") {
            return {
                valido: false,
                erros: ["Produto invalido."]
            };
        }

        if (!String(produto.nome || "").trim()) {
            erros.push("Nome do produto e obrigatorio.");
        }

        if (!String(produto.categoria || "").trim()) {
            erros.push("Categoria do produto e obrigatoria.");
        } else if (!this.categoriaValida(produto.categoria)) {
            erros.push("Categoria do produto invalida.");
        }

        if (!String(produto.unidadeCalculo || produto.unidadeVenda || produto.unidade || "").trim()) {
            erros.push("Unidade de calculo do produto e obrigatoria.");
        } else if (!this.unidadeValida(produto.unidadeCalculo || produto.unidadeVenda || produto.unidade)) {
            erros.push("Unidade de calculo do produto invalida.");
        }

        if (!String(produto.tipoCalculo || "").trim()) {
            erros.push("Tipo de calculo do produto e obrigatorio.");
        } else if (!this.tipoCalculoValido(produto.tipoCalculo)) {
            erros.push("Tipo de calculo do produto invalido.");
        }

        if (!this.numeroNaoNegativo(produto.custoUnitario ?? produto.custo ?? produto.precoCusto)) {
            erros.push("Custo unitario do produto invalido.");
        }

        if (!this.statusValido(produto.ativo)) {
            erros.push("Status do produto invalido.");
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    categoriaValida(categoria) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.categoriaValida === "function") {
            return ProdutoModel.categoriaValida(categoria);
        }

        return !!categoria;
    },

    tipoCalculoValido(tipoCalculo) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.tipoCalculoValido === "function") {
            return ProdutoModel.tipoCalculoValido(tipoCalculo);
        }

        return !!tipoCalculo;
    },

    unidadeValida(unidade) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.unidadeValida === "function") {
            return ProdutoModel.unidadeValida(unidade);
        }

        return !!unidade;
    },

    numeroNaoNegativo(valor) {
        return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
    },

    statusValido(ativo) {
        return typeof ativo === "boolean";
    }
};
