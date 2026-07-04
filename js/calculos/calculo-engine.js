const CalculoEngine = {
    calcular(calculo = {}) {
        const tipo = CalculoModel.normalizarTipoCalculo(calculo.tipoCalculo);

        if (tipo === CalculoModel.tipos.AREA_M2) {
            return this.calcularArea(calculo);
        }

        if (tipo === CalculoModel.tipos.LINEAR_M) {
            return this.calcularLinear(calculo);
        }

        if (tipo === CalculoModel.tipos.UNIDADE) {
            return this.calcularUnidade(calculo);
        }

        return CalculoModel.criarErro(tipo, ["Tipo de calculo personalizado preparado para etapa futura."]);
    },

    calcularArea(dados = {}) {
        const calculo = CalculoModel.normalizar({
            ...dados,
            tipoCalculo: CalculoModel.tipos.AREA_M2
        });
        const area = calculo.largura * calculo.altura * calculo.quantidade;
        const valorCalculado = area * calculo.valorUnitario;

        return this.criarResultado(calculo, valorCalculado, {
            area: CalculoModel.arredondar(area, 4),
            largura: calculo.largura,
            altura: calculo.altura,
            quantidade: calculo.quantidade
        });
    },

    calcularLinear(dados = {}) {
        const calculo = CalculoModel.normalizar({
            ...dados,
            tipoCalculo: CalculoModel.tipos.LINEAR_M
        });
        const metragemLinear = calculo.comprimento * calculo.quantidade;
        const valorCalculado = metragemLinear * calculo.valorUnitario;

        return this.criarResultado(calculo, valorCalculado, {
            metragemLinear: CalculoModel.arredondar(metragemLinear, 4),
            comprimento: calculo.comprimento,
            quantidade: calculo.quantidade
        });
    },

    calcularUnidade(dados = {}) {
        const calculo = CalculoModel.normalizar({
            ...dados,
            tipoCalculo: CalculoModel.tipos.UNIDADE
        });
        const unidades = calculo.quantidade;
        const valorCalculado = unidades * calculo.valorUnitario;

        return this.criarResultado(calculo, valorCalculado, {
            unidades: CalculoModel.arredondar(unidades, 4),
            quantidade: calculo.quantidade
        });
    },

    criarResultado(calculo, valorCalculado, detalhes = {}) {
        return CalculoModel.criarResultado({
            sucesso: true,
            tipo: calculo.tipoCalculo,
            valorCalculado,
            unidade: CalculoModel.obterUnidade(calculo.tipoCalculo),
            detalhes: {
                ...detalhes,
                valorUnitario: calculo.valorUnitario,
                subtotal: CalculoModel.arredondar(valorCalculado, 2),
                observacoes: calculo.observacoes,
                preparadoPara: {
                    perdas: calculo.perdaPercentual,
                    descontos: calculo.desconto,
                    acrescimos: calculo.acrescimo,
                    impostos: false,
                    margem: false,
                    multiplosProdutos: false,
                    kits: false
                }
            }
        });
    }
};
