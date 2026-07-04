# Pedido para Codex - Fundacao v0.2.0

## Contexto

Estamos no projeto RK-Conecte, branch `feature/v020-comercial`.

A v0.1.0 ja esta publicada. A v0.2.0 inicia o Bloco Comercial do MVP.

O projeto e uma PWA estatica em HTML, CSS e JavaScript puro, publicada no Firebase Hosting e integrada ao Firestore com SDK compat. O codigo atual usa objetos globais e nao usa bundler.

## Objetivo

Implementar a fundacao da v0.2.0 usando Projeto como entidade central do sistema.

## Arquivos de referencia obrigatorios

Ler antes de codar:

- `docs/PROJECT_BIBLE.md`;
- `docs/MVP_RK_CONECTE.md`;
- `docs/DOMINIO_PROJETO.md`;
- `docs/FLUXO_COMERCIAL.md`;
- `docs/MODELAGEM_FIRESTORE.md`;
- `docs/GUIA_CODEX.md`;
- `js/projetos/README.md`.

## O que ja existe

- `js/projetos/projeto-model.js`;
- `js/projetos/projeto-status.js`;
- `js/projetos/projeto-historico.js`;
- `js/projetos/projeto-storage.js`;
- `js/projetos/projeto-service.js`;
- chaves `Config.storage.projetos` e `Config.storage.projetoAtual`;
- regra Firestore para `projetos`.

## Tarefa principal

Criar a primeira experiencia utilizavel do Bloco Comercial.

Implementar:

1. `paginas/projetos.html`;
2. `js/projetos/projeto-ui.js`;
3. link para Projetos a partir da area de funcionario;
4. listagem de Projetos;
5. formulario de criacao/edicao;
6. filtros por status;
7. acao de alterar status;
8. acao de registrar contato;
9. exibicao de historico;
10. validacao manual do fluxo local.

## Regras tecnicas

- Nao usar framework.
- Nao usar `import/export`.
- Nao adicionar build.
- Seguir padrao de objetos globais.
- Carregar scripts na ordem correta.
- Preservar o modulo de orcamentos existente.
- Usar `ProjetoModel`, `ProjetoStorage` e `ProjetoService`.
- Manter fallback local se Firebase estiver indisponivel.

## Regras de produto

- Projeto pode existir sem orcamento.
- Orcamento deve continuar funcionando sem Projeto.
- Status comercial deve seguir `docs/DOMINIO_PROJETO.md`.
- Toda alteracao importante deve entrar no historico.
- Dados internos nao devem ir para telas publicas.

## Validacao esperada

Testar manualmente:

- abrir `paginas/projetos.html`;
- criar Projeto;
- listar Projeto criado;
- recarregar pagina e manter dados;
- alterar status;
- registrar contato;
- confirmar historico;
- confirmar ausencia de erros no console.

## Resultado esperado

Ao final, a v0.2.0 deve ter uma tela comercial minima e funcional, pronta para depois conectar Projetos aos orcamentos atuais.
