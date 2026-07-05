# RC1 v0.3.0 Comercial

Release Candidate RC1 da v0.3.0 na branch
`feature/v030-formalizacao-comercial`.

Esta revisao fecha os dois riscos apontados na Release Review
`docs/releases/v0.3.0-comercial.md`, sem criar novas funcionalidades, sem
alterar UX, sem alterar telas e sem mudar o fluxo comercial.

## 1. Escopo do RC1

Riscos tratados:

1. Integracao do `PdfAdapter` com `pdf-lib` para ambiente publicado.
2. Clareza do fluxo de Conversao em Projeto e da responsabilidade de
   persistencia.

## 2. PdfAdapter + pdf-lib

### Encapsulamento

O encapsulamento foi preservado:

- Somente `js/export/adapters/pdf-adapter.js` conhece a biblioteca `pdf-lib`.
- Nenhum service, renderer, use case, controller ou tela importa `pdf-lib`.
- `ExportService` continua selecionando o adapter pelo contrato existente.

### Carregamento

O carregamento agora segue esta ordem:

1. Usa `PDFLib` global quando ja existir.
2. Usa `require("pdf-lib")` quando estiver em ambiente Node/teste.
3. Carrega dinamicamente `js/vendor/pdf-lib.min.js` no navegador.

Antes do RC1, o fallback do navegador apontava para `node_modules`, pasta
ignorada pelo Firebase Hosting. No RC1, o UMD distribuivel foi versionado em
`js/vendor/pdf-lib.min.js`, caminho que pode ser publicado junto com o projeto
estatico.

### Dependencias

- `package.json` mantem `pdf-lib` como dependencia de desenvolvimento/runtime.
- `js/vendor/pdf-lib.min.js` e o artefato browser publicado.
- `js/vendor/pdf-lib.LICENSE.md` registra a licenca do pacote.

### Integracao com ExportService

Nenhuma alteracao foi feita no `ExportService`.

O fluxo permanece:

```text
Documento Comercial
  -> DocumentHtmlRenderer
  -> ExportService
  -> PdfAdapter
  -> pdf-lib encapsulado
```

## 3. Conversao em Projeto

### Quando ocorre persistencia

Na v0.3.0, a Conversao em Projeto nao executa persistencia definitiva.

O que ocorre no momento da conversao:

- `ConversaoService` valida Documento Comercial `APROVADO`.
- `ConversaoService` cria Projeto Executivo via `ProjetoService.criarManual`.
- `ConversaoService` registra Workflow/EventBus quando disponivel.
- `ConversaoService` guarda a referencia em AppState.

### Componente responsavel

Na v0.3.0:

- `ConversaoService` e responsavel pela conversao em memoria.
- `ProjetoService.criarManual` e responsavel por normalizar/criar a estrutura do
  Projeto.
- `AppStateService` e responsavel por manter a referencia corrente em memoria.

Na v0.4:

- a camada operacional devera decidir quando chamar persistencia definitiva;
- o componente recomendado para persistir Projeto continua sendo
  `ProjetoService.salvar`;
- a persistencia deve seguir a estrategia oficial de Projeto/Repository/Storage
  definida para a v0.4.

### O que permanece apenas em AppState

Na v0.3.0 ficam em memoria:

```js
projetoSelecionado
configuracoes.conversao.projetoAtual
configuracoes.conversao.documentoOrigem
configuracoes.conversao.dataConversao
configuracoes.conversao.convertido
configuracoes.conversao.ultimaAcaoConversao
```

### Responsabilidade da v0.4

A v0.4 Producao deve:

- persistir o Projeto Executivo quando ele entrar no fluxo operacional;
- definir a etapa inicial de Producao pelo Workflow;
- vincular tarefas, materiais, fotos, agenda e status operacional;
- decidir se Documento Comercial e Conversao precisam de colecoes/documentos
  persistidos proprios;
- manter o fluxo sem acesso direto a Firestore pela interface.

## 4. Validacoes do RC1

Checklist executado:

- `node --check` em `js/export/adapters/pdf-adapter.js`.
- Geracao real do PDF por `ExportService` + `PdfAdapter` em ambiente Node.
- Conferencia de que `ExportService` nao foi alterado.
- Conferencia de que o fallback do browser nao aponta mais para
  `node_modules`.
- Conferencia de que a conversao permanece sem nova regra de negocio.

## 5. Resultado

Os dois riscos de release foram tratados:

- o PDF real passa a ter artefato browser publicavel;
- a Conversao em Projeto esta documentada como conversao em memoria na v0.3,
  com persistencia definitiva delegada para a v0.4 Producao.

## 6. Recomendacao

**A release pode receber a tag `v0.3.0-comercial`?**

**SIM.**

Justificativa: o risco tecnico de publicacao do `pdf-lib` foi removido sem
alterar a arquitetura, e o risco de interpretacao da Conversao em Projeto foi
resolvido por documentacao clara de responsabilidades. A v0.3.0 fica fechada
como Comercial Completo, com persistencia operacional planejada para a v0.4.
