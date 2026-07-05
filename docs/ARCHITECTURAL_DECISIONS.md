# Architectural Decisions - RK-Conecte

Este documento registra as decisoes arquiteturais centrais da v0.2.0. As decisoes abaixo devem orientar novas funcionalidades, refatoracoes e integracoes futuras.

## ADR-001 - Projeto e a entidade central do sistema

**Decisao:** o RK-Conecte deve organizar sua rotina em torno da entidade `Projeto`.

**Contexto:** a operacao da vidracaria nao termina no orcamento. Um atendimento pode virar proposta, aprovacao, producao, instalacao, financeiro, garantia e historico.

**Consequencia:** orcamentos, clientes, pagamentos, fotos, arquivos, agenda, producao e instalacao devem se relacionar com um Projeto sempre que fizer sentido operacional.

## ADR-002 - Toda funcionalidade pertence a um Projeto ou a Configuracao

**Decisao:** toda funcionalidade nova deve pertencer a um `Projeto` ou a `Configuracao` do sistema.

**Contexto:** funcionalidades soltas criam duplicidade de dados e dificultam rastreabilidade.

**Consequencia:** antes de criar uma tela, colecao ou modulo, deve-se responder: isto e parte de um Projeto ou e uma configuracao geral do sistema?

## ADR-003 - O RK-Conecte e orientado a Workflow

**Decisao:** o sistema deve ser guiado pelo ciclo de vida do Projeto.

**Contexto:** a equipe trabalha por etapas: comercial, producao, instalacao e financeiro.

**Consequencia:** status, proximas acoes, pendencias e historico devem guiar o uso do sistema mais do que menus isolados.

## ADR-004 - A interface nao deve acessar o Firestore diretamente

**Decisao:** telas e componentes de interface nao devem chamar Firestore diretamente.

**Contexto:** acesso direto ao banco dentro da interface espalha regras de negocio e dificulta manutencao.

**Consequencia:** a interface deve chamar servicos de aplicacao. Os servicos decidem como carregar, validar, salvar e sincronizar dados. A infraestrutura concentra detalhes de Firebase, LocalStorage e futuras integracoes.

## ADR-005 - O Dashboard deve ser orientado por trabalho, nao por menus

**Decisao:** o Dashboard deve mostrar trabalho a fazer, pendencias e prioridades.

**Contexto:** a operacao precisa saber o que fazer agora: propostas em aberto, projetos aprovados, producao pendente, instalacoes do dia e pagamentos aguardando.

**Consequencia:** o Dashboard deve evoluir para cards de trabalho, filas e alertas, evitando ser apenas uma lista de links.

## ADR-006 - Toda mudanca importante deve registrar historico

**Decisao:** mudancas relevantes em Projeto devem gerar evento de historico.

**Contexto:** o historico permite entender quem alterou, quando alterou e por que a etapa mudou.

**Consequencia:** transicoes de status, envio de proposta, aprovacao, cancelamento, alteracoes financeiras, anexos importantes e conclusao devem registrar evento.

## ADR-007 - O sistema deve ser preparado para Comercial, Operacional e Financeiro

**Decisao:** a arquitetura deve separar os blocos Comercial, Operacional e Financeiro sem isolar os dados do Projeto.

**Contexto:** a v0.2.0 foca no Comercial, mas o MVP precisa crescer para producao, instalacao e financeiro.

**Consequencia:** o modelo de Projeto deve aceitar dados comerciais, operacionais e financeiros desde a fundacao, mesmo que algumas telas sejam entregues em versoes futuras.

## ADR-008 - Eventos de dominio desacoplam modulos

**Decisao:** acoes importantes do dominio devem poder emitir eventos por um Event Bus central.

**Contexto:** Timeline, Dashboard, Financeiro, Producao e Instalacao precisarao reagir a mudancas do Projeto sem criar dependencias diretas entre telas e modulos.

**Consequencia:** novos modulos devem preferir ouvir eventos de dominio, como `projeto.status_alterado` ou `projeto.aprovado`, em vez de serem chamados diretamente pela interface.

## ADR-009 - Persistencia deve usar Repository + Adapter

**Decisao:** casos de uso devem depender de repositorios, e repositorios devem depender de adapters de armazenamento.

**Contexto:** o RK-Conecte precisa funcionar com memoria durante desenvolvimento e testes, mas deve poder evoluir para Firestore sem reescrever regras de aplicacao.

**Consequencia:** telas e use cases nao devem conhecer Firestore diretamente. A troca de tecnologia de persistencia deve ocorrer pela escolha do adapter.

## ADR-010 - Estado de aplicacao deve ter uma fonte central em memoria

**Decisao:** o RK-Conecte deve manter um App State central em `js/core/` para estado de aplicacao transitorio.

**Contexto:** Orcamento, Documento, Cliente e Projeto precisam compartilhar selecoes e contexto sem criar acoplamento direto entre telas, services e renderizadores.

**Consequencia:** estado de usuario, empresa, cliente selecionado, projeto selecionado, orcamento atual, servico selecionado, produtos selecionados, documento atual, configuracoes, loading e erros deve passar pelo `AppState`/`AppStateService` nas proximas sprints. O AppState nao substitui repositories, nao persiste dados, nao acessa Firestore e deve emitir eventos pelo EventBus somente quando ele estiver disponivel.
