# Project Bible - RK-Conecte

## Visao do produto

RK-Conecte e o sistema operacional da RK Vidracaria. O produto deve organizar a rotina da empresa em uma linha clara: atendimento, orcamento, aprovacao, producao, instalacao, financeiro, garantia e historico.

A visao do produto e transformar demandas de clientes em Projetos rastreaveis, reduzindo perda de informacao e criando uma base confiavel para operacao, gestao e inteligencia.

## Missao

Ajudar a RK Vidracaria a trabalhar com mais velocidade, simplicidade e controle, mantendo cada oportunidade, venda e obra dentro de um fluxo unico e acompanhavel.

## Conceito de Projeto Vivo

Projeto Vivo e o conceito central do RK-Conecte.

Um Projeto nao e apenas um cadastro. Ele muda de estado, recebe eventos, ganha anexos, fotos, pagamentos, tarefas, historico e indicadores. Ele acompanha a vida real da demanda desde o primeiro contato ate o arquivamento.

Na v0.2.0, o Projeto Vivo nasce no Comercial. Nas proximas versoes, ele deve avancar para Operacional, Financeiro, Inteligencia e estabilidade comercial.

## Regra arquitetural numero 1

Toda funcionalidade pertence a um Projeto ou a Configuracao do sistema.

Antes de criar uma funcionalidade nova, a pergunta obrigatoria e:

```text
Isto faz parte de um Projeto ou e uma Configuracao geral?
```

Se fizer parte da jornada de um cliente, deve se relacionar com Projeto. Se definir parametros globais do sistema, deve pertencer a Configuracao.

## Principios

- Simplicidade: a equipe deve conseguir operar o sistema no ritmo do dia a dia.
- Velocidade: criar, localizar e atualizar informacoes deve ser rapido.
- Rastreabilidade: mudancas importantes devem gerar historico.
- Escalabilidade: o MVP deve crescer sem reescrever a base.
- Clareza: regras de negocio devem ficar documentadas e fora de telas sempre que possivel.

## Separacao em camadas

### Dominio

Contem as regras principais do negocio: Projeto, status, workflow, historico, orcamento, cliente, financeiro e demais entidades.

O Dominio nao deve depender da interface.

### Aplicacao

Orquestra casos de uso: criar Projeto, alterar status, registrar historico, vincular orcamento, aprovar proposta e preparar dados para producao.

A Aplicacao deve ser o ponto de entrada preferencial para telas.

O Event Bus pertence a base de aplicacao/core e permite que modulos reajam a eventos de dominio sem dependencia direta entre si.

Use Cases representam a camada de aplicacao. Eles coordenam validacao, repositorios e eventos de dominio sem depender da interface.

### Infraestrutura

Cuida de armazenamento e integracoes: Firestore, LocalStorage, Firebase Hosting, arquivos e futuras APIs.

Detalhes de infraestrutura nao devem vazar para a interface.

Repositorios e adapters formam a ponte entre Aplicacao e Infraestrutura. O reposititorio fala com um adapter; o adapter decide se os dados ficam em memoria, LocalStorage, Firestore ou outra tecnologia futura.

### Interface

Mostra dados, coleta entradas do usuario e chama servicos de aplicacao.

A interface nao deve acessar Firestore diretamente nem concentrar regras de negocio sensiveis.

## Fluxo geral

```text
cliente -> orcamento -> aprovacao -> producao -> instalacao -> financeiro -> garantia -> arquivamento
```

O Projeto acompanha esse fluxo e guarda os dados essenciais de cada etapa.

## Blocos do sistema

### Comercial

Clientes, produtos, servicos, orcamentos, propostas, aprovacoes e conversao em Projeto.

Na Sprint 3.1, o Bloco Comercial inicia pelo Centro Comercial de Clientes. A
camada de Cliente deve seguir o Core v1 com Use Cases, Service, Repository e
Adapter, sem acesso direto ao Firestore e sem alterar fluxos existentes de
Orcamento, Dashboard, Producao ou Financeiro.

Na Sprint 3.4, o dominio Servicos entra como estrutura de base do Bloco
Comercial. Servicos segue o mesmo Core v1 de Cliente e Projeto, com model,
factory, validator, service, repository e use cases. Esta sprint prepara o
futuro Catalogo de Servicos e o Orcamento Inteligente, sem implementar tela,
cadastro, catalogo, PDF, Firebase ou alteracoes no Orcamento atual.

Na Sprint 3.5, o Catalogo Comercial de Servicos ganha a primeira interface em
`paginas/servicos.html`. A tela lista Servicos por meio de
`ListarServicosUseCase`, visualiza detalhes por `BuscarServicoUseCase` e mantem
placeholders para produtos sugeridos, ferragens sugeridas, campos obrigatorios e
fluxo do Orcamento Inteligente. A interface nao acessa Firestore nem Repository
diretamente e nao implementa cadastro, edicao ou inicio real de orcamento.

Na Sprint 3.6, o dominio Produtos entra como estrutura de base do Bloco
Comercial. Produtos segue o Core v1 com model, factory, validator, service,
repository e use cases. Esta sprint prepara o futuro Catalogo de Produtos e o
Orcamento Inteligente, com categorias, subcategorias de vidro, precificacao e
atributos tecnicos, sem implementar tela, HTML, CSS, Firebase ou alteracoes no
Orcamento atual.

Na Sprint 3.7, nasce o Motor de Calculo Comercial como modulo reutilizavel e
desacoplado em `js/calculos/`. O motor segue o Core v1 sem persistencia, no
fluxo Use Cases -> `CalculoService` -> `CalculoValidator` -> `CalculoEngine`.
Ele calcula area, metro linear e unidade com resultado padronizado, preparando
base futura para Orcamento Inteligente, Catalogo de Servicos, Catalogo de
Produtos, Financeiro, Simulacoes e Dashboard. Esta sprint nao altera o
orcamento legado, telas, HTML, CSS, Firebase ou Firestore.

Na Sprint 3.8, o Orquestrador do Orcamento entra como camada de aplicacao para
coordenar o fluxo do futuro Orcamento Inteligente. O modulo vive em
`js/orcamentos/` e usa contexto, estados, factory e orchestrator para integrar
`ClienteService`, `ProjetoService`, `ServicoService`, `ProdutoService`,
`CalculoService` e `WorkflowEngine`. O Orchestrator nao calcula formulas, nao
acessa Repository diretamente, nao acessa Firestore e nao altera interface,
HTML, CSS, Firebase ou o Orcamento legado.

Na Sprint 3.9A, nasce a primeira estrutura visual do Orcamento Inteligente em
`paginas/orcamento-inteligente.html`. A tela exibe cabecalho, etapas, areas para
cliente, projeto, servico, produtos, calculo e resumo, alem de estados vazios.
O controller inicializa apenas um contexto por `CriarOrcamentoUseCase`,
`OrcamentoOrchestrator` ou `OrcamentoFactory`, sem duplicar regra de calculo,
sem PDF, sem aprovacao, sem Firebase, sem Firestore e sem alterar a tela antiga
de orcamento.

Na Sprint 3.9B, o Orcamento Inteligente passa a ter fluxo guiado funcional:
Cliente -> Projeto -> Servico -> Produtos -> Calculo -> Resumo. A interface
renderiza uma etapa por vez e chama apenas controller/use cases/orquestrador. O
controller consome `ClienteService`, `ProjetoService`, `ServicoService` e
`ProdutoService` para montar as opcoes, chama `OrcamentoOrchestrator` para
selecionar entidades e produtos, e solicita o calculo por
`CalcularOrcamentoUseCase`/`CalculoService`. O resumo e atualizado a partir do
contexto retornado, sem PDF, sem aprovacao, sem persistencia definitiva, sem
Firebase e sem acesso direto a Firestore pela interface.

Na Sprint 3.9C, o MVP do Orcamento Inteligente e consolidado. O contexto passa
a carregar resumo, observacoes, condicoes comerciais, validacao final e objeto
padronizado preparado para PDF Comercial. O painel de resumo exibe Cliente,
Projeto, Servico, quantidade de produtos, valor total, tipo de calculo e
status. Os totais usam o resultado do Motor de Calculo, mantendo desconto e
acrescimo apenas como placeholders. A finalizacao valida cliente, projeto,
servico, produtos e resultado de calculo, sem gerar PDF, sem aprovacao, sem
persistencia definitiva e sem acesso direto a Firestore pela interface.

Na Sprint 3.10, a arquitetura da v0.2.x e auditada sem alteracao de
comportamento. A revisao consolida Core, Workflow, Event Bus, Repository
Pattern, Storage Adapter, Dashboard, Projeto, Cliente, Servicos, Produtos,
Motor de Calculo, Orquestrador e Orcamento Inteligente em
`docs/ARCHITECTURE_REVIEW_V020.md`. A conclusao registra arquitetura pronta
para iniciar o Epico 4, com atencao especial a legado com Firestore direto,
Projeto ainda parcialmente fora do Repository Pattern, arquivos grandes e
necessidade de testes automatizados.

Na Sprint 4.1, o PDF Comercial Profissional ganha uma camada de dominio propria
em `js/pdf/`. O modulo prepara modelo, validator, service e template logico a
partir do contexto do `OrcamentoOrchestrator`, usando
`contexto.orcamentoPreparado` quando disponivel. Esta sprint nao gera arquivo,
nao faz download, nao imprime, nao usa bibliotecas externas, nao usa canvas, nao
transforma HTML em PDF e nao acessa Firestore. A geracao efetiva fica reservada
para a Sprint 4.2.

Ainda na Sprint 4.1, nasce o Document Pipeline em `js/documentos/`. Essa camada
transforma o Orcamento Inteligente em um Documento Comercial estruturado,
reutilizavel por PDF, impressao, WhatsApp, e-mail e visualizacao web. O pipeline
usa o contexto do `OrcamentoOrchestrator`, preserva Services comerciais como
dependencias de aplicacao e nao acessa Firestore, HTML, CSS ou bibliotecas
externas.

Na Sprint 4.1.5, o Core recebe o App State Manager em `js/core/`. Essa
infraestrutura centraliza estado de aplicacao em memoria para usuario, empresa,
cliente selecionado, projeto selecionado, orcamento atual, servico selecionado,
produtos selecionados, documento atual, configuracoes, loading e erros. O
AppState nao persiste dados, nao acessa Firestore, nao altera telas e apenas
emite eventos pelo EventBus quando ele estiver disponivel.

Na Sprint 4.2, o Documento Comercial recebe a primeira camada de renderizacao.
`DocumentRenderer` valida e prepara visualizacao, `DocumentHtmlRenderer` gera
uma string HTML limpa e `DocumentPrintRenderer` prepara estrutura de impressao
futura sem executar impressao. O renderizador recebe apenas o Documento
Comercial ja montado, nao conhece `OrcamentoOrchestrator`, nao acessa Firestore
e nao altera telas existentes.

Na Sprint 4.3, nasce a infraestrutura de exportacao em `js/export/`. O
`ExportService` recebe Documento Comercial pronto, usa o HTML renderizado pelo
`DocumentHtmlRenderer`, valida a solicitacao e seleciona um adapter
independente. `PdfAdapter` e `PrintAdapter` retornam apenas estruturas
simuladas, sem biblioteca externa, sem download, sem PDF real, sem
`window.print` e sem acesso a Firestore. A biblioteca PDF definitiva deve ficar
encapsulada no adapter em sprint futura.

Na Sprint 4.4, a primeira tela da Formalizacao Comercial entra como Central de
Compartilhamento do Documento. A pagina `paginas/compartilhar-documento.html`
reutiliza Document Pipeline, Document Renderer, Export Service, adapters e
AppState para visualizar o Documento Comercial, exportar PDF simulado, preparar
impressao futura e exibir placeholders integrados para WhatsApp, Email e Link.
A central nao altera Orcamento Inteligente, Motor de Calculo, Document Pipeline,
Document Builder, Document Renderer, Export Service, Workflow, Repository ou
AppState.

Na Sprint 4.5, o `PdfAdapter` ganha a implementacao real com `pdf-lib`. A
biblioteca fica encapsulada exclusivamente em `js/export/adapters/pdf-adapter.js`;
nenhum outro modulo deve importar `pdf-lib`. O PDF Comercial e gerado somente a
partir dos dados do Documento Comercial, contendo logo placeholder, empresa,
cliente, projeto, servicos, produtos, resumo financeiro, observacoes, condicoes
comerciais, validade, assinaturas e rodape. O adapter ja deixa pontos de
extensao para logo real, QR Code e assinatura digital.

Na Sprint 4.6, nasce o fluxo de Aprovacao Comercial do Documento Comercial em
`js/comercial/`. O modulo define estados comerciais proprios (`RASCUNHO`,
`EM_REVISAO`, `APROVADO`, `REPROVADO`), valida o Documento Comercial pelo
Document Pipeline e registra a evolucao em AppState dentro de
`configuracoes.comercial`. A tela `paginas/aprovacao-comercial.html` permite
solicitar aprovacao, aprovar, reprovar e voltar para revisao, disparando os
eventos `documento.em_revisao`, `documento.aprovado` e `documento.reprovado`
quando o EventBus esta disponivel. Esta sprint nao converte em Projeto e nao
altera Workflow, EventBus, AppState, Export Service, Renderer ou PDF Adapter.

Na Sprint 4.7, a aprovacao comercial passa a habilitar a Conversao em Projeto.
O modulo `js/conversao/` converte somente Documento Comercial `APROVADO` em
Projeto Executivo por meio do `ProjetoService`, preservando cliente, servico,
produtos, totais, observacoes e referencia ao Documento Comercial de origem. A
conversao registra `projetoSelecionado` e `configuracoes.conversao` no AppState,
usa Workflow para historico e dispara `projeto.criado` e `projeto.convertido`
quando o EventBus esta disponivel. Esta sprint nao acessa Firestore, nao chama
repository diretamente e nao altera ProjetoService, Workflow, AppState,
Document Pipeline, Export Service ou Motor de Calculo.

Na Sprint 4.8, a Formalizacao Comercial recebe o Dashboard Comercial em
`paginas/dashboard-comercial.html`. O modulo `js/dashboard-comercial/` consulta
AppState, ProjetoService, ComercialService e DocumentService para apresentar
Total de Orcamentos, Documentos Aprovados, Projetos Convertidos, Taxa de
Conversao, Valor em Negociacao, Ultimos Orcamentos, Ultimas Atividades e
Proximas Acoes. O dashboard e somente leitura: nao altera AppState, nao cria
novas regras de negocio, nao acessa Firestore diretamente e nao modifica Core,
Workflow, EventBus, ProjetoService, ComercialService, DocumentService ou
ExportService.

### Operacional

Producao, materiais, instalacao, agenda, fotos, arquivos e conclusao.

Na Sprint 5.1, nasce o Centro de Producao em `js/producao/` como primeiro
dominio do bloco operacional. A entidade Ordem de Producao pertence a um
Projeto por `projetoId` e carrega `id`, `status`, `dataCriacao`,
`responsavel`, `prioridade` e `observacoes`. O modulo segue o padrao existente
com model, validator, service, repository e use case, usa Repository Pattern
com `MemoryAdapter` como padrao, registra eventos pelo EventBus quando
disponivel, grava `ordemAtual` no AppState e registra historico operacional no
Workflow sem alterar as regras globais de Projeto. Esta sprint nao cria tela,
nao acessa Firestore e nao altera Comercial, ProjetoService, Documentos,
Export, Dashboard Comercial, Workflow, EventBus ou Repository global.

### Financeiro

Recebimentos, pagamentos, custos, saldo, margem, comissoes e relatorios.

### Inteligencia

Indicadores, alertas, previsoes, gargalos, desempenho comercial e apoio a decisao.

Na Sprint 2.5, o primeiro Dashboard nasce dentro deste bloco como uma leitura
consolidada de Projetos. Ele consome `ProjetoService`, prepara indicadores por
status e usa `MemoryAdapter` apenas para dados simulados quando ainda nao houver
Projetos cadastrados. O Dashboard nao acessa Firestore nem Repository
diretamente e nao cria novas regras de negocio.

## Padrao de desenvolvimento

- Fazer mudancas pequenas e organizadas.
- Nao remover funcionalidades existentes sem necessidade clara.
- Preservar compatibilidade com o fluxo atual de orcamento.
- Preferir funcoes pequenas e servicos de aplicacao.
- Evitar acesso direto ao Firestore dentro da interface.
- Usar Repository Pattern para persistencia de dominio.
- Usar eventos de dominio para desacoplar reacoes entre modulos.
- Atualizar documentacao ao alterar regras de negocio ou arquitetura.
- Registrar historico para mudancas importantes de Projeto.

## Roadmap

### v0.2.0 - Comercial

Formalizar Projeto como entidade central e preparar o bloco comercial: clientes, produtos, servicos, orcamentos, aprovacao e conversao em Projeto.

Sprint 2.5 encerra o Core v1 com o primeiro Dashboard baseado em Projeto,
utilizando a infraestrutura de `ProjetoService`, Repository/Adapter,
`MemoryAdapter` e Workflow Engine ja preparada nas sprints anteriores.

Sprint 3.1 inicia o Centro Comercial de Clientes com dominio Cliente, validacao,
factory, service, repository e use cases dedicados.

Sprint 3.4 cria o dominio Servicos como base para catalogo comercial e futuro
Orcamento Inteligente, mantendo Repository/Adapter desacoplados e sem acesso
direto ao Firestore.

Sprint 3.5 cria a primeira interface do Catalogo Comercial de Servicos,
consumindo Use Cases e `ServicoService`, com cards comerciais, pesquisa e areas
preparadas para o futuro Orcamento Inteligente.

Sprint 3.6 cria o dominio Produtos como base para catalogo de produtos e futuro
Orcamento Inteligente, mantendo Repository/Adapter desacoplados e sem acesso
direto ao Firestore.

Sprint 3.7 cria o Motor de Calculo Comercial como infraestrutura compartilhada
para calculos de area, linear e unidade, mantendo o modulo sem interface,
persistencia ou acoplamento com o Orcamento atual.

Sprint 3.8 cria o Orquestrador do Orcamento como camada de aplicacao para a
futura tela de Orcamento Inteligente, coordenando dominios comerciais e o motor
de calculo sem criar interface ou persistencia nova.

Sprint 3.9A cria a estrutura inicial da tela do Orcamento Inteligente, mantendo
o fluxo apenas preparado para a 3.9B e consumindo o Orchestrator somente para
iniciar contexto.

Sprint 3.9B implementa o fluxo guiado do Orcamento Inteligente sobre o
Orquestrador, reutilizando Services, WorkflowEngine e Motor de Calculo, sem
alterar a tela antiga ou criar persistencia definitiva.

Sprint 3.9C consolida o MVP do Orcamento Inteligente com resumo final,
observacoes, condicoes comerciais, validacao e objeto preparado para o futuro
PDF Comercial da Sprint 4.1.

Sprint 3.10 realiza a auditoria geral da v0.2.x, documentando mapa da
arquitetura, fluxo comercial completo, pontos fortes, pontos de atencao,
debitos tecnicos e recomendacoes para a v0.3.0, sem alterar codigo ou regras de
negocio.

### v0.3.0 - Formalizacao Comercial

Preparar proposta comercial profissional, PDF Comercial e estrutura formal de
apresentacao do orcamento, mantendo o Orcamento Inteligente como fonte unica de
dados.

Sprint 4.1 prepara a camada de dominio do PDF Comercial Profissional, criando
modelo, service, validator, template e use case dedicados, sem alterar o fluxo
do Orcamento Inteligente e sem gerar PDF real.

Sprint 4.1 tambem cria o Document Pipeline, uma fundacao generica para montar
Documento Comercial a partir do Orcamento Inteligente. Esse objeto estruturado
sera a entrada preferencial para PDF, impressao, WhatsApp, e-mail e visualizacao
web nas proximas sprints.

Sprint 4.1.5 cria o App State Manager como infraestrutura de estado em memoria.
O objetivo e preparar uma fonte central para Orcamento, Documento, Cliente e
Projeto nas proximas sprints, sem mudar comportamento existente, sem persistir
dados e sem acessar Firebase ou Firestore.

Sprint 4.2 cria a renderizacao visual do Documento Comercial, gerando HTML
organizado por use case a partir do documento ja montado. Essa camada prepara a
proxima sprint de PDF real sem duplicar dados do Orcamento Inteligente.

Sprint 4.3 cria o Export Service e os adapters de PDF/impressao como
infraestrutura desacoplada. O fluxo passa a ser Documento Comercial ->
Renderer HTML -> Export Service -> Adapter escolhido, ainda sem gerar arquivo
real, sem download e sem impressao automatica.

Sprint 4.4 cria a Central de Compartilhamento como primeira interface de
entrega do Documento Comercial ao cliente. A tela usa somente documento pronto,
preview HTML e exportacao simulada, preparando as proximas sprints de PDF real,
impressao e canais de envio sem duplicar regras de negocio.

Sprint 4.5 implementa o PDF real dentro do `PdfAdapter`, preservando
`ExportService`, Document Pipeline e Renderer. Novos adapters devem seguir a
mesma regra: conhecer apenas sua tecnologia interna e receber Documento
Comercial pronto pelo contrato de exportacao.

Sprint 4.6 cria o fluxo de Aprovacao Comercial do Documento Comercial, com
estados comerciais, validacoes, use cases e tela propria. A aprovacao passa a
ser o marco de entrada para a futura Conversao em Projeto, mantendo a sprint
sem persistencia definitiva, sem Firestore e sem alterar os modulos centrais ja
estabilizados.

Sprint 4.7 cria a Conversao em Projeto Executivo a partir de Documento Comercial
aprovado. A conversao reaproveita `ProjetoService`, `ComercialService`,
AppState, Workflow e EventBus, deixando Producao preparada para consumir o
Projeto gerado como entrada operacional futura.

Sprint 4.8 cria o Dashboard Comercial como leitura consolidada da
Formalizacao Comercial. A tela prepara a evolucao para BI ao separar consulta,
agregacao de exibicao e renderizacao visual, mantendo a fonte dos dados nos
services e estados ja existentes.

### v0.4.0 - Operacional

Adicionar producao, instalacao, agenda operacional, fotos e acompanhamento de execucao.

Sprint 5.1 cria a fundacao do Centro de Producao com a entidade Ordem de
Producao, estados `PENDENTE`, `PLANEJADA`, `EM_PRODUCAO` e `FINALIZADA`,
eventos `ordem.criada`, `ordem.iniciada` e `ordem.finalizada`, uso de
ProjetoService, Workflow, EventBus, Repository Pattern e AppState. O
Planejamento deve consumir essa camada criando ordens por `projetoId`, definindo
responsavel/prioridade e conduzindo a ordem ate o inicio da producao sem acessar
Repository ou Firestore diretamente.

### v0.5.0 - Financeiro

Conectar Projeto a pagamentos, recebimentos, custos, saldo, margem e relatorios financeiros.

### v0.6.0 - Inteligencia

Criar indicadores, alertas de pendencia, visao por gargalos, previsoes e apoio a decisao.

### v1.0.0 - Comercial estavel

Consolidar o fluxo comercial como experiencia estavel, confiavel e pronta para uso continuo.

## Como o Codex deve trabalhar

O Codex deve ler a documentacao do dominio antes de implementar, preservar compatibilidade com telas existentes, evitar mudancas grandes em uma unica tarefa e listar ao final todos os arquivos criados ou alterados.
