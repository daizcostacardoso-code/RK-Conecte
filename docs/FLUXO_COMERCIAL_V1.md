# Fluxo Comercial V1

Este documento define o fluxo comercial alvo para o Bloco Comercial V1.

## Fluxo principal

```text
Cliente -> Projeto -> Servico -> Orcamento -> PDF -> Aprovacao -> Projeto ativo
```

## 1. Cliente

O fluxo comeca com a identificacao do cliente.

O usuario deve poder:

- Pesquisar cliente existente.
- Criar novo cliente.
- Completar dados faltantes.
- Ver historico e Projetos vinculados.

Saida desta etapa:

- Cliente identificado.

## 2. Projeto

Depois do cliente, a equipe cria ou seleciona um Projeto.

O Projeto representa a demanda real.

O usuario deve informar:

- Titulo ou resumo.
- Endereco da obra.
- Origem.
- Responsavel.
- Observacoes iniciais.

Saida desta etapa:

- Projeto criado em status inicial.

## 3. Servico

O usuario escolhe o tipo de servico.

Tipos iniciais:

- Box.
- Espelho.
- Guarda-corpo.
- Fachada.
- Cobertura.
- Porta.
- Janela.
- Projeto personalizado.

Saida desta etapa:

- Tipo de servico definido para orientar o orcamento.

## 4. Orcamento

O usuario preenche medidas, itens e condicoes comerciais.

O orcamento deve:

- Usar campos adequados ao tipo de servico.
- Calcular totais.
- Permitir descontos e acrescimos.
- Registrar validade.
- Manter vinculo com Projeto.

Saida desta etapa:

- Orcamento revisado.

## 5. PDF

O sistema gera proposta em PDF para envio ao cliente.

O PDF deve:

- Ser claro.
- Mostrar escopo.
- Mostrar valor e condicoes.
- Informar validade.
- Evitar dados internos.

Saida desta etapa:

- Proposta enviada.

## 6. Aprovacao

O cliente aprova, pede ajuste ou cancela.

Cenarios:

- Aprovado: Projeto segue para ativo.
- Ajuste: Orcamento volta para revisao.
- Cancelado: Projeto registra motivo e encerra oportunidade.
- Sem retorno: Projeto permanece para follow-up.

Saida desta etapa:

- Decisao comercial registrada.

## 7. Projeto ativo

Projeto ativo e uma oportunidade aprovada ou em execucao.

Proximas etapas futuras:

- Producao.
- Instalacao.
- Financeiro.
- Pos-venda.

## Indicadores esperados

- Projetos em orcamento.
- Orcamentos enviados.
- Projetos aprovados.
- Projetos cancelados.
- Projetos sem follow-up.
- Valor potencial em aberto.

## Regra central

O fluxo comercial deve sempre preservar a relacao:

```text
Cliente possui Projetos.
Projeto possui Servicos e Orcamentos.
Orcamento gera PDF.
Aprovacao ativa o Projeto.
```
