# Dominio Projeto

## Conceito

Projeto e a entidade central do RK-Conecte a partir da v0.2.0.

Um Projeto representa uma oportunidade comercial acompanhavel. Ele pode nascer de uma solicitacao do site, de um atendimento por WhatsApp, de uma indicacao, de uma visita presencial ou de um cadastro manual feito por funcionario.

## Por que Projeto vem antes de Orcamento

O cliente nao compra apenas um PDF. Ele passa por uma jornada:

- primeiro contato;
- entendimento da necessidade;
- medicao ou levantamento;
- orcamento;
- negociacao;
- aprovacao;
- producao;
- instalacao;
- pos-venda.

O Projeto guarda essa jornada. O orcamento e apenas uma parte dela.

## Estrutura base

```js
Projeto {
  id,
  numero,
  status,
  etapaAtual,
  cliente,
  orcamento,
  comercial,
  operacional,
  financeiro,
  historico,
  arquivos,
  fotos,
  datas,
  criadoPor,
  atualizadoPor
}
```

## Campos essenciais

### Identificacao

- `id`: identificador unico.
- `numero`: numero amigavel, como `PRJ-20260704-0001`.
- `titulo`: nome curto do projeto.
- `origem`: canal de entrada.
- `status`: situacao comercial atual.
- `etapaAtual`: etapa macro do fluxo.
- `prioridade`: baixa, media, alta ou urgente.

### Cliente

- `nome`;
- `telefone`;
- `email`;
- `documento`;
- `endereco`.

### Obra

- `endereco`;
- `bairro`;
- `cidade`;
- `referencia`;
- `observacoes`.

### Comercial

- `responsavel`;
- `vendedor`;
- `canal`;
- `probabilidade`;
- `valorEstimado`;
- `valorFechado`;
- `motivoPerda`;
- `proximoContato`;
- `observacoes`.

### Operacional

- `responsavel`;
- `status`;
- `previsaoProducao`;
- `previsaoInstalacao`;
- `observacoes`.

### Financeiro

- `status`;
- `valorTotal`;
- `valorRecebido`;
- `saldo`;
- `observacoes`.

### Orcamento vinculado

- `id`;
- `numero`;
- `status`;
- `total`;
- `pdfUrl`.

### Datas

- `criacao`;
- `atualizacao`;
- `ultimoContato`;
- `proximoContato`;
- `aprovacao`;
- `cancelamento`;
- `conclusao`;
- `finalizacao`.

### Historico

Lista de eventos importantes do Projeto.

Cada item deve conter:

- `tipo`;
- `data`;
- `usuario`;
- `descricao`;
- `dados`.

## Status comercial

Status iniciais:

- `rascunho`: Projeto criado, ainda incompleto.
- `em_orcamento`: orcamento em preparacao.
- `enviado`: proposta enviada ao cliente.
- `aprovado`: cliente aprovou.
- `em_producao`: Projeto em producao.
- `em_instalacao`: Projeto em instalacao.
- `concluido`: Projeto finalizado.
- `cancelado`: Projeto cancelado.

## Etapas do fluxo

Etapas iniciais:

- `comercial`;
- `producao`;
- `instalacao`;
- `financeiro`;
- `finalizado`.

Essas etapas permitem que o Projeto comece no comercial e avance para producao, instalacao e financeiro sem trocar de entidade central.

## Regras

- Todo Projeto deve ter `id`, `numero`, `status`, `etapaAtual`, `cliente`, `orcamento`, `comercial`, `operacional`, `financeiro`, `datas` e `historico`.
- Projeto pode existir sem orcamento.
- Orcamento nao deve depender de tela nova para continuar funcionando.
- Quando um orcamento for criado a partir de um Projeto, ele deve receber `projetoId` e `projetoNumero`.
- Quando um Projeto mudar de status, o historico deve receber um evento.
- Projetos aprovados devem guardar `valorFechado` quando possivel.
