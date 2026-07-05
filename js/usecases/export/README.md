# Use Cases de Exportacao

Casos de uso da Sprint 4.3 para exportar Documento Comercial a partir do HTML
renderizado.

## Arquivos

- `exportar-documento-usecase.js`: orquestra validacao, renderizacao HTML e
  chamada ao `ExportService`.

## Fluxo

```text
Documento Comercial
    -> DocumentService.validarDocumento()
    -> DocumentRenderer.prepararVisualizacao()
    -> DocumentHtmlRenderer.renderizar()
    -> ExportService.exportar()
    -> PdfAdapter ou PrintAdapter
```

## Entrada

`ExportarDocumentoUseCase` recebe apenas o Documento Comercial ja gerado pelo
Document Pipeline.

```js
ExportarDocumentoUseCase.executar(documento, {
    formato: "PDF"
});
```

## Saida

```text
sucesso
formato
documento
html
exportacao
adapter
arquivo
download
erros
detalhes
```

## Limites

O use case nao acessa Firestore, nao gera PDF real, nao imprime, nao faz
download e nao conhece o fluxo do Orcamento Inteligente. Ele apenas conecta o
Documento Comercial pronto ao servico de exportacao.
