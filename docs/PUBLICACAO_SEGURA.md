# Publicação segura do Patch 3

Este checklist publica o Firebase Authentication do Patch 2, o Hosting e as
regras protegidas do Firestore do Patch 3 como uma única versão.

## 1. Pré-requisitos

- confirme que o usuário administrativo entra e sai normalmente;
- mantenha o provedor E-mail/senha habilitado no Firebase Authentication;
- use Node.js 22 ou superior e Java 21 ou superior;
- faça um backup ou exportação dos dados importantes antes de alterar produção;
- execute os comandos na raiz do projeto e com a árvore Git limpa.

## 2. Autorizar o primeiro administrador

Esta etapa deve ser concluída **antes do deploy**. No Console do Firebase:

1. abra **Authentication > Users** e copie o UID do usuário administrador;
2. abra **Firestore Database** e crie a coleção `usuarios_autorizados`;
3. crie um documento cujo ID seja exatamente o UID copiado — não use ID automático;
4. adicione estes quatro campos:

| Campo | Tipo | Valor |
| --- | --- | --- |
| `ativo` | boolean | `true` |
| `perfil` | string | `admin` |
| `email` | string | e-mail usado no Authentication |
| `nome` | string | nome do administrador |

Cada futuro funcionário precisa de uma conta no Authentication e de um documento
com o próprio UID nessa coleção. Use `perfil: funcionario` para acessos comuns.
Uma conta autenticada sem esse documento continuará bloqueada.

## 3. Validação local

```powershell
npm install
npm run check
git status --short
```

O resultado esperado é sintaxe válida, todos os testes unitários aprovados,
todos os testes do emulador aprovados e nenhum arquivo inesperado no Git.

O comando de testes usa explicitamente o projeto `demo-rk-conecte`. Esse prefixo
impede que uma falha de configuração alcance os dados reais do Firebase.

## 4. Publicação controlada

Confira o projeto selecionado antes de publicar:

```powershell
firebase use
```

O projeto esperado é `rk-vidracaria`. Publique Hosting e regras juntos:

```powershell
firebase deploy --only "hosting,firestore:rules"
```

Não publique somente as regras enquanto uma versão anterior ao Patch 2 estiver
no Hosting, pois o frontend antigo não envia a identidade do Firebase.

## 5. Verificação após o deploy

Em uma janela anônima do navegador:

1. abra o site público e carregue a página de orçamento;
2. envie uma solicitação pública de teste;
3. confirme que páginas internas redirecionam para o login;
4. entre com o usuário administrativo;
5. confirme clientes, produtos, orçamentos, arquivos, caixa e notas de serviço;
6. confirme que a solicitação de teste aparece na área do funcionário;
7. saia e verifique novamente o bloqueio das páginas internas.

Se algum fluxo interno retornar `permission-denied`, não abra novamente as
regras. Registre a tela, a coleção envolvida e restaure a última versão conhecida
das regras pelo histórico do Git antes de investigar.
