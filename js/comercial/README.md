# Comercial

Modulo de aprovacao comercial do Documento Comercial.

Criado na Sprint 4.6 para controlar o estado comercial da proposta sem alterar
Workflow, EventBus, AppState, Document Pipeline, Export Service, Renderer ou PDF
Adapter.

## Arquivos

- `comercial-model.js`: estados, estrutura do registro comercial e historico.
- `comercial-validator.js`: validacoes de documento e transicoes comerciais.
- `comercial-service.js`: fachada para solicitar, aprovar, reprovar e voltar
  para revisao.
- `comercial-controller.js`: controller da tela
  `paginas/aprovacao-comercial.html`.

## Estados

```text
RASCUNHO
EM_REVISAO
APROVADO
REPROVADO
```

## Acoes

- `solicitar()`: envia Documento Comercial valido para revisao.
- `aprovar()`: aprova documento em revisao.
- `reprovar()`: reprova documento em revisao.
- `voltar()`: retorna documento aprovado ou reprovado para revisao.

## AppState

O AppState nao foi alterado nesta sprint. Os dados comerciais ficam em:

```js
configuracoes.comercial = {
    statusComercial,
    dataAprovacao,
    ultimaAcaoComercial,
    dataSolicitacao,
    dataReprovacao,
    motivoReprovacao,
    atualizadoEm,
    historico
};
```

## Eventos

O `ComercialService` dispara eventos pelo `EventBus` apenas quando ele estiver
disponivel:

```text
documento.em_revisao
documento.aprovado
documento.reprovado
```

## Integrações

- `DocumentService` e `DocumentRenderer` validam o Documento Comercial.
- `ExportService` valida a prontidao de exportacao sem gerar arquivo.
- `WorkflowEngine.registrar()` registra historico comercial quando disponivel.
- `AppStateService` guarda estado comercial em memoria.

## Limites da sprint

- Sem Firestore.
- Sem novas regras de orcamento.
- Sem persistencia definitiva.
- Sem conversao em Projeto.
- Sem download, impressao automatica ou PDF adicional.
