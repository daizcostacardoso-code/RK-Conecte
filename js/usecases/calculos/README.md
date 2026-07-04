# Use Cases de Calculos

Casos de uso da Sprint 3.7 para o Motor de Calculo Comercial.

## Arquivos

- `calcular-area-usecase.js`: executa calculo `AREA_M2` usando
  `CalculoService`.
- `calcular-linear-usecase.js`: executa calculo `LINEAR_M` usando
  `CalculoService`.
- `calcular-unidade-usecase.js`: executa calculo `UNIDADE` usando
  `CalculoService`.

## Fluxo

```text
Use Case -> CalculoService -> CalculoValidator -> CalculoEngine
```

## Ordem sugerida de scripts

```html
<script src="../js/calculos/calculo-model.js"></script>
<script src="../js/calculos/calculo-validator.js"></script>
<script src="../js/calculos/calculo-engine.js"></script>
<script src="../js/calculos/calculo-service.js"></script>
<script src="../js/usecases/calculos/calcular-area-usecase.js"></script>
<script src="../js/usecases/calculos/calcular-linear-usecase.js"></script>
<script src="../js/usecases/calculos/calcular-unidade-usecase.js"></script>
```

## Padrao de resposta

Os use cases retornam objetos com `sucesso`, `tipo`, `valorCalculado`, `unidade`
e `detalhes`.
