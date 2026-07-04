# js/servicos

Dominio Servicos do RK-Conecte.

Esta pasta contem a camada de dominio de Servicos do Bloco Comercial. O modulo
segue a arquitetura Core v1: Use Cases -> Services -> Repository -> Adapter.

## Objetivo

Representar servicos comerciais que futuramente poderao alimentar o Catalogo de
Servicos e o Orcamento Inteligente.

Na Sprint 3.5, o modulo recebeu a primeira interface do Catalogo Comercial de
Servicos em `paginas/servicos.html`. A tela consome Use Cases e
`ServicoService`, mantendo cadastro, edicao e inicio real de orcamento como
etapas futuras.

## Arquivos

- `servico-model.js`: modelo, normalizacao, categorias e tipos de calculo.
- `servico-validator.js`: validacoes de nome, categoria, tipo de calculo e
  status.
- `servico-factory.js`: criacao de Servicos e objeto padrao.
- `servico-repository.js`: persistencia via `StorageAdapter`, sem acesso direto
  a Firestore.
- `servico-service.js`: fachada de aplicacao para criar, buscar, listar,
  atualizar e desativar Servicos.
- `servico-ui.js`: renderizacao da tela do Catalogo Comercial de Servicos.
- `servico-controller.js`: orquestracao da interface via Use Cases e
  `ServicoService`.

## Estrutura do Servico

```text
id
nome
categoria
descricao
tipoCalculo
unidadeVenda
camposObrigatorios
produtosSugeridos
ferragensSugeridas
tempoEstimado
ativo
observacoes
criadoEm
atualizadoEm
```

## Categorias iniciais

```text
box
espelho
guarda_corpo
cobertura
fachada
janela
porta
fechamento
manutencao
projeto_personalizado
```

## Tipos de calculo

```text
area_m2
linear_m
unidade
quantidade
personalizado
```

## Ordem sugerida de scripts

```html
<script src="../js/storage/storage-adapter.js"></script>
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/servicos/servico-model.js"></script>
<script src="../js/servicos/servico-validator.js"></script>
<script src="../js/servicos/servico-factory.js"></script>
<script src="../js/servicos/servico-repository.js"></script>
<script src="../js/servicos/servico-service.js"></script>
<script src="../js/usecases/servicos/buscar-servico-usecase.js"></script>
<script src="../js/usecases/servicos/listar-servicos-usecase.js"></script>
<script src="../js/servicos/servico-ui.js"></script>
<script src="../js/servicos/servico-controller.js"></script>
```

## Fluxo

```text
Use Case -> ServicoService -> ServicoRepository -> StorageAdapter
```

## Integracao futura com Orcamento Inteligente

O dominio Servicos prepara os dados que poderao orientar o orcamento no futuro:

- `tipoCalculo` indica se o servico usa area, metro linear, unidade, quantidade
  ou regra personalizada;
- `camposObrigatorios` pode orientar quais medidas a interface deve solicitar;
- `produtosSugeridos` e `ferragensSugeridas` podem apoiar montagem de itens;
- `tempoEstimado` pode apoiar planejamento comercial e operacional.

Nesta sprint, esses campos sao apenas estrutura de dominio. Eles nao alteram o
orcamento atual.

Na interface da Sprint 3.5, esses campos aparecem apenas como areas preparadas:
produtos sugeridos, ferragens sugeridas, campos obrigatorios e fluxo do
orcamento. Nenhum comportamento de Orcamento Inteligente foi implementado.

## Regra arquitetural

O modulo nao acessa Firestore diretamente. Persistencia deve acontecer somente
por Repository + Adapter.

A interface deve chamar Use Cases e `ServicoService`. Ela nao deve acessar
`ServicoRepository` diretamente.
