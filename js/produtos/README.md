# js/produtos

Dominio Produtos do RK-Conecte.

Esta pasta contem a camada de dominio de Produtos do Bloco Comercial. O modulo
segue a arquitetura Core v1: Use Cases -> Services -> Repository -> Adapter.

## Objetivo

Representar materiais, insumos, acessorios, ferragens, vidros e mao de obra
usados nos tipos de instalacao/manutencao. Nesta sprint, Produto serve como
cadastro tecnico de custo, nao como precificacao comercial.

## Arquivos

- `produto-model.js`: modelo, normalizacao, categorias, unidades e regras de
  consumo/calculo.
- `produto-validator.js`: validacoes de nome, categoria, unidade, tipo de
  calculo, custo unitario e status.
- `produto-factory.js`: criacao de Produtos e objeto padrao.
- `produto-repository.js`: persistencia via `StorageAdapter`, sem acesso direto
  a Firestore.
- `produto-service.js`: fachada de aplicacao para criar, buscar, listar,
  atualizar e desativar Produtos.
- `produto-ui.js`: renderizacao da tela interna de cadastro de Produtos.
- `produto-controller.js`: orquestracao da tela via Use Cases e
  `ProdutoService`.

## Campos ativos nesta sprint

```text
id
nome
categoria
descricao
unidadeCalculo
regraCalculo
custoUnitario
ativo
observacoes
criadoEm
atualizadoEm
```

`unidade`, `unidadeVenda`, `tipoCalculo`, `custo` e `precoCusto` podem aparecer
como aliases de compatibilidade, mas a tela deve trabalhar com
`unidadeCalculo`, `regraCalculo` e `custoUnitario`.

## Categorias iniciais

```text
vidro
aluminio_perfil
ferragem
acessorio
insumo
mao_de_obra
kit
acabamento
outro
```

## Unidades de calculo

```text
m2
metro_linear
unidade
kit
hora
```

## Tipos de calculo

```text
area_m2
linear_m
linear_altura
perimetro
quantidade_fixa
unidade
hora
```

## Ordem sugerida de scripts

```html
<script src="../js/storage/storage-adapter.js"></script>
<script src="../js/storage/local-storage-adapter.js"></script>
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/produtos/produto-model.js"></script>
<script src="../js/produtos/produto-validator.js"></script>
<script src="../js/produtos/produto-factory.js"></script>
<script src="../js/produtos/produto-repository.js"></script>
<script src="../js/produtos/produto-service.js"></script>
<script src="../js/usecases/produtos/criar-produto-usecase.js"></script>
<script src="../js/usecases/produtos/buscar-produto-usecase.js"></script>
<script src="../js/usecases/produtos/listar-produtos-usecase.js"></script>
<script src="../js/usecases/produtos/atualizar-produto-usecase.js"></script>
<script src="../js/usecases/produtos/excluir-produto-usecase.js"></script>
<script src="../js/produtos/produto-ui.js"></script>
<script src="../js/produtos/produto-controller.js"></script>
```

## Fluxo

```text
Use Case -> ProdutoService -> ProdutoRepository -> StorageAdapter
```

## Integracao futura com Orcamento Inteligente

O dominio Produtos prepara a base tecnica usada pelos Servicos:

- `tipoCalculo`/`regraCalculo` indica se o produto usa area, largura, altura,
  perimetro, quantidade fixa, unidade ou tempo medio;
- `custoUnitario` e seus aliases de custo (`custo`, `precoCusto`) preparam
  controle futuro de caixa e custo da obra;
- `categoria` orienta filtros do cadastro de Produtos;
- somente Produtos ativos cadastrados podem ser selecionados como dependencias
  em Servicos/Tipos de servico.

Nesta sprint, Produto nao trabalha com margem, lucro, markup, preco de venda,
comissoes, impostos ou precificacao final.

## Regra arquitetural

O modulo nao acessa Firestore diretamente. Persistencia deve acontecer somente
por Repository + Adapter.
