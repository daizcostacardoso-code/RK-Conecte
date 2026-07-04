# js/calculos

Motor de Calculo Comercial do RK-Conecte.

Esta pasta contem um modulo desacoplado para calculos reutilizaveis. Ele segue a
arquitetura Core v1 em uma versao sem persistencia: Use Cases -> Service ->
Engine -> Model/Validator.

## Objetivo

Centralizar calculos comerciais para uso futuro por Orcamento Inteligente,
Catalogo de Servicos, Catalogo de Produtos, Financeiro, Simulacoes e Dashboard.

Nesta sprint nao ha interface, HTML, CSS, Firebase, Firestore ou alteracao no
orcamento atual.

## Arquivos

- `calculo-model.js`: normalizacao do objeto de calculo, tipos e resultado
  padrao.
- `calculo-validator.js`: validacao de tipo, campos obrigatorios, valores
  negativos e divisao por zero.
- `calculo-engine.js`: execucao dos calculos de area, linear e unidade.
- `calculo-service.js`: fachada de aplicacao com `calcular`, `validar` e
  `formatarResultado`.

## Modelo Calculo

```text
tipoCalculo
quantidade
largura
altura
comprimento
valorUnitario
perdaPercentual
desconto
acrescimo
resultado
observacoes
```

## Tipos de calculo

```text
AREA_M2
LINEAR_M
UNIDADE
PERSONALIZADO
```

## Resultado padrao

```js
{
    sucesso: true,
    tipo: "AREA_M2",
    valorCalculado: 0,
    unidade: "m2",
    detalhes: {}
}
```

## Fluxo

```text
Use Case -> CalculoService -> CalculoValidator -> CalculoEngine -> CalculoModel
```

## Regras atuais

- `AREA_M2`: `largura * altura * quantidade * valorUnitario`.
- `LINEAR_M`: `comprimento * quantidade * valorUnitario`.
- `UNIDADE`: `quantidade * valorUnitario`.
- `PERSONALIZADO`: tipo reservado para etapa futura; ainda nao executa formula.

As medidas devem ser informadas na unidade comercial escolhida pelo modulo que
chamar o Engine. O motor nao converte centimetros para metros nesta sprint.

## Preparacao futura

O resultado inclui detalhes preparados para perdas, descontos, acrescimos,
impostos, margem, multiplos produtos e kits. Nesta sprint esses campos nao
alteram o valor calculado.

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

## Regra arquitetural

O modulo nao acessa Firestore, nao persiste dados e nao depende de interface. Ele
deve ser consumido por Use Cases e Services de outros modulos quando o Orcamento
Inteligente evoluir.
