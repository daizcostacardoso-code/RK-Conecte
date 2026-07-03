# Changelog

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
