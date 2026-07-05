# Architecture Review v0.2.x - Sprint 3.10

Auditoria geral da arquitetura implementada na branch `feature/v020-comercial`.

Esta revisao nao altera comportamento, nao cria funcionalidades e nao modifica
regras de negocio. O objetivo e documentar o estado atual da arquitetura,
registrar pontos de atencao e preparar a passagem para as proximas etapas.

## 1. Visao Geral

O RK-Conecte v0.2.x evoluiu de uma PWA estatica com scripts globais e fluxo de
orcamento legado para uma base comercial organizada por dominio, aplicacao,
infraestrutura e interface.

A arquitetura atual tem uma fundacao coerente:

- Projeto continua sendo a entidade central do sistema.
- Workflow Engine controla o ciclo de vida do Projeto.
- Event Bus existe para desacoplar reacoes futuras entre modulos.
- Repository Pattern e Storage Adapter foram introduzidos para reduzir
  dependencia direta de Firestore.
- Cliente, Servicos e Produtos seguem o padrao Core v1.
- Motor de Calculo foi separado da interface e da persistencia.
- Orcamento Inteligente usa um Orchestrator para coordenar services e calculo.
- Tela antiga de Orcamento permanece preservada.

O principal ponto estrutural e a convivencia entre a arquitetura nova e o
legado. Os modulos comerciais recentes estao bem isolados, mas alguns fluxos
antigos ainda usam `db.collection(...)`, LocalStorage direto e arquivos grandes.
Isso e aceitavel para a transicao da v0.2.x, desde que novas sprints nao copiem
esse padrao para funcionalidades novas.

### Escopo analisado

- `js/core/`
- `js/workflow/`
- `js/storage/`
- `js/repositories/`
- `js/dashboard/`
- `js/projetos/`
- `js/clientes/`
- `js/servicos/`
- `js/produtos/`
- `js/calculos/`
- `js/orcamentos/`
- `js/usecases/`
- `paginas/clientes.html`
- `paginas/servicos.html`
- `paginas/orcamento-inteligente.html`
- `paginas/novo-orcamento.html`
- `paginas/orcamento.html`
- `paginas/funcionario.html`
- `css/style.css`
- Documentacao em `docs/`

## 2. Mapa da arquitetura

Fluxo arquitetural recomendado para modulos novos:

```text
Interface
    -> Controller
        -> Use Case
            -> Service / Orchestrator
                -> Model / Validator / Engine / Workflow
                    -> Repository
                        -> Storage Adapter
                            -> Memoria, LocalStorage, Firestore ou API futura
```

Fluxo de eventos esperado:

```text
Acao de dominio
    -> Service ou Use Case
        -> WorkflowEngine quando houver mudanca de etapa
        -> EventBus para notificacoes entre modulos
        -> Historico do Projeto quando aplicavel
```

Mapa por camada:

| Camada | Responsabilidade | Estado atual |
| --- | --- | --- |
| Interface | Renderizar telas, coletar dados e chamar controllers | Adequada nos modulos novos; legado ainda concentra logica |
| Controller | Coordenar eventos da tela e chamar aplicacao | Adequado; alguns controllers ja estao crescendo |
| Use Cases | Entrada de aplicacao reutilizavel | Presente em Cliente, Servicos, Produtos, Calculos, Projetos e Orcamentos |
| Services | Fachadas de aplicacao por dominio | Bem estabelecidas em Cliente, Servicos, Produtos, Calculos e Projetos |
| Orchestrator | Coordenar fluxo do Orcamento Inteligente | Funcional e sem acesso direto a Firestore |
| Models/Validators | Normalizacao e validacao de dominio | Boa separacao nos modulos novos |
| Workflow | Estados e transicoes do Projeto | Isolado e documentado |
| Event Bus | Eventos de dominio desacoplados | Simples e pronto para expansao |
| Repository | Persistencia orientada a dominio | Forte em Cliente, Servicos, Produtos; parcial em Projeto |
| Storage Adapter | Contrato de armazenamento | MemoryAdapter funcional; FirestoreAdapter reservado |
| Legado | Fluxos antigos preservados | Ainda usa Firestore/localStorage direto e arquivos grandes |

Mapa por modulo:

- Core: `EventBus`, tipos de evento, dispatchers e listeners de base.
- Workflow: estados, transicoes, eventos em memoria e `WorkflowEngine`.
- Storage: contrato, `MemoryAdapter` e `FirestoreAdapter` preparado.
- Repositories: `ProjetoRepository` e repositories dedicados em dominios
  comerciais.
- Dashboard: leitura consolidada de Projetos via `ProjetoService`.
- Projeto: modelo central, status, historico, service e storage de transicao.
- Cliente: dominio comercial completo em Core v1.
- Servicos: dominio comercial completo em Core v1 e tela de catalogo.
- Produtos: dominio comercial completo em Core v1, ainda sem tela propria.
- Motor de Calculo: modulo desacoplado, sem persistencia e sem UI.
- Orcamento Inteligente: controller, UI e orchestrator sobre os dominios.
- Orcamento legado: preservado para compatibilidade, com PDF e persistencia
  antiga fora do escopo do fluxo novo.

## 3. Fluxo comercial completo

Fluxo comercial da v0.2.x:

```text
Cliente
    -> Projeto
        -> Servico
            -> Produtos
                -> Motor de Calculo
                    -> Resumo do Orcamento Inteligente
                        -> Objeto preparado para PDF Comercial
```

Fluxo operacional dentro do Orcamento Inteligente:

```text
OrcamentoInteligenteUI
    -> OrcamentoInteligenteController
        -> ClienteService / ProjetoService / ServicoService / ProdutoService
        -> OrcamentoOrchestrator
            -> OrcamentoContext
            -> CalculoService
                -> CalculoValidator
                -> CalculoEngine
            -> WorkflowEngine para leitura de proximos estados quando aplicavel
        -> Resumo renderizado pela UI
```

Estados funcionais observados:

- Cliente nao selecionado.
- Projeto nao selecionado.
- Servico nao selecionado.
- Sem produtos.
- Calculo pendente.
- Resumo atualizado.
- Orcamento validado.
- Orcamento finalizado em memoria.

O fluxo novo respeita os limites definidos:

- Nao gera PDF.
- Nao aprova orcamento.
- Nao faz persistencia definitiva.
- Nao acessa Firestore diretamente pela interface.
- Nao duplica formulas do Motor de Calculo na UI.
- Mantem a tela antiga preservada.

## 4. Pontos fortes

- A decisao de manter Projeto como entidade central esta refletida nos
  documentos e nos modulos.
- Workflow Engine esta bem isolado de UI, HTML, CSS, Firebase e Firestore.
- Event Bus tem API simples e nomes de evento centralizados.
- Repository Pattern e Storage Adapter ja existem como base para reduzir
  acoplamento de persistencia.
- Cliente, Servicos e Produtos seguem padrao consistente: Model, Factory,
  Validator, Repository, Service e Use Cases.
- Motor de Calculo concentra as formulas comerciais e devolve resultado
  padronizado.
- Orcamento Inteligente usa o Orchestrator para coordenar dominios, em vez de
  colocar regras dentro da interface.
- Controller e UI do Orcamento Inteligente mantem fluxo guiado por etapas.
- Dashboard consome `ProjetoService` e nao acessa Firestore diretamente.
- A tela antiga de Orcamento continua preservada, reduzindo risco de regressao.
- A documentacao evoluiu junto com a arquitetura e registra limites de cada
  sprint.

## 5. Pontos de atencao

- `ProjetoService` ainda usa `ProjetoStorage` diretamente, enquanto outros
  dominios novos usam Repository + Adapter de forma mais clara.
- `ProjetoStorage` mistura LocalStorage e Firestore dentro do mesmo objeto,
  funcionando como ponte de compatibilidade.
- `WorkflowEvents` e `EventBus` ainda sao mecanismos separados de evento.
- `ProjetoStatus` e `WorkflowState` possuem conceitos parecidos, mas nao
  totalmente unificados.
- A dependencia por ordem de `<script>` continua sendo um ponto fragil do padrao
  sem bundler.
- `css/style.css` esta muito grande e concentra estilos de muitos modulos.
- `funcionario.js`, `orcamento.js`, `orcamento-cliente.js`, `pdf.js`,
  `valores.js` e `orcamentos/orcamento-storage.js` ainda representam legado com
  acesso direto a Firestore ou persistencia local.
- `OrcamentoOrchestrator`, `orcamento-inteligente-controller.js` e
  `orcamento-inteligente-ui.js` cresceram bastante durante as Sprints 3.9B e
  3.9C.
- Alguns documentos antigos ainda possuem encoding inconsistente.
- Existem arquivos documentais vazios ou reservados, como `docs/API.md`,
  `docs/BLOCO_FINANCEIRO.md`, `docs/BLOCO_OPERACIONAL.md`,
  `docs/PADRAO_CODIGO.md` e `docs/UI_GUIDE.md`.
- `js/totais.js` esta vazio e deve ser tratado em sprint propria de limpeza.
- Nao ha suite automatizada de testes para garantir contratos entre services,
  validators, workflow, calculo e orchestrator.

## 6. Debitos tecnicos

Debitos de arquitetura:

- Migrar Projeto para o mesmo fluxo Repository + Adapter usado nos dominios
  comerciais novos.
- Implementar ou formalizar um adapter de LocalStorage para substituir o uso
  direto de `Storage` nos fluxos novos.
- Consolidar estrategia entre `WorkflowEvents` e `EventBus`.
- Harmonizar status de Projeto e estados do Workflow.
- Definir uma regra oficial de carregamento de scripts por tela.

Debitos de modularizacao:

- Dividir gradualmente `css/style.css` por modulo ou por blocos funcionais.
- Reduzir responsabilidades dos controllers maiores, especialmente no
  Orcamento Inteligente.
- Considerar use cases dedicados para validacao final, resumo e preparacao para
  PDF na fase de PDF Comercial.
- Isolar dados simulados de desenvolvimento para evitar mistura com fluxo de
  producao.

Debitos de legado:

- Mapear e reduzir acesso direto a `db.collection(...)` em scripts antigos.
- Manter PDF legado separado do futuro PDF Comercial ate a Sprint 4.1.
- Evitar que novas telas reutilizem padroes antigos de persistencia direta.

Debitos de qualidade:

- Criar testes de unidade para validators, models e Motor de Calculo.
- Criar testes de contrato para repositories e adapters.
- Criar testes de fluxo para `OrcamentoOrchestrator`.
- Adicionar verificacao automatizada de carregamento das paginas principais.
- Corrigir encoding de documentos antigos em uma sprint dedicada.

## 7. Melhorias futuras

- Criar um guia oficial de arquitetura v0.3.0 com exemplos de novos modulos.
- Criar checklist de aceitacao para novas telas: sem Firestore direto, sem regra
  comercial na UI, com service/use case definido.
- Introduzir camada de use cases mais forte para fluxos compostos.
- Preparar `FirestoreAdapter` real antes de migrar persistencia definitiva.
- Separar estilos por modulo sem alterar visual.
- Criar factories de dados de teste para Cliente, Projeto, Servico, Produto e
  Orcamento.
- Definir eventos de dominio obrigatorios para mudancas importantes do Projeto.
- Formalizar objeto de proposta comercial que sera consumido pelo PDF da Sprint
  4.1.
- Documentar contratos publicos dos services mais usados.
- Criar matriz de dependencias entre modulos para evitar acoplamento cruzado.

## 8. Recomendacoes para v0.3.0

Recomendacao principal:

```text
A arquitetura esta pronta para iniciar o proximo epico, desde que novas entregas
sigam o padrao novo e nao ampliem o legado.
```

Antes de crescer a v0.3.0, recomenda-se:

- Tratar Projeto como prioridade arquitetural, aproximando `ProjetoService` de
  Repository + Adapter.
- Definir qual mecanismo de evento sera o caminho oficial entre Workflow e
  Event Bus.
- Criar testes minimos para Motor de Calculo, Workflow e Orchestrator.
- Congelar o acesso direto a Firestore em novas telas.
- Documentar ordem oficial de scripts das telas comerciais.
- Planejar a divisao do CSS sem misturar com entrega funcional.

Para a Sprint 4.1, PDF Comercial:

- Usar `contexto.orcamentoPreparado` como contrato de entrada.
- Nao consultar Firestore diretamente na geracao do PDF.
- Nao recalcular totais no PDF.
- Consumir valores ja vindos do Motor de Calculo e do resumo consolidado.
- Manter aprovacao e persistencia definitiva fora do escopo, salvo decisao de
  sprint futura.

Nota geral da arquitetura v0.2.x: **8.0/10**.

Conclusao: a arquitetura esta pronta para iniciar o Epico 4, especialmente a
Sprint 4.1 de PDF Comercial. A base e consistente, o fluxo comercial esta
integrado e o Orcamento Inteligente ja entrega um objeto padronizado. Os riscos
principais estao no legado, no tamanho de alguns arquivos e na persistencia de
Projeto ainda nao totalmente alinhada ao Repository Pattern.
