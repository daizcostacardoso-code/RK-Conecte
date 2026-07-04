# Core Review - Sprint 2.5.1

Revisao arquitetural do Core v1 do RK-Conecte na branch `feature/v020-comercial`.

Esta revisao nao implementa melhorias, nao altera comportamento, nao cria telas e
nao altera HTML ou CSS. Os pontos abaixo registram o estado atual da arquitetura
e indicam atencoes para sprints futuras.

## Resumo da arquitetura

O RK-Conecte esta organizado como uma PWA estatica com JavaScript global, sem
`import/export` e sem bundler. O Core v1 cria uma base de dominio orientada a
Projeto, com separacao inicial entre dominio, aplicacao, eventos, workflow e
persistencia.

Arquitetura principal observada:

- `js/projetos/`: modelo, status, historico, storage e service de Projeto.
- `js/workflow/`: estados, transicoes, eventos de workflow e motor de transicao.
- `js/core/`: Event Bus, tipos de evento, dispatchers e listeners futuros.
- `js/repositories/`: Repository Pattern inicial para Projeto.
- `js/storage/`: contrato de adapter, MemoryAdapter e FirestoreAdapter reservado.
- `js/usecases/projetos/`: caso de uso inicial para criar Projeto.
- `js/dashboard/`: primeiro dashboard preparado para consumir ProjetoService.
- `js/orcamentos/` e arquivos de raiz em `js/`: fluxo legado e modularizacao
  gradual do orcamento.

O Core novo esta mais organizado que o legado, mas ainda convive com scripts
antigos que acessam Firestore diretamente e concentram comportamento em arquivos
grandes.

## Fluxo da arquitetura

```text
UI
v
Use Cases
v
Services
v
Workflow
v
Event Bus
v
Repository
v
Storage
v
Firestore
```

Fluxo pratico esperado para novas funcionalidades:

```text
Tela -> UseCase/Service -> Modelo/Workflow -> EventBus -> Repository -> Adapter -> Storage externo
```

No estado atual, parte do legado ainda segue caminhos paralelos:

```text
Tela/script legado -> db.collection(...)
Tela/script legado -> Storage local
ProjetoService -> ProjetoStorage -> LocalStorage/Firestore
```

## Pontos fortes

- Projeto foi definido como entidade central nos documentos e nos modulos novos.
- O Workflow esta separado em estado, validacao, eventos e engine.
- O Event Bus tem API simples: `on`, `off`, `emit`, `once` e `clear`.
- Os tipos de evento estao centralizados em `event-types.js`.
- O Repository Pattern existe e depende de contrato de adapter, nao de Firestore.
- O MemoryAdapter esta funcional e isolado por contrato.
- O FirestoreAdapter existe como ponto de extensao futuro, ainda sem implementacao.
- O Dashboard consome `ProjetoService` e nao acessa Repository ou Firestore.
- O Core respeita o padrao atual do projeto: objetos globais e ordem de scripts.
- A documentacao arquitetural ja registra decisoes importantes em `PROJECT_BIBLE.md`
  e `ARCHITECTURAL_DECISIONS.md`.

## Pontos que precisam atencao

- A interface legada ainda acessa Firestore diretamente em `funcionario.js`,
  `orcamento.js`, `orcamento-cliente.js`, `pdf.js`, `valores.js` e
  `orcamentos/orcamento-storage.js`.
- `ProjetoService` concentra operacoes de aplicacao do Projeto, mas ainda chama
  `ProjetoStorage` diretamente em vez de passar pelo Repository Pattern.
- `ProjetoStorage` mistura LocalStorage e Firestore dentro do mesmo objeto,
  funcionando como ponte de compatibilidade para a fase atual.
- O Workflow registra eventos em memoria por `WorkflowEvents`, separado do
  `EventBus` central. Isso e aceitavel para o Core v1, mas pode gerar dois
  caminhos de evento se crescer sem consolidacao.
- `ProjetoStatus` e `WorkflowState` possuem mapas de status parecidos, mas nao
  identicos. O Workflow tem estados adicionais como `pronto_instalacao`,
  `aguardando_pagamento`, `garantia` e `arquivado`.
- Ainda ha dependencias implicitas por ordem de `<script>`, naturais do padrao
  sem bundler, mas que exigem documentacao e cuidado ao integrar telas futuras.
- Ha arquivos vazios rastreados: `docs/API.md`, `docs/BLOCO_FINANCEIRO.md`,
  `docs/BLOCO_OPERACIONAL.md`, `docs/PADRAO_CODIGO.md`, `docs/UI_GUIDE.md` e
  `js/totais.js`.
- Existem pastas de modulo com apenas README, como `clientes`, `produtos`,
  `servicos`, `shared` e `firebase`. Elas parecem reservas intencionais, nao
  duplicidade funcional.

## Estrutura de pastas

Resultado da revisao:

- Organizacao: boa para o Core novo, com dominios e infraestrutura separados.
- Nomes: claros e consistentes nos modulos novos.
- Duplicidade: nao foram encontrados arquivos de codigo duplicados por nome nos
  arquivos rastreados; multiplos `README.md` por modulo sao intencionais.
- Modulos vazios: existem arquivos/documentos vazios que devem ser tratados em
  sprint propria.
- Arquivos desnecessarios: nenhum arquivo deve ser removido nesta sprint; apenas
  `js/totais.js` e docs vazios ficam registrados como pontos de limpeza futura.

## ProjetoService

Arquivos analisados:

- `js/projetos/projeto-service.js`
- `js/projetos/projeto-model.js`
- `js/projetos/projeto-status.js`
- `js/projetos/projeto-historico.js`
- `js/projetos/projeto-storage.js`

Conclusao:

`ProjetoService` atua como fachada de aplicacao para Projeto. Ele cria Projeto
manual, cria Projeto a partir de solicitacao, salva, lista, carrega, altera
status, registra contato, vincula orcamento e filtra Projetos.

Responsabilidade unica:

- Avaliacao: parcialmente adequada.
- Motivo: todas as operacoes pertencem ao dominio Projeto, mas o service ja
  mistura comandos, consultas e filtro. Para o Core v1 esta aceitavel, mas deve
  ser observado para nao virar ponto central de toda regra futura.

Atencao:

- O service usa `ProjetoStorage` diretamente.
- O Repository Pattern existe, mas ainda nao e o caminho principal do
  `ProjetoService`.

## Workflow Engine

Arquivos analisados:

- `js/workflow/workflow-state.js`
- `js/workflow/workflow-validator.js`
- `js/workflow/workflow-events.js`
- `js/workflow/workflow-engine.js`
- `js/workflow/README.md`

Conclusao:

O Workflow esta bem separado para o tamanho atual. Estados, transicoes, eventos
em memoria e motor ficam em arquivos distintos. O modulo nao acessa HTML, CSS,
Firebase ou Firestore.

Atencoes:

- Depende de globais e ordem de script, como o resto do projeto.
- `WorkflowEvents` e separado do `EventBus`, criando dois mecanismos de eventos.
- Ha diferenca entre estados do Workflow e status do Projeto.

## Event Bus

Arquivos analisados:

- `js/core/event-types.js`
- `js/core/event-bus.js`
- `js/core/event-dispatcher.js`
- `js/core/event-listener.js`
- `js/core/README.md`

Conclusao:

O Event Bus e simples, legivel e suficiente para a fase atual. Ele permite
desacoplar modulos por eventos e ja possui dispatcher para eventos comuns de
Projeto.

Atencoes:

- Listeners futuros ainda sao placeholders.
- Nao ha fila assincrona, persistencia de eventos ou padrao de erro avancado.
- O Workflow ainda nao publica diretamente no Event Bus central.

## Repository Pattern

Arquivos analisados:

- `js/repositories/projeto-repository.js`
- `js/repositories/README.md`
- `js/usecases/projetos/criar-projeto-usecase.js`

Conclusao:

`ProjetoRepository` esta desacoplado de Firestore e depende de um adapter com
contrato valido. O `CriarProjetoUseCase` ja aceita repository como dependencia,
o que e positivo para testes e troca de persistencia.

Atencoes:

- O Repository ainda e pouco usado pelo restante do sistema.
- `ProjetoService` usa `ProjetoStorage`, nao `ProjetoRepository`.
- `ProjetoRepository` usa `MemoryAdapter` global como fallback quando nenhum
  adapter e configurado.

## Storage

Arquivos analisados:

- `js/storage/storage-adapter.js`
- `js/storage/memory-adapter.js`
- `js/storage/firestore-adapter.js`
- `js/storage/README.md`
- `js/storage.js`
- `js/projetos/projeto-storage.js`

Conclusao:

O contrato `StorageAdapterContract` e claro. O `MemoryAdapter` implementa os
metodos esperados e clona dados para evitar mutacao acidental. O
`FirestoreAdapter` esta corretamente reservado para implementacao futura.

Atencoes:

- `js/storage.js` e `ProjetoStorage` ainda representam a camada legada/local.
- `ProjetoStorage` acessa Firestore diretamente, mas esta fora da interface e
  funciona como ponte de compatibilidade.
- O FirestoreAdapter ainda nao substitui os acessos diretos existentes.

## Dashboard

Arquivos analisados:

- `js/dashboard/dashboard-model.js`
- `js/dashboard/dashboard-service.js`
- `js/dashboard/dashboard-controller.js`
- `js/dashboard/dashboard-utils.js`
- `js/dashboard/README.md`

Conclusao:

O Dashboard utiliza `ProjetoService` para obter Projetos e nao acessa Repository
ou Firestore diretamente. Quando nao ha Projetos cadastrados, usa `MemoryAdapter`
para dados simulados. A estrutura esta preparada para renderizacao futura sem
depender de HTML especifico.

Atencoes:

- O Dashboard ja consulta `WorkflowEngine` para proximos status, o que e util,
  mas deve continuar sem criar regras proprias de workflow.
- Indicadores usam placeholders de icone e cor, conforme esperado para a sprint.

## Arquivos importantes

- `docs/PROJECT_BIBLE.md`: visao, camadas e regra arquitetural central.
- `docs/ARCHITECTURAL_DECISIONS.md`: ADRs do Core v1.
- `docs/CHANGELOG.md`: historico de sprints.
- `js/projetos/projeto-model.js`: modelo central de Projeto.
- `js/projetos/projeto-service.js`: fachada de aplicacao para Projeto.
- `js/projetos/projeto-storage.js`: persistencia atual de Projeto.
- `js/workflow/workflow-engine.js`: motor de transicao.
- `js/workflow/workflow-validator.js`: transicoes permitidas.
- `js/core/event-bus.js`: infraestrutura de eventos.
- `js/core/event-types.js`: nomes oficiais de eventos.
- `js/repositories/projeto-repository.js`: repository de Projeto.
- `js/storage/storage-adapter.js`: contrato de adapter.
- `js/storage/memory-adapter.js`: adapter em memoria.
- `js/storage/firestore-adapter.js`: adapter reservado para Firestore.
- `js/usecases/projetos/criar-projeto-usecase.js`: primeiro use case.
- `js/dashboard/dashboard-service.js`: consumo de ProjetoService pelo Dashboard.

## Checklist do Core

| Item | Resposta | Observacao |
| --- | --- | --- |
| Projeto e entidade central? | SIM | Documentado e refletido nos modulos novos. |
| Workflow desacoplado? | SIM | Nao acessa UI, HTML, CSS, Firebase ou Firestore. |
| Event Bus desacoplado? | SIM | API central sem dependencia de telas. |
| Repository desacoplado? | SIM | Depende de adapter, nao de Firestore. |
| Storage desacoplado? | SIM | Contrato e adapters existem; legado ainda convive em paralelo. |
| Dashboard usa ProjetoService? | SIM | `DashboardService` chama `ProjetoService.listar()` e `criarManual()`. |
| Interface acessa Firestore diretamente? | SIM | Ha acessos diretos em scripts legados. |
| Existem dependencias circulares? | NAO | Nao ha imports; ha dependencia por ordem de script. |
| Existem arquivos duplicados? | NAO | Duplicidade relevante nao encontrada; READMEs por modulo sao intencionais. |
| Existe acoplamento desnecessario? | SIM | Principalmente legado com Firestore direto e service usando storage direto. |

## Melhorias futuras

Nao implementar nesta sprint:

- Fazer `ProjetoService` usar `ProjetoRepository` como caminho principal.
- Implementar `FirestoreAdapter` e migrar acessos diretos de Firestore para
  adapters/repositorios.
- Consolidar eventos de Workflow com o Event Bus central.
- Harmonizar `ProjetoStatus` e `WorkflowState` para evitar divergencia futura.
- Reduzir gradualmente acesso direto a `db.collection(...)` em scripts legados.
- Avaliar remocao ou preenchimento de arquivos vazios em sprint de limpeza.
- Documentar ordem oficial de scripts para cada tela que integrar o Core novo.

## Resultado final

Nota geral do Core v1: 8.0/10.

O Core v1 esta pronto para iniciar o Bloco Comercial com ressalvas. A fundacao
arquitetural existe e esta coerente: Projeto central, Workflow separado, Event
Bus simples, Repository + Adapter iniciado e Dashboard consumindo
`ProjetoService`.

Principais riscos:

- Legado ainda acessa Firestore diretamente.
- Repository Pattern ainda nao e o caminho principal de todos os fluxos.
- Possivel divergencia entre status de Projeto e estados do Workflow.
- Dependencias globais por ordem de script podem causar erro de integracao se
  novas paginas carregarem arquivos fora da ordem documentada.

Decisao recomendada:

O Bloco Comercial pode iniciar, desde que novas funcionalidades sigam a
arquitetura do Core e que melhorias estruturais sejam planejadas sem misturar
refatoracao ampla com entrega funcional.
