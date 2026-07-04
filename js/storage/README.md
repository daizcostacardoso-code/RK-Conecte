# Storage Adapters

Camada de persistencia desacoplada do RK-Conecte.

Esta pasta define o contrato de armazenamento e adapters concretos ou preparados para uso futuro. A interface e os casos de uso devem depender do contrato, nao de Firestore diretamente.

## Arquivos

- `storage-adapter.js`: contrato conceitual com `save`, `get`, `list`, `update` e `delete`.
- `memory-adapter.js`: adapter funcional em memoria, util para testes e desenvolvimento sem backend.
- `firestore-adapter.js`: estrutura reservada para Firebase/Firestore, ainda sem implementacao real nesta sprint.

## Ordem sugerida

```html
<script src="../js/storage/storage-adapter.js"></script>
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/storage/firestore-adapter.js"></script>
```

## Regra

Servicos, repositorios e casos de uso devem receber um adapter. Nenhuma tela deve acessar Firestore diretamente.

