# js/pdf

Camada de dominio do PDF Comercial do RK-Conecte.

Esta pasta foi criada na Sprint 4.1 para preparar os dados e o template logico
do PDF Comercial. A geracao efetiva fica reservada para a Sprint 4.2.

## Limites da Sprint 4.1

- Nao gera arquivo PDF.
- Nao faz download.
- Nao imprime.
- Nao usa bibliotecas externas.
- Nao usa canvas.
- Nao transforma HTML em PDF.
- Nao acessa Firebase ou Firestore.
- Nao altera o fluxo existente do Orcamento Inteligente.

## Fonte de dados

O modulo deve receber exclusivamente o contexto retornado pelo
`OrcamentoOrchestrator`, preferencialmente depois da finalizacao do Orcamento
Inteligente, quando `contexto.orcamentoPreparado` estiver disponivel.

```text
OrcamentoOrchestrator
    -> contexto.orcamentoPreparado
        -> GerarPdfUseCase
            -> PdfService
                -> PdfModel
                -> PdfValidator
                -> PdfTemplate
```

## Arquivos

- `pdf-model.js`: normaliza a estrutura do PDF Comercial.
- `pdf-validator.js`: valida Cliente, Projeto, Servico, Produtos e Totais.
- `pdf-template.js`: monta o template padronizado em dados estruturados.
- `pdf-service.js`: monta dados, valida e prepara a exportacao futura.

## Modelo PDF

```text
Empresa
Cliente
Projeto
Servico
Produtos
Totais
Observacoes
Condicoes Comerciais
Validade
Rodape
```

## Template preparado

```text
Cabecalho
Logo placeholder
Dados da empresa
Dados do cliente
Resumo do projeto
Tabela de produtos
Resumo financeiro
Observacoes
Assinaturas
Rodape
```

## Ordem sugerida de scripts

```html
<script src="../js/pdf/pdf-model.js"></script>
<script src="../js/pdf/pdf-validator.js"></script>
<script src="../js/pdf/pdf-template.js"></script>
<script src="../js/pdf/pdf-service.js"></script>
<script src="../js/usecases/pdf/gerar-pdf-usecase.js"></script>
```

## Padrao de resposta

`PdfService.prepararExportacao()` retorna:

```text
sucesso
modelo
template
exportacao
erros
detalhes
```

O campo `exportacao` e apenas uma preparacao para a Sprint 4.2. Ele nao executa
download, impressao ou geracao real do arquivo.
