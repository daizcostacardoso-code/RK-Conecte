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

        if (!this.tiposValidos(servico.tiposItem)) {
            erros.push("Tipos de item do servico invalidos.");
        }

        if (!this.dependenciasValidas(servico.dependenciasPadrao)) {
            erros.push("Dependencias padrao do servico invalidas.");
        }

        if (!this.tamanhosValidos(servico.tamanhosPadrao)) {
            erros.push("Tamanhos padrao do servico invalidos.");
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
    },

    listaValida(lista) {
        return Array.isArray(lista);
    },

    tiposValidos(tipos = []) {
        if (!Array.isArray(tipos)) {
            return false;
        }

        return tipos.every(tipo => (
            tipo &&
            typeof tipo === "object" &&
            String(tipo.nome || "").trim() &&
            typeof tipo.ativo === "boolean" &&
            this.numeroNaoNegativo(tipo.tempoMedio ?? 0) &&
            this.dependenciasValidas(tipo.dependencias || tipo.dependenciasPadrao || [])
        ));
    },

    dependenciasValidas(dependencias = []) {
        if (!Array.isArray(dependencias)) {
            return false;
        }

        return dependencias.every(dependencia => {
            return dependencia &&
                typeof dependencia === "object" &&
                !!String(dependencia.produtoId || "").trim() &&
                !!String(dependencia.produtoNome || "").trim() &&
                !!String(dependencia.categoria || "").trim() &&
                !!String(dependencia.unidadeCalculo || "").trim() &&
                !!String(dependencia.regraCalculo || "").trim() &&
                this.numeroNaoNegativo(dependencia.quantidadePadrao ?? 0) &&
                this.numeroNaoNegativo(dependencia.custoUnitario ?? 0) &&
                this.numeroNaoNegativo(dependencia.custoEstimado ?? 0) &&
                typeof dependencia.obrigatoria === "boolean";
        });
    },

    numeroNaoNegativo(valor) {
        return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
    },

    tamanhosValidos(tamanhos = []) {
        if (!Array.isArray(tamanhos)) {
            return false;
        }

        return tamanhos.every(tamanho => (
            tamanho &&
            typeof tamanho === "object" &&
            typeof tamanho.ativo === "boolean" &&
            typeof tamanho.larguraCm === "number" &&
            typeof tamanho.alturaCm === "number" &&
            tamanho.larguraCm >= 0 &&
            tamanho.alturaCm >= 0
        ));
    }
};
