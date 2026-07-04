# Workflow Engine - RK-Conecte

## Visao geral

O RK-Conecte deve ser orientado pelo ciclo de vida do Projeto. O Workflow define os status possiveis, as transicoes permitidas e os eventos de historico gerados em cada mudanca importante.

Nesta etapa, o Workflow ainda e uma diretriz arquitetural. A implementacao deve evoluir em servicos de aplicacao, sem colocar regra de transicao diretamente nas telas.

## Ciclo de vida do Projeto

Status previstos:

- `rascunho`
- `em_orcamento`
- `enviado`
- `aprovado`
- `em_producao`
- `pronto_instalacao`
- `em_instalacao`
- `aguardando_pagamento`
- `concluido`
- `garantia`
- `arquivado`
- `cancelado`

## Significado dos status

### rascunho

Projeto criado, ainda sem dados comerciais completos.

### em_orcamento

Projeto em fase de montagem ou revisao de orcamento.

### enviado

Proposta enviada ao cliente.

### aprovado

Cliente aprovou a proposta.

### em_producao

Projeto aprovado entrou na etapa operacional de producao.

### pronto_instalacao

Itens prontos para instalar ou entregar.

### em_instalacao

Instalacao em andamento ou agendada para execucao.

### aguardando_pagamento

Instalacao concluida ou etapa finalizada, mas existe pendencia financeira.

### concluido

Projeto finalizado operacional e financeiramente.

### garantia

Projeto concluido permanece em periodo de acompanhamento ou garantia.

### arquivado

Projeto encerrado e retirado das filas ativas.

### cancelado

Projeto interrompido antes da conclusao.

## Transicoes principais

```text
rascunho -> em_orcamento
em_orcamento -> enviado
enviado -> aprovado
aprovado -> em_producao
em_producao -> pronto_instalacao
pronto_instalacao -> em_instalacao
em_instalacao -> aguardando_pagamento
aguardando_pagamento -> concluido
concluido -> garantia
garantia -> arquivado
```

## Transicao de cancelamento

Um Projeto pode ser cancelado antes de `concluido`, desde que o motivo seja registrado no historico.

Transicoes permitidas para cancelamento:

- `rascunho -> cancelado`
- `em_orcamento -> cancelado`
- `enviado -> cancelado`
- `aprovado -> cancelado`
- `em_producao -> cancelado`
- `pronto_instalacao -> cancelado`
- `em_instalacao -> cancelado`
- `aguardando_pagamento -> cancelado`

## Regras de transicao

- Toda transicao deve registrar evento no historico.
- O evento deve conter status anterior, status novo, usuario, data e descricao.
- A interface nao deve decidir sozinha se a transicao e valida.
- A validacao deve ficar em servico de aplicacao ou modulo de dominio.
- Transicoes fora do fluxo principal devem ser documentadas antes de implementadas.
- Reabertura de Projeto arquivado ou cancelado deve ser tratada como regra explicita futura.

## Evento de historico esperado

Exemplo conceitual:

```js
{
  tipo: "status_alterado",
  descricao: "Status alterado de enviado para aprovado",
  usuario: "Funcionario",
  data: "2026-07-04T12:00:00.000Z",
  dados: {
    statusAnterior: "enviado",
    statusNovo: "aprovado"
  }
}
```

## Direcao de implementacao

O Workflow deve evoluir para um modulo reutilizavel que exponha funcoes como:

- validar transicao;
- listar proximos status;
- aplicar transicao;
- registrar historico;
- atualizar datas importantes do Projeto.
