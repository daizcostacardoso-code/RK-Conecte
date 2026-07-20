# Histórico de alterações

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
