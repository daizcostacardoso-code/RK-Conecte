# js/clientes

Centro Comercial de Clientes do RK-Conecte.

Esta pasta contem a primeira camada de dominio Cliente do Bloco Comercial. O
modulo segue a arquitetura Core v1: Use Cases -> Services -> Repository ->
Adapter.

## Arquivos

- `cliente-model.js`: modelo e normalizacao da entidade Cliente.
- `cliente-validator.js`: validacoes iniciais de nome, tipo de pessoa, telefone
  e CPF/CNPJ quando informado.
- `cliente-factory.js`: criacao de Clientes validos para entrada no dominio.
- `cliente-repository.js`: persistencia via `StorageAdapter`, sem acesso direto
  a Firestore.
- `cliente-service.js`: fachada de aplicacao para criar, buscar, listar,
  atualizar e desativar Clientes.
- `cliente-ui.js`: renderizacao da tela de Clientes, resumo, abas,
  placeholders e indicadores comerciais.
- `cliente-controller.js`: orquestracao da interface com Use Cases e
  `ClienteService`.

## Estrutura do Cliente

```text
id
tipoPessoa
nome
nomeFantasia
cpfCnpj
inscricaoEstadual
telefonePrincipal
telefoneSecundario
email
enderecos
contatos
observacoes
status
dataCadastro
ultimaAtualizacao
projetos
orcamentos
historico
timeline
```

## Ordem sugerida de scripts

```html
<script src="../js/storage/storage-adapter.js"></script>
<script src="../js/storage/memory-adapter.js"></script>
<script src="../js/clientes/cliente-model.js"></script>
<script src="../js/clientes/cliente-validator.js"></script>
<script src="../js/clientes/cliente-factory.js"></script>
<script src="../js/clientes/cliente-repository.js"></script>
<script src="../js/clientes/cliente-service.js"></script>
<script src="../js/usecases/clientes/criar-cliente-usecase.js"></script>
<script src="../js/usecases/clientes/buscar-cliente-usecase.js"></script>
<script src="../js/usecases/clientes/listar-clientes-usecase.js"></script>
<script src="../js/clientes/cliente-ui.js"></script>
<script src="../js/clientes/cliente-controller.js"></script>
```

## Interface - Sprint 3.3

A pagina `paginas/clientes.html` usa `ClienteController` e `ClienteUI` para
compor o Centro Comercial de Clientes.

Areas da tela:

- cabecalho com titulo, busca e acao Novo Cliente;
- lista de clientes com Nome, Tipo, Telefone, Cidade, Status, Ultima
  atualizacao e Acoes;
- cadastro rapido para o primeiro contato comercial;
- resumo do cliente selecionado;
- abas de Dados, Projetos, Orcamentos, Historico, Timeline e Observacoes;
- painel lateral de indicadores.

Regras da interface:

- criar, buscar e listar devem passar por Use Cases ou `ClienteService`;
- Projetos e Orcamentos sao apenas listas preparadas nesta sprint;
- Timeline permanece como placeholder;
- a interface nao acessa Firestore diretamente.

## Workflow

Nesta sprint, Cliente nao possui workflow proprio de status. O Workflow continua
reservado para o ciclo de vida do Projeto. Quando um Cliente gerar Projeto, o
fluxo deve seguir pelos modulos de Projeto e Workflow existentes.

## Regra arquitetural

O modulo nao acessa Firestore diretamente. Persistencia deve acontecer somente
por Repository + Adapter.
