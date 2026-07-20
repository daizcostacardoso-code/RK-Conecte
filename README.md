# RK-Conecte

Sistema web da RK Vidraçaria para atendimento público, cadastro de clientes,
orçamentos, arquivos comerciais, medições, notas de serviço e controle de caixa.

## Versão atual

`v0.4.3`

A aplicação utiliza Firebase Hosting e Firestore como fonte oficial de dados.
Não existe API Node ou sincronização com MySQL nesta base.

## Validação local

Requisitos:

- Node.js 22 ou superior;
- Java 21 ou superior para o emulador do Firestore;
- dependências instaladas com `npm install`.

Execute antes de aplicar novas alterações ou publicar:

```powershell
npm run check
```

O comando valida a sintaxe dos módulos JavaScript, executa os testes unitários e
inicia temporariamente o emulador local para testar as regras do Firestore. Os
testes de regras usam o projeto isolado `demo-rk-conecte` e não acessam produção.

Para executar somente os testes das regras:

```powershell
npm run test:rules
```

## Publicação

O Firebase Hosting está configurado para não publicar testes, scripts de
manutenção, documentação, backups temporários ou arquivos de configuração. As
coleções operacionais exigem Firebase Authentication e um perfil ativo vinculado
ao UID em `usuarios_autorizados`; visitantes podem apenas ler os valores do
orçamento público e criar solicitações dentro do contrato validado pelas regras.

Antes de publicar, siga [docs/PUBLICACAO_SEGURA.md](docs/PUBLICACAO_SEGURA.md).

## Estrutura principal

- `index.html` e `paginas/`: site público e telas internas;
- `css/`: estilos globais e específicos;
- `js/`: módulos e regras da aplicação;
- `tests/`: testes automatizados;
- `scripts/`: validações locais;
- `docs/`: estado atual e roadmap;
- `firebase.json` e `firestore.rules`: configuração Firebase.

Consulte também [docs/ESTADO_ATUAL.md](docs/ESTADO_ATUAL.md) e
[docs/ROADMAP.md](docs/ROADMAP.md).
