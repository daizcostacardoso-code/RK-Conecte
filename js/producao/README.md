# Producao

Dominio de Producao da Sprint 5.2.

O modulo evolui a Ordem de Producao da fundacao criada na Sprint 5.1 para uma ordem planejavel, vinculada a Projeto, com responsavel, prioridade, previsoes, checklist operacional, historico e status de liberacao.

## Arquivos

- `producao-model.js`: centraliza `PRODUCAO_STATUS`, `PRODUCAO_PRIORIDADE`, checklist padrao, criacao e normalizacao de Ordens de Producao.
- `producao-validator.js`: valida campos minimos, checklist, prioridades e transicoes da ordem.
- `producao-repository.js`: persiste ordens pelo Repository Pattern usando adapter de storage.
- `producao-service.js`: coordena criacao, planejamento, responsavel, prioridade, checklist, liberacao, Workflow, EventBus e AppState.
- `producao-controller.js`: conecta a pagina aos use cases, sem acessar Repository diretamente nas acoes da interface.
- `producao-ui.js`: renderiza lista, indicadores, painel de planejamento, checklist e historico.

## Entidade

Campos da Ordem de Producao:

```js
{
  id: "op_...",
  projetoId: "prj_...",
  clienteId: "cli_...",
  numero: "OP-...",
  status: "PENDENTE",
  prioridade: "NORMAL",
  responsavel: "Equipe Producao",
  previsaoInicio: "2026-07-06",
  previsaoEntrega: "2026-07-10",
  tempoEstimado: "6 horas",
  descricao: "Resumo operacional",
  observacoes: "Notas do planejamento",
  checklist: [
    {
      id: "projeto_conferido",
      titulo: "Projeto conferido",
      concluido: false,
      atualizadoEm: "2026-07-06T00:00:00.000Z"
    }
  ],
  historico: [],
  criadoEm: "2026-07-06T00:00:00.000Z",
  atualizadoEm: "2026-07-06T00:00:00.000Z"
}
```

`dataCriacao` e `dataAtualizacao` seguem como aliases de compatibilidade para ordens criadas na Sprint 5.1.

## Estados

Status centralizados em `PRODUCAO_STATUS`:

- `PENDENTE`
- `PLANEJADA`
- `LIBERADA`
- `EM_PRODUCAO`
- `FINALIZADA`

Fluxo permitido:

```text
PENDENTE -> PLANEJADA -> LIBERADA -> EM_PRODUCAO -> FINALIZADA
```

## Prioridades

Prioridades centralizadas em `PRODUCAO_PRIORIDADE`:

- `BAIXA`
- `NORMAL`
- `ALTA`
- `URGENTE`

Valores legados como `MEDIA` sao normalizados para `NORMAL`.

## Checklist

Toda Ordem possui checklist inicial:

- Projeto conferido
- Medidas conferidas
- Material definido
- Ferragens definidas
- Producao autorizada

Cada item possui `id`, `titulo`, `concluido` e `atualizadoEm`.

## Eventos

O service dispara eventos pelo `EventBus` quando disponivel:

- `ordem.criada`
- `ordem.planejada`
- `ordem.liberada`
- `ordem.responsavel`
- `ordem.prioridade`
- `ordem.checklist_atualizado`
- `ordem.iniciada`
- `ordem.finalizada`

## AppState

`ProducaoService` registra a ordem corrente em:

```js
AppStateService.setState("ordemAtual", ordem)
```

A tela tambem preserva `ordemAtual` no estado demo local (`RKE2EDemoState`) para manter o fluxo E2E em `sessionStorage`.

## Persistencia

O repositorio usa `MemoryAdapter` como padrao e nao acessa Firestore. Outro adapter pode ser injetado por `criarProducaoRepository(adapter)`.

## Ordem sugerida de scripts

```html
<script src="../js/storage/storage-adapter.js"></script>
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/core/event-bus.js"></script>
<script src="../js/core/app-state.js"></script>
<script src="../js/core/app-state-service.js"></script>
<script src="../js/workflow/workflow-state.js"></script>
<script src="../js/workflow/workflow-events.js"></script>
<script src="../js/workflow/workflow-engine.js"></script>
<script src="../js/producao/producao-model.js"></script>
<script src="../js/producao/producao-validator.js"></script>
<script src="../js/producao/producao-repository.js"></script>
<script src="../js/producao/producao-service.js"></script>
<script src="../js/usecases/producao/criar-ordem-producao-usecase.js"></script>
<script src="../js/usecases/producao/listar-ordens-producao-usecase.js"></script>
<script src="../js/usecases/producao/planejar-producao-usecase.js"></script>
<script src="../js/usecases/producao/liberar-producao-usecase.js"></script>
```

## Limites da Sprint 5.2

Esta sprint nao implementa estoque, compras, agenda, financeiro, fotos, instalacao, garantia, SQL, login/permissoes reais, Firestore definitivo ou cadastro real de materiais.
