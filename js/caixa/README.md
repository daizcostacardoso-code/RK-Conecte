# Caixa

Modulo de seguranca e compatibilidade do caixa do RK-Conecte.

## Objetivo

Centralizar a normalizacao, validacao, persistencia e exportacao dos lancamentos do caixa sem trocar as bases atuais.

## Compatibilidade preservada

- LocalStorage: `vidracaria_caixa_empresa`
- Firestore: colecao `caixa_empresa`
- Tela atual: `paginas/funcionario.html`
- Funcoes publicas do `Funcionario`: `carregarCaixa`, `registrarMovimentoCaixa`, `cancelarMovimentoCaixa`, `excluirMovimentoCaixaDefinitivo` e exportacoes continuam existindo.

## Arquivos

- `caixa-model.js`: schema v1 e normalizacao de lancamentos antigos e novos.
- `caixa-validator.js`: validacao de lancamentos novos.
- `caixa-repository.js`: merge local/nuvem e persistencia em localStorage + Firestore atual.
- `caixa-service.js`: camada de aplicacao consumida pela tela.
- `caixa-export.js`: backup JSON seguro no formato `rk-caixa-backup-AAAA-MM-DD.json`.

## Merge de dados

Ao listar, o repository mescla localStorage e Firestore sem duplicar. A prioridade de identificacao e:

1. `idFirestore`
2. `idLocal`
3. `criadoEmISO`
4. fallback gerado

Lancamentos antigos nunca sao descartados por falta de campos novos; o modelo preenche valores padrao e aplica `schemaVersion: 1`.
