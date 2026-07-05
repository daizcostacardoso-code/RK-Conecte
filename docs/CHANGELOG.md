# Changelog

## v0.3.0 - Formalizacao Comercial
- Sprint 4.3: Criada a infraestrutura de Export Service e adapters de exportacao.
- Adicionado modulo `js/export/` com model, validator, service, README e adapters para PDF e impressao.
- Adicionado `ExportarDocumentoUseCase` em `js/usecases/export/` para conectar Documento Comercial, renderizacao HTML e adapter escolhido.
- `PdfAdapter` e `PrintAdapter` retornam apenas estruturas simuladas, sem biblioteca externa, sem download, sem PDF real e sem `window.print`.
- Arquitetura preparada para biblioteca PDF real futura, mantendo Document Pipeline, Renderer e adapters desacoplados.
- Sprint 4.1.5: Criado o App State Manager como infraestrutura central de estado em memoria.
- Adicionados `AppState`, `AppStateService` e `AppStateEvents` em `js/core/`.
- Estado central preparado para usuario, empresa, cliente, projeto, orcamento, servico, produtos, documento, configuracoes, loading e erros.
- AppState passa a emitir `app.state.changed`, `app.state.item_changed` e `app.state.cleared` pelo EventBus apenas quando disponivel.
- Estrutura criada sem alterar HTML, CSS, Firebase, Firestore, telas existentes ou fluxo do orcamento.
- Sprint 4.2: Criado o primeiro renderizador visual do Documento Comercial.
- Adicionados `DocumentRenderer`, `DocumentHtmlRenderer` e `DocumentPrintRenderer` em `js/documentos/`.
- Adicionado `RenderizarDocumentoUseCase` para receber Documento Comercial, validar, renderizar HTML e retornar `{ sucesso, html, erros }`.
- Renderizacao preparada para PDF real futuro sem acessar Firestore, sem conhecer OrcamentoOrchestrator, sem alterar telas existentes e sem executar impressao.
- Sprint 4.1 Document Pipeline: Criada a fundacao de Documento Comercial reutilizavel.
- Adicionado modulo `js/documentos/` com model, builder, service, validator e README.
- Adicionado `GerarDocumentoUseCase` em `js/usecases/documentos/` para preparar documento estruturado a partir do contexto do `OrcamentoOrchestrator`.
- Pipeline preparado para PDF, impressao, WhatsApp, e-mail e visualizacao web, sem gerar PDF, HTML, CSS, canvas, download, impressao ou Firestore.
- Sprint 4.1: Criada a camada de dominio do PDF Comercial Profissional.
- Adicionado modulo `js/pdf/` com model, service, template, validator e README.
- Adicionado `GerarPdfUseCase` em `js/usecases/pdf/` para preparar modelo, template e exportacao futura a partir do contexto do `OrcamentoOrchestrator`.
- Estrutura preparada sem download, impressao, exportacao real, bibliotecas externas, canvas, HTML para PDF, Firestore ou alteracao no fluxo do Orcamento Inteligente.

## v0.2.0 - Em desenvolvimento
- Sprint 3.10: Realizada auditoria geral da arquitetura v0.2.x.
- Criado `docs/ARCHITECTURE_REVIEW_V020.md` com visao geral, mapa da arquitetura, fluxo comercial completo, pontos fortes, pontos de atencao, debitos tecnicos, melhorias futuras e recomendacoes para v0.3.0.
- Revisados Core, Workflow, Event Bus, Repository Pattern, Storage Adapter, Dashboard, Projeto, Cliente, Servicos, Produtos, Motor de Calculo, Orquestrador e Orcamento Inteligente.
- Registrada nota geral 8.0/10 e avaliacao de prontidao para iniciar o Epico 4 com ressalvas de governanca arquitetural.
- Sprint 3.9C: Consolidado o MVP do Orcamento Inteligente.
- Painel de resumo passa a exibir Cliente, Projeto, Servico, quantidade de produtos, valor total, tipo de calculo e status.
- Adicionados totais consolidados com subtotal, desconto e acrescimo como placeholders, e total geral vindo do resultado do Motor de Calculo.
- Adicionados campos de observacoes livres, comerciais e tecnicas, alem de condicoes comerciais preparadas para forma de pagamento, prazo de entrega e validade da proposta.
- Implementadas validacao final, finalizacao em memoria e objeto padronizado preparado para PDF Comercial, sem gerar PDF, aprovar, persistir definitivamente ou acessar Firestore direto.
- Sprint 3.9B: Implementado o fluxo guiado do Orcamento Inteligente.
- Controller passa a selecionar Cliente, Projeto, Servico, adicionar/remover Produtos, solicitar calculo ao Motor de Calculo e atualizar o resumo.
- UI passa a renderizar etapa atual, estados de selecao, produtos, calculo pendente e resumo atualizado.
- Orquestrador complementado para remover produtos e limpar calculo/resultado quando selecoes ou produtos mudam.
- Tela antiga de Orcamento preservada; sem PDF, aprovacao, persistencia definitiva, Firebase ou Firestore direto na interface.
- Sprint 3.9A: Criada estrutura inicial da tela do Orcamento Inteligente.
- Adicionada pagina `paginas/orcamento-inteligente.html` com cabecalho, etapas, containers e estados vazios.
- Criados controller e UI iniciais para preparar contexto via Orchestrator/Factory, sem fluxo completo ou calculo duplicado.
- Estilo isolado do Orcamento Inteligente adicionado em `css/style.css`.
- Sprint 3.8: Criado Orquestrador do Orcamento para o futuro Orcamento Inteligente.
- Adicionados contexto, estados, factory e orchestrator em `js/orcamentos/`.
- Criados use cases para criar, calcular e validar Orcamento via Orchestrator.
- Orquestrador passa a coordenar Cliente, Projeto, Servico, Produto, Calculo e Workflow sem interface, Firestore ou alteracoes no Orcamento legado.
- Sprint 3.7: Criado Motor de Calculo Comercial desacoplado.
- Adicionados model, validator, engine e service para Calculos.
- Criados use cases para calcular area, linear e unidade.
- Motor preparado para futuro Orcamento Inteligente, Catalogos, Financeiro, Simulacoes e Dashboard, sem interface ou alteracoes no Orcamento atual.
- Sprint 3.6: Criado dominio Produtos no padrao Core v1.
- Adicionados model, factory, validator, service e repository para Produtos.
- Criados use cases para criar, buscar e listar Produtos.
- Dominio Produtos preparado para futuro Catalogo de Produtos e Orcamento Inteligente, sem interface ou alteracoes no Orcamento atual.
- Sprint 3.5: Criada primeira interface do Catalogo Comercial de Servicos.
- Adicionada pagina `paginas/servicos.html` com cabecalho, busca, categorias, cards, visualizacao e placeholders do Orcamento Inteligente.
- Criados `js/servicos/servico-ui.js` e `js/servicos/servico-controller.js` consumindo Use Cases/ServicoService sem acesso direto ao Firestore.
- Atualizado estilo isolado do modulo Servicos em `css/style.css`.
- Sprint 3.4: Criado dominio Servicos no padrao Core v1.
- Adicionados model, factory, validator, service e repository para Servicos.
- Criados use cases para criar, buscar e listar Servicos.
- Dominio Servicos preparado para futuro Catalogo de Servicos e Orcamento Inteligente.
- Sprint 3.3: Clientes evoluido para Centro Comercial.
- Adicionado resumo do cliente com dados principais de atendimento.
- Criadas abas de Dados, Projetos, Orcamentos, Historico, Timeline e Observacoes.
- Adicionado painel lateral de indicadores comerciais sem novas regras de negocio.
- Sprint 3.2: Criada primeira interface do modulo Clientes.
- Adicionada pagina `paginas/clientes.html` com cabecalho, busca, lista, cadastro rapido e detalhe inicial.
- Interface de Clientes passa a consumir Use Cases/ClienteService sem acesso direto a persistencia.
- Sprint 3.1: Inicio do Centro Comercial de Clientes.
- Criada camada de dominio Cliente com model, factory, validator, service e repository.
- Criados use cases para criar, buscar e listar Clientes.
- Iniciada a descoberta do Bloco Comercial.
- Criados documentos de negocio, UX e fluxo comercial.
- Documentada a jornada do cliente e o processo da vidracaria.
- Implementado Repository Pattern inicial.
- Criado Storage Adapter.
- Criado Memory Adapter.
- Criada estrutura do Firestore Adapter.
- Sprint 2.5.1: Revisao arquitetural do Core v1.
- Criado documento `docs/CORE_REVIEW.md` com auditoria tecnica, checklist e riscos.
- Sprint 2.5: Primeiro Dashboard baseado em Projetos.
- Criada estrutura `js/dashboard/` com model, service, controller e utils.
- Dashboard passa a consumir Projetos pelo `ProjetoService`.
- Dados simulados do Dashboard usam `MemoryAdapter` quando ainda nao houver Projetos cadastrados.
- Indicadores iniciais preparados para Projetos, Em orcamento, Enviados, Aprovados, Producao, Instalacao, Concluidos e Cancelados.
- Criado primeiro Use Case: CriarProjetoUseCase.
- Implementado Event Bus inicial.
- Criado padrao de eventos de dominio.
- Preparada base para Timeline, Dashboard, Financeiro e Producao reagirem a acoes do Projeto.
- Sprint 2.1: Workflow Engine.
- Criada maquina de estados para o ciclo de vida de Projetos.
- Adicionado registro de eventos de Workflow.
- Adicionada validacao de transicoes de estado.
- Formalizadas as decisoes arquiteturais do RK-Conecte.
- Criado modelo de dominio inicial.
- Documentado o conceito de Projeto como entidade central.
- Documentado o Workflow do ciclo de vida de um Projeto.
- Definida a regra arquitetural numero 1: toda funcionalidade pertence a um Projeto ou a Configuracao.
- Iniciada a fundacao do Bloco Comercial.
- Criado conceito central de Projeto.
- Criada documentacao base da arquitetura da v0.2.0.
- Criada estrutura inicial de pastas para modulos comerciais.
- Criado modelo inicial de Projeto.

## v2.5.0
- Criada base profissional do módulo de orçamento interno.
- Adicionados cabeçalho comercial, dados da obra, status, vendedor e validade.
- Itens agora suportam categoria, descrição, tipo de vidro, valor por m², ferragens, serviço e observações técnicas.
- Totais passam a calcular quantidade de itens, área total, descontos, acréscimo, instalação, frete e total final.
- Preparada estrutura de pagamento e custos internos com lucro bruto e margem.
- Orçamento salvo em objeto compatível com Firebase, incluindo datas, usuários e histórico.
- PDF atualizado para exibir dados públicos do cliente, obra, itens, totais, pagamento, validade e aceite.
- Custos internos, histórico e usuários não são enviados para o PDF do cliente.
- Documentação atualizada em arquitetura, regras de negócio, database e roadmap.

## v2.0.0
- Reorganização do projeto para publicação direta pela pasta principal.
- `firebase.json` ajustado para publicar a raiz do projeto.
- Alumínio alterado de cálculo por m² para cálculo linear interno, sem exibir campo/coluna de metragem.
- Melhorias de validação para largura, altura, quantidade e valores negativos.
- Firestore com inicialização mais segura.
- PDF e tabela mantêm Alumínio e Acessórios destacados, sem coluna Linear.
- Documentação inicial em `README.md` e `docs/`.

## 2.1.0
- Corrigido cálculo de alumínio para metro reto usando a maior medida da peça.
- Cliente agora monta orçamento com múltiplos itens, igual ao fluxo do funcionário.
- Solicitações agora sincronizam com Firestore para aparecer no dashboard do funcionário online.


## v2.3.0
- Adicionado módulo Caixa da Empresa no painel do funcionário.
- Controle de entradas, funcionários, despesas, materiais e lucro/saldo.
- Caixa funciona localmente e também salva na coleção Firestore `caixa_empresa` quando disponível.
