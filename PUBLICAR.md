# Guia de publicação — RK Conecte

Esta pasta é a fonte usada para os deploys do RK Conecte. O Hosting publica a
raiz do projeto; dependências, testes, documentação e scripts ficam no
repositório para manutenção, mas são excluídos pelo `firebase.json`.

## Alterações rápidas

| Necessidade | Arquivo principal |
| --- | --- |
| Nome, contato, logo e chaves locais | `js/config.js` |
| Projeto Firebase público | `js/firebase-config.js` |
| Tela de carregamento global | `js/shared/rk-loading.js` e `css/rk-loading-critical.css` |
| Navegação e menu | `js/shared/rk-navigation.js` |
| Regras visuais globais | `css/style.css` |
| Página pública inicial | `index.html` |

`js/firebase-config.js` contém somente identificadores públicos do Firebase.
Nunca adicione tokens privados, credenciais de serviço ou arquivos `.env`.

## Preparação local

```powershell
npm install
npm run check
```

O `predeploy` do Firebase executa a mesma validação antes da publicação.
Revise o ambiente, as regras do Firestore e o projeto selecionado antes de
executar `firebase deploy`.

## Organização e manutenção

- Não versionar `node_modules`, `.firebase`, logs, `tmp` ou credenciais.
- Manter alterações de empresa concentradas em `js/config.js`.
- Manter a tela de carregamento centralizada em `js/shared/rk-loading.js`.
- Registrar mudanças visíveis no `CHANGELOG.md`.
- Fazer deploy a partir desta pasta e manter o backup externo intacto.
