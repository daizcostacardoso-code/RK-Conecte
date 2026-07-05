# Conversao em Projeto

Modulo criado na Sprint 4.7 para converter um Documento Comercial aprovado em
Projeto Executivo.

## Arquivos

- `conversao-model.js`: mapeia Documento Comercial para dados de Projeto.
- `conversao-validator.js`: valida documento aprovado e bloqueia dupla
  conversao.
- `conversao-service.js`: executa a conversao usando `ProjetoService`,
  `ComercialService`, `AppState`, `Workflow` e `EventBus`.

## Fluxo

```text
Documento Comercial aprovado
-> ConversaoValidator
-> ProjetoService.criarManual
-> ConversaoModel.anexarOrigemProjeto
-> WorkflowEngine.registrar
-> EventBus
-> AppState
```

## AppState

O AppState nao foi alterado. A sprint guarda o Projeto gerado em:

```js
projetoSelecionado
```

E guarda os dados especificos da conversao em:

```js
configuracoes.conversao = {
    projetoAtual,
    documentoOrigem,
    dataConversao,
    convertido,
    ultimaAcaoConversao
};
```

## Eventos

Quando `EventBus` estiver disponivel, o modulo emite:

```text
projeto.criado
projeto.convertido
```

## Projeto Gerado

O Projeto Executivo preserva:

- Cliente.
- Servico.
- Produtos.
- Totais.
- Observacoes.
- Referencia ao Documento Comercial de origem.

## Limites da sprint

- Sem Firestore.
- Sem chamada direta a repository.
- Sem alteracao em `ProjetoService`, `ProjetoRepository`, Workflow, AppState,
  Document Pipeline, Export Service ou Motor de Calculo.
- Sem iniciar Producao.
- Sem persistencia definitiva.
