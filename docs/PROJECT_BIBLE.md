# Project Bible - RK-Conecte

## Identidade do produto

RK-Conecte e o sistema operacional da RK Vidracaria. O produto deve centralizar a rotina comercial, operacional e financeira em torno de uma entidade principal: o Projeto.

O Projeto representa uma oportunidade real de venda e execucao: uma solicitacao recebida, um orcamento em negociacao, uma obra aprovada, um servico em producao ou uma entrega finalizada.

## Visao

Transformar a rotina da vidracaria em um fluxo rastreavel, simples e rapido, reduzindo perda de informacao entre atendimento, orcamento, producao, instalacao e financeiro.

## Missao

Ajudar a RK Vidracaria a registrar cada demanda, acompanhar cada etapa e tomar decisoes com dados confiaveis, sem exigir um sistema pesado ou dificil de operar.

## Versao atual

- Versao publicada: v0.1.0.
- Versao em desenvolvimento: v0.2.0.
- Branch de trabalho: `feature/v020-comercial`.
- Foco da v0.2.0: Bloco Comercial do MVP.

## Principio central

Tudo que nasce no comercial deve virar Projeto ou se conectar a um Projeto.

Antes da v0.2.0, o sistema trata o orcamento como principal objeto de trabalho. A partir da v0.2.0, o orcamento passa a ser uma parte do Projeto, nao o centro do sistema.

## Principios

- Simplicidade: telas e fluxos devem ser diretos para uso diario.
- Velocidade: registrar e encontrar informacao deve ser rapido.
- Inteligencia: dados comerciais devem preparar relatorios e decisoes futuras.
- Rastreabilidade: mudancas importantes devem gerar historico.
- Escalabilidade: o MVP deve crescer sem reescrever o sistema inteiro.

## Fluxo geral

```text
cliente -> orcamento -> aprovacao -> producao -> instalacao -> financeiro
```

O Projeto acompanha esse fluxo e guarda os dados essenciais de cada etapa.

## Entidades principais

### Projeto

Entidade central do RK-Conecte.

Guarda:

- cliente;
- endereco da obra;
- origem da demanda;
- etapa comercial;
- status;
- responsavel;
- orcamento vinculado;
- valor estimado;
- valor fechado;
- historico;
- proximas acoes;
- observacoes.

### Orcamento

Documento comercial com itens, calculos, totais, condicoes de pagamento e PDF.

Na v0.2.0, o orcamento continua existindo, mas deve ser vinculado a um Projeto.

### Solicitacao

Pedido vindo do site publico ou registrado manualmente. Pode gerar um Projeto.

### Cliente

Pessoa ou empresa interessada no servico. Na fundacao do MVP, o cliente pode continuar embutido no Projeto. Uma colecao propria de clientes fica para evolucao futura.

## Blocos do sistema

### Comercial

Responsavel por entrada de leads, cadastro de Projetos, orcamentos, follow-up, negociacao, aprovacao e perda.

### Operacional

Responsavel por medicao, producao, instalacao, entrega e pos-venda. Deve nascer depois da aprovacao comercial.

### Financeiro

Responsavel por caixa, pagamentos, recebimentos, comissoes e margem. Na v0.2.0, recebe apenas a base de dados necessaria para evoluir depois.

## Regras de produto

- O sistema deve funcionar como PWA estatica, sem bundler.
- O JavaScript deve seguir o padrao atual de objetos globais.
- A compatibilidade com a v0.1.0 deve ser preservada.
- Nenhuma informacao interna de custo deve aparecer para o cliente.
- O Firestore deve ser a fonte de persistencia em nuvem, com fallback local quando possivel.
- Mudancas estruturais devem ser documentadas antes ou junto da implementacao.

## Padrao de desenvolvimento

- Fazer mudancas pequenas e organizadas.
- Preferir funcoes curtas e objetos globais compativeis com o codigo atual.
- Nao remover funcionalidades existentes sem motivo documentado.
- Nao alterar telas criticas junto com mudancas de dominio.
- Atualizar documentacao quando criar ou mudar regras de negocio.

## Como o Codex deve trabalhar

O Codex deve ler a documentacao do dominio antes de implementar, preservar compatibilidade com o fluxo atual de orcamento e listar ao final os arquivos criados e alterados.

## Definicao de pronto da v0.2.0

A v0.2.0 esta pronta quando:

- existir a colecao `projetos`;
- for possivel modelar um Projeto de ponta a ponta;
- houver base JavaScript para criar, normalizar, salvar, carregar e atualizar Projetos;
- o fluxo comercial estiver documentado;
- o orcamento puder ser associado a um Projeto em uma etapa seguinte;
- o proximo Codex conseguir continuar a implementacao lendo `docs/GUIA_CODEX.md`.
