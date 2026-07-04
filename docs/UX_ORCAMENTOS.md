# UX Orcamentos

Este documento define a experiencia esperada para o orcamento inteligente por
tipo de servico no Bloco Comercial. Nao representa implementacao.

## Objetivo

Guiar o usuario para montar orcamentos consistentes, com campos adequados ao
tipo de servico, calculo claro e PDF comercial padronizado.

## Principio de UX

O usuario deve primeiro escolher o tipo de servico. Depois, o sistema deve
apresentar apenas os campos relevantes para aquele servico.

Fluxo esperado:

```text
Selecionar Projeto -> escolher tipo de servico -> preencher medidas
-> revisar itens -> calcular totais -> gerar PDF -> enviar ao cliente
```

## Entrada por tipo de servico

### Box

Campos esperados:

- Tipo de abertura.
- Largura.
- Altura.
- Quantidade de folhas.
- Vidro.
- Ferragens.
- Instalacao.

### Espelho

Campos esperados:

- Largura.
- Altura.
- Quantidade.
- Acabamento de borda.
- Tipo de instalacao.
- Recortes.

### Guarda-corpo

Campos esperados:

- Comprimento.
- Altura.
- Tipo de fixacao.
- Vidro.
- Corrimao.
- Local de instalacao.

### Fachada

Campos esperados:

- Largura total.
- Altura total.
- Modulos.
- Portas.
- Perfis.
- Vidro.

### Cobertura

Campos esperados:

- Area.
- Estrutura.
- Material.
- Inclinacao.
- Vedacao.
- Acesso para instalacao.

### Porta

Campos esperados:

- Largura.
- Altura.
- Tipo de abertura.
- Vidro.
- Ferragens.
- Puxador e fechadura.

### Janela

Campos esperados:

- Largura.
- Altura.
- Tipo de abertura.
- Folhas.
- Vidro.
- Perfil.

### Projeto personalizado

Campos esperados:

- Descricao.
- Medidas livres.
- Fotos.
- Materiais.
- Observacoes tecnicas.
- Necessidade de visita.

## Revisao do orcamento

Antes do PDF, o usuario deve revisar:

- Dados do cliente.
- Dados da obra.
- Tipo de servico.
- Itens.
- Medidas.
- Valores.
- Desconto.
- Acrescimo.
- Forma de pagamento.
- Validade.
- Observacoes publicas.

## PDF

O PDF deve ser claro para o cliente.

Deve conter:

- Identificacao da vidracaria.
- Cliente.
- Obra.
- Descricao dos servicos.
- Valores.
- Condicoes comerciais.
- Validade.
- Aceite ou instrucoes de aprovacao.

Nao deve conter:

- Custos internos.
- Margem.
- Observacoes internas.
- Dados sensiveis da operacao.

## Estados do orcamento

Estados conceituais:

- Rascunho.
- Em revisao.
- Enviado.
- Aprovado.
- Cancelado.
- Vencido.

## Relacao com Projeto

O orcamento pertence ao Projeto.

Diretrizes:

- Nao criar orcamento solto quando houver acompanhamento comercial.
- PDF deve apontar para o orcamento gerado.
- A aprovacao deve atualizar o Projeto.
- Ajustes importantes devem gerar nova versao ou historico.
