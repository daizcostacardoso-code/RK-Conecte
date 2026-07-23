# Publicação segura da v1.0.1

Esta versão usa deploy direto e controlado em produção. Não depende de ambiente de staging ou canal de preview.

## Pré-publicação obrigatória

- [ ] árvore Git limpa e commit de release aprovado;
- [ ] Node.js 22+ e Java 21+ disponíveis;
- [ ] `npm ci` concluído sem alterar o lockfile;
- [ ] `npm run release:prepare` aprovado por completo;
- [ ] `dist/` contém somente o pacote público validado;
- [ ] export do Firestore concluído e restaurável;
- [ ] conta de administrador e conta de funcionário disponíveis para o teste;
- [ ] nenhum usuário está editando dados durante a janela de publicação;
- [ ] commit anterior e regras anteriores registrados para rollback.

## O que `release:prepare` protege

O comando executa sintaxe, testes automatizados, regras no Firestore Emulator, geração do pacote e inspeção do Hosting. A publicação é bloqueada quando `dist/` contém metadados Git, backups, testes, logs, patches, documentação interna, configurações de desenvolvimento ou referências locais quebradas.

```powershell
npm run release:prepare
```

## Backup dos dados

Use o bucket e o ID reais do projeto Firebase:

```powershell
gcloud firestore export gs://SEU_BUCKET/rk-conecte/v1.0.1-AAAA-MM-DD --project SEU_PROJECT_ID
gcloud firestore operations list --project SEU_PROJECT_ID
```

Confirme que a operação terminou antes do deploy. Não armazene credenciais, chaves ou arquivos de conta de serviço no repositório.

## Publicação direta

Confirme o projeto selecionado antes de executar:

```powershell
firebase use
firebase use SEU_PROJECT_ID
npm run deploy
```

O script `deploy` publica somente Firebase Hosting e regras do Firestore. O predeploy do Hosting executa `release:prepare` novamente e interrompe a publicação se alguma validação falhar.

## Teste de fumaça imediato

Em uma janela anônima, uma sessão de administrador, uma sessão de funcionário e um celular real, confirme:

- visitante abre o site público;
- usuário autenticado na página inicial entra direto no dashboard;
- PWA com sessão ativa abre o dashboard sem segunda tela de carregamento;
- PWA sem sessão chega ao login sem loop;
- logout remove a sessão;
- funcionário não acessa a gestão de usuários;
- área interna não mostra o rodapé institucional da RK;
- existe uma única barra Conecte e ela não cria rolagem horizontal no celular;
- cliente, orçamento, aprovação, projeto, medição, ordem de serviço e financeiro continuam operando;
- geração de PDF continua funcionando;
- console do navegador não apresenta erro não tratado;
- instalação PWA antiga recebe a versão `v1.0.1` sem reinstalação.

A tag `v1.0.1` deve ser criada somente depois desse teste passar.

## Rollback sem perda de dados

1. interrompa novas operações e registre o horário e o sintoma;
2. publique o commit anterior aprovado do Hosting;
3. restaure as regras anteriores somente quando forem compatíveis com o frontend restaurado;
4. não importe o backup automaticamente: dados criados depois do export podem ser perdidos;
5. use o export apenas em caso de corrupção confirmada e com plano de reconciliação.
