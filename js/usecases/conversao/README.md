# Use Cases de Conversao

Casos de uso para transformar Documento Comercial aprovado em Projeto
Executivo.

## Arquivos

- `converter-projeto-usecase.js`: chama `ConversaoService.converter`.

## Contrato de retorno

```js
{
    sucesso: true,
    projeto,
    documento,
    documentoOrigem,
    dataConversao,
    conversao,
    workflowEvento,
    eventos,
    appState,
    erros: [],
    detalhes: {}
}
```

Em erro:

```js
{
    sucesso: false,
    projeto: null,
    documento,
    documentoOrigem,
    dataConversao: "",
    conversao: null,
    workflowEvento: null,
    eventos: {},
    appState: false,
    erros: [],
    detalhes: {}
}
```

## Responsabilidade

O use case nao acessa Firestore, nao usa repository e nao cria regras proprias.
Ele apenas delega a conversao ao modulo `js/conversao/`.
