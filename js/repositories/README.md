# Repositories

Repositorios isolam os casos de uso da tecnologia de persistencia.

`ProjetoRepository` recebe um adapter com contrato de armazenamento e oferece metodos orientados ao dominio Projeto.

## ProjetoRepository

Metodos:

- `salvarProjeto(projeto)`
- `buscarProjeto(id)`
- `listarProjetos()`
- `atualizarProjeto(id, dados)`
- `removerProjeto(id)`

O repositorio nao conhece Firestore diretamente. Para trocar a persistencia, configure outro adapter.

```js
const repository = criarProjetoRepository(criarMemoryAdapter());
```

