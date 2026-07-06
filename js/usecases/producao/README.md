# Use Cases - Producao

Casos de uso coordenam a camada de aplicacao do dominio Producao. A interface chama controller, o controller chama use case, o use case chama `ProducaoService` e somente o service chega ao repository.

## CriarOrdemProducaoUseCase

Recebe dados da Ordem de Producao e chama `ProducaoService.criarOrdem`.

## ListarOrdensProducaoUseCase

Lista ordens por `ProducaoService.listarOrdens`, aplicando filtros de service quando informados.

## ObterIndicadoresProducaoUseCase

Retorna indicadores simples da tela de Producao:

- Pendentes
- Planejadas
- Liberadas
- Em producao
- Finalizadas
- Urgentes

## PlanejarProducaoUseCase

Atualiza dados operacionais da Ordem e move `PENDENTE -> PLANEJADA` quando aplicavel.

Campos tratados:

- responsavel
- prioridade
- previsaoInicio
- previsaoEntrega
- tempoEstimado
- descricao
- observacoes

## AlterarResponsavelProducaoUseCase

Define ou troca o responsavel da ordem, registrando historico e evento `ordem.responsavel` quando o EventBus estiver disponivel.

## AlterarPrioridadeProducaoUseCase

Altera prioridade para `BAIXA`, `NORMAL`, `ALTA` ou `URGENTE`, registrando historico e evento `ordem.prioridade`.

## AtualizarChecklistProducaoUseCase

Marca ou desmarca um item do checklist operacional e dispara `ordem.checklist_atualizado`.

## LiberarProducaoUseCase

Move a ordem de `PLANEJADA` para `LIBERADA`, registra historico de liberacao e dispara `ordem.liberada`.

## Retorno padronizado

Sucesso:

```js
{
  sucesso: true,
  ordem: ordem,
  evento: evento,
  workflowEvento: workflowEvento,
  appState: true,
  erros: []
}
```

Erro:

```js
{
  sucesso: false,
  ordem: null,
  erros: ["mensagem do erro"]
}
```
