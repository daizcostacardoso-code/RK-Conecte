# Dashboard Comercial

Modulo criado na Sprint 4.8 para apresentar uma visao comercial de leitura.

## Arquivos

- `dashboard-comercial-controller.js`: consulta AppState e services existentes,
  monta o estado de exibicao e chama a UI.
- `dashboard-comercial-ui.js`: renderiza cards, tabela, atividades e proximas
  acoes.
- `paginas/dashboard-comercial.html`: tela do Dashboard Comercial.

## Dados Consultados

- `AppStateService.getState()`: documento atual, orcamento atual e
  configuracoes comerciais/conversao.
- `ProjetoService.listar()`: projetos disponiveis pelo service existente.
- `ComercialService.obterRegistroAtual()`: status comercial do Documento
  Comercial atual.
- `DocumentService.validarDocumento()`: leitura da validade do Documento
  Comercial atual.

## KPIs

- Total de Orcamentos.
- Total de Documentos Aprovados.
- Total de Projetos Convertidos.
- Taxa de Conversao.

## Secoes

- Resumo Comercial.
- Valor em Negociacao.
- Ultimos Orcamentos.
- Ultimas Atividades.
- Proximas Acoes.

## Regras da Sprint

- O Dashboard apenas consulta e apresenta informacoes.
- O AppState e somente lido.
- Nao ha chamada direta ao Firestore.
- Nao ha acesso direto a repository.
- Nao cria novas regras de negocio.
- Nao altera Core, Workflow, EventBus, AppState, ProjetoService,
  ComercialService, DocumentService ou ExportService.

## Evolucao Futuras

Este modulo pode evoluir para BI quando houver uma fonte consolidada de
eventos, documentos, projetos e valores historicos. A tela ja separa controller
e UI para permitir troca da origem dos dados sem mudar a apresentacao.
