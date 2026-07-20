# Estado atual do RK-Conecte

## Base técnica

- Versão: `v0.9.1`.
- Frontend: HTML, CSS e JavaScript sem framework.
- Hospedagem: Firebase Hosting.
- Banco oficial: Cloud Firestore.
- Aplicativo instalável: PWA com service worker.
- Tela de carregamento crítica disponível antes dos estilos e no cache offline.

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
- financeiro por projeto integrado ao caixa;
- controle administrativo de acessos.

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

## Abertura operacional consolidada na Sprint 2

- Aprovar um orçamento abre ou reutiliza um projeto na coleção canônica `projetos`.
- O identificador do projeto é estável para o orçamento e evita duplicidades em tentativas repetidas.
- Orçamento e projeto mantêm vínculo bidirecional, usuário responsável e histórico auditável.
- Aprovações antigas sem projeto podem ser reparadas pela tela de arquivos.
- A tela de projetos permite acompanhar a operação e iniciar a medição vinculada.
- Rascunhos de medição são locais e isolados por projeto.
- O cancelamento comercial encerra o projeto relacionado sem excluir seus registros.
- Projetos não podem ser excluídos definitivamente pelas regras do Firestore.

## Execução operacional consolidada na Sprint 2

- Cada projeto possui uma medição canônica determinística na coleção `medicoes`.
- Rascunhos continuam locais; salvar e concluir criam revisões e histórico no Firestore.
- A conclusão da medição libera uma única ordem de serviço vinculada ao projeto.
- A ordem de serviço conduz o projeto por produção, instalação e finalização.
- Repetições da mesma ação não duplicam documentos nem eventos operacionais.
- Cancelamentos preservam medições, ordens, projetos e seus históricos.
- O dashboard inclui pendências de medição, produção e instalação.
- Regras impedem exclusão definitiva e troca dos vínculos operacionais.

## Financeiro e acessos consolidados na Sprint 2

- Cada projeto aprovado possui um documento único em `financeiro_operacional`.
- Recebimentos atualizam financeiro, resumo do projeto e `caixa_empresa` na mesma transação.
- Repetições com o mesmo identificador não duplicam recebimentos nem lançamentos.
- Cancelamentos preservam valores já recebidos e todo o histórico.
- A tela de acessos é exclusiva para administradores e não armazena senhas.
- Perfis podem ser ativados, desativados ou alterados sem exclusão definitiva.
- Toda tela interna exige identidade válida e perfil ativo antes de ser exibida.
- A interface apresenta termos de negócio e não expõe nomes da infraestrutura interna.
