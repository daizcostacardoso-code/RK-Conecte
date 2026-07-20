# Estado atual do RK-Conecte

## Base técnica

- Versão: `v0.4.2`.
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
inteligente, PDFs, notas de serviço e operações do adaptador Firestore.

Use `npm run check` para validar a sintaxe e executar todos os testes.

## Pendências críticas da Sprint 0

1. Exigir usuário autorizado nas coleções internas do Firestore.
2. Permitir ao público somente a criação validada de solicitações.
3. Criar testes automatizados para as regras do Firestore.

O login local foi substituído pelo Firebase Authentication no Patch 2.

Até a conclusão dessas etapas, as regras atuais não devem ser tratadas como
seguras para operação com dados reais.
