# UX Clientes

Este documento define a experiencia esperada para o modulo de Clientes no Bloco
Comercial. Nao representa implementacao.

## Objetivo

Permitir que a equipe encontre, cadastre e acompanhe clientes sem perder
historico comercial ou Projetos vinculados.

## Campos do cliente

Campos principais:

- Nome.
- Telefone principal.
- WhatsApp.
- Telefone alternativo.
- Email.
- Documento.
- Tipo de cliente: pessoa fisica, empresa ou indefinido.
- Origem: site, WhatsApp, indicacao, telefone, presencial, cliente antigo.
- Observacoes gerais.

Enderecos:

- Endereco principal.
- Bairro.
- Cidade.
- Referencia.
- Observacao de acesso.

Contatos:

- Nome do contato.
- Funcao ou relacao.
- Telefone.
- Email.
- Observacoes.

## Pesquisa

A pesquisa deve localizar cliente por:

- Nome.
- Telefone.
- Documento.
- Endereco.
- Numero do Projeto.
- Observacao relevante.

Resultado esperado:

- Lista simples, rapida e escaneavel.
- Destaque para clientes com Projetos ativos.
- Indicacao de ultimo contato ou ultima atualizacao.

## Historico

O historico do cliente deve mostrar eventos importantes:

- Cliente criado.
- Contato registrado.
- Projeto criado.
- Orcamento enviado.
- Projeto aprovado.
- Projeto cancelado.
- Pos-venda registrado.

Diretriz:

- Historico do cliente nao substitui historico do Projeto.
- Eventos especificos de obra devem ficar no Projeto.

## Projetos vinculados

Cada cliente pode ter varios Projetos.

A tela do cliente deve permitir visualizar:

- Projetos ativos.
- Projetos em orcamento.
- Projetos concluidos.
- Projetos cancelados.
- Valor ou resumo comercial, quando aplicavel.

## Observacoes

Observacoes devem ser livres, mas com cuidado para nao substituir campos
estruturados.

Exemplos:

- Preferencia de contato.
- Melhor horario.
- Cliente recorrente.
- Restricao de acesso.
- Observacao comercial.

## Experiencia esperada

Fluxo principal:

```text
Pesquisar cliente -> abrir detalhe -> ver Projetos -> criar novo Projeto
```

Quando nao encontrar cliente:

```text
Pesquisar -> nenhum resultado -> criar Cliente -> criar Projeto
```

## Criterios de UX

- Cadastro rapido.
- Poucos campos obrigatorios no primeiro contato.
- Possibilidade de completar dados depois.
- Historico visivel.
- Projetos do cliente em destaque.
- Nenhuma informacao importante deve depender apenas de memoria da equipe.

## Sprint 3.2 - Primeira interface

A primeira tela do modulo Clientes deve priorizar a rotina comercial imediata:

- buscar clientes pelo campo principal no cabecalho;
- listar Nome, Tipo, Telefone, Cidade, Status, Ultima atualizacao e Acoes;
- cadastrar rapidamente dados essenciais do primeiro contato;
- abrir um detalhe preparado para Dados principais, Enderecos, Contatos,
  Projetos vinculados, Orcamentos, Timeline e Observacoes.

Diretriz tecnica de UX:

- a interface nao acessa persistencia diretamente;
- a criacao, busca e listagem devem passar pelos Use Cases ou pelo
  `ClienteService`;
- campos ainda nao cobertos pelo cadastro rapido devem aparecer como areas
  preparadas para evolucao posterior.
