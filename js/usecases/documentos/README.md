# Use Cases de Documentos

Casos de uso da Sprint 4.1 para gerar o Documento Comercial a partir do
Orcamento Inteligente.

## Arquivos

- `gerar-documento-usecase.js`: executa o pipeline de documento por meio de
  `DocumentService`.
- `renderizar-documento-usecase.js`: renderiza o Documento Comercial em HTML
  por meio do renderer informado.

## Fluxo

```text
GerarDocumentoUseCase
    -> DocumentService.prepararExportacao()
        -> DocumentService.gerarDocumento()
        -> DocumentService.validarDocumento()

RenderizarDocumentoUseCase
    -> DocumentHtmlRenderer.renderizar()
        -> DocumentRenderer.prepararVisualizacao()
```

## Entradas

`GerarDocumentoUseCase` deve receber o contexto retornado pelo
`OrcamentoOrchestrator`. Quando existir, `contexto.orcamentoPreparado` sera a
fonte principal.

`RenderizarDocumentoUseCase` deve receber apenas o Documento Comercial ja
gerado pelo pipeline.

## Saidas

`GerarDocumentoUseCase` retorna:

```text
sucesso
documento
exportacao
erros
detalhes
```

`RenderizarDocumentoUseCase` retorna:

```text
sucesso
html
erros
```

## Limites

Os use cases nao geram PDF, nao imprimem, nao fazem download, nao usam canvas,
nao usam bibliotecas externas e nao acessam Firestore.

`RenderizarDocumentoUseCase` gera apenas uma string HTML a partir do Documento
Comercial recebido. Ele nao altera paginas, nao aplica CSS e nao executa
impressao.
