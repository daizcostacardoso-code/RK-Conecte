# js/dashboard

Primeiro Dashboard do RK-Conecte, baseado em Projetos.

O modulo prepara dados consolidados para uma tela futura sem acessar Firestore,
Repository ou HTML diretamente. A entrada oficial dos dados e o `ProjetoService`.

## Objetivo

Exibir uma visao resumida dos Projetos do sistema, com indicadores por status e
lista simples de Projetos recentes. Nesta sprint o dashboard nao cria novas
regras de negocio e nao altera funcionalidades de orcamento.

## Arquivos

- `dashboard-model.js`: modelo base do dashboard com `indicadores`,
  `projetosRecentes`, `proximasInstalacoes`, `alertas` e `recebimentos`.
- `dashboard-service.js`: carrega Projetos pelo `ProjetoService`, monta
  indicadores, lista Projetos e usa `MemoryAdapter` para dados simulados quando
  ainda nao houver Projetos cadastrados.
- `dashboard-controller.js`: controla inicializacao, atualizacao, refresh e
  renderizacao futura sem depender de HTML especifico.
- `dashboard-utils.js`: funcoes auxiliares para status, quantidades,
  agrupamento e ordenacao por data.

## Fluxo

```text
DashboardController -> DashboardService -> ProjetoService -> infraestrutura atual
                                      -> MemoryAdapter quando nao houver Projetos
                                      -> WorkflowEngine para proximos status
```

## Dependencias

Ordem sugerida para paginas futuras:

```html
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/workflow/workflow-state.js"></script>
<script src="../js/workflow/workflow-validator.js"></script>
<script src="../js/workflow/workflow-events.js"></script>
<script src="../js/workflow/workflow-engine.js"></script>
<script src="../js/projetos/projeto-status.js"></script>
<script src="../js/projetos/projeto-historico.js"></script>
<script src="../js/projetos/projeto-model.js"></script>
<script src="../js/projetos/projeto-storage.js"></script>
<script src="../js/projetos/projeto-service.js"></script>
<script src="../js/dashboard/dashboard-model.js"></script>
<script src="../js/dashboard/dashboard-utils.js"></script>
<script src="../js/dashboard/dashboard-service.js"></script>
<script src="../js/dashboard/dashboard-controller.js"></script>
```

## Novos indicadores

Novos indicadores devem ser adicionados em `DashboardService.indicadoresBase`,
mantendo o formato:

```js
{
    id: "em_orcamento",
    titulo: "Em orcamento",
    status: "em_orcamento",
    icone: "placeholder-orcamento",
    cor: "placeholder-comercial"
}
```

O campo `status` deve usar status ja existentes do Projeto/Workflow. O campo
vazio em `status` representa indicador total.
