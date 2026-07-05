# Use Cases Comerciais

Casos de uso da aprovacao comercial do Documento Comercial.

## Arquivos

- `aprovar-documento-usecase.js`: executa aprovacao por meio do
  `ComercialService`.
- `reprovar-documento-usecase.js`: executa reprovacao por meio do
  `ComercialService`.

## Contrato de retorno

```js
{
    sucesso: true,
    documento,
    comercial,
    statusComercial,
    dataAprovacao,
    ultimaAcaoComercial,
    evento,
    workflowEvento,
    exportacao,
    erros: [],
    detalhes: {}
}
```

Em erro:

```js
{
    sucesso: false,
    documento: null,
    comercial: null,
    statusComercial: "",
    dataAprovacao: "",
    ultimaAcaoComercial: "",
    evento: null,
    workflowEvento: null,
    exportacao: null,
    erros: [],
    detalhes: {}
}
```

## Responsabilidade

Os use cases nao acessam Firestore, nao alteram Workflow e nao implementam
conversao em Projeto. Eles apenas orquestram a camada comercial criada na
Sprint 4.6.
