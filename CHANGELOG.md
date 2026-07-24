# Histórico de alterações

## v1.0.0 — estabilização para lançamento

- Adicionado carregador global acessível, responsivo e orientado a tarefas reais.
- Protegido o conteúdo interno antes da autenticação e do perfil autorizado.
- Adicionado app shell offline e cache `rk-conecte-v1.0.0` com descarte seguro de caches antigos.
- Centralizada a versão e adicionados testes contra regressões e referências visíveis antigas.
- Adicionado workflow de validação com Node.js 22, Java 21 e Firebase Emulator isolado.
- Documentados auditoria de legado, backup, preview, rollback e testes pós-publicação.

## v0.9.0 — financeiro operacional e controle de acessos

- Exposto o controle de acessos no menu superior das telas internas para administradores.
- Feita a renderização do dashboard aguardar o perfil carregado antes de decidir os atalhos administrativos.
- Restauradas dimensões uniformes para os atalhos em telas grandes, médias e móveis.
- Convertida a tabela de usuários em cartões responsivos, sem rolagem lateral no celular.
- Retirada a escrita automática de último acesso pelo navegador para eliminar falhas de permissão na abertura das telas.
- Corrigida a exibição indevida do painel vazio de senha temporária antes da criação de um acesso.
- Removido o uso da persistência local obsoleta do SDK e atualizada a metatag de aplicativo no dashboard.
- Aberto um financeiro determinístico para cada projeto originado de orçamento aprovado.
- Vinculados valores contratado, recebido e saldo ao projeto operacional.
- Registrados recebimentos no financeiro e no caixa na mesma transação, sem duplicidade.
- Adicionados estados pendente, parcial, quitado e cancelado com histórico preservado.
- Protegidos lançamentos vinculados contra edição ou cancelamento manual pelo caixa.
- Criada tela administrativa para cadastrar, ativar e desativar acessos e alterar perfis.
- Incluídos geração de senha temporária e envio de recuperação sem armazenar senhas.
- Bloqueadas a autodesativação e a remoção do próprio perfil administrativo.
- Exigido perfil ativo antes de liberar qualquer tela interna.
- Removidas da interface as referências visíveis à infraestrutura técnica interna.
- Reforçadas as regras e adicionados testes de financeiro, acessos, interface e permissões.

## v0.8.0 — execução operacional canônica

- Persistida uma medição determinística por projeto na coleção `medicoes`.
- Mantidos rascunhos locais com salvamento, revisão e conclusão explícitos no Firestore.
- Liberada a ordem de serviço somente para medições concluídas.
- Reutilizada uma única ordem por projeto para impedir duplicidades.
- Conectadas as etapas de produção, instalação e conclusão ao status do projeto.
- Adicionados atalhos entre projeto, medição e ordem de serviço.
- Incluídas pendências operacionais no dashboard comercial.
- Substituída a exclusão de notas por cancelamento com histórico preservado.
- Propagado o cancelamento comercial para ordens operacionais ativas.
- Reforçadas as regras para preservar os vínculos de medições e ordens.
- Adicionados testes de modelo, repositório, integração, compatibilidade e regras.

## v0.7.0 — abertura do fluxo operacional

- Conectada a aprovação comercial à abertura automática de um projeto operacional.
- Adotado identificador determinístico para impedir projetos duplicados por orçamento.
- Vinculados orçamento e projeto na mesma transação do Firestore.
- Adicionada ação de reparo para orçamentos aprovados anteriormente e ainda sem projeto.
- Restaurada uma tela própria para acompanhar e editar projetos operacionais.
- Contextualizada a medição com cliente, obra e orçamento do projeto selecionado.
- Isolados os rascunhos de medição por projeto e por dispositivo.
- Propagado o cancelamento do orçamento para o projeto com histórico preservado.
- Bloqueada a exclusão definitiva de projetos nas regras do Firestore.
- Adicionados testes de idempotência, vínculo, cancelamento, contexto de medição e regras.

## v0.6.0 — orçamento canônico e fluxo comercial

- Consolidada `orcamentos_emitidos` como fonte oficial dos orçamentos comerciais.
- Removidas as gravações de rascunho no documento global `orcamentos/atual`.
- Mantidos rascunhos em andamento somente no dispositivo do usuário.
- Padronizados identificador, número, revisão e vínculos de solicitação, cliente e projeto.
- Reemissões localizam registros legados pelo número e não criam documentos duplicados.
- Integrados Dashboard, painel do funcionário e histórico do cliente aos orçamentos reais.
- Substituída a exclusão definitiva por cancelamento com histórico preservado.
- Tornada somente leitura a coleção legada de orçamentos nas regras do Firestore.
- Adicionados testes do contrato canônico, compatibilidade, duplicidade e cancelamento.

## v0.5.0 — persistência canônica no Firestore

- Implementado o adaptador real do Firestore para projetos e itens de serviço.
- Removida a escolha automática de `localStorage` ou memória para dados permanentes.
- Removidos clientes, produtos e projetos demonstrativos das telas operacionais.
- Substituído o estado E2E por um rascunho de fluxo sem dados pré-criados.
- Mantido armazenamento local somente para rascunhos e preferências de interface.
- Adicionados estados explícitos de carregamento, vazio e erro nas listas principais.
- Ampliados os testes de persistência, rascunho e ausência de dados simulados.

## v0.4.3 — regras seguras do Firestore

- Fechadas para visitantes todas as coleções operacionais e financeiras.
- Exigido perfil ativo por UID; autenticação sem autorização não libera dados.
- Permitida ao perfil `admin` a gestão segura de funcionários autorizados.
- Mantido acesso público somente à configuração de valores do orçamento.
- Permitida apenas a criação validada de solicitações pelo formulário público.
- Adicionado bloqueio padrão para coleções não mapeadas.
- Adicionados testes reais das regras com Firebase Emulator e projeto isolado.
- Criado checklist para publicação e verificação após o deploy.

## v0.4.2 — Firebase Authentication

- Substituído o login local por autenticação real com e-mail e senha.
- Removidas credenciais e sessões antigas armazenadas no navegador.
- Protegidas as telas internas durante a restauração da sessão.
- Atualizados login, logout, carregamento e perfil do funcionário.
- Adicionadas mensagens seguras para falhas de autenticação.

As regras do Firestore permanecem inalteradas até o Patch 3.

## v0.4.1 — preparação da Sprint 0

- Padronizada a versão exibida pelo sistema e pelo cache da PWA.
- Adicionados comandos para testes e validação de sintaxe.
- Configurado bloqueio de deploy quando as verificações falharem.
- Excluídos backups, testes, scripts e configurações da publicação no Hosting.
- Adicionada documentação do estado atual e do roadmap de segurança.

Esta versão não altera autenticação, regras do Firestore ou dados existentes.
