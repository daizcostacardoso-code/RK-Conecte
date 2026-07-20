const test = require("node:test");
const assert = require("node:assert/strict");

const { ProjetoModel } = require("../js/projetos/projeto-model.js");
global.ProjetoModel = ProjetoModel;
const { FinanceiroOperacionalModel } = require("../js/caixa/financeiro-operacional-model.js");

function projeto() {
    return {
        id: "prj_orc_100",
        numero: "PRJ-100",
        origem: "orcamento_aprovado",
        status: "aprovado",
        cliente: { id: "cli-1", nome: "Cliente Financeiro" },
        orcamento: { id: "orc-100", numero: "000100", total: 1500 },
        financeiro: { valorTotal: 1500 },
        historico: []
    };
}

test("financeiro abre um registro único por projeto e calcula o saldo", () => {
    const primeiro = FinanceiroOperacionalModel.criarOuAtualizar(projeto(), null, { nome: "Admin" });
    assert.equal(primeiro.sucesso, true);
    assert.equal(primeiro.financeiro.id, "fin_prj_orc_100");
    assert.equal(primeiro.financeiro.valorContratadoCentavos, 150000);
    assert.equal(primeiro.financeiro.saldoCentavos, 150000);
    assert.equal(primeiro.financeiro.status, "pendente");

    const repetido = FinanceiroOperacionalModel.criarOuAtualizar(projeto(), primeiro.financeiro, { nome: "Admin" });
    assert.equal(repetido.idempotente, true);
    assert.equal(repetido.financeiro.historico.filter(item => item.tipo === "financeiro_aberto").length, 1);
});

test("recebimentos parciais e totais mantêm centavos e não duplicam", () => {
    const inicial = FinanceiroOperacionalModel.criarOuAtualizar(projeto(), null, { nome: "Admin" }).financeiro;
    const parcial = FinanceiroOperacionalModel.registrarRecebimento(inicial, {
        id: "rec-1", valor: "500,00", data: "2026-07-20", formaPagamento: "PIX"
    }, { nome: "Caio" });
    assert.equal(parcial.sucesso, true);
    assert.equal(parcial.financeiro.status, "parcial");
    assert.equal(parcial.financeiro.valorRecebidoCentavos, 50000);
    assert.equal(parcial.financeiro.saldoCentavos, 100000);

    const repetido = FinanceiroOperacionalModel.registrarRecebimento(parcial.financeiro, {
        id: "rec-1", valor: 500, data: "2026-07-20"
    });
    assert.equal(repetido.idempotente, true);
    assert.equal(repetido.financeiro.recebimentos.length, 1);

    const quitado = FinanceiroOperacionalModel.registrarRecebimento(parcial.financeiro, {
        id: "rec-2", valorCentavos: 100000, data: "2026-07-21", formaPagamento: "Transferência"
    });
    assert.equal(quitado.financeiro.status, "quitado");
    assert.equal(quitado.financeiro.saldoCentavos, 0);
    assert.equal(FinanceiroOperacionalModel.movimentoCaixa(quitado.financeiro, quitado.recebimento).projeto_id, projeto().id);
});

test("financeiro bloqueia valor acima do saldo e preserva recebimentos ao cancelar", () => {
    const inicial = FinanceiroOperacionalModel.criarOuAtualizar(projeto(), null).financeiro;
    const invalido = FinanceiroOperacionalModel.registrarRecebimento(inicial, {
        id: "rec-alto", valor: 1600, data: "2026-07-20"
    });
    assert.equal(invalido.sucesso, false);
    assert.match(invalido.erros.join(" "), /saldo/);

    const parcial = FinanceiroOperacionalModel.registrarRecebimento(inicial, {
        id: "rec-ok", valor: 200, data: "2026-07-20"
    }).financeiro;
    const cancelado = FinanceiroOperacionalModel.cancelar(parcial, { nome: "Admin" }, "Cancelado pelo cliente.");
    assert.equal(cancelado.financeiro.status, "cancelado");
    assert.equal(cancelado.financeiro.recebimentos.length, 1);
    assert.equal(cancelado.financeiro.valorRecebidoCentavos, 20000);
});
