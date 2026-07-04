# Bloco Comercial - v0.2.0

## Objetivo

Construir a base comercial do RK-Conecte usando Projeto como entidade central.

O Bloco Comercial deve permitir que a empresa acompanhe demandas desde o primeiro contato ate aprovacao, perda ou cancelamento.

## Entidade central

Projeto.

Um Projeto pode conter ou se relacionar com:

- solicitacao do site;
- cliente;
- endereco da obra;
- vendedor/responsavel;
- orcamento;
- follow-ups;
- historico;
- status comercial;
- valor estimado;
- valor fechado.

## Entregas da fundacao

- `docs/PROJECT_BIBLE.md`;
- `docs/MVP_RK_CONECTE.md`;
- `docs/DOMINIO_PROJETO.md`;
- `docs/FLUXO_COMERCIAL.md`;
- `docs/MODELAGEM_FIRESTORE.md`;
- `docs/GUIA_CODEX.md`;
- `docs/PEDIDO_CODEX_V020_FUNDACAO.md`;
- `js/projetos/`;
- regras Firestore para `projetos`;
- chaves de LocalStorage para Projetos.

## Entregas futuras do bloco

### Tela de Projetos

Listagem comercial com:

- busca;
- filtros por status;
- resumo de valor;
- ultima atualizacao;
- proximo contato;
- acesso rapido ao detalhe.

### Detalhe do Projeto

Tela ou painel com:

- dados do cliente;
- dados da obra;
- status e prioridade;
- orcamento vinculado;
- historico;
- formulario de contato;
- proximas acoes.

### Vinculo com Orcamento

O orcamento deve poder:

- nascer a partir de um Projeto;
- salvar `projetoId` e `projetoNumero`;
- atualizar resumo dentro do Projeto;
- manter PDF e calculos no modulo existente.

## Indicadores comerciais iniciais

- quantidade de Projetos por status;
- valor estimado total com proposta enviada;
- valor fechado;
- projetos sem proximo contato;
- projetos cancelados por motivo.

## Limites desta etapa

A v0.2.0 deve preparar a base. Nao precisa entregar CRM completo, agenda completa ou automacoes complexas.
