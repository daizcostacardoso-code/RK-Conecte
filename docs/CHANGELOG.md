# Changelog

## v0.2.0 - Em desenvolvimento
- Formalizadas as decisoes arquiteturais do RK-Conecte.
- Criado modelo de dominio inicial.
- Documentado o conceito de Projeto como entidade central.
- Documentado o Workflow do ciclo de vida de um Projeto.
- Definida a regra arquitetural numero 1: toda funcionalidade pertence a um Projeto ou a Configuracao.
- Iniciada a fundacao do Bloco Comercial.
- Criado conceito central de Projeto.
- Criada documentacao base da arquitetura da v0.2.0.
- Criada estrutura inicial de pastas para modulos comerciais.
- Criado modelo inicial de Projeto.

## v2.5.0
- Criada base profissional do módulo de orçamento interno.
- Adicionados cabeçalho comercial, dados da obra, status, vendedor e validade.
- Itens agora suportam categoria, descrição, tipo de vidro, valor por m², ferragens, serviço e observações técnicas.
- Totais passam a calcular quantidade de itens, área total, descontos, acréscimo, instalação, frete e total final.
- Preparada estrutura de pagamento e custos internos com lucro bruto e margem.
- Orçamento salvo em objeto compatível com Firebase, incluindo datas, usuários e histórico.
- PDF atualizado para exibir dados públicos do cliente, obra, itens, totais, pagamento, validade e aceite.
- Custos internos, histórico e usuários não são enviados para o PDF do cliente.
- Documentação atualizada em arquitetura, regras de negócio, database e roadmap.

## v2.0.0
- Reorganização do projeto para publicação direta pela pasta principal.
- `firebase.json` ajustado para publicar a raiz do projeto.
- Alumínio alterado de cálculo por m² para cálculo linear interno, sem exibir campo/coluna de metragem.
- Melhorias de validação para largura, altura, quantidade e valores negativos.
- Firestore com inicialização mais segura.
- PDF e tabela mantêm Alumínio e Acessórios destacados, sem coluna Linear.
- Documentação inicial em `README.md` e `docs/`.

## 2.1.0
- Corrigido cálculo de alumínio para metro reto usando a maior medida da peça.
- Cliente agora monta orçamento com múltiplos itens, igual ao fluxo do funcionário.
- Solicitações agora sincronizam com Firestore para aparecer no dashboard do funcionário online.


## v2.3.0
- Adicionado módulo Caixa da Empresa no painel do funcionário.
- Controle de entradas, funcionários, despesas, materiais e lucro/saldo.
- Caixa funciona localmente e também salva na coleção Firestore `caixa_empresa` quando disponível.
