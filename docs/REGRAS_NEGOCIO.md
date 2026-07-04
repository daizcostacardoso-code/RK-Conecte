# Regras de Negócio

## Item de orçamento

Cada item profissional representa um serviço ou produto de vidraçaria:

- Box
- Espelho
- Porta
- Janela
- Guarda-corpo
- Cobertura
- Fachada
- Vidro avulso
- Serviço avulso

Campos principais do item:

- descrição
- categoria
- tipo de vidro
- espessura
- cor
- largura em centímetros
- altura em centímetros
- quantidade
- área em m²
- valor por m²
- ferragens
- serviço/mão de obra
- total do item
- observações técnicas

## Cálculo

Área:

```text
area_m2 = (largura_cm * altura_cm) / 10000
```

Total do item:

```text
valor_total_item = (area_m2 * valor_m2 * quantidade) + ferragens + servicos
```

O sistema arredonda área para 3 casas decimais e valores monetários para 2 casas decimais.

## Resumo financeiro

O resumo calcula:

- quantidade de itens
- área total em m², considerando quantidade
- subtotal
- desconto em R$
- desconto em %
- acréscimo
- instalação
- frete/transporte
- total final

O desconto total é a soma do desconto em valor com o desconto percentual calculado sobre o subtotal, limitado ao valor do subtotal.

```text
total_final = subtotal - desconto_total + acrescimo + instalacao + frete
```

## Custos internos

Custos internos servem para gestão da empresa e não aparecem no PDF do cliente:

- custo do vidro
- custo de ferragens
- custo de mão de obra
- custo de transporte
- comissão
- lucro bruto
- margem de lucro

```text
lucro_bruto = total_final - custos_internos
margem_lucro = lucro_bruto / total_final * 100
```

## Status

Status possíveis:

- Rascunho
- Enviado
- Aprovado
- Em produção
- Instalado
- Cancelado

Quando o status muda, o sistema adiciona um evento ao histórico do orçamento.
