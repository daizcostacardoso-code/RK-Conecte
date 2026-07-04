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

        if (!this.subcategoriaValida(produto)) {
            erros.push("Subcategoria de vidro invalida.");
        }

        if (!String(produto.unidadeVenda || "").trim()) {
            erros.push("Unidade de venda do produto e obrigatoria.");
        }

        if (!String(produto.tipoCalculo || "").trim()) {
            erros.push("Tipo de calculo do produto e obrigatorio.");
        } else if (!this.tipoCalculoValido(produto.tipoCalculo)) {
            erros.push("Tipo de calculo do produto invalido.");
        }

        if (!this.numeroNaoNegativo(produto.precoCusto)) {
            erros.push("Preco de custo do produto invalido.");
        }

        if (!this.numeroNaoNegativo(produto.precoVenda)) {
            erros.push("Preco de venda do produto invalido.");
        }

        if (!this.numeroNaoNegativo(produto.margem)) {
            erros.push("Margem do produto invalida.");
        }

        if (!this.statusValido(produto.ativo)) {
            erros.push("Status do produto invalido.");
        }

        if (!this.atributosValidos(produto.atributos)) {
            erros.push("Atributos do produto invalidos.");
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

    subcategoriaValida(produto = {}) {
        if (!produto.subcategoria) {
            return true;
        }

        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.subcategoriaVidroValida === "function") {
            return ProdutoModel.normalizarCategoria(produto.categoria) !== "vidro"
                || ProdutoModel.subcategoriaVidroValida(produto.subcategoria);
        }

        return true;
    },

    tipoCalculoValido(tipoCalculo) {
        if (typeof ProdutoModel !== "undefined" && typeof ProdutoModel.tipoCalculoValido === "function") {
            return ProdutoModel.tipoCalculoValido(tipoCalculo);
        }

        return !!tipoCalculo;
    },

    numeroNaoNegativo(valor) {
        return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
    },

    statusValido(ativo) {
        return typeof ativo === "boolean";
    },

    atributosValidos(atributos) {
        return !!atributos && typeof atributos === "object" && !Array.isArray(atributos);
    }
};
