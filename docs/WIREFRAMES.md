# Wireframes em Texto

Wireframes conceituais para orientar produto e UX do Bloco Comercial. Estes
wireframes nao definem layout final nem implementacao.

## Tela de clientes

```text
+---------------------------------------------------------------+
| Clientes                                      [Novo cliente]   |
+---------------------------------------------------------------+
| Buscar por nome, telefone, documento ou projeto                |
| [___________________________________________________________]   |
+---------------------------------------------------------------+
| Filtros: [Todos] [Com projeto ativo] [Sem retorno] [Antigos]   |
+---------------------------------------------------------------+
| Nome              Telefone        Projetos   Ultimo contato    |
| Maria Souza       73 99999-0000   2          Hoje              |
| Loja Centro       73 98888-1111   1          Ontem             |
| Carlos Lima       73 97777-2222   0          10/07/2026        |
+---------------------------------------------------------------+
| Acoes por linha: abrir cliente, criar projeto, registrar contato|
+---------------------------------------------------------------+
```

Objetivo:

- Encontrar cliente rapido.
- Ver se possui Projetos.
- Criar novo Projeto sem sair do contexto.

## Detalhe do cliente

```text
+---------------------------------------------------------------+
| Cliente: Maria Souza                         [Editar] [Contato]|
+---------------------------------------------------------------+
| Telefone: 73 99999-0000    Email: maria@email.com              |
| Endereco: Rua Exemplo, Centro                                  |
| Origem: Indicacao          Observacao: prefere WhatsApp        |
+---------------------------------------------------------------+
| Projetos vinculados                              [Novo Projeto] |
| - PRJ-001 | Box banheiro | Em orcamento | Resp: Ana            |
| - PRJ-002 | Espelho sala | Concluido    | Resp: Bruno          |
+---------------------------------------------------------------+
| Historico                                                     |
| 10/07 - Cliente criado                                        |
| 11/07 - Projeto PRJ-001 criado                                |
| 12/07 - Orcamento enviado                                     |
+---------------------------------------------------------------+
```

Objetivo:

- Centralizar dados do cliente.
- Mostrar Projetos vinculados.
- Facilitar continuidade comercial.

## Novo projeto

```text
+---------------------------------------------------------------+
| Novo Projeto                                                  |
+---------------------------------------------------------------+
| Cliente: [Maria Souza____________________] [Trocar cliente]    |
| Titulo:  [Box banheiro social____________]                     |
| Tipo:    [Box v]                                               |
| Origem:  [WhatsApp v]                                          |
| Responsavel comercial: [Ana v]                                 |
+---------------------------------------------------------------+
| Endereco da obra                                              |
| [Rua Exemplo, Centro_______________________________________]   |
| Referencia: [Ao lado da farmacia___________________________]   |
+---------------------------------------------------------------+
| Observacoes iniciais                                          |
| [Cliente pediu vidro fume e ferragem preta...]                 |
+---------------------------------------------------------------+
| [Cancelar]                                      [Criar Projeto]|
+---------------------------------------------------------------+
```

Objetivo:

- Criar Projeto com poucos dados obrigatorios.
- Permitir complemento posterior.
- Ja orientar o tipo de servico.

## Novo orcamento

```text
+---------------------------------------------------------------+
| Novo Orcamento - PRJ-001 | Maria Souza | Box banheiro social   |
+---------------------------------------------------------------+
| Tipo de servico: [Box v]                                      |
+---------------------------------------------------------------+
| Medidas                                                       |
| Largura: [____]  Altura: [____]  Quantidade: [__]              |
| Abertura: [Correr v] Vidro: [Temperado 8mm v]                 |
| Ferragens: [Preta v]                                          |
+---------------------------------------------------------------+
| Itens                                                         |
| Box vidro temperado                         R$ ______          |
| Ferragens                                  R$ ______           |
| Instalacao                                 R$ ______           |
+---------------------------------------------------------------+
| Desconto: [____]  Acrescimo: [____]  Validade: [____]          |
| Total: R$ ______                                               |
+---------------------------------------------------------------+
| [Salvar rascunho] [Gerar PDF] [Marcar como enviado]            |
+---------------------------------------------------------------+
```

Objetivo:

- Guiar por tipo de servico.
- Reduzir campos irrelevantes.
- Preparar PDF e aprovacao.

## Dashboard comercial

```text
+---------------------------------------------------------------+
| Dashboard Comercial                                           |
+---------------------------------------------------------------+
| Projetos | Em orcamento | Enviados | Aprovados | Cancelados   |
|   24     |      8       |    6     |     5     |      2       |
+---------------------------------------------------------------+
| Propostas que precisam de retorno                             |
| PRJ-001 | Maria Souza | Box | Enviado ha 2 dias | [Abrir]      |
| PRJ-004 | Loja Centro | Fachada | Enviado hoje | [Abrir]      |
+---------------------------------------------------------------+
| Projetos recentes                                             |
| PRJ-010 | Carlos Lima | Espelho | Em orcamento | Ana           |
| PRJ-009 | Maria Souza | Box | Enviado | Bruno                  |
+---------------------------------------------------------------+
| Proximas acoes                                                |
| - Ligar para Maria Souza                                      |
| - Revisar medida do guarda-corpo                              |
| - Confirmar pagamento de sinal                                |
+---------------------------------------------------------------+
```

Objetivo:

- Mostrar trabalho comercial do dia.
- Destacar follow-up.
- Dar visao rapida ao dono e vendedor.
