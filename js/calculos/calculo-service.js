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

    validar(dados = {}) {
        const calculo = {
            ...CalculoModel.normalizar(dados),
            divisor: dados.divisor
        };
        return CalculoValidator.validar(calculo);
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
