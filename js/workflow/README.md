# Workflow Engine

Infraestrutura da Sprint 2.1 para controlar o ciclo de vida dos Projetos no RK-Conecte.

Este modulo nao acessa telas, HTML, CSS, Firebase ou Firestore. Ele apenas define estados, transicoes validas, eventos em memoria e um motor simples para alterar estado de Projeto.

## Arquivos

- `workflow-state.js`: enum/objeto com os estados possiveis do Projeto.
- `workflow-validator.js`: mapa de transicoes e funcao `validarTransicao(estadoAtual, novoEstado)`.
- `workflow-events.js`: registro em memoria com `registrarEvento()`, `listarEventos()` e `limparEventos()`.
- `workflow-engine.js`: objeto `WorkflowEngine` para validar, alterar estado e registrar evento automaticamente.

## Ordem sugerida de scripts

```html
<script src="../js/workflow/workflow-state.js"></script>
<script src="../js/workflow/workflow-validator.js"></script>
<script src="../js/workflow/workflow-events.js"></script>
<script src="../js/workflow/workflow-engine.js"></script>
```

## Fluxo principal

```text
rascunho -> em_orcamento -> enviado -> aprovado -> em_producao
-> pronto_instalacao -> em_instalacao -> aguardando_pagamento
-> concluido -> garantia -> arquivado
```

`cancelado` e permitido antes da conclusao do fluxo, conforme definido em `workflow-validator.js`.

## Uso basico

```js
const resultado = WorkflowEngine.alterarEstado(
    projeto,
    WORKFLOW_STATE.EM_ORCAMENTO,
    "Funcionario"
);
```

Quando a transicao e valida, o resultado retorna `sucesso: true`, o Projeto atualizado e um evento `status_alterado`.

