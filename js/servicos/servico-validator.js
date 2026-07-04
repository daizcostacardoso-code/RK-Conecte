const ServicoValidator = {
    validar(servico = {}) {
        const erros = [];

        if (!servico || typeof servico !== "object") {
            return {
                valido: false,
                erros: ["Servico invalido."]
            };
        }

        if (!String(servico.nome || "").trim()) {
            erros.push("Nome do servico e obrigatorio.");
        }

        if (!String(servico.categoria || "").trim()) {
            erros.push("Categoria do servico e obrigatoria.");
        } else if (!this.categoriaValida(servico.categoria)) {
            erros.push("Categoria do servico invalida.");
        }

        if (!String(servico.tipoCalculo || "").trim()) {
            erros.push("Tipo de calculo do servico e obrigatorio.");
        } else if (!this.tipoCalculoValido(servico.tipoCalculo)) {
            erros.push("Tipo de calculo do servico invalido.");
        }

        if (!this.statusValido(servico.ativo)) {
            erros.push("Status do servico invalido.");
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    categoriaValida(categoria) {
        if (typeof ServicoModel !== "undefined" && typeof ServicoModel.categoriaValida === "function") {
            return ServicoModel.categoriaValida(categoria);
        }

        return !!categoria;
    },

    tipoCalculoValido(tipoCalculo) {
        if (typeof ServicoModel !== "undefined" && typeof ServicoModel.tipoCalculoValido === "function") {
            return ServicoModel.tipoCalculoValido(tipoCalculo);
        }

        return !!tipoCalculo;
    },

    statusValido(ativo) {
        return typeof ativo === "boolean";
    }
};
