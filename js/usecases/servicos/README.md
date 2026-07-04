# Use Cases de Servicos

Casos de uso da Sprint 3.4 para o dominio Servicos.

## Arquivos

- `criar-servico-usecase.js`: cria Servico usando `ServicoService`.
- `buscar-servico-usecase.js`: busca Servico por id usando `ServicoService`.
- `listar-servicos-usecase.js`: lista Servicos usando `ServicoService`.

## Fluxo

```text
Use Case -> ServicoService -> ServicoRepository -> StorageAdapter
```

## Ordem sugerida de scripts

```html
<script src="../js/storage/storage-adapter.js"></script>
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/servicos/servico-model.js"></script>
<script src="../js/servicos/servico-validator.js"></script>
<script src="../js/servicos/servico-factory.js"></script>
<script src="../js/servicos/servico-repository.js"></script>
<script src="../js/servicos/servico-service.js"></script>
<script src="../js/usecases/servicos/criar-servico-usecase.js"></script>
<script src="../js/usecases/servicos/buscar-servico-usecase.js"></script>
<script src="../js/usecases/servicos/listar-servicos-usecase.js"></script>
```

## Padrao de resposta

Os use cases retornam objetos com `sucesso`, dados (`servico` ou `servicos`) e
`erros`.
