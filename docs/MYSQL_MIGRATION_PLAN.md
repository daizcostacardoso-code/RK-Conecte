# Plano de Migracao MySQL - RK-Conecte

## Objetivo da Sprint 5.3

Criar a base tecnica para uma futura arquitetura com API Node.js/Express e MySQL, sem trocar a persistencia atual e sem alterar telas, regras de negocio ou fluxos existentes.

```text
Frontend RK-Conecte
|
v
API Node.js/Express
|
v
MySQL
```

## Estado atual preservado

- Firebase continua funcionando como fonte atual onde ja e usado.
- LocalStorage continua funcionando como fonte atual onde ja e usado.
- Firestore nao foi removido.
- Nenhum dado real foi migrado automaticamente.
- Nenhuma tela deve depender do MySQL nesta sprint.

## Base criada

- API isolada em `api/`, com Express, CORS, dotenv, mysql2 e nodemon.
- Conexao MySQL preparada em `api/src/database/mysql.js`.
- Health checks iniciais:
  - `GET /api/health`
  - `GET /api/db-health`
- Schema inicial em `api/src/migrations/001_schema_inicial.sql`.
- Adapter futuro do frontend em `js/storage/api-adapter.js`, ainda como placeholder seguro.

## Estrategia de ativacao

O MySQL sera ativado por modulo, de forma gradual. A ordem sugerida e:

1. Escolher um modulo de baixo risco.
2. Criar repository especifico no backend.
3. Criar endpoints da API para o modulo.
4. Criar ou adaptar o repository do frontend para falar com a API.
5. Validar em homologacao contra Firebase/localStorage.
6. Migrar dados com script controlado e backup.
7. Trocar a leitura/escrita do modulo somente quando os totais e registros baterem.

## Repository Pattern

O RK-Conecte deve continuar usando Repository Pattern.

- A interface chama controller/use case/service.
- Services chamam repositories.
- Repositories usam adapters.
- Adapters decidem a tecnologia de persistencia.

Nenhuma tela deve acessar MySQL diretamente. Nenhuma tela deve conhecer credenciais, host, usuario ou nome do banco.

## Regra de integracao

O frontend deve falar com a API, nunca direto com o banco.

Credenciais de MySQL ficam apenas no backend, via variaveis de ambiente:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Como subir a API

```bash
cd api
npm install
copy .env.example .env
npm run dev
```

Com a API ativa:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/db-health
```

`/api/db-health` responde `OK` quando o MySQL estiver configurado e acessivel. Sem MySQL, ele deve responder erro controlado, sem quebrar a API nem o frontend.

## O que nao fazer nesta fase

- Nao trocar Firebase por MySQL.
- Nao remover localStorage.
- Nao remover Firestore.
- Nao migrar dados automaticamente.
- Nao alterar Orcamento Inteligente.
- Nao alterar Caixa.
- Nao alterar Agenda.
- Nao alterar Painel.
- Nao alterar area publica.
- Nao colocar credenciais de banco no frontend.

## Checklist tecnico

- Frontend continua abrindo igual.
- API sobe separadamente.
- `GET /api/health` responde `OK`.
- `GET /api/db-health` testa conexao quando MySQL estiver configurado.
- Schema SQL existe.
- Documentacao registra a estrategia gradual.
- Nenhuma tela foi alterada para usar MySQL.
