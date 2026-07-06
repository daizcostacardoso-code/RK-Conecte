# Migracao do Caixa para SQL

## Objetivo

Preparar o caixa do RK-Conecte para migracao futura sem perder compatibilidade com os dados atuais.

As bases atuais continuam sendo:

- LocalStorage: `vidracaria_caixa_empresa`
- Firestore: colecao `caixa_empresa`

Nenhuma colecao deve ser trocada sem rotina de migracao e conferencia dos backups.

## Tabela futura sugerida

```sql
CREATE TABLE caixa_lancamentos (
  id INT IDENTITY(1,1) PRIMARY KEY,
  id_local VARCHAR(100),
  id_firestore VARCHAR(100),
  descricao VARCHAR(255) NOT NULL,
  categoria VARCHAR(80),
  tipo VARCHAR(20) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  forma_pagamento VARCHAR(80),
  origem VARCHAR(80),
  observacao TEXT,
  responsavel VARCHAR(120),
  status VARCHAR(30),
  mes_referencia VARCHAR(7),
  ano_referencia INT,
  dia_referencia INT,
  cliente_id VARCHAR(100),
  orcamento_id VARCHAR(100),
  usuario_id VARCHAR(100),
  schema_version INT DEFAULT 1,
  criado_em DATETIME,
  criado_em_iso VARCHAR(40),
  atualizado_em_iso VARCHAR(40)
);
```

## Mapeamento Firestore/localStorage -> SQL

| Origem RK-Conecte | Campo SQL | Observacao |
| --- | --- | --- |
| `idLocal` | `id_local` | Identificador local usado para deduplicacao. |
| `idFirestore` | `id_firestore` | Id do documento em `caixa_empresa`. |
| `descricao` | `descricao` | Obrigatorio para novos lancamentos. |
| `categoria` | `categoria` | Ex.: entrada, funcionario, despesa, material, outro. |
| `tipo` | `tipo` | `entrada` ou `saida`. |
| `valor` | `valor` | Decimal positivo. Conferir registros antigos com valor 0 antes da migracao final. |
| `data` | `data` | Formato atual `AAAA-MM-DD`. |
| `formaPagamento` | `forma_pagamento` | Ex.: Dinheiro, Pix, Cartao, Transferencia. |
| `origem` | `origem` | Ex.: Manual, Orcamento, Ajuste. |
| `observacao` | `observacao` | Texto livre. |
| `responsavel` | `responsavel` | Nome de quem registrou. |
| `status` | `status` | `confirmado`, `pendente` ou `cancelado`. |
| `mesReferencia` | `mes_referencia` | Formato `AAAA-MM`. |
| `anoReferencia` | `ano_referencia` | Inteiro. |
| `diaReferencia` | `dia_referencia` | Inteiro. |
| `clienteId` | `cliente_id` | Preparado para vinculo futuro. |
| `orcamentoId` | `orcamento_id` | Preparado para vinculo futuro. |
| `usuarioId` | `usuario_id` | Preparado para autenticacao futura. |
| `schemaVersion` | `schema_version` | Comeca em 1. |
| `criadoEm` | `criado_em` | Valor legado em formato local. Pode exigir conversao manual. |
| `criadoEmISO` | `criado_em_iso` | Fonte mais confiavel para ordenacao historica. |
| `atualizadoEmISO` | `atualizado_em_iso` | Ultima alteracao conhecida. |

## Ordem recomendada para migracao

1. Exportar backup JSON pelo painel usando `rk-caixa-backup-AAAA-MM-DD.json`.
2. Exportar Firestore `caixa_empresa` pelo console/admin antes de qualquer alteracao.
3. Usar `CaixaService.listar()` para gerar uma lista deduplicada local + nuvem.
4. Validar valores, datas e status em ambiente de homologacao.
5. Inserir em `caixa_lancamentos`, preservando `id_local` e `id_firestore`.
6. Conferir totais por mes, status e forma de pagamento contra o painel atual.
7. Somente depois trocar a leitura do painel para API/SQL.

## Observacoes

- Lancamentos antigos nunca devem ser descartados por falta de campos novos.
- Registros antigos sem valor valido devem ser revisados, nao apagados automaticamente.
- A colecao Firestore `caixa_empresa` permanece como fonte atual ate existir migracao completa.
