const CalcularUnidadeUseCase = {
    executar(dados = {}, service = CalculoService) {
        return service.calcular({
            ...dados,
            tipoCalculo: CalculoModel.tipos.UNIDADE
        });
    }
};
