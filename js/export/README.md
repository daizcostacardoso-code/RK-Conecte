# js/export

Infraestrutura de exportacao de documentos do RK-Conecte.

Criada na Sprint 4.3 para preparar a camada que transforma o Documento
Comercial renderizado em saidas como PDF real e impressao controlada.

Na Sprint 4.5, o `PdfAdapter` passou a encapsular a biblioteca `pdf-lib` para
gerar bytes reais de PDF Comercial. Nenhum outro modulo deve importar ou
carregar `pdf-lib`.

## Objetivo

Centralizar a escolha de adapter e a validacao tecnica de exportacao, mantendo
o Documento Comercial e sua renderizacao HTML desacoplados da tecnologia final.

## Arquivos

- `export-model.js`: modelo normalizado da solicitacao de exportacao.
- `export-validator.js`: validacao tecnica de documento, HTML e formato.
- `export-service.js`: fachada que valida, seleciona adapter e executa a exportacao.
- `adapters/pdf-adapter.js`: adapter PDF real com `pdf-lib` encapsulado.
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

## Limites originais da Sprint 4.3

- Sem Firestore.
- Sem Firebase.
- Sem biblioteca externa.
- Sem `jsPDF`, `pdfmake` ou `pdf-lib`.
- Sem `window.print`.
- Sem download.
- Sem geracao real de arquivo.

Na Sprint 4.5, o limite de `pdf-lib` foi removido apenas para o
`PdfAdapter`. Os demais modulos continuam sem conhecer bibliotecas de PDF.

## PDF real na Sprint 4.5

O `PdfAdapter` gera PDF profissional usando exclusivamente dados do Documento
Comercial:

```text
Logo placeholder
Empresa
Cliente
Projeto
Servicos
Produtos
Resumo Financeiro
Observacoes
Condicoes Comerciais
Validade
Assinaturas
Rodape
```

O retorno do `ExportService` continua desacoplado. Para obter os bytes reais do
PDF:

```js
const resultado = ExportService.exportar(documentoComercial, { formato: "PDF" });
const arquivo = await resultado.arquivo.gerar();
```

`arquivo.bytes` contem um `Uint8Array` gerado por `pdf-lib`. O adapter nao faz
download, nao acessa Firestore e nao consulta Services de dominio.

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

O retorno contem a estrutura de exportacao:

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
