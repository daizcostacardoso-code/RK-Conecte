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
```

## Workflow

Nesta sprint, Cliente nao possui workflow proprio de status. O Workflow continua
reservado para o ciclo de vida do Projeto. Quando um Cliente gerar Projeto, o
fluxo deve seguir pelos modulos de Projeto e Workflow existentes.

## Regra arquitetural

O modulo nao acessa Firestore diretamente. Persistencia deve acontecer somente
por Repository + Adapter.
