# Use Cases de Clientes

Casos de uso da Sprint 3.1 para o Centro Comercial de Clientes.

## Arquivos

- `criar-cliente-usecase.js`: cria Cliente usando `ClienteService`.
- `buscar-cliente-usecase.js`: busca Cliente por id usando `ClienteService`.
- `listar-clientes-usecase.js`: lista Clientes usando `ClienteService`.

## Fluxo

```text
Use Case -> ClienteService -> ClienteRepository -> StorageAdapter
```

## Ordem sugerida de scripts

```html
<script src="../js/storage/storage-adapter.js"></script>
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/clientes/cliente-model.js"></script>
<script src="../js/clientes/cliente-validator.js"></script>
<script src="../js/clientes/cliente-factory.js"></script>
<script src="../js/clientes/cliente-repository.js"></script>
<script src="../js/clientes/cliente-service.js"></script>
<script src="../js/usecases/clientes/criar-cliente-usecase.js"></script>
<script src="../js/usecases/clientes/buscar-cliente-usecase.js"></script>
<script src="../js/usecases/clientes/listar-clientes-usecase.js"></script>
```

## Padrao de resposta

Os use cases retornam objetos com `sucesso`, dados (`cliente` ou `clientes`) e
`erros`.
