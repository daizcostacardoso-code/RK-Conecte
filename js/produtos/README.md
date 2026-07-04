# js/produtos

Dominio Produtos do RK-Conecte.

Esta pasta contem a camada de dominio de Produtos do Bloco Comercial. O modulo
segue a arquitetura Core v1: Use Cases -> Services -> Repository -> Adapter.

## Objetivo

Representar produtos comerciais que futuramente poderao alimentar o Catalogo de
Produtos e o Orcamento Inteligente, sem implementar interface, HTML, CSS,
Firebase ou alteracoes no modulo de Orcamentos nesta sprint.

## Arquivos

- `produto-model.js`: modelo, normalizacao, categorias, subcategorias,
  atributos preparados e tipos de calculo.
- `produto-validator.js`: validacoes de nome, categoria, unidade, tipo de
  calculo, precos, margem, status e atributos.
- `produto-factory.js`: criacao de Produtos e objeto padrao.
- `produto-repository.js`: persistencia via `StorageAdapter`, sem acesso direto
  a Firestore.
- `produto-service.js`: fachada de aplicacao para criar, buscar, listar,
  atualizar e desativar Produtos.

## Estrutura do Produto

```text
id
nome
categoria
subcategoria
descricao
unidadeVenda
tipoCalculo
precoCusto
precoVenda
margem
ativo
atributos
observacoes
criadoEm
atualizadoEm
```

## Categorias iniciais

```text
vidro
ferragem
perfil
acessorio
insumo
servico_complementar
```

## Subcategorias de vidro

```text
comum
temperado
laminado
espelho
reflecta
canelado
```

## Atributos preparados

```text
espessura
cor
acabamento
marca
modelo
peso
largura
altura
comprimento
```

## Tipos de calculo

```text
area_m2
linear_m
unidade
quantidade
peso_kg
personalizado
```

## Ordem sugerida de scripts

```html
<script src="../js/storage/storage-adapter.js"></script>
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/produtos/produto-model.js"></script>
<script src="../js/produtos/produto-validator.js"></script>
<script src="../js/produtos/produto-factory.js"></script>
<script src="../js/produtos/produto-repository.js"></script>
<script src="../js/produtos/produto-service.js"></script>
```

## Fluxo

```text
Use Case -> ProdutoService -> ProdutoRepository -> StorageAdapter
```

## Integracao futura com Orcamento Inteligente

O dominio Produtos prepara os dados que poderao orientar o orcamento no futuro:

- `tipoCalculo` indica se o produto usa area, metro linear, unidade, quantidade,
  peso ou regra personalizada;
- `precoCusto`, `precoVenda` e `margem` poderao apoiar precificacao;
- `atributos` prepara dimensoes, acabamento, marca e modelo;
- `categoria` e `subcategoria` poderao orientar filtros do Catalogo de Produtos.

Nesta sprint, esses campos sao apenas estrutura de dominio. Eles nao alteram o
orcamento atual.

## Regra arquitetural

O modulo nao acessa Firestore diretamente. Persistencia deve acontecer somente
por Repository + Adapter.
