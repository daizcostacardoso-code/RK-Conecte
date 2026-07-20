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

### Patch 3 — autorização e regras

- fechar as coleções internas;
- validar a criação de solicitações públicas;
- testar regras no Firebase Emulator;
- preparar checklist de publicação segura.

## Sprint 1 — consolidação da V1

- remover telas, módulos e estados antigos sem uso;
- unificar orçamento, dashboard, arquivos e caixa;
- manter `localStorage` somente para rascunhos e preferências;
- consolidar o fluxo comercial e o histórico.

## Sprint 2 — fluxo operacional

- conectar solicitação, cliente, orçamento e aprovação;
- integrar medição, nota de serviço e caixa;
- validar o fluxo completo no mobile e no desktop.

## Sprint 3 — lançamento

- testes de ponta a ponta;
- backup e checklist de deploy;
- publicação controlada;
- criação da versão estável `v1.0.0` do produto.
