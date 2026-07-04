# Fluxo Comercial

## Objetivo

Organizar o atendimento comercial da RK Vidracaria desde a entrada da demanda ate a aprovacao, perda ou cancelamento.

## Fluxo macro

```text
Cadastrar cliente -> Criar orcamento -> Adicionar itens -> Calcular totais
-> Gerar PDF -> Enviar proposta -> Aprovar orcamento -> Criar Projeto
-> Iniciar producao futuramente
```

## 1. Entrada

Origem possivel:

- formulario publico do site;
- WhatsApp;
- telefone;
- indicacao;
- visita presencial;
- cliente antigo;
- cadastro manual.

Acao do sistema:

- criar Projeto com status `rascunho`;
- registrar origem;
- preencher cliente e obra quando houver dados;
- registrar historico inicial.

## 2. Qualificacao

O funcionario confirma:

- nome e telefone do cliente;
- endereco da obra;
- tipo de servico;
- medidas preliminares;
- urgencia;
- necessidade de visita tecnica;
- observacoes comerciais.

Acao do sistema:

- manter Projeto em `rascunho` enquanto os dados minimos sao confirmados;
- registrar proximo contato, se necessario;
- guardar observacoes.

## 3. Criacao do orcamento

O funcionario monta ou vincula um orcamento.

Acao do sistema:

- atualizar Projeto para status `em_orcamento`;
- adicionar itens;
- calcular totais;
- vincular dados do orcamento;
- salvar numero, total e status do orcamento no Projeto;
- manter os itens e calculos no modulo de orcamento.

## 4. Envio da proposta

O orcamento foi enviado ou apresentado ao cliente.

Acao do sistema:

- gerar PDF;
- atualizar Projeto para status `enviado`;
- registrar valor estimado;
- registrar follow-ups;
- atualizar probabilidade comercial;
- registrar ajustes importantes.

## 5. Aprovado

Cliente confirmou a contratacao.

Acao do sistema:

- atualizar Projeto para status `aprovado`;
- salvar `valorFechado`;
- registrar data de aprovacao;
- preparar dados para iniciar producao futuramente.

## 6. Cancelado

Projeto encerrado sem conclusao comercial valida.

Acao do sistema:

- atualizar Projeto para status `cancelado`;
- registrar motivo em observacoes ou historico.

## Regras de tela futuras

A tela comercial deve permitir:

- criar Projeto;
- listar Projetos;
- filtrar por status;
- abrir detalhes;
- vincular orcamento;
- registrar contato;
- alterar status;
- ver historico;
- localizar rapidamente cliente por nome ou telefone.
