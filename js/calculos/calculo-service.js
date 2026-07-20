const CalculoService = {
    calcular(dados = {}) {
        const calculo = CalculoModel.criar(dados);
        const validacao = this.validar({
            ...dados,
            ...calculo
        });

        if (!validacao.valido) {
            return CalculoModel.criarErro(calculo.tipoCalculo, validacao.erros);
        }

        return this.formatarResultado(CalculoEngine.calcular(calculo));
    },

    calcularItens(dados = {}) {
        const validacao = this.validarItens(dados);

        if (!validacao.valido) {
            return CalculoModel.criarErro("ORCAMENTO_ITENS", validacao.erros, {
                itens: Array.isArray(dados.itens) ? dados.itens : []
            });
        }

        return this.formatarResultado(CalculoEngine.calcularItensOrcamento(dados));
    },

    validar(dados = {}) {
        const calculo = {
            ...CalculoModel.normalizar(dados),
            divisor: dados.divisor
        };
        return CalculoValidator.validar(calculo);
    },

    validarItens(dados = {}) {
        const itens = Array.isArray(dados.itens) ? dados.itens : [];
        const erros = [];

        if (!itens.length) {
            erros.push("Pelo menos um item e obrigatorio para calcular o orcamento.");
        }

        itens.forEach((item, indice) => {
            const numeroItem = indice + 1;
            const tipoCalculo = CalculoEngine.normalizarTipoItem(item.tipoCalculo || item.unidade || "area_m2");
            const larguraCm = CalculoModel.numero(item.larguraCm ?? item.largura, 0);
            const alturaCm = CalculoModel.numero(item.alturaCm ?? item.altura, 0);
            const quantidade = CalculoModel.numero(item.quantidade, 0);
            const valorUnitario = CalculoModel.numero(item.valorUnitario ?? item.precoVenda, 0);
            const valorJato = CalculoModel.numero(item.valorJato ?? item.adicionalJato, 0);

            if (!String(item.produtoId || item.id || item.nome || item.descricao || "").trim()) {
                erros.push(`Item ${numeroItem}: produto ou descricao e obrigatorio.`);
            }

            if (tipoCalculo === CalculoModel.tipos.AREA_M2) {
                if (larguraCm <= 0) {
                    erros.push(`Item ${numeroItem}: largura em centimetros deve ser maior que zero.`);
                }

                if (alturaCm <= 0) {
                    erros.push(`Item ${numeroItem}: altura em centimetros deve ser maior que zero.`);
                }
            }

            if (quantidade <= 0) {
                erros.push(`Item ${numeroItem}: quantidade deve ser maior que zero.`);
            }

            if (valorUnitario < 0) {
                erros.push(`Item ${numeroItem}: valor unitario nao pode ser negativo.`);
            }

            if (valorJato < 0) {
                erros.push(`Item ${numeroItem}: adicional do jato nao pode ser negativo.`);
            }
        });

        ["descontoValor", "acrescimoValor"].forEach(campo => {
            const valor = dados.ajustes?.[campo] ?? dados[campo];
            const numero = CalculoModel.numero(valor, 0);

            if (numero < 0) {
                erros.push(`${campo === "descontoValor" ? "Desconto" : "Acrescimo"} nao pode ser negativo.`);
            }
        });

        return {
            valido: erros.length === 0,
            erros
        };
    },

    formatarResultado(resultado = {}) {
        if (!resultado.sucesso) {
            return CalculoModel.criarErro(
                resultado.tipo,
                resultado.detalhes?.erros || ["Erro ao executar calculo."],
                resultado.detalhes
            );
        }

        return CalculoModel.criarResultado({
            sucesso: true,
            tipo: resultado.tipo,
            valorCalculado: resultado.valorCalculado,
            unidade: resultado.unidade,
            detalhes: resultado.detalhes || {}
        });
    }
};
