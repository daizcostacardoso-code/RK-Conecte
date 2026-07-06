# Modelagem Firestore

## Visao geral

A v0.2.0 adiciona a colecao `projetos` como base do Bloco Comercial.

O objetivo e manter a modelagem simples, compativel com o app atual e facil de evoluir para operacional e financeiro.

## Colecoes atuais

- `orcamentos`;
- `orcamentos_emitidos`;
- `solicitacoes_site`;
- `configuracoes`;
- `caixa_empresa`.

## Nova colecao

### `projetos/{projetoId}`

Documento principal do Projeto.

```json
{
  "id": "prj_...",
  "numero": "PRJ-20260704-0001",
  "titulo": "Box banheiro - Maria",
  "origem": "site",
  "status": "rascunho",
  "etapaAtual": "comercial",
  "prioridade": "media",
  "cliente": {
    "nome": "",
    "telefone": "",
    "email": "",
    "documento": "",
    "endereco": ""
  },
  "obra": {
    "endereco": "",
    "bairro": "",
    "cidade": "",
    "referencia": "",
    "observacoes": ""
  },
  "comercial": {
    "responsavel": "",
    "vendedor": "",
    "canal": "",
    "probabilidade": 0,
    "valorEstimado": 0,
    "valorFechado": 0,
    "motivoCancelamento": "",
    "proximoContato": "",
    "observacoes": ""
  },
  "orcamento": {
    "id": "",
    "numero": "",
    "status": "",
    "total": 0,
    "pdfUrl": ""
  },
  "operacional": {
    "responsavel": "",
    "status": "",
    "previsaoProducao": "",
    "previsaoInstalacao": "",
    "observacoes": ""
  },
  "financeiro": {
    "status": "",
    "valorTotal": 0,
    "valorRecebido": 0,
    "saldo": 0,
    "observacoes": ""
  },
  "datas": {
    "criacao": "",
    "atualizacao": "",
    "ultimoContato": "",
    "proximoContato": "",
    "aprovacao": "",
    "cancelamento": "",
    "conclusao": null,
    "finalizacao": ""
  },
  "tags": [],
  "historico": [],
  "arquivos": [],
  "fotos": [],
  "criadoPor": "",
  "atualizadoPor": ""
}
```

## Relacao com orcamentos

Na v0.2.0, o vinculo pode ser duplicado de forma controlada:

- Projeto guarda resumo do orcamento.
- Orcamento deve passar a guardar `projetoId` e `projetoNumero` em etapa posterior.

Essa duplicacao e aceitavel no Firestore porque facilita listagem comercial sem carregar itens completos do orcamento.

## Colecoes previstas para crescimento

### `clientes`

Cadastro de clientes reutilizaveis em Projetos e orcamentos.

### `produtos`

Catalogo de produtos de vidracaria usados em itens de orcamento.

### `servicos`

Catalogo de servicos, mao de obra e instalacoes.

### `orcamentos`

Rascunhos e documentos comerciais com itens, totais, pagamento e vinculo futuro com Projeto.

### `usuarios`

Usuarios do sistema quando houver autenticacao mais completa.

### `funcionarios`

Dados operacionais e comerciais dos funcionarios.

### `configuracoes`

Parametros do sistema, valores padrao e regras ajustaveis.

### `logs`

Eventos tecnicos e rastreabilidade futura.

O Projeto sera a entidade central que conecta clientes, orcamentos, operacional e financeiro.

## LocalStorage

Chaves adicionadas:

- `vidracaria_projetos`: cache/lista local de Projetos.
- `vidracaria_projeto_atual`: ultimo Projeto aberto ou editado.

## Indices

Consultas iniciais recomendadas:

- ordenar por `datas.atualizacao`;
- filtrar por `status`;
- filtrar por `comercial.responsavel`;
- buscar localmente por nome ou telefone depois da carga.

Se consultas combinadas forem criadas no Firestore, o console pode solicitar indices compostos.

## Regras de seguranca

As regras atuais do projeto estao abertas para facilitar a operacao inicial:

```text
allow read, write: if true;
```

Isso deve ser substituido por autenticacao antes de uso com dados sensiveis em producao madura.
## Caixa

### `caixa_empresa/{lancamentoId}`

Colecao atual dos lancamentos financeiros do caixa. Deve permanecer ativa ate existir migracao formal para SQL.

Campos padronizados pelo modulo `js/caixa/`: `idLocal`, `idFirestore`, `descricao`, `categoria`, `tipo`, `valor`, `data`, `formaPagamento`, `origem`, `observacao`, `responsavel`, `status`, `mesReferencia`, `anoReferencia`, `diaReferencia`, `clienteId`, `orcamentoId`, `usuarioId`, `criadoEm`, `criadoEmISO`, `atualizadoEmISO` e `schemaVersion`.

O merge local/nuvem identifica registros por `idFirestore`, `idLocal`, `criadoEmISO` e fallback gerado, nessa ordem.
