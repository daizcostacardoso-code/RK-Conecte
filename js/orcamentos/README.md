# js/orcamentos

Modulo de Orcamentos do RK-Conecte.

Esta pasta contem arquivos legados do orcamento profissional e, a partir da
Sprint 3.8, o Orquestrador do Orcamento Inteligente.

## Orquestrador do Orcamento

O Orquestrador coordena o fluxo de criacao de um orcamento usando dominios ja
existentes. Ele nao implementa interface, nao calcula formulas diretamente, nao
acessa Firestore e nao altera HTML, CSS ou Firebase.

## Arquivos do orquestrador

- `orcamento-state.js`: estados internos do fluxo de orcamento.
- `orcamento-context.js`: estrutura normalizada do contexto do orcamento.
- `orcamento-factory.js`: cria um contexto inicial valido.
- `orcamento-orchestrator.js`: coordena cliente, projeto, servico, produtos,
  calculo, validacao e finalizacao.

## Contexto

```text
cliente
projeto
servico
produtos
calculo
resultado
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
    -> calcular()
    -> validar()
    -> finalizar()
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

Nesta sprint, o Orchestrator nao grava orcamentos nem altera o orcamento legado.
Ele prepara o fluxo reutilizavel para as proximas etapas.
