const CalcularAreaUseCase = {
    executar(dados = {}, service = CalculoService) {
        return service.calcular({
            ...dados,
            tipoCalculo: CalculoModel.tipos.AREA_M2
        });
    }
};
