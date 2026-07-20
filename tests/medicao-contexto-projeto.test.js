const test = require("node:test");
const assert = require("node:assert/strict");

const memoria = new Map();
global.localStorage = {
    getItem: chave => memoria.has(chave) ? memoria.get(chave) : null,
    setItem: (chave, valor) => memoria.set(chave, String(valor)),
    removeItem: chave => memoria.delete(chave)
};
const { MedicaoModel } = require("../js/medicoes/medicao-model.js");

test("rascunho de medição fica isolado por projeto operacional", () => {
    memoria.clear();
    MedicaoModel.configurarContexto({ projetoId: "projeto-a", orcamentoId: "orcamento-a" });
    const projetoA = MedicaoModel.estadoVazio();
    projetoA.clienteNome = "Cliente A";
    MedicaoModel.salvar(projetoA);

    MedicaoModel.configurarContexto({ projetoId: "projeto-b", orcamentoId: "orcamento-b" });
    const projetoB = MedicaoModel.carregar();
    assert.equal(projetoB.clienteNome, "");
    assert.equal(projetoB.projetoId, "projeto-b");

    projetoB.clienteNome = "Cliente B";
    MedicaoModel.salvar(projetoB);
    MedicaoModel.configurarContexto({ projetoId: "projeto-a", orcamentoId: "orcamento-a" });
    assert.equal(MedicaoModel.carregar().clienteNome, "Cliente A");
});

test("medição avulsa migra o rascunho legado sem perder dados", () => {
    memoria.clear();
    memoria.set("rk_medicao_obra_rascunho", JSON.stringify({
        clienteNome: "Cliente Legado",
        medidas: []
    }));
    MedicaoModel.configurarContexto({});
    const carregado = MedicaoModel.carregar();
    assert.equal(carregado.clienteNome, "Cliente Legado");
    assert.ok(memoria.has("rk_medicao_obra_rascunho:avulsa"));
});
