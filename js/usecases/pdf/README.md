# Use Cases de PDF

Casos de uso da Sprint 4.1 para preparar o PDF Comercial do Orcamento
Inteligente.

## Arquivos

- `gerar-pdf-usecase.js`: prepara o modelo, valida os dados e monta o template
  logico por meio de `PdfService`.

## Fluxo

```text
GerarPdfUseCase
    -> PdfService.prepararExportacao()
        -> PdfService.montarDados()
        -> PdfModel
        -> PdfValidator
        -> PdfTemplate
```

## Entrada

O use case deve receber o contexto retornado pelo `OrcamentoOrchestrator`.
Quando disponivel, `contexto.orcamentoPreparado` sera usado como fonte principal
dos dados comerciais.

## Saida

```text
sucesso
modelo
template
exportacao
erros
detalhes
```

## Limites

Este use case nao gera arquivo, nao imprime, nao baixa PDF, nao acessa
Firestore e nao usa bibliotecas externas. A geracao real fica para a Sprint 4.2.
