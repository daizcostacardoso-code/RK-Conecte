const test = require("node:test");
const assert = require("node:assert/strict");

const { OrcamentoAprovacaoModel } = require("../js/orcamentos/orcamento-aprovacao-model.js");
const { ProjetoModel } = require("../js/projetos/projeto-model.js");
global.OrcamentoAprovacaoModel = OrcamentoAprovacaoModel;
global.ProjetoModel = ProjetoModel;
const { ProjetoOperacionalModel } = require("../js/projetos/projeto-operacional-model.js");

function orcamentoAprovado(sobrescritas = {}) {
    return OrcamentoAprovacaoModel.normalizarRegistro({
        id: "orcamento-77",
        numero: "000077",
        status: "aprovado",
        cliente: {
            id: "cliente-7",
            nome: "Cliente Operacional",
            telefone: "71999999999",
            endereco: "Rua da Obra, 10"
        },
        projeto: { cidade: "Porto Seguro", observacoes: "Conferir acesso lateral." },
        itens: [{ nome: "Box frontal" }, { nome: "Espelho" }],
        total: 2400,
        aprovacao: {
            status: "aprovado",
            aprovadoEm: "2026-07-20T08:00:00.000Z",
            aprovadoPor: { uid: "admin-1", nome: "Admin RK" },
            valorAprovadoCentavos: 240000
        },
        ...sobrescritas
    });
}

test("modelo operacional cria projeto determinístico a partir do orçamento aprovado", () => {
    const orcamento = orcamentoAprovado();
    const resultado = ProjetoOperacionalModel.criarOuAtualizar(orcamento, null, {
        uid: "admin-1",
        nome: "Admin RK"
    });

    assert.equal(resultado.criado, true);
    assert.equal(resultado.projeto.id, "prj_orc_orcamento-77");
    assert.equal(resultado.projeto.origem, "orcamento_aprovado");
    assert.equal(resultado.projeto.status, "aprovado");
    assert.equal(resultado.projeto.operacional.status, "aguardando_medicao");
    assert.equal(resultado.projeto.orcamento.id, "orcamento-77");
    assert.equal(resultado.projeto.financeiro.valorTotal, 2400);
    assert.equal(resultado.projeto.cliente.id, "cliente-7");
    assert.equal(resultado.projeto.historico.filter(item => item.tipo === "operacao_aberta").length, 1);
});

test("modelo operacional vincula o orçamento uma única vez", () => {
    const orcamento = orcamentoAprovado();
    const primeiraAbertura = ProjetoOperacionalModel.criarOuAtualizar(orcamento, null, { uid: "admin-1", nome: "Admin RK" });
    const primeiroVinculo = ProjetoOperacionalModel.vincularOrcamento(orcamento, primeiraAbertura.projeto, { uid: "admin-1", nome: "Admin RK" });

    assert.equal(primeiroVinculo.alterado, true);
    assert.equal(primeiroVinculo.orcamento.schemaVersion, 4);
    assert.equal(primeiroVinculo.orcamento.vinculos.projetoId, primeiraAbertura.projeto.id);
    assert.equal(primeiroVinculo.orcamento.operacao.status, "aberta");
    assert.equal(primeiroVinculo.orcamento.historicoStatus.filter(item => item.acao === "operacao_aberta").length, 1);

    const repetido = ProjetoOperacionalModel.vincularOrcamento(primeiroVinculo.orcamento, primeiraAbertura.projeto, { uid: "admin-1", nome: "Admin RK" });
    const projetoRepetido = ProjetoOperacionalModel.criarOuAtualizar(primeiroVinculo.orcamento, primeiraAbertura.projeto, { uid: "admin-1", nome: "Admin RK" });
    assert.equal(repetido.alterado, false);
    assert.equal(projetoRepetido.alterado, false);
    assert.equal(projetoRepetido.projeto.historico.filter(item => item.tipo === "operacao_aberta").length, 1);
});

test("reabertura preserva projeto que já avançou para produção", () => {
    const orcamento = orcamentoAprovado();
    const inicial = ProjetoOperacionalModel.criarOuAtualizar(orcamento, null, { nome: "Admin RK" }).projeto;
    const emProducao = ProjetoModel.atualizar(inicial, {
        status: "em_producao",
        operacional: { status: "em_producao" }
    }, "Produção");
    const repetido = ProjetoOperacionalModel.criarOuAtualizar(orcamento, emProducao, { nome: "Admin RK" });

    assert.equal(repetido.projeto.status, "em_producao");
    assert.equal(repetido.projeto.operacional.status, "em_producao");
    assert.equal(repetido.alterado, false);
});
