# Roadmap de evolução

## Sprint 0 — base segura

### Patch 1 — organização e validação — concluído

- proteger a publicação contra arquivos internos;
- padronizar versão;
- automatizar verificações;
- documentar o estado atual.

### Patch 2 — autenticação — concluído

- implementar Firebase Authentication;
- remover usuário e senha salvos no navegador;
- proteger as telas internas pelo estado real da autenticação;
- preparar perfis `admin` e `funcionario`.

### Patch 3 — autorização e regras — concluído

- fechar as coleções internas;
- validar a criação de solicitações públicas;
- testar regras no Firebase Emulator;
- preparar checklist de publicação segura.

## Sprint 1 — consolidação da V1

### Patch 4 — persistência canônica — concluído

- remover o estado demonstrativo das páginas de produção;
- usar Firestore nos cadastros permanentes de projetos e itens de serviço;
- manter `localStorage` somente para rascunhos e preferências;
- apresentar estados explícitos de carregamento, vazio e erro.

### Patch 5 — orçamento canônico e fluxo comercial — concluído

- consolidar `orcamentos_emitidos` como fonte oficial dos orçamentos;
- remover o rascunho global `orcamentos/atual` das gravações de produção;
- preservar vínculos entre solicitação, cliente, projeto e orçamento;
- sincronizar Dashboard, arquivos e histórico do cliente;
- trocar exclusão definitiva por cancelamento auditável.

### Próximos passos

- conectar aprovação comercial à abertura da operação;
- vincular os recebimentos do caixa ao orçamento aprovado;
- remover módulos antigos que permanecerem sem uso após a migração.

## Sprint 2 — fluxo operacional

- conectar solicitação, cliente, orçamento e aprovação;
- integrar medição, nota de serviço e caixa;
- validar o fluxo completo no mobile e no desktop.

## Sprint 3 — lançamento

- testes de ponta a ponta;
- backup e checklist de deploy;
- publicação controlada;
- criação da versão estável `v1.0.0` do produto.
