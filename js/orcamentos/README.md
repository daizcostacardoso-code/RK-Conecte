# js/orcamentos

Modulo de Orcamentos do RK-Conecte.

Esta pasta contem arquivos legados do orcamento profissional e, a partir da
Sprint 3.8, o Orquestrador do Orcamento Inteligente.

Na Sprint 3.9A, o modulo ganhou a primeira estrutura visual do Orcamento
Inteligente em `paginas/orcamento-inteligente.html`. Na Sprint 3.9B, essa tela
passa a executar um fluxo guiado: Cliente -> Projeto -> Servico -> Produtos ->
Calculo -> Resumo, usando o Orquestrador e o Motor de Calculo.

Na Sprint 3.9C, o MVP do Orcamento Inteligente e consolidado com resumo final,
totais, observacoes, condicoes comerciais, validacao e objeto padronizado
preparado para PDF Comercial.

## Orquestrador do Orcamento

O Orquestrador coordena o fluxo de criacao de um orcamento usando dominios ja
existentes. Ele nao implementa interface, nao calcula formulas diretamente, nao
acessa Firestore e nao altera HTML, CSS ou Firebase.

## Arquivos do orquestrador

- `orcamento-state.js`: estados internos do fluxo de orcamento.
- `orcamento-context.js`: estrutura normalizada do contexto do orcamento.
- `orcamento-factory.js`: cria um contexto inicial valido.
- `orcamento-orchestrator.js`: coordena cliente, projeto, servico, produtos,
  remocao de produto, calculo, validacao e finalizacao.
- `orcamento-inteligente-ui.js`: renderizacao da etapa atual, estados do fluxo,
  produtos, calculo e resumo.
- `orcamento-inteligente-controller.js`: controle do fluxo guiado, eventos da
  tela e chamadas para Services, Use Cases e Orchestrator.

## Contexto

```text
cliente
projeto
servico
produtos
calculo
resultado
observacoes
condicoesComerciais
resumo
validacaoFinal
orcamentoPreparado
status
historico
criadoEm
atualizadoEm
```

## Estados

```text
INICIADO
CLIENTE_SELECIONADO
PROJETO_SELECIONADO
SERVICO_SELECIONADO
PRODUTOS_ADICIONADOS
CALCULADO
VALIDADO
FINALIZADO
```

## Fluxo

```text
CriarOrcamentoUseCase
    -> OrcamentoOrchestrator.iniciar()
    -> selecionarCliente()
    -> selecionarProjeto()
    -> selecionarServico()
    -> adicionarProduto()
    -> removerProduto()
    -> calcular()
    -> atualizar resumo na interface
```

## Integracao entre modulos

O Orchestrator deve chamar apenas fachadas de aplicacao:

```text
ClienteService
ProjetoService
ServicoService
ProdutoService
CalculoService
WorkflowEngine
```

Nenhum Repository deve ser chamado diretamente pelo Orchestrator. Persistencia e
integracoes continuam encapsuladas pelos services, repositories e adapters ja
existentes.

## Preparacao para a tela de Orcamento Inteligente

A futura interface devera montar um contexto progressivo e chamar use cases. A
tela nao devera conhecer regras de calculo, validacao de dominio, workflow ou
persistencia. Ela apenas exibira o estado retornado pelo Orchestrator.

Na Sprint 3.9A, a interface apenas chama `CriarOrcamentoUseCase`,
`OrcamentoOrchestrator.iniciar()` ou `OrcamentoFactory.criar()` para preparar um
contexto inicial. Ela nao seleciona entidades, nao calcula, nao gera PDF, nao
aprova orcamentos e nao altera o orcamento legado.

Na Sprint 3.9B, a interface guia o usuario por uma etapa atual independente e
mantem o resumo lateral sincronizado com o contexto. O controller implementa:

```text
selecionarCliente()
selecionarProjeto()
selecionarServico()
adicionarProduto()
removerProduto()
calcularOrcamento()
atualizarResumo()
gerarResumo()
validarOrcamento()
finalizarOrcamento()
avancarEtapa()
voltarEtapa()
```

A UI implementa:

```text
renderizarCliente()
renderizarProjeto()
renderizarServico()
renderizarProdutos()
renderizarResumo()
renderizarEtapaAtual()
renderizarTotais()
renderizarObservacoes()
renderizarCondicoes()
renderizarValidacao()
```

## Estados exibidos no fluxo guiado

```text
Cliente nao selecionado
Projeto nao selecionado
Servico nao selecionado
Sem produtos
Calculo pendente
Resumo atualizado
```

## Limites da Sprint 3.9B

- Sem PDF.
- Sem aprovacao.
- Sem persistencia definitiva.
- Sem Firebase ou Firestore direto na interface.
- Sem regras de calculo na UI.
- Tela antiga de orcamento preservada.

## Base entregue pela Sprint 3.9B

O fluxo deixou o contexto completo em memoria com cliente, projeto, servico,
produtos, calculo e resultado, preparando a consolidacao feita na Sprint 3.9C
sem mover formulas para a interface.

## Consolidacao da Sprint 3.9C

O resumo consolidado contem:

```text
Cliente
Projeto
Servico
Quantidade de produtos
Valor total
Tipo de calculo
Status
```

Os totais exibidos sao:

```text
Subtotal
Desconto (placeholder)
Acrescimo (placeholder)
Total geral
```

O controller valida antes de finalizar:

```text
Cliente informado
Projeto informado
Servico informado
Pelo menos um produto
Resultado do calculo disponivel
```

Ao finalizar, o Orquestrador monta `orcamentoPreparado`, um objeto padronizado
para a Sprint 4.1 (PDF Comercial). Esse objeto nao e persistido definitivamente
e nenhum PDF e gerado nesta sprint.

## Preparacao para Sprint 4.1

A Sprint 4.1 pode consumir `contexto.orcamentoPreparado` para gerar o PDF
Comercial. A estrutura ja contem cliente, projeto, servico, produtos, calculo,
resultado, totais, observacoes, condicoes comerciais, resumo e historico, sem
regra de PDF implementada na Sprint 3.9C.

## Ordem sugerida para a tela 3.9A

```html
<script src="../js/orcamentos/orcamento-state.js"></script>
<script src="../js/orcamentos/orcamento-context.js"></script>
<script src="../js/orcamentos/orcamento-factory.js"></script>
<script src="../js/orcamentos/orcamento-orchestrator.js"></script>
<script src="../js/usecases/orcamentos/criar-orcamento-usecase.js"></script>
<script src="../js/usecases/orcamentos/calcular-orcamento-usecase.js"></script>
<script src="../js/orcamentos/orcamento-inteligente-ui.js"></script>
<script src="../js/orcamentos/orcamento-inteligente-controller.js"></script>
```
