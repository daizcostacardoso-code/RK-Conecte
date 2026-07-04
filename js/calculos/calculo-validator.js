const CalculoValidator = {
    validar(calculo = {}) {
        const erros = [];

        if (!calculo || typeof calculo !== "object") {
            return {
                valido: false,
                erros: ["Calculo invalido."]
            };
        }

        if (!String(calculo.tipoCalculo || "").trim()) {
            erros.push("Tipo de calculo e obrigatorio.");
        } else if (!this.tipoValido(calculo.tipoCalculo)) {
            erros.push("Tipo de calculo invalido.");
        }

        this.validarNumerosNaoNegativos(calculo, erros);
        this.validarCamposObrigatorios(calculo, erros);
        this.validarDivisaoPorZero(calculo, erros);

        return {
            valido: erros.length === 0,
            erros
        };
    },

    validarNumerosNaoNegativos(calculo, erros) {
        [
            "quantidade",
            "largura",
            "altura",
            "comprimento",
            "valorUnitario",
            "perdaPercentual",
            "desconto",
            "acrescimo"
        ].forEach(campo => {
            if (!this.numeroValido(calculo[campo])) {
                erros.push(`${this.rotuloCampo(campo)} deve ser numerico.`);
                return;
            }

            if (calculo[campo] < 0) {
                erros.push(`${this.rotuloCampo(campo)} nao pode ser negativo.`);
            }
        });
    },

    validarCamposObrigatorios(calculo, erros) {
        const tipo = this.normalizarTipo(calculo.tipoCalculo);

        if ([CalculoModel.tipos.AREA_M2, CalculoModel.tipos.LINEAR_M, CalculoModel.tipos.UNIDADE].includes(tipo)) {
            this.exigirMaiorQueZero(calculo, "quantidade", erros);
        }

        if (tipo === CalculoModel.tipos.AREA_M2) {
            this.exigirMaiorQueZero(calculo, "largura", erros);
            this.exigirMaiorQueZero(calculo, "altura", erros);
        }

        if (tipo === CalculoModel.tipos.LINEAR_M) {
            this.exigirMaiorQueZero(calculo, "comprimento", erros);
        }
    },

    validarDivisaoPorZero(calculo, erros) {
        if (Object.prototype.hasOwnProperty.call(calculo, "divisor") && Number(calculo.divisor) === 0) {
            erros.push("Divisao por zero nao permitida.");
        }
    },

    exigirMaiorQueZero(calculo, campo, erros) {
        if (!this.numeroValido(calculo[campo]) || calculo[campo] <= 0) {
            erros.push(`${this.rotuloCampo(campo)} deve ser maior que zero.`);
        }
    },

    tipoValido(tipoCalculo) {
        if (typeof CalculoModel !== "undefined" && typeof CalculoModel.tipoValido === "function") {
            return CalculoModel.tipoValido(tipoCalculo);
        }

        return !!tipoCalculo;
    },

    normalizarTipo(tipoCalculo) {
        if (typeof CalculoModel !== "undefined" && typeof CalculoModel.normalizarTipoCalculo === "function") {
            return CalculoModel.normalizarTipoCalculo(tipoCalculo);
        }

        return String(tipoCalculo || "").trim();
    },

    numeroValido(valor) {
        return typeof valor === "number" && Number.isFinite(valor);
    },

    rotuloCampo(campo) {
        const rotulos = {
            quantidade: "Quantidade",
            largura: "Largura",
            altura: "Altura",
            comprimento: "Comprimento",
            valorUnitario: "Valor unitario",
            perdaPercentual: "Perda percentual",
            desconto: "Desconto",
            acrescimo: "Acrescimo"
        };

        return rotulos[campo] || campo;
    }
};
