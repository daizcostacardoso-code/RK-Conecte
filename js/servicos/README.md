# js/servicos

Dominio Servicos do RK-Conecte.

Esta pasta contem a camada de dominio de Servicos do Bloco Comercial. O modulo
segue a arquitetura Core v1: Use Cases -> Services -> Repository -> Adapter.

## Objetivo

Representar macro servicos comerciais que organizam os tipos de servico e suas
dependencias tecnicas para o Orcamento Inteligente.

Na Sprint de Cadastros Base, `paginas/servicos.html` passou a permitir
cadastro, edicao, listagem, pesquisa e inativacao logica de Servicos. A tela
consome Use Cases e `ServicoService`, sem acesso direto a Repository ou
Firestore pela interface.

## Arquivos

- `servico-model.js`: modelo, normalizacao, categorias e tipos de calculo.
- `servico-validator.js`: validacoes de nome, categoria, tipo de calculo e
  status.
- `servico-factory.js`: criacao de Servicos e objeto padrao.
- `servico-repository.js`: persistencia via `StorageAdapter`, sem acesso direto
  a Firestore.
- `servico-service.js`: fachada de aplicacao para criar, buscar, listar,
  atualizar e desativar Servicos.
- `servico-ui.js`: renderizacao da tela interna de cadastro guiado de Servicos.
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
tiposItem/tiposServico
dependenciasPadrao
tamanhosPadrao
tempoEstimado
ativo
observacoes
criadoEm
atualizadoEm
```

## Categorias iniciais

```text
instalacao
manutencao
limpeza
medicao_tecnica
remocao
outros
```

## Dependencias

Dependencias de Servicos e Tipos de servico devem vir apenas de Produtos ativos
cadastrados. Cada dependencia guarda:

```text
produtoId
produtoNome
categoria
unidadeCalculo
regraCalculo
quantidadePadrao
custoUnitario
custoEstimado
obrigatoria
observacao
```

Dependencia digitada livremente nao e aceita nesta sprint. A interface deve
sempre selecionar um Produto ativo cadastrado e salvar um snapshot com nome,
categoria, unidade, regra e custos.

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
<script src="../js/storage/local-storage-adapter.js"></script>
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/servicos/servico-model.js"></script>
<script src="../js/servicos/servico-validator.js"></script>
<script src="../js/servicos/servico-factory.js"></script>
<script src="../js/servicos/servico-repository.js"></script>
<script src="../js/servicos/servico-service.js"></script>
<script src="../js/usecases/servicos/buscar-servico-usecase.js"></script>
<script src="../js/usecases/servicos/listar-servicos-usecase.js"></script>
<script src="../js/usecases/servicos/atualizar-servico-usecase.js"></script>
<script src="../js/usecases/servicos/excluir-servico-usecase.js"></script>
<script src="../js/servicos/servico-ui.js"></script>
<script src="../js/servicos/servico-controller.js"></script>
```

## Fluxo

```text
Use Case -> ServicoService -> ServicoRepository -> StorageAdapter
```

## Integracao futura com Orcamento Inteligente

O dominio Servicos prepara os dados que orientam os cadastros guiados:

- `categoria` representa a macro categoria do servico;
- `tiposItem` guarda tipos editaveis, tempo medio, unidade de tempo,
  observacoes tecnicas e dependencias;
- `dependenciasPadrao` guarda produtos tecnicos selecionados do cadastro de
  Produtos, incluindo custo unitario e custo estimado;
- `tamanhosPadrao` guarda medidas em centimetros vinculadas ao modelo correto,
  como Porta de abrir, Porta de correr, Janela 2 folhas, Janela 4 folhas e Box
  frontal.

Nesta sprint, esses cadastros nao alteram calculo, PDF, preview ou fluxo atual
do Orcamento Inteligente.

## Regra arquitetural

O modulo nao acessa Firestore diretamente. Persistencia deve acontecer somente
por Repository + Adapter.

A interface deve chamar Use Cases e `ServicoService`. Ela nao deve acessar
`ServicoRepository` diretamente.
