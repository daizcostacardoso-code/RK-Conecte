# js/projetos

Base JavaScript do dominio Projeto na v0.2.0.

## Arquivos

- `projeto-model.js`: cria, normaliza e padroniza objetos de Projeto.
- `projeto-status.js`: define status e etapas do Projeto.
- `projeto-historico.js`: cria eventos e adiciona entradas ao historico.
- `projeto-storage.js`: salva, carrega e lista Projetos no LocalStorage/Firestore.
- `projeto-service.js`: concentra acoes de negocio, como criar, alterar status e registrar contato.

## Ordem sugerida de scripts

```html
<script src="../js/config.js"></script>
<script src="../js/storage.js"></script>
<script src="../js/util.js"></script>
<script src="../js/firebase-config.js"></script>
<script src="../js/projetos/projeto-status.js"></script>
<script src="../js/projetos/projeto-historico.js"></script>
<script src="../js/projetos/projeto-model.js"></script>
<script src="../js/projetos/projeto-storage.js"></script>
<script src="../js/projetos/projeto-service.js"></script>
```

## Padrao

O projeto atual nao usa `import/export`. Os arquivos desta pasta seguem o mesmo padrao de objetos globais.
