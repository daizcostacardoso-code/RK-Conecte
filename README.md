# RK-Conecte

Sistema web da RK Vidraçaria para atendimento público, cadastro de clientes,
orçamentos, arquivos comerciais, medições, notas de serviço e controle de caixa.

## Versão atual

`v1.0.1`

A aplicação utiliza Firebase Hosting e Firestore como fonte oficial de dados.
Não existe API Node ou sincronização com MySQL nesta base.

Projetos, clientes, produtos e itens de serviço usam o Firestore como fonte
canônica. O navegador mantém somente preferências e rascunhos do fluxo em
andamento; telas vazias não recebem registros demonstrativos automaticamente.

Orçamentos emitidos usam exclusivamente a coleção `orcamentos_emitidos`, com
identidade estável, vínculos de solicitação, cliente e projeto, revisão, status
e histórico comercial. A coleção antiga `orcamentos/atual` permanece somente
para leitura de compatibilidade e não recebe novas gravações.

Quando um orçamento é aprovado, o sistema abre ou reutiliza um único projeto
operacional no Firestore e grava o vínculo nos dois registros. Projetos abertos
por aprovação preservam histórico, não aceitam exclusão definitiva e levam o
contexto do cliente e da obra para um rascunho de medição isolado por projeto.

Medições concluídas são persistidas na coleção `medicoes`, com documento único
por projeto, revisão e histórico. A conclusão libera uma ordem de serviço
vinculada na coleção `notas_servico`; essa ordem conduz o projeto pelas etapas
de produção, instalação e finalização sem apagar registros anteriores.

Cada projeto aprovado também possui um registro financeiro único. Recebimentos
parciais ou totais atualizam o saldo do projeto e criam a entrada correspondente
no caixa na mesma transação, preservando vínculos e histórico.

Administradores possuem uma tela própria para criar acessos, definir o perfil da
equipe, ativar ou desativar contas e enviar recuperação de senha. A interface só é
liberada após a confirmação de um perfil ativo e senhas nunca são armazenadas pela
aplicação.

## Validação local

Requisitos:

- Node.js 22 ou superior;
- Java 21 ou superior para o emulador do Firestore;
- dependências instaladas de forma reproduzível com `npm ci`.

Execute durante o desenvolvimento:

```powershell
npm run check
```

O comando valida a sintaxe dos módulos JavaScript, executa os testes unitários e
inicia temporariamente o emulador local para testar as regras do Firestore. Os
testes de regras usam o projeto isolado `demo-rk-conecte` e não acessam produção.

Antes de publicar, gere e valide o pacote restrito do Hosting:

```powershell
npm run release:prepare
```

Esse comando executa toda a validação, recria `dist/` somente com arquivos
públicos permitidos e bloqueia o deploy caso encontre Git, backups, testes, logs,
patches, mapas de código-fonte ou referências locais quebradas.

Para executar somente os testes das regras:

```powershell
npm run test:rules
```

## Publicação

O Firebase Hosting publica exclusivamente a pasta gerada `dist/`, nunca a raiz
do repositório. Testes, scripts de manutenção, documentação, backups temporários,
metadados Git e configurações de desenvolvimento ficam fora do pacote público.
As coleções operacionais exigem Firebase Authentication e um perfil ativo
vinculado ao UID em `usuarios_autorizados`; visitantes podem apenas ler os
valores do orçamento público e criar solicitações dentro do contrato validado
pelas regras.

Para validar novamente e publicar Hosting e regras:

```powershell
npm run deploy
```

O Firebase executa `release:prepare` automaticamente antes do deploy do Hosting.
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
