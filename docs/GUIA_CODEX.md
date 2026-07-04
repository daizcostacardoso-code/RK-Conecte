# Guia Codex - RK-Conecte

## Contexto rapido

Projeto: RK-Conecte.

Branch da v0.2.0: `feature/v020-comercial`.

Objetivo atual: construir o Bloco Comercial do MVP usando Projeto como entidade central.

## Padrao tecnico do repositorio

- App web/PWA estatico.
- HTML, CSS e JavaScript puro.
- Sem bundler.
- Sem `import/export`.
- Objetos globais no JavaScript, como `OrcamentoModel`, `OrcamentoStorage`, `OrcamentoUI`.
- Firebase SDK compat.
- Firestore acessado por `db.collection(...)`.
- Fallback local com `Storage`.

## Antes de implementar

1. Ler `docs/PROJECT_BIBLE.md`.
2. Ler `docs/MVP_RK_CONECTE.md`.
3. Ler `docs/DOMINIO_PROJETO.md`.
4. Ler `docs/FLUXO_COMERCIAL.md`.
5. Ler `docs/MODELAGEM_FIRESTORE.md`.
6. Conferir `js/projetos/README.md`.

## Regras para proximas alteracoes

- Nao quebrar o fluxo atual de orcamentos.
- Nao remover scripts antigos.
- Nao converter o projeto para framework.
- Nao introduzir build step.
- Manter compatibilidade com Firebase Hosting.
- Preferir funcoes pequenas em objetos globais.
- Documentar novas colecoes ou campos.
- Preservar custos internos fora do PDF e de telas publicas.
- Nunca apagar arquivos sem necessidade clara.
- Comentar regras de negocio importantes quando o codigo nao for obvio.
- Evitar mudancas grandes em uma unica tarefa.
- Sempre listar arquivos criados e alterados ao final.

## Proxima tarefa recomendada

Implementar uma tela comercial inicial, preferencialmente:

- `paginas/projetos.html`;
- `js/projetos/projeto-ui.js`;
- link de acesso a partir da area do funcionario;
- listagem basica de Projetos;
- formulario simples de criacao/edicao;
- filtros por status;
- acao para criar Projeto manual;
- acao futura para vincular orcamento.

## Ordem sugerida para implementacao

1. Criar tela `paginas/projetos.html`.
2. Incluir scripts globais na ordem correta.
3. Criar `ProjetoUI`.
4. Listar Projetos com `ProjetoStorage.listar()`.
5. Criar formulario minimo.
6. Salvar Projeto com `ProjetoService.salvar()`.
7. Alterar status com `ProjetoService.alterarStatus()`.
8. Registrar contato com `ProjetoService.registrarContato()`.
9. Testar sem Firebase e com Firebase quando possivel.

## Validacao manual

Fluxos minimos:

- abrir a tela sem erros no console;
- criar Projeto manual;
- recarregar pagina e manter Projeto no LocalStorage;
- salvar no Firestore quando `db` estiver disponivel;
- alterar status e ver historico crescer;
- registrar contato e ver `datas.ultimoContato` atualizado.
