# Use Cases de Produtos

Casos de uso da Sprint 3.6 para o dominio Produtos.

## Arquivos

- `criar-produto-usecase.js`: cria Produto usando `ProdutoService`.
- `buscar-produto-usecase.js`: busca Produto por id usando `ProdutoService`.
- `listar-produtos-usecase.js`: lista Produtos usando `ProdutoService`.

## Fluxo

```text
Use Case -> ProdutoService -> ProdutoRepository -> StorageAdapter
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
<script src="../js/usecases/produtos/criar-produto-usecase.js"></script>
<script src="../js/usecases/produtos/buscar-produto-usecase.js"></script>
<script src="../js/usecases/produtos/listar-produtos-usecase.js"></script>
```

## Padrao de resposta

Os use cases retornam objetos com `sucesso`, dados (`produto` ou `produtos`) e
`erros`.
