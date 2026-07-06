# Integracao Visual E2E - Sprint 5.1A

## Objetivo

Tornar o RK-Conecte navegavel de ponta a ponta no site online, usando as telas e modulos existentes e criando apenas as pecas visuais que faltavam para conectar o fluxo.

## Fluxo completo

```text
Login
-> Dashboard Comercial
-> Clientes
-> Projetos
-> Orcamento Inteligente
-> Documento Comercial
-> Gerar PDF
-> Compartilhar
-> Aprovar
-> Converter em Projeto
-> Producao
```

## Paginas envolvidas

- `paginas/login.html`: entrada da equipe.
- `paginas/dashboard-comercial.html`: ponto de entrada apos login.
- `paginas/clientes.html`: selecao/cadastro rapido de Cliente.
- `paginas/projetos.html`: selecao visual de Projeto.
- `paginas/orcamento-inteligente.html`: fluxo Cliente -> Projeto -> Servico -> Produtos -> Calculo -> Resumo.
- `paginas/compartilhar-documento.html`: visualizacao, PDF, impressao e placeholders de canais.
- `paginas/aprovacao-comercial.html`: fluxo Rascunho -> Em Revisao -> Aprovado/Reprovado.
- `paginas/converter-projeto.html`: conversao de Documento aprovado em Projeto Executivo.
- `paginas/producao.html`: criacao visual de Ordem de Producao demo a partir do Projeto convertido.

## Modulos utilizados

- `AppState` e `AppStateService` para estado corrente.
- `ProjetoService` para Projeto.
- `OrcamentoOrchestrator`, use cases de Orcamento e Motor de Calculo para Orcamento Inteligente.
- `DocumentService`, `DocumentHtmlRenderer`, `ExportService`, `PdfAdapter` e `PrintAdapter` para Documento, PDF e impressao.
- `ComercialService` e use cases comerciais para aprovacao.
- `ConversaoService` e `ConverterProjetoUseCase` para Projeto Executivo.
- `ProducaoService`, `ProducaoRepository` e `CriarOrdemProducaoUseCase` para Ordem de Producao.

## Dados demo

O arquivo `js/shared/rk-e2e-demo-state.js` cria dados locais de demonstracao quando o navegador nao possui dados reais suficientes para percorrer o fluxo.

Esses dados ficam em `sessionStorage`, sao marcados com origem `DEMO_E2E` e hidratam o AppState apenas para navegacao visual. Eles nao acessam Firestore e nao substituem regras definitivas.

## Limitacoes conhecidas

- Os dados demo duram a sessao do navegador.
- A persistencia definitiva de Projeto/Producao ainda depende da evolucao operacional futura.
- WhatsApp, Email e Copiar Link continuam como placeholders.
- O PDF depende do `PdfAdapter` e do suporte do navegador para iniciar download local.
- A tela de Producao cria Ordem de Producao demo, sem agenda, materiais ou execucao real.

## Como testar online

1. Abrir `paginas/login.html`.
2. Entrar com `admin` e `1234`.
3. Confirmar redirecionamento para `paginas/dashboard-comercial.html`.
4. Usar os atalhos ou menu principal para seguir: Clientes -> Projetos -> Orcamento -> Documento -> Aprovacao -> Conversao -> Producao.
5. No Orcamento Inteligente, finalizar o orcamento e clicar em `Gerar Documento Comercial`.
6. Em Compartilhamento, usar `Visualizar Documento` e `Exportar PDF`.
7. Em Aprovacao Comercial, solicitar revisao e aprovar.
8. Em Conversao, converter em Projeto.
9. Em Producao, criar a Ordem de Producao demo.
