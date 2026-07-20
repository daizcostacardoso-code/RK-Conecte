const CalcularLinearUseCase = {
    executar(dados = {}, service = CalculoService) {
        return service.calcular({
            ...dados,
            tipoCalculo: CalculoModel.tipos.LINEAR_M
        });
    }
};
