# Database

## LocalStorage

Chaves usadas pelo módulo de orçamento:

- `vidracaria_orcamento_atual`: rascunho atual do funcionário.
- `vidracaria_historico_orcamentos`: orçamentos emitidos em PDF.
- `vidracaria_numero_orcamento`: próximo número local de orçamento.
- `vidracaria_solicitacoes_site`: solicitações feitas pelo formulário público.

## Firestore

### `orcamentos/atual`

Documento usado pelo rascunho ativo do funcionário.

```json
{
  "id": "",
  "numero": "",
  "cliente": {
    "nome": "",
    "telefone": "",
    "email": "",
    "endereco": ""
  },
  "obra": {
    "endereco": "",
    "observacoes": ""
  },
  "vendedor": "",
  "status": "rascunho",
  "datas": {
    "criacao": "",
    "validade": "",
    "atualizacao": ""
  },
  "usuarios": {
    "criacao": "",
    "atualizacao": ""
  },
  "itens": [],
  "totais": {
    "quantidadeItens": 0,
    "areaTotalM2": 0,
    "subtotal": 0,
    "descontoValor": 0,
    "descontoPercentual": 0,
    "descontoTotal": 0,
    "acrescimo": 0,
    "frete": 0,
    "instalacao": 0,
    "totalFinal": 0
  },
  "pagamento": {
    "forma": "",
    "entrada": 0,
    "parcelas": 1,
    "observacoes": ""
  },
  "custosInternos": {
    "custoVidro": 0,
    "custoFerragens": 0,
    "custoMaoObra": 0,
    "custoTransporte": 0,
    "comissao": 0,
    "lucroBruto": 0,
    "margemLucro": 0
  },
  "historico": []
}
```

### `orcamentos_emitidos/{numero}`

Documento criado ao gerar PDF. Usa a versão pública do orçamento e não inclui `custosInternos`, `historico` nem `usuarios`.

### `solicitacoes_site`

Coleção usada pelo formulário público de solicitação de orçamento.

## Observação de segurança

Custos internos podem ser salvos no rascunho interno, mas não devem ser renderizados no PDF do cliente.
