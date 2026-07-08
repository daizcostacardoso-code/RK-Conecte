# js/projetos

Base JavaScript do dominio Projeto na v0.2.0.

## Arquivos

- `projeto-model.js`: cria, normaliza e padroniza objetos de Projeto.
- `projeto-status.js`: define status e etapas do Projeto.
- `projeto-historico.js`: cria eventos e adiciona entradas ao historico.
- `projeto-validator.js`: valida campos obrigatorios para cadastro interno.
- `projeto-storage.js`: salva, carrega e lista Projetos no LocalStorage/Firestore.
- `projeto-service.js`: concentra acoes de negocio, CRUD via Repository e metodos legados de Projeto.
- `projeto-ui.js`: renderizacao da tela interna de Projetos.
- `projeto-controller.js`: orquestracao da tela via Use Cases e Service.

## Ordem sugerida de scripts

```html
<script src="../js/config.js"></script>
<script src="../js/storage.js"></script>
<script src="../js/util.js"></script>
<script src="../js/firebase-config.js"></script>
<script src="../js/storage/storage-adapter.js"></script>
<script src="../js/storage/local-storage-adapter.js"></script>
<script src="../js/projetos/projeto-status.js"></script>
<script src="../js/projetos/projeto-historico.js"></script>
<script src="../js/projetos/projeto-model.js"></script>
<script src="../js/projetos/projeto-validator.js"></script>
<script src="../js/repositories/projeto-repository.js"></script>
<script src="../js/projetos/projeto-storage.js"></script>
<script src="../js/projetos/projeto-service.js"></script>
```

## Padrao

O projeto atual nao usa `import/export`. Os arquivos desta pasta seguem o mesmo padrao de objetos globais.

## Cadastro interno

`paginas/projetos.html` permite listar, pesquisar, criar, editar, inativar como
cancelado e selecionar Projeto para uso futuro no Orcamento Inteligente.

Campos principais:

```text
id
nome/titulo
clienteId
clienteNome
descricao
enderecoObra
cidade
status
tipoProjeto
observacoes
padrao
generico
ativo
criadoEm
atualizadoEm
```

O cadastro usa `ProjetoService -> ProjetoRepository -> LocalStorageAdapter`.
`ProjetoStorage` continua disponivel para compatibilidade com fluxos existentes.

## Projeto padrao

`Projeto padrao` deve existir sempre para orcamentos rapidos quando o usuario
nao quiser detalhar obra ou ambiente. A tela tambem cadastra projetos genericos
de apoio, como Banheiro, Cozinha, Area externa, Sala, Quarto, Fachada, Sacada,
Area gourmet, Loja/comercial, Obra completa e Manutencao geral.

O `Projeto padrao` nao deve ser inativado pela interface, pois ele e usado como
apoio do fluxo Cliente -> Projeto -> Servico -> Tipo de servico -> Dependencias
-> Orcamento.
