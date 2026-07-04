# UX Projetos

Este documento define a experiencia esperada para Projetos no Bloco Comercial.
O Projeto e a entidade central do RK-Conecte.

## Objetivo

Organizar cada demanda real do cliente em um fluxo unico, rastreavel e preparado
para comercial, orcamento, producao, instalacao e financeiro.

## Criacao de Projeto

Um Projeto pode nascer de:

- Cliente cadastrado.
- Lead vindo do site.
- Atendimento por WhatsApp.
- Ligacao.
- Cliente antigo.
- Orcamento iniciado.

Campos iniciais:

- Cliente.
- Titulo ou resumo do Projeto.
- Tipo de servico.
- Origem.
- Responsavel comercial.
- Endereco da obra.
- Observacoes iniciais.

Regra de UX:

- Criacao deve ser rapida.
- O Projeto pode comecar incompleto.
- Campos tecnicos podem ser preenchidos no Orcamento.

## Timeline

A timeline deve mostrar os eventos relevantes do Projeto.

Eventos esperados:

- Projeto criado.
- Status alterado.
- Contato registrado.
- Orcamento criado.
- PDF enviado.
- Orcamento aprovado.
- Projeto cancelado.
- Producao iniciada.
- Instalacao agendada.
- Projeto concluido.

Objetivo:

- Responder "o que aconteceu com este Projeto?" sem depender de conversa solta.

## Status

Status comerciais e operacionais iniciais:

- Rascunho.
- Em orcamento.
- Enviado.
- Aprovado.
- Em producao.
- Em instalacao.
- Concluido.
- Cancelado.

Diretriz:

- Status deve indicar o momento real do Projeto.
- Alteracao de status deve preservar historico.
- Status nao deve ser confundido com tipo de servico.

## Responsavel

O Projeto deve possuir responsaveis por etapa quando necessario.

Responsaveis possiveis:

- Responsavel comercial.
- Orcamentista.
- Responsavel operacional.
- Instalador.
- Responsavel financeiro.

No inicio do Bloco Comercial, o foco principal e responsavel comercial e
orcamentista.

## Historico

Historico do Projeto deve reunir:

- Alteracoes de status.
- Contatos importantes.
- Decisoes do cliente.
- Motivo de cancelamento.
- Observacoes comerciais.
- Vinculo com orcamentos.

Diretriz:

- Historico deve ser consultivo.
- Nao deve ser usado como unico lugar para informacao estruturada.

## Relacao com Orcamento

Um Projeto pode ter um ou mais orcamentos ao longo do tempo.

No fluxo inicial:

```text
Projeto -> Orcamento -> PDF -> Aprovacao
```

Comportamentos esperados:

- Orcamento deve saber a qual Projeto pertence.
- Projeto deve indicar orcamento atual ou principal.
- Aprovacao de orcamento muda o estado comercial do Projeto.
- Cancelamento de Projeto nao deve apagar o Orcamento.

## Experiencia esperada

Fluxo principal:

```text
Abrir Projeto -> ver resumo -> criar/editar Orcamento -> enviar PDF -> registrar retorno
```

O usuario deve entender rapidamente:

- Quem e o cliente.
- Qual e o servico.
- Qual e o status.
- Quem e o responsavel.
- Qual foi a ultima atualizacao.
- Qual e a proxima acao.
