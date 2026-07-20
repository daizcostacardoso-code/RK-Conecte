# RK-Conecte

Sistema web da RK Vidraçaria para atendimento público, cadastro de clientes,
orçamentos, arquivos comerciais, medições, notas de serviço e controle de caixa.

## Versão atual

`v0.4.1`

A aplicação utiliza Firebase Hosting e Firestore como fonte oficial de dados.
Não existe API Node ou sincronização com MySQL nesta base.

## Validação local

Requisitos:

- Node.js 22 ou superior;
- dependências instaladas com `npm install`.

Execute antes de aplicar novas alterações ou publicar:

```powershell
npm run check
```

O comando valida a sintaxe dos módulos JavaScript e executa todos os testes
automatizados do projeto.

## Publicação

O Firebase Hosting está configurado para não publicar testes, scripts de
manutenção, documentação, backups temporários ou arquivos de configuração.

> Atenção: o login definitivo e o fechamento das regras do Firestore serão
> implementados nos próximos patches da Sprint 0. Não publique as regras atuais
> em um ambiente com dados reais antes de concluir essas etapas.

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
