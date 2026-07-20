# Estado atual do RK-Conecte

## Base técnica

- Versão: `v0.6.0`.
- Frontend: HTML, CSS e JavaScript sem framework.
- Hospedagem: Firebase Hosting.
- Banco oficial: Cloud Firestore.
- Aplicativo instalável: PWA com service worker.

## Funcionalidades existentes

- site institucional e solicitação pública;
- clientes;
- produtos, itens e dependências;
- orçamento inteligente e PDF;
- histórico de arquivos e aprovação interna;
- medição de obra;
- nota de serviço;
- controle básico de caixa;
- dashboard comercial.

## Validação automatizada

O projeto possui testes para clientes, numeração de orçamento, orçamento
inteligente, PDFs, notas de serviço, operações do adaptador Firestore e regras
de segurança executadas no Firebase Emulator.

Projetos e itens de serviço não possuem mais fallback silencioso para memória ou
armazenamento local. Falhas do Firestore são exibidas na interface, e a ausência
de registros é representada por um estado vazio real.

Use `npm run check` para validar a sintaxe e executar todos os testes.

## Segurança concluída na Sprint 0

- Firebase Authentication substitui o login local.
- Coleções internas exigem usuário autenticado e perfil ativo autorizado por UID.
- O público lê somente `configuracoes/valores`.
- Solicitações públicas aceitam apenas criação com estrutura e limites válidos.
- Caminhos desconhecidos são negados por padrão.
- Contas autenticadas sem autorização explícita continuam sem acesso interno.
- Os testes usam um projeto de demonstração e não acessam dados de produção.

A publicação deve seguir o checklist de [PUBLICACAO_SEGURA.md](PUBLICACAO_SEGURA.md).

## Persistência consolidada na Sprint 1

- Firestore é a fonte canônica dos cadastros permanentes.
- `localStorage` permanece apenas para preferências e rascunhos em andamento.
- O estado demonstrativo E2E não é carregado nas páginas de produção.
- Dashboards e orçamentos não fabricam registros quando as coleções estão vazias.

## Fluxo comercial consolidado na Sprint 1

- `orcamentos_emitidos` é a fonte canônica de orçamentos finalizados.
- O rascunho de orçamento é local por dispositivo e não usa mais o documento global `orcamentos/atual`.
- Registros canônicos preservam solicitação, cliente, projeto, número, revisão, status e histórico.
- Reemissões reutilizam o documento localizado pelo número para evitar duplicidades.
- Dashboard, arquivos e detalhes do cliente leem os mesmos registros comerciais.
- Cancelamentos preservam o documento e acrescentam um evento ao histórico.
- A coleção legada `orcamentos` permanece somente para leitura durante a compatibilização.
