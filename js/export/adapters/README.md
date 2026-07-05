# js/export/adapters

Adapters de exportacao do RK-Conecte.

Cada adapter deve implementar a mesma interface:

```text
gerar()
validar()
preparar()
```

## PDF Adapter

`PdfAdapter` prepara uma estrutura simulada para PDF Comercial futuro.

Ele nao usa biblioteca externa, nao gera arquivo real, nao cria blob, nao cria
URL e nao inicia download. A proxima sprint podera substituir apenas a parte
interna do adapter por uma biblioteca PDF real, mantendo o contrato externo.

## Print Adapter

`PrintAdapter` prepara uma estrutura de impressao futura a partir do HTML
renderizado.

Ele nao chama `window.print` e nao abre janelas. A execucao real de impressao
fica reservada para sprint futura.

## Contrato de retorno

```text
sucesso
formato
exportacao
erros
detalhes
```

Quando `gerar()` for chamado nesta sprint, `arquivo`, `blob` e `url` continuam
nulos para deixar explicito que a exportacao real ainda nao existe.
