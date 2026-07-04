# Use Cases - Projetos

Casos de uso coordenam regras de aplicacao do dominio Projeto.

## CriarProjetoUseCase

Fluxo:

1. Recebe dados iniciais do Projeto.
2. Cria um Projeto base usando `criarProjetoBase` ou `ProjetoModel`, quando disponivel.
3. Valida dados minimos.
4. Salva pelo `ProjetoRepository`.
5. Dispara `projeto.criado` pelo Event Bus, quando disponivel.
6. Retorna resultado padronizado.

Retorno de sucesso:

```js
{
  sucesso: true,
  projeto: projeto,
  erros: []
}
```

Retorno de erro:

```js
{
  sucesso: false,
  projeto: null,
  erros: ["mensagem do erro"]
}
```

