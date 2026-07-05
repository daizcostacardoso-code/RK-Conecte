# Producao

Dominio de Producao da Sprint 5.1.

O modulo cria a entidade Ordem de Producao para ligar um Projeto aprovado ao fluxo operacional, mantendo a arquitetura existente do RK-Conecte.

## Arquivos

- `producao-model.js`: define `PRODUCAO_STATUS`, cria e normaliza Ordens de Producao.
- `producao-validator.js`: valida campos minimos e transicoes da ordem.
- `producao-repository.js`: persiste ordens pelo Repository Pattern usando adapter de storage.
- `producao-service.js`: coordena criacao, status, Workflow, EventBus e AppState.

## Entidade

Campos minimos da Ordem de Producao:

```js
{
  id: "op_...",
  projetoId: "prj_...",
  status: "PENDENTE",
  dataCriacao: "2026-07-05T00:00:00.000Z",
  responsavel: "Sistema",
  prioridade: "MEDIA",
  observacoes: ""
}
```

## Estados

- `PENDENTE`
- `PLANEJADA`
- `EM_PRODUCAO`
- `FINALIZADA`

Fluxo permitido:

```text
PENDENTE -> PLANEJADA -> EM_PRODUCAO -> FINALIZADA
```

## Eventos

O service dispara eventos pelo `EventBus` quando disponivel:

- `ordem.criada`
- `ordem.iniciada`
- `ordem.finalizada`

## AppState

`ProducaoService` registra a ordem corrente em:

```js
AppStateService.setState("ordemAtual", ordem)
```

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
<script src="../js/projetos/projeto-service.js"></script>
<script src="../js/producao/producao-model.js"></script>
<script src="../js/producao/producao-validator.js"></script>
<script src="../js/producao/producao-repository.js"></script>
<script src="../js/producao/producao-service.js"></script>
```

## Planejamento

O Planejamento deve consumir este modulo criando uma Ordem de Producao para um `projetoId`, definir `responsavel` e `prioridade`, planejar a ordem e depois iniciar a producao. A tela futura deve chamar use cases/services, nunca Repository ou Firestore diretamente.
