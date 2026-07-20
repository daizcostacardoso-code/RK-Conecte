const test = require("node:test");
const assert = require("node:assert/strict");

const { ProjetoModel } = require("../js/projetos/projeto-model.js");
global.ProjetoModel = ProjetoModel;
const { MedicaoOperacionalModel } = require("../js/medicoes/medicao-operacional-model.js");

function projeto() {
    return ProjetoModel.normalizar({
        id: "projeto-18",
        numero: "PRJ-000018",
        status: "aprovado",
        cliente: { id: "cliente-18", nome: "Cliente 18", telefone: "73999990000" },
        obra: { endereco: "Rua da Obra, 18" },
        orcamento: { id: "orcamento-18", numero: "000018", status: "aprovado" },
        operacional: { status: "aguardando_medicao" },
        historico: []
    });
}

function estado() {
    return {
        projetoId: "projeto-18",
        clienteNome: "Cliente 18",
        clienteTelefone: "73999990000",
        obraEndereco: "Rua da Obra, 18",
        responsavel: "Técnico RK",
        dataMedicao: "2026-07-20",
        medidas: [{ id: "m1", quantidade: 1, tipo: "Box", descricao: "Box frontal", altura: 190, largura: 140, observacao: "" }]
    };
}

test("medição operacional usa um documento determinístico e conclusão idempotente", () => {
    const primeiro = MedicaoOperacionalModel.criarOuAtualizar(estado(), projeto(), null, { nome: "Caio" }, { concluir: false });
    assert.equal(primeiro.sucesso, true);
    assert.equal(primeiro.medicao.id, "med_projeto-18");
    assert.equal(primeiro.medicao.status, "rascunho");
    assert.equal(primeiro.medicao.revisao, 1);

    const concluida = MedicaoOperacionalModel.criarOuAtualizar(estado(), projeto(), primeiro.medicao, { nome: "Caio" }, { concluir: true });
    assert.equal(concluida.medicao.status, "concluida");
    assert.equal(concluida.medicao.revisao, 2);
    assert.equal(concluida.medicao.historico.filter(item => item.tipo === "medicao_concluida").length, 1);

    const repetida = MedicaoOperacionalModel.criarOuAtualizar(estado(), projeto(), concluida.medicao, { nome: "Caio" }, { concluir: true });
    assert.equal(repetida.idempotente, true);
    assert.equal(repetida.medicao.revisao, 2);
    assert.equal(repetida.medicao.historico.filter(item => item.tipo === "medicao_concluida").length, 1);
});

test("medição atualiza o projeto sem duplicar eventos operacionais", () => {
    const medicao = MedicaoOperacionalModel.criarOuAtualizar(estado(), projeto(), null, { nome: "Caio" }, { concluir: true }).medicao;
    const atualizado = MedicaoOperacionalModel.atualizarProjeto(projeto(), medicao, { nome: "Caio" });
    assert.equal(atualizado.operacional.medicaoId, medicao.id);
    assert.equal(atualizado.operacional.status, "medicao_concluida");
    assert.equal(atualizado.etapaAtual, "medicao");
    assert.equal(atualizado.historico.filter(item => item.tipo === "medicao_concluida").length, 1);

    const repetido = MedicaoOperacionalModel.atualizarProjeto(atualizado, medicao, { nome: "Caio" });
    assert.equal(repetido.historico.filter(item => item.tipo === "medicao_concluida").length, 1);
});
