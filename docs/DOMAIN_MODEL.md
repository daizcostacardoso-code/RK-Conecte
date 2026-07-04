# Domain Model - RK-Conecte

## Visao geral

O RK-Conecte usa `Projeto` como entidade principal. As demais entidades existem para descrever, executar, documentar ou configurar um Projeto.

Um Projeto pode nascer no Comercial, avancar para Operacional, passar por Financeiro, entrar em garantia e depois ser arquivado. Cada entidade deve manter relacao clara com esse ciclo de vida.

## Entidades

### Projeto

Entidade central do sistema.

Representa uma demanda acompanhavel: atendimento, orcamento, aprovacao, producao, instalacao, financeiro, garantia e historico.

Relacionamentos principais:

- possui Cliente;
- pode possuir Orcamento;
- pode possuir Producao;
- pode possuir Instalacao;
- pode possuir Financeiro;
- pode possuir Pagamentos;
- pode possuir Agenda;
- pode possuir Arquivos e Fotos;
- sempre deve possuir Historico.

### Cliente

Pessoa ou empresa atendida pela RK Vidracaria.

Relaciona-se com Projeto e Orcamento. Em versoes futuras, pode ser reutilizado em varios Projetos.

### Orcamento

Proposta comercial com itens, valores, condicoes de pagamento e PDF.

Relaciona-se com Projeto. Um Projeto pode existir sem Orcamento, mas um Orcamento aprovado deve ser convertido ou vinculado a um Projeto.

### Produto

Item de catalogo usado em orcamentos e propostas, como vidro, box, espelho, porta, janela ou outro produto comercializado.

Relaciona-se com Orcamento e, indiretamente, com Projeto.

### Servico

Mao de obra, instalacao, visita tecnica, transporte ou outro servico cobrado ou executado.

Relaciona-se com Orcamento, Producao, Instalacao e Projeto.

### Producao

Etapa operacional que acompanha separacao, compra, corte, montagem ou preparacao de itens.

Relaciona-se diretamente com Projeto aprovado.

### Instalacao

Etapa operacional de agendamento, execucao e conclusao da instalacao na obra.

Relaciona-se com Projeto, Agenda, Fotos, Arquivos e Historico.

### Financeiro

Resumo financeiro do Projeto: valor fechado, custos, recebimentos, saldo, margem e situacao financeira.

Relaciona-se com Projeto e Pagamento.

### Pagamento

Registro de entrada, parcela, forma de pagamento, data prevista e data recebida.

Relaciona-se com Financeiro e Projeto.

### Agenda

Compromissos relacionados a visita, medicao, producao, entrega, instalacao, cobranca ou follow-up.

Relaciona-se com Projeto, Funcionario e Historico.

### Arquivo

Documento anexado ao Projeto, como PDF, contrato, comprovante, nota ou autorizacao.

Relaciona-se com Projeto e Historico.

### Foto

Imagem vinculada ao Projeto, como foto de medicao, andamento, instalacao ou pos-venda.

Relaciona-se com Projeto, Instalacao e Historico.

### Historico

Linha do tempo de eventos importantes.

Relaciona-se principalmente com Projeto, mas tambem pode registrar eventos de Orcamento, Instalacao, Financeiro e Agenda.

### Configuracao

Parametro geral do sistema: dados da empresa, valores padrao, listas auxiliares, permissoes futuras e regras ajustaveis.

Configuracao e a excecao da regra central: pode existir sem Projeto porque define comportamento global.

### Usuario

Identidade de acesso ao sistema.

Relaciona-se com Historico, permissoes e autoria de acoes.

### Funcionario

Pessoa da equipe da RK Vidracaria que executa tarefas comerciais, operacionais ou financeiras.

Relaciona-se com Projeto, Agenda, Historico, Producao e Instalacao.

## Regra de relacionamento

Toda entidade operacional ou comercial deve se conectar a um Projeto quando representar uma demanda real de cliente.

Entidades globais, como Configuracao, podem existir fora de Projeto porque definem parametros do sistema.
