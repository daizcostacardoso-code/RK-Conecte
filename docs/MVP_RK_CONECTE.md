# MVP RK-Conecte

## Objetivo do MVP

Construir um sistema simples, confiavel e evolutivo para a rotina da RK Vidracaria, com foco inicial no bloco comercial e com o Projeto como entidade central.

O MVP nao deve tentar resolver todos os departamentos de uma vez. Ele deve criar uma base clara para receber, organizar, vender e acompanhar demandas comerciais.

## Blocos do MVP

### Comercial

Entrada de clientes, produtos, servicos, orcamentos, envio de proposta, aprovacao e conversao em Projeto.

### Operacional

Producao, separacao de materiais, acompanhamento de instalacao, fotos, arquivos e conclusao da obra.

### Financeiro

Recebimentos, custos, comissoes, caixa, margem e relatorios financeiros.

## Escopo da v0.1.0

A v0.1.0 validou a base do sistema:

- site institucional;
- PWA publicada no Firebase Hosting;
- formulario publico de solicitacao;
- area de funcionario;
- criacao de orcamentos;
- calculos de itens;
- emissao de PDF;
- persistencia local e Firestore;
- documentacao tecnica inicial.

## Escopo da v0.2.0

A v0.2.0 inicia o Bloco Comercial.

Entregas esperadas:

- base para clientes;
- base para produtos;
- base para servicos;
- continuidade do modulo de orcamentos;
- aprovacao comercial;
- conversao de orcamento em Projeto;
- documentacao base do dominio Projeto;
- modelagem inicial da colecao `projetos`;
- estrutura `js/projetos/`;
- objeto `ProjetoModel`;
- objeto `ProjetoStorage`;
- objeto `ProjetoService`;
- regras iniciais do Firestore para `projetos`;
- preparacao para vincular orcamentos a Projetos;
- guia para proximas implementacoes com Codex.

## Fora do escopo da v0.2.0

Para manter o MVP controlado, ficam fora desta etapa:

- autenticacao completa por perfil;
- CRM avancado;
- funil visual com arrastar e soltar;
- modulo financeiro completo;
- modulo operacional completo;
- agenda de instalacao completa;
- relatorios gerenciais avancados;
- colecao separada de clientes;
- migracao total dos orcamentos antigos.

## Fluxo principal do MVP

1. Cliente envia solicitacao pelo site ou funcionario cadastra manualmente.
2. Sistema cria ou atualiza um Projeto.
3. Funcionario qualifica a demanda.
4. Funcionario monta ou vincula um orcamento.
5. Projeto recebe proposta enviada.
6. Projeto e aprovado ou cancelado.
7. Projetos aprovados alimentam futuras etapas operacional e financeira.

## Priorizacao

Prioridade 1:

- Projeto como entidade central.
- Fluxo comercial minimo.
- Persistencia de Projetos.

Prioridade 2:

- Listagem e filtros comerciais.
- Vinculo visual entre Projeto e Orcamento.
- Historico de interacoes.

Prioridade 3:

- Etapas operacionais.
- Recebimentos e financeiro.
- Permissoes e login real.

## Criterios de qualidade

- Codigo simples e compativel com o padrao atual.
- Documentacao suficiente para continuidade.
- Dados normalizados antes de salvar.
- Fallback local quando Firebase estiver indisponivel.
- Sem exposicao de custos internos em PDF ou telas publicas.
