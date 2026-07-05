# js/documentos

Pipeline de Documento Comercial do RK-Conecte.

Esta pasta foi criada na Sprint 4.1 para transformar o contexto do Orcamento
Inteligente em um objeto estruturado e reutilizavel.

Na Sprint 4.2, o modulo recebeu o primeiro renderizador visual do Documento
Comercial. O renderizador gera uma string HTML limpa a partir do documento ja
montado, sem criar telas, sem CSS, sem Firebase, sem Firestore, sem download e
sem executar impressao.

## Objetivo

Gerar um Documento Comercial padronizado que possa ser consumido futuramente por:

- PDF.
- Impressao.
- WhatsApp.
- E-mail.
- Visualizacao Web.

## Fonte de dados

O pipeline recebe o contexto retornado pelo `OrcamentoOrchestrator` e usa
`contexto.orcamentoPreparado` quando ele estiver disponivel.

O modulo reconhece as fachadas de aplicacao do fluxo comercial:

```text
OrcamentoOrchestrator
ClienteService
ProjetoService
ServicoService
ProdutoService
CalculoService
```

Ele nao acessa repositories, adapters, LocalStorage ou Firestore diretamente.

## Arquivos

- `document-model.js`: normaliza o objeto padrao do Documento Comercial.
- `document-builder.js`: monta as secoes do documento.
- `document-validator.js`: valida Cliente, Projeto, Servico, Produtos e Totais.
- `document-service.js`: gera, valida e prepara a exportacao futura.
- `document-renderer.js`: camada base de validacao e preparo de visualizacao.
- `document-html-renderer.js`: gera visualizacao HTML do Documento Comercial
  por `DocumentHtmlRenderer`/`HtmlRenderer`.
- `document-print-renderer.js`: prepara estrutura de impressao futura por
  `DocumentPrintRenderer`/`PrintRenderer`, sem executar impressao.

## Modelo

```text
Empresa
Cliente
Projeto
Servico
Produtos
Totais
Resumo Financeiro
Observacoes
Condicoes Comerciais
Validade
Metadados
```

## Builder

O `DocumentBuilder` monta secoes estruturadas:

```text
montarCabecalho()
montarCliente()
montarProjeto()
montarProdutos()
montarTotais()
montarRodape()
```

## Fluxo

```text
GerarDocumentoUseCase
    -> DocumentService.prepararExportacao()
        -> DocumentService.gerarDocumento()
            -> DocumentModel
            -> DocumentBuilder
        -> DocumentValidator
```

## Ordem sugerida de scripts

```text
js/documentos/document-model.js
js/documentos/document-builder.js
js/documentos/document-validator.js
js/documentos/document-service.js
js/documentos/document-renderer.js
js/documentos/document-html-renderer.js
js/documentos/document-print-renderer.js
js/usecases/documentos/gerar-documento-usecase.js
js/usecases/documentos/renderizar-documento-usecase.js
```

## Padrao de resposta

```text
sucesso
documento
exportacao
erros
detalhes
```

`exportacao` indica apenas que o documento esta preparado para canais futuros.
Ela nao gera arquivo e nao executa nenhuma saida real nesta sprint.

## Renderizacao

O fluxo de renderizacao recebe apenas um Documento Comercial ja gerado:

```text
Documento Comercial
    -> RenderizarDocumentoUseCase
        -> DocumentHtmlRenderer
            -> DocumentRenderer
```

O retorno padrao do use case e:

```js
{
    sucesso: true,
    html: "",
    erros: []
}
```

O renderizador nao conhece `OrcamentoOrchestrator`, nao acessa Firestore e nao
altera nenhuma tela existente. A string HTML gerada serve como base para PDF
real, impressao futura, visualizacao web e compartilhamentos comerciais.
