# Use Cases de Orcamentos

Casos de uso da Sprint 3.8 para o Orquestrador do Orcamento.

## Arquivos

- `criar-orcamento-usecase.js`: cria contexto inicial usando
  `OrcamentoOrchestrator`.
- `calcular-orcamento-usecase.js`: calcula o contexto usando
  `CalculoService` por meio do Orchestrator.
- `validar-orcamento-usecase.js`: valida o contexto usando o Orchestrator.

## Fluxo

```text
Use Case -> OrcamentoOrchestrator -> Services de dominio
```

## Ordem sugerida de scripts

```html
<script src="../js/orcamentos/orcamento-state.js"></script>
<script src="../js/orcamentos/orcamento-context.js"></script>
<script src="../js/orcamentos/orcamento-factory.js"></script>
<script src="../js/orcamentos/orcamento-orchestrator.js"></script>
<script src="../js/usecases/orcamentos/criar-orcamento-usecase.js"></script>
<script src="../js/usecases/orcamentos/calcular-orcamento-usecase.js"></script>
<script src="../js/usecases/orcamentos/validar-orcamento-usecase.js"></script>
```

## Padrao de resposta

Os use cases retornam objetos com `sucesso`, `contexto`, `erros` e `detalhes`.
