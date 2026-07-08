# Changelog

## v0.4.1 - Cadastros Guiados para Orcamento Inteligente
- Projetos agora garantem `Projeto padrao` e projetos genericos sugeridos, preservando o padrao sempre disponivel para orcamentos rapidos.
- Produtos passaram a funcionar como cadastro tecnico de materiais, insumos, acessorios, ferragens, vidros e mao de obra, mantendo apenas unidade/regra de calculo, custo unitario, status e observacoes no fluxo da sprint.
- Servicos foram reorganizados como macro categorias (`Instalacao`, `Manutencao`, `Limpeza`, `Medicao tecnica`, `Remocao` e `Outros`), com tipos editaveis.
- Dependencias de Servicos/Tipos agora sao selecionadas apenas de Produtos ativos cadastrados e salvas com `produtoId`, nome, categoria, unidade, regra, quantidade padrao, custo unitario, custo estimado, obrigatoriedade e observacao.
- Margem, lucro, markup, preco de venda, comissoes, impostos e precificacao final ficaram fora do cadastro de Produtos desta sprint.
- Tamanhos padrao continuam editaveis e vinculados ao modelo relacionado, incluindo Porta de abrir, Porta de correr, Janela 2 folhas, Janela 4 folhas e Box frontal.
- O Orçamento Inteligente mantem o fluxo visual atual, mas passa a ter `Projeto padrao` como apoio pre-selecionado quando um cliente e escolhido.
- Atualizados estilos e documentacao dos cadastros sem alterar calculo, preview, PDF, producao, aprovacao, conversao ou area publica.

## v0.4.0 - Sprint Cadastros Base para Orcamento Inteligente
- Criados cadastros internos funcionais para Projetos, Produtos e Servicos, com listagem, busca, criacao, edicao e inativacao logica.
- Adicionado `LocalStorageAdapter` em `js/storage/local-storage-adapter.js`, mantendo persistencia pelo fluxo Repository/Adapter sem API, MySQL ou acesso direto da interface a Firestore.
- Produtos passam a suportar `valorUnitario`, `custo`, `unidade`, dependencias e tamanhos padrao com area em m2, preservando aliases legados `precoVenda`, `precoCusto` e `unidadeVenda`.
- Servicos passam a suportar tipos/modelos de item, dependencias padrao e tamanhos padrao; a base inicial inclui Porta, Janela, Box, Espelho, Vidro fixo, Fachada, Guarda-corpo e Outros.
- Projetos passam a ter CRUD interno com nome, cliente, descricao, endereco da obra, cidade, status, tipo e observacoes, alem de selecao para uso futuro no Orcamento Inteligente.
- Adicionados use cases de listagem, atualizacao e inativacao para Projetos, Produtos e Servicos.
- `OrcamentoInteligenteController` passou a configurar catalogos pelo adapter local quando houver cadastros salvos, mantendo os fallbacks atuais e sem alterar calculo, preview ou PDF.
- Atualizado `css/style.css` com estilos compartilhados para os cadastros internos, preservando a identidade visual do painel.

## v0.4.0 - Ajustes visuais PDF e Orcamento Inteligente
- PDF Comercial do cliente deixa de renderizar as secoes de Servico e Condicoes Comerciais, mantendo esses dados no Documento Comercial para controle interno.
- PDF Comercial recebeu ajuste de espacamento vertical em campos e assinaturas para reduzir respiros excessivos entre nomes e linhas.
- Central de Compartilhamento passa a usar preview de PDF com fallback para mobile, exibindo acoes de abrir em tela cheia e baixar quando o navegador nao renderizar o PDF embutido.
- Orcamento Inteligente recebeu melhorias visuais de clareza nas etapas, estados, opcoes de servico, campos numericos, unidades e botoes, sem mudar layout principal ou funcionalidades.
- Criado `docs/VISAO_FUTURA_ORCAMENTO_VIDRACARIA.md` com ideias futuras de visualizacao, logica de orcamento e layout, sem implementacao nesta etapa.

## v0.4.0 - Sprint 5.3 Preparacao MySQL/API
- Criada a base isolada da API em `api/`, com estrutura `src/config`, `src/database`, `src/routes`, `src/controllers`, `src/services`, `src/repositories`, `src/models` e `src/migrations`.
- Adicionado `api/package.json` com Express, mysql2, CORS, dotenv e nodemon para subir a API separadamente do frontend.
- Criada conexao MySQL em `api/src/database/mysql.js`, usando `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.
- Adicionado `api/.env.example` com configuracao local padrao para `rk_conecte`.
- Adicionados health checks `GET /api/health` e `GET /api/db-health`; o banco retorna erro controlado quando o MySQL ainda nao estiver configurado.
- Criado schema inicial em `api/src/migrations/001_schema_inicial.sql` com clientes, orcamentos, itens, caixa, agenda, PDFs comerciais, projetos, ordens de producao e usuarios.
- Criado `js/storage/api-adapter.js` como placeholder seguro para futura API, sem substituir Firebase, Firestore, localStorage ou adapters atuais.
- Criado `docs/MYSQL_MIGRATION_PLAN.md` documentando migracao gradual, Repository Pattern e regra de frontend falar somente com API, nunca direto com banco.

## v0.4.0 - Sprint 5.2.2 Orcamento Inteligente + Preview/PDF
- Orcamento Inteligente passa a selecionar multiplos tipos de servico no mesmo contexto: Porta, Janela, Box, Espelho, Vidro fixo, Fachada, Guarda-corpo e Outros.
- Criado `js/orcamentos/orcamento-item-config.js` para centralizar tipos, subtipos, tamanhos padrao e dependencias demonstrativas dos itens de vidracaria.
- Itens do projeto passam a carregar grupo de servico, tipo, subtipo, dependencias, tamanho padrao ou engenharia/personalizado, medidas em cm, area m2, percentual e valor de adicional de engenharia.
- `CalculoService`/`CalculoEngine` passam a aplicar adicional de engenharia por item somente em engenharia/personalizado, preservando tamanho padrao com adicional zerado.
- Resumo, Documento Comercial e PDF passam a consumir os itens/totais finais do contexto preparado, incluindo desconto/acrescimo em tempo real e ocultando ajustes/observacoes vazios no preview/PDF.
- Preview e PDF receberam tabela comercial com tipo, subtipo, medidas, area, quantidade, valor unitario, adicional de engenharia e subtotal, com largura minima segura para evitar quebra letra por letra.

## v0.4.0 - Sprint 5.2.1 Orcamento Inteligente Comercial
- Orcamento Inteligente passa a permitir cadastro rapido de novo cliente via Use Case/ClienteService, sem acesso direto a Firestore pela interface.
- Itens do orcamento agora sao independentes, com produto relacionado, descricao, largura/altura em centimetros, quantidade, unidade, valor unitario, area em m2 e subtotal por item.
- Calculo de itens foi centralizado em `CalculoService`/`CalculoEngine`, convertendo cm para m2 e aplicando desconto/acrescimo em tempo real.
- Resumo comercial ganhou campos guiados para desconto, acrescimo, forma de pagamento, prazo de entrega e validade da proposta.
- Documento Comercial e PDF passam a consumir os itens/totais preparados pelo Orcamento Inteligente, escondendo observacoes vazias e evitando placeholders no preview final.
- Preview do Documento Comercial recebeu layout de proposta com cabecalho, cliente/projeto, tabela de itens, resumo financeiro, condicoes comerciais, assinaturas e rodape profissional.

## v0.4.0 - Sprint 5.2 Planejamento da Producao
- Ordem de Producao expandida para planejamento operacional com `clienteId`, `numero`, `previsaoInicio`, `previsaoEntrega`, `tempoEstimado`, `descricao`, `observacoes`, `checklist`, `historico`, `criadoEm` e `atualizadoEm`.
- Status de Producao centralizados em `PRODUCAO_STATUS`: `PENDENTE`, `PLANEJADA`, `LIBERADA`, `EM_PRODUCAO` e `FINALIZADA`.
- Prioridades centralizadas em `PRODUCAO_PRIORIDADE`: `BAIXA`, `NORMAL`, `ALTA` e `URGENTE`; valor legado `MEDIA` passa a ser normalizado para `NORMAL`.
- Checklist operacional padrao criado para toda Ordem: Projeto conferido, Medidas conferidas, Material definido, Ferragens definidas e Producao autorizada.
- `ProducaoService` passa a planejar ordem, alterar responsavel, alterar prioridade, atualizar checklist, liberar producao e calcular indicadores sem acesso direto a Firestore.
- Adicionados use cases de listagem, indicadores, planejamento, responsavel, prioridade, checklist e liberacao em `js/usecases/producao/`.
- `paginas/producao.html` evoluida para listar cards de ordens, selecionar ordem, editar planejamento, marcar checklist, liberar producao, ver historico e exibir indicadores.
- Eventos novos disparados quando disponivel: `ordem.planejada`, `ordem.liberada`, `ordem.responsavel`, `ordem.prioridade` e `ordem.checklist_atualizado`.
- Mantido MemoryAdapter/sessionStorage/demo state como persistencia temporaria; sem estoque, compras, agenda, instalacao, financeiro, SQL, login real ou Firestore definitivo.

## v0.4.0 - Sprint Caixa Seguro
- Criado modulo `js/caixa/` com model, validator, repository, service, export e README.
- Caixa passa a normalizar lancamentos em `schemaVersion: 1`, preenchendo campos novos sem descartar registros legados.
- Repository do caixa preserva compatibilidade com localStorage `vidracaria_caixa_empresa` e Firestore `caixa_empresa`.
- Listagem do caixa passa a mesclar localStorage e Firestore por `idFirestore`, `idLocal`, `criadoEmISO` e fallback gerado, evitando duplicidade.
- `Funcionario.carregarCaixa`, `registrarMovimentoCaixa`, `cancelarMovimentoCaixa` e exclusao definitiva passam a chamar `CaixaService` internamente, mantendo a tela atual.
- Exportacao JSON do caixa passa a gerar backup no formato `rk-caixa-backup-AAAA-MM-DD.json`.
- Criado `docs/MIGRACAO_CAIXA_SQL.md` com tabela SQL futura e mapeamento Firestore/localStorage -> SQL.
- Atualizado cache do Service Worker para `rk-vidracaria-v4.0.2`.

## v0.4.0 - Hotfix 5.1B
- Separado o site publico do painel interno para Produtos e Servicos.
- Criadas as paginas publicas `paginas/produtos-publico.html` e `paginas/servicos-publico.html` com conteudo institucional simples.
- Menus publicos de `index.html`, `paginas/contato.html` e `paginas/orcamento.html` passam a apontar para as paginas publicas.
- Mantidas `paginas/produtos.html` e `paginas/servicos.html` como rotas internas protegidas do painel.
- Ajustado o visual do botao Login no header removendo seletor generico `a[href*="login"]` e usando classes especificas.
- Atualizado o cache do Service Worker para `rk-vidracaria-v4.0.1` para evitar cache antigo no site publicado.

## v0.4.0 - Integracao Visual E2E
- Sprint 5.1A: Integrado fluxo visual end-to-end do RK-Conecte no site online.
- Adicionada navegacao principal compartilhada em `js/shared/rk-navigation.js` para Dashboard Comercial, Clientes, Projetos, Servicos, Produtos, Orcamento Inteligente, Documento, Aprovacao, Conversao e Producao.
- Adicionado estado demo local em `js/shared/rk-e2e-demo-state.js`, usando `sessionStorage` e AppState para testar o fluxo sem banco externo.
- Login e loading passam a direcionar para `paginas/dashboard-comercial.html`.
- Criada pagina `paginas/projetos.html` com `js/projetos/projeto-ui.js` e `js/projetos/projeto-controller.js` para selecao visual de Projeto.
- Orcamento Inteligente passa a oferecer `Gerar Documento Comercial`, alimentando Document Pipeline e AppState.
- Compartilhamento passa a tentar download de PDF quando o `PdfAdapter` real entrega bytes; quando nao for possivel, exibe mensagem clara.
- Criada pagina `paginas/producao.html` com `js/producao/producao-ui.js` e `js/producao/producao-controller.js`, permitindo criar Ordem de Producao demo a partir do Projeto convertido.
- Criado `docs/INTEGRACAO_VISUAL_E2E.md` com fluxo, paginas, modulos, dados demo, limitacoes e roteiro de teste.

## v0.4.0 - Operacional
- Sprint 5.1: Criado o Centro de Producao como dominio operacional inicial.
- Adicionado modulo `js/producao/` com model, validator, repository, service e README para Ordem de Producao.
- Adicionado `CriarOrdemProducaoUseCase` em `js/usecases/producao/`.
- Ordem de Producao nasce vinculada a `projetoId`, com status `PENDENTE`, `PLANEJADA`, `EM_PRODUCAO` e `FINALIZADA`.
- `ProducaoRepository` usa Repository Pattern com `MemoryAdapter` como padrao, sem Firestore.
- `ProducaoService` reutiliza ProjetoService como referencia de Projeto, registra Workflow quando disponivel, dispara `ordem.criada`, `ordem.iniciada` e `ordem.finalizada` pelo EventBus e salva `ordemAtual` no AppState.
- AppState recebeu suporte explicito para `ordemAtual`.
- Estrutura preparada para o futuro Planejamento consumir ordens por Projeto, sem alterar Comercial, ProjetoService, Workflow, EventBus, Repository global, Documentos, Export ou Dashboard Comercial.

## v0.3.0 - Formalizacao Comercial
- RC1 v0.3.0 Comercial: fechado o risco de publicacao do `pdf-lib` ao versionar o artefato browser em `js/vendor/pdf-lib.min.js` e atualizar o fallback do `PdfAdapter` para caminho estatico publicado.
- RC1 tambem documenta em `docs/releases/RC1_v0.3.0.md` que a Conversao em Projeto da v0.3.0 cria Projeto Executivo em memoria/AppState, enquanto a persistencia definitiva fica para a v0.4 Producao via componente apropriado.
- Release Review v0.3.0 Comercial: criada auditoria de release em `docs/releases/v0.3.0-comercial.md`, com resumo da versao, fluxo comercial, arquitetura atual, pontos fortes, riscos, checklist de qualidade, nota 8.1/10 e recomendacao de nao taguear ainda como release pronta ate resolver o risco de publicacao do `pdf-lib` e a decisao de persistencia da conversao.
- Sprint 4.8: Criado o Dashboard Comercial como tela de leitura da Formalizacao Comercial.
- Adicionada pagina `paginas/dashboard-comercial.html` com Resumo Comercial, Valor em Negociacao, Ultimos Orcamentos, Ultimas Atividades e Proximas Acoes.
- Adicionado modulo `js/dashboard-comercial/` com controller, UI e README.
- Dashboard consulta AppState, ProjetoService, ComercialService e DocumentService sem alterar estado, sem acessar Firestore diretamente e sem criar novas regras de negocio.
- KPIs exibem Total de Orcamentos, Total de Documentos Aprovados, Total de Projetos Convertidos e Taxa de Conversao a partir de dados ja existentes.
- Sprint 4.7: Criada a Conversao em Projeto a partir de Documento Comercial aprovado.
- Adicionado modulo `js/conversao/` com model, validator, service e README.
- Adicionado `ConverterProjetoUseCase` em `js/usecases/conversao/`.
- Adicionada tela `paginas/converter-projeto.html` com fluxo simples de Documento aprovado -> Converter em Projeto -> mensagem de sucesso.
- Conversao cria Projeto Executivo por `ProjetoService.criarManual`, preserva cliente, servico, produtos, totais, observacoes e referencia ao Documento Comercial de origem.
- AppState registra `projetoSelecionado` e `configuracoes.conversao` com `projetoAtual`, `documentoOrigem` e `dataConversao`, sem alterar o AppState.
- Fluxo emite `projeto.criado` e `projeto.convertido` quando EventBus estiver disponivel, sem Firestore, sem repository direto e sem alterar ProjetoService, Workflow, Document Pipeline, Export Service ou Motor de Calculo.
- Sprint 4.6: Criado o fluxo de Aprovacao Comercial do Documento Comercial.
- Adicionado modulo `js/comercial/` com model, validator, service, controller e README.
- Adicionados use cases `AprovarDocumentoUseCase` e `ReprovarDocumentoUseCase` em `js/usecases/comercial/`.
- Adicionada tela `paginas/aprovacao-comercial.html` para solicitar aprovacao, aprovar, reprovar e voltar para revisao.
- Fluxo usa Document Pipeline, Workflow, AppState e ExportService sem Firestore, sem conversao em Projeto e sem alterar Workflow, EventBus, AppState, Renderer, ExportService ou PDF Adapter.
- Estado comercial passa a ser guardado em `configuracoes.comercial`, preservando as chaves originais do AppState.
- Sprint 4.5: Implementada geracao real do PDF Comercial dentro do `PdfAdapter`.
- Instalada dependencia `pdf-lib`, encapsulada exclusivamente em `js/export/adapters/pdf-adapter.js`.
- PDF passa a ser gerado a partir dos dados do Documento Comercial, com logo placeholder, empresa, cliente, projeto, servicos, produtos, resumo financeiro, observacoes, condicoes comerciais, validade, assinaturas e rodape.
- Adapter preparado para logo real, QR Code e assinatura digital futuros, sem alterar ExportService, Document Pipeline, Renderer, Workflow ou AppState.
- Geracao real validada via bytes `Uint8Array`, sem Firestore, sem Services de dominio, sem download e sem outros imports de `pdf-lib`.
- Sprint 4.4: Criada a Central de Compartilhamento do Documento Comercial.
- Adicionada pagina `paginas/compartilhar-documento.html` para visualizar, exportar PDF simulado, preparar impressao e exibir placeholders de WhatsApp, Email e Link.
- Adicionados `DocumentShareController` e `DocumentShareUI` em `js/documentos/`, reutilizando Document Pipeline, Document Renderer, Export Service, adapters e AppState.
- Central salva `documentoAtual` no AppState e registra a ultima acao em `configuracoes.ultimaAcaoExportacao`, sem alterar AppState.
- Interface criada sem PDF real, envio, backend, download, `window.print`, Firestore ou mudancas no Orcamento Inteligente.
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
