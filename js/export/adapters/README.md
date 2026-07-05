# js/export/adapters

Adapters de exportacao do RK-Conecte.

Cada adapter deve implementar a mesma interface:

```text
gerar()
validar()
preparar()
```

## PDF Adapter

`PdfAdapter` gera o PDF Comercial real a partir dos dados do Documento
Comercial.

Ele e o unico modulo autorizado a conhecer `pdf-lib`. Nenhum outro modulo deve
importar, carregar ou depender diretamente dessa biblioteca.

O adapter nao cria URL, nao inicia download, nao acessa Firestore e nao chama
Services de dominio. O resultado real fica disponivel por:

```js
const resultado = PdfAdapter.gerar(exportacao);
const arquivo = await resultado.arquivo.gerar();
```

`arquivo.bytes` contem o `Uint8Array` do PDF.

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

`blob` e `url` continuam nulos. O adapter entrega bytes de PDF, deixando
download, preview externo e envio para camadas futuras.
