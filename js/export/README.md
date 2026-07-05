# js/export

Infraestrutura de exportacao de documentos do RK-Conecte.

Criada na Sprint 4.3 para preparar a camada que vai transformar o Documento
Comercial renderizado em saidas futuras, como PDF real e impressao controlada.

## Objetivo

Centralizar a escolha de adapter e a validacao tecnica de exportacao, mantendo
o Documento Comercial e sua renderizacao HTML desacoplados da tecnologia final.

## Arquivos

- `export-model.js`: modelo normalizado da solicitacao de exportacao.
- `export-validator.js`: validacao tecnica de documento, HTML e formato.
- `export-service.js`: fachada que valida, seleciona adapter e executa a exportacao simulada.
- `adapters/pdf-adapter.js`: adapter PDF simulado, sem biblioteca externa.
- `adapters/print-adapter.js`: adapter de impressao futura, sem `window.print`.

## Fluxo

```text
Documento Comercial
    -> DocumentRenderer
    -> DocumentHtmlRenderer
    -> ExportService
    -> Adapter escolhido
```

## Formatos preparados

```text
PDF
PRINT
```

`PRINT` tambem pode ser solicitado como `IMPRESSAO`.

## Limites da Sprint 4.3

- Sem Firestore.
- Sem Firebase.
- Sem biblioteca externa.
- Sem `jsPDF`, `pdfmake` ou `pdf-lib`.
- Sem `window.print`.
- Sem download.
- Sem geracao real de arquivo.

## Ordem sugerida de scripts

```html
<script src="../js/export/export-model.js"></script>
<script src="../js/export/export-validator.js"></script>
<script src="../js/export/adapters/pdf-adapter.js"></script>
<script src="../js/export/adapters/print-adapter.js"></script>
<script src="../js/export/export-service.js"></script>
<script src="../js/usecases/export/exportar-documento-usecase.js"></script>
```

## Exemplo

```js
const resultado = ExportarDocumentoUseCase.executar(documentoComercial, {
    formato: "PDF"
});
```

O retorno contem apenas estrutura preparada:

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
