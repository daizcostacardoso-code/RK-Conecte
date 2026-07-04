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

### Operacional

Producao, materiais, instalacao, agenda, fotos, arquivos e conclusao.

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

### v0.3.0 - Operacional

Adicionar producao, instalacao, agenda operacional, fotos e acompanhamento de execucao.

### v0.4.0 - Financeiro

Conectar Projeto a pagamentos, recebimentos, custos, saldo, margem e relatorios financeiros.

### v0.5.0 - Inteligencia

Criar indicadores, alertas de pendencia, visao por gargalos, previsoes e apoio a decisao.

### v1.0.0 - Comercial estavel

Consolidar o fluxo comercial como experiencia estavel, confiavel e pronta para uso continuo.

## Como o Codex deve trabalhar

O Codex deve ler a documentacao do dominio antes de implementar, preservar compatibilidade com telas existentes, evitar mudancas grandes em uma unica tarefa e listar ao final todos os arquivos criados ou alterados.
