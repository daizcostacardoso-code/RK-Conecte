# Core do RK-Conecte

Esta pasta reune infraestrutura central compartilhada por modulos da aplicacao.

Na v0.3.0, o Core contem o Event Bus e o App State Manager. Ambos existem para
reduzir acoplamento entre modulos sem alterar telas existentes.

## Event Bus

O Event Bus e a infraestrutura central de eventos do RK-Conecte.

Ele permite que modulos reajam a acoes importantes sem ficarem diretamente
acoplados entre si. Por exemplo: quando um Projeto for aprovado, no futuro
Timeline, Dashboard, Financeiro e Producao poderao reagir ao mesmo evento sem
que a tela precise chamar cada modulo manualmente.

### Por que existe

- Reduzir acoplamento entre modulos.
- Evitar que telas concentrem regras de propagacao.
- Criar base para Timeline, Dashboard, Financeiro e Producao reagirem a eventos de dominio.
- Manter eventos importantes com nomes padronizados.

### Arquivos de eventos

- `event-types.js`: lista oficial de nomes de eventos.
- `event-bus.js`: objeto global `EventBus` com `on`, `off`, `emit`, `once` e `clear`.
- `event-dispatcher.js`: funcoes auxiliares para disparar eventos comuns de Projeto.
- `event-listener.js`: estrutura inicial para registrar listeners futuros.

### Ordem sugerida de scripts

```html
<script src="../js/core/event-types.js"></script>
<script src="../js/core/event-bus.js"></script>
<script src="../js/core/event-dispatcher.js"></script>
<script src="../js/core/event-listener.js"></script>
```

### Padrao de nomes

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

### Exemplos

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

## App State Manager

O App State Manager e uma infraestrutura central de estado em memoria. Ele nao
persiste dados, nao acessa Firestore, nao altera HTML/CSS e nao muda o fluxo do
orcamento. Sua funcao e oferecer um ponto unico para compartilhar estado entre
camadas de aplicacao nas proximas sprints.

### Arquivos de estado

- `app-state-events.js`: nomes e helpers de eventos do estado da aplicacao.
- `app-state.js`: objeto global `AppState` com estado central e assinaturas por chave.
- `app-state-service.js`: fachada `AppStateService` para consumo por modulos de aplicacao.

### Estado inicial

```text
usuarioAtual
empresaAtual
clienteSelecionado
projetoSelecionado
orcamentoAtual
servicoSelecionado
produtosSelecionados
documentoAtual
configuracoes
loading
erros
```

### API

```js
AppState.getState();
AppState.setState("clienteSelecionado", cliente);
AppState.updateState({ projetoSelecionado: projeto, loading: false });
AppState.clearState();
AppState.getItem("orcamentoAtual");
AppState.removeItem("documentoAtual");
AppState.subscribe("orcamentoAtual", callback);
AppState.unsubscribe("orcamentoAtual", callback);
```

`AppStateService` expoe a mesma API e deve ser a fachada preferencial para
modulos de aplicacao quando a tela nao precisar falar diretamente com o objeto
central.

### Eventos do App State

Quando o estado muda, o App State tenta emitir eventos pelo `EventBus`, apenas
se ele estiver disponivel:

```text
app.state.changed
app.state.item_changed
app.state.cleared
```

Se o `EventBus` nao estiver carregado, o App State continua funcionando apenas
com as assinaturas locais por chave.

### Ordem sugerida para uso futuro

```html
<script src="../js/core/event-types.js"></script>
<script src="../js/core/event-bus.js"></script>
<script src="../js/core/app-state-events.js"></script>
<script src="../js/core/app-state.js"></script>
<script src="../js/core/app-state-service.js"></script>
```

Esta sprint cria somente a infraestrutura. Nenhuma tela existente passa a
carregar esses scripts automaticamente.
