# Arquitetura RK-Conecte

## Visão geral

O RK-Conecte é um sistema web/PWA estático para vidraçaria, publicado pela raiz do projeto e integrado ao Firebase pelo SDK compat. A interface usa HTML, CSS e JavaScript globais, sem bundler e sem `import/export`.

## Módulo de orçamento

A tela interna principal é `paginas/novo-orcamento.html`. Ela mantém os scripts antigos e adiciona uma base modular em `js/orcamentos/`:

- `orcamento-model.js`: monta e normaliza o objeto profissional do orçamento.
- `orcamento-calculos.js`: concentra regras de área, item, totais e custos internos.
- `orcamento-storage.js`: salva/carrega o rascunho atual localmente e no Firestore.
- `orcamento-ui.js`: preenche cabeçalho, resumo, pagamento e custos internos.
- `orcamento-pdf.js`: fornece dados públicos e blocos auxiliares para PDF.

Os arquivos antigos continuam ativos para compatibilidade:

- `js/formulario.js`: leitura dos campos da tela.
- `js/calculos.js`: delega para a regra profissional quando o item é novo.
- `js/itens.js`: lista em memória dos itens.
- `js/tabela.js`: renderização da tabela.
- `js/orcamento.js`: controlador do fluxo.
- `js/pdf.js`: geração do PDF com jsPDF.

## Compatibilidade

O projeto continua usando funções globais. Itens antigos são marcados como `modelo: "legado"` para não serem recalculados pela fórmula profissional. Itens novos usam `modelo: "profissional"`.

## Persistência

O rascunho atual permanece em:

- LocalStorage: `vidracaria_orcamento_atual`
- Firestore: coleção `orcamentos`, documento `atual`

Orçamentos emitidos pelo PDF continuam sendo gravados em:

- LocalStorage: `vidracaria_historico_orcamentos`
- Firestore: coleção `orcamentos_emitidos`, documento pelo número do orçamento
