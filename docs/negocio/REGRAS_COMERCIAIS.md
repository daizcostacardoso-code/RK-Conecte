# Regras Comerciais Iniciais

Este documento registra regras comerciais para orientar UX e produto no Bloco
Comercial. As regras abaixo sao conceituais e nao representam implementacao.

## Quando um orcamento vira Projeto

Um orcamento deve estar vinculado a um Projeto quando existe uma oportunidade
comercial real a acompanhar.

Cenarios:

- Cliente novo solicita servico: criar Cliente, Projeto e Orcamento.
- Cliente existente solicita novo servico: criar novo Projeto vinculado ao
  Cliente.
- Pedido vindo do site: converter solicitacao em Projeto antes de acompanhar o
  fluxo comercial.
- Orcamento avulso antigo: pode ser vinculado a Projeto quando houver
  acompanhamento comercial.

Regra de produto:

- O Projeto e a entidade central.
- O Orcamento e uma etapa ou documento dentro do Projeto.
- A aprovacao do Orcamento ativa o Projeto para etapas seguintes.

## Status comerciais

Status iniciais para o acompanhamento comercial:

- `rascunho`: Projeto criado, ainda incompleto.
- `em_orcamento`: aguardando calculo ou montagem da proposta.
- `enviado`: proposta enviada ao cliente.
- `aprovado`: cliente aceitou a proposta.
- `em_producao`: Projeto aprovado entrou na preparacao operacional.
- `em_instalacao`: Projeto esta em etapa de instalacao.
- `concluido`: servico finalizado.
- `cancelado`: oportunidade encerrada sem venda ou execucao.

## Validade da proposta

A proposta deve possuir validade comercial.

Diretrizes:

- Validade padrao deve ser configuravel futuramente.
- PDF deve exibir data ou prazo de validade.
- Propostas vencidas devem ser revisadas antes de aprovacao.
- Alteracoes de preco podem exigir nova versao do orcamento.

## Descontos

Descontos devem ser claros e rastreaveis.

Diretrizes:

- Desconto pode ser aplicado em valor ou percentual.
- Desconto deve aparecer no resumo interno.
- No PDF, a exibicao do desconto deve seguir decisao comercial.
- Descontos relevantes devem ter responsavel ou observacao.

## Aprovacao

A aprovacao acontece quando o cliente aceita a proposta.

Evidencias possiveis:

- Confirmacao por mensagem.
- Pagamento de sinal.
- Aceite formal.
- Autorizacao registrada por vendedor.

Efeitos esperados:

- Projeto deixa o status comercial de proposta.
- Operacional pode iniciar producao ou agenda.
- Financeiro deve acompanhar recebimento.

## Cancelamento

Cancelamento encerra uma oportunidade sem continuidade.

Motivos comuns:

- Preco.
- Prazo.
- Cliente desistiu.
- Cliente fechou com concorrente.
- Falta de retorno.
- Servico inviavel.

Diretrizes:

- Cancelamento deve registrar motivo.
- Projeto cancelado deve permanecer no historico.
- Cancelamento nao deve apagar Cliente nem Orcamentos.

## Follow-up

Toda proposta enviada deve ter proxima acao.

Exemplos:

- Retornar em 1 dia.
- Confirmar medidas.
- Enviar versao ajustada.
- Cobrar aprovacao.

Objetivo:

- Reduzir propostas esquecidas.
- Dar visibilidade ao vendedor e ao dono.
