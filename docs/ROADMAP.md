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

## Sprint 2 — fluxo operacional

### Patch 6 — abertura operacional — concluído

- abrir ou reutilizar um projeto quando o orçamento for aprovado;
- manter vínculo bidirecional e impedir duplicidade por orçamento;
- oferecer reparo para aprovações anteriores sem projeto;
- levar cliente, obra e orçamento para a medição contextual;
- preservar projetos e cancelamentos no histórico.

### Patch 7 — execução operacional — concluído

- persistir uma medição canônica e revisável por projeto;
- liberar a ordem de serviço somente após a conclusão da medição;
- conduzir produção, instalação e conclusão pela ordem vinculada;
- preservar vínculos, cancelamentos e histórico sem exclusão definitiva;
- apresentar pendências operacionais no dashboard.

### Patch 8 — financeiro operacional e acessos — concluído

- integrar recebimentos de projetos ao caixa sem duplicidade;
- manter saldos, situações e histórico financeiro por projeto;
- impedir exclusões definitivas de registros financeiros;
- criar a administração de acessos e perfis da equipe;
- exigir perfil ativo antes de liberar as telas internas;
- ocultar da interface as referências à infraestrutura técnica.

### Próximos passos

- validar o fluxo completo no mobile e no desktop;
- remover módulos antigos que permanecerem sem uso após a migração;
- preparar cenários de ponta a ponta para o lançamento.

## Sprint 3 — estabilização v1.0.0

- testes de ponta a ponta;
- backup e checklist de deploy;
- publicação controlada (pendente de autorização explícita);
- versão estável `v1.0.0` preparada, sem deploy automático.
