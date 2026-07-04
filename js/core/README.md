# Core Event Bus

O Event Bus e a infraestrutura central de eventos do RK-Conecte.

Ele permite que modulos reajam a acoes importantes sem ficarem diretamente acoplados entre si. Por exemplo: quando um Projeto for aprovado, no futuro Timeline, Dashboard, Financeiro e Producao poderao reagir ao mesmo evento sem que a tela precise chamar cada modulo manualmente.

## Por que existe

- Reduzir acoplamento entre modulos.
- Evitar que telas concentrem regras de propagacao.
- Criar base para Timeline, Dashboard, Financeiro e Producao reagirem a eventos de dominio.
- Manter eventos importantes com nomes padronizados.

## Arquivos

- `event-types.js`: lista oficial de nomes de eventos.
- `event-bus.js`: objeto global `EventBus` com `on`, `off`, `emit`, `once` e `clear`.
- `event-dispatcher.js`: funcoes auxiliares para disparar eventos comuns de Projeto.
- `event-listener.js`: estrutura inicial para registrar listeners futuros.

## Ordem sugerida de scripts

```html
<script src="../js/core/event-types.js"></script>
<script src="../js/core/event-bus.js"></script>
<script src="../js/core/event-dispatcher.js"></script>
<script src="../js/core/event-listener.js"></script>
```

## Padrao de nomes

Eventos usam o formato:

```text
dominio.acao
```

Exemplos:

- `projeto.criado`
- `projeto.status_alterado`
- `orcamento.enviado`
- `financeiro.pagamento_recebido`
- `instalacao.concluida`

## Exemplos

Registrar listener:

```js
EventBus.on(EventTypes.PROJETO_APROVADO, (payload) => {
    console.log("Projeto aprovado", payload.projetoId);
});
```

Disparar evento:

```js
dispararEventoProjetoAprovado(projeto);
```

Executar uma unica vez:

```js
EventBus.once(EventTypes.PROJETO_CRIADO, (payload) => {
    console.log("Primeiro projeto criado", payload.projetoId);
});
```

## Como novos modulos devem se registrar

Novos modulos devem registrar listeners durante sua inicializacao, preferencialmente em uma funcao propria. A interface nao deve saber quais modulos precisam reagir ao evento; ela deve apenas disparar uma acao de dominio ou chamar um dispatcher.

