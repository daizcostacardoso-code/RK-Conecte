# Use Cases - Producao

Casos de uso coordenam a camada de aplicacao do dominio Producao.

## CriarOrdemProducaoUseCase

Fluxo:

1. Recebe dados da Ordem de Producao.
2. Chama `ProducaoService.criarOrdem`.
3. O service cria o modelo, valida campos minimos, salva pelo `ProducaoRepository`, registra Workflow, dispara `ordem.criada` e atualiza `ordemAtual` no AppState.
4. Retorna resultado padronizado.

Retorno de sucesso:

```js
{
  sucesso: true,
  ordem: ordem,
  projeto: projeto,
  evento: evento,
  workflowEvento: workflowEvento,
  appState: true,
  erros: []
}
```

Retorno de erro:

```js
{
  sucesso: false,
  ordem: null,
  erros: ["mensagem do erro"]
}
```
