# Publicação segura da v1.0.0

Nenhum comando desta página deve ser executado contra produção sem autorização explícita.

## Pré-publicação

- [ ] árvore Git limpa e commit/tag aprovados;
- [ ] `npm ci` e `npm run check` aprovados com Node 22 e Java 21+;
- [ ] versão central, cache e assets em `v1.0.0`;
- [ ] export do Firestore concluído e restaurável;
- [ ] administrador real, regras no emulador e perfis ativo/inativo validados;
- [ ] preview testado em desktop, celular, PWA e offline;
- [ ] formulário público, login e logout validados;
- [ ] orçamento, PDF, aprovação, projeto, medição e ordem de serviço validados;
- [ ] financeiro, caixa e gestão de acessos validados;
- [ ] rollback ensaiado e responsável definido.

## Backup

```powershell
gcloud firestore export gs://SEU_BUCKET/rk-conecte/v1.0.0-AAAA-MM-DD --project rk-vidracaria
gcloud firestore operations list --project rk-vidracaria
```

Confirme que o export terminou. Não armazene credenciais no repositório.

## Preview (somente após autorização)

```powershell
npm ci
npm run check
firebase use rk-vidracaria
firebase hosting:channel:deploy release-v1-0-0 --expires 7d
```

## Publicação posterior (somente após autorização)

```powershell
npm ci
npm run check
firebase use rk-vidracaria
firebase deploy --only "hosting,firestore:rules" --project rk-vidracaria
```

## Teste pós-deploy

Em janela anônima e dispositivo móvel real, execute todos os fluxos do checklist. Confirme proteção interna, logout, atualização da PWA e abertura offline depois que o app shell tiver sido armazenado.

## Rollback

1. interrompa novas operações e registre horário/sintoma;
2. restaure o Hosting pela release anterior ou publique o commit anterior aprovado;
3. restaure regras anteriores somente se compatíveis com o frontend restaurado;
4. não importe o backup automaticamente, pois dados posteriores ao export podem ser perdidos;
5. em caso de corrupção, importe primeiro em ambiente isolado e planeje a reconciliação.
