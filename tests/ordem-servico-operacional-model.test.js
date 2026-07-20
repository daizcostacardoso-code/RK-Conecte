const test = require("node:test");
const assert = require("node:assert/strict");

const memoria = new Map();
global.localStorage = {
    getItem: chave => memoria.has(chave) ? memoria.get(chave) : null,
    setItem: (chave, valor) => memoria.set(chave, String(valor)),
    removeItem: chave => memoria.delete(chave)
};
const { ProjetoModel } = require("../js/projetos/projeto-model.js");
global.ProjetoModel = ProjetoModel;
const { NotaServicoModel } = require("../js/notas-servico/nota-servico-model.js");
global.NotaServicoModel = NotaServicoModel;
const { OrdemServicoOperacionalModel } = require("../js/notas-servico/ordem-servico-operacional-model.js");

function projeto() {
    return ProjetoModel.normalizar({
        id: "projeto-21",
        numero: "PRJ-000021",
        status: "aprovado",
        cliente: { id: "cliente-21", nome: "Cliente 21" },
        obra: { endereco: "Rua da Obra, 21" },
        orcamento: { id: "orcamento-21", numero: "000021", status: "aprovado" },
        operacional: { medicaoId: "med_projeto-21", status: "medicao_concluida" },
        historico: []
    });
}

function medicao() {
    return {
        id: "med_projeto-21",
        projetoId: "projeto-21",
        orcamentoId: "orcamento-21",
        status: "concluida",
        revisao: 2,
        clienteNome: "Cliente 21",
        obraEndereco: "Rua da Obra, 21",
        medidas: [{ id: "m1", quantidade: 2, tipo: "Janela", descricao: "Janela frontal", altura: 120, largura: 100 }]
    };
}

test("ordem de serviço nasce da medição concluída sem duplicidade", () => {
    const contexto = OrdemServicoOperacionalModel.estadoDoContexto(projeto(), medicao());
    assert.equal(contexto.id, "os_projeto-21");
    assert.equal(contexto.medicaoId, "med_projeto-21");
    assert.equal(contexto.servicos.length, 1);

    const primeira = OrdemServicoOperacionalModel.criarOuAtualizar(contexto, projeto(), medicao(), null, { nome: "Caio" }, { status: "em_producao" });
    assert.equal(primeira.sucesso, true);
    assert.equal(primeira.ordem.status, "em_producao");
    assert.equal(primeira.ordem.historicoOperacional.filter(item => item.tipo === "producao_iniciada").length, 1);

    const repetida = OrdemServicoOperacionalModel.criarOuAtualizar(primeira.ordem, projeto(), medicao(), primeira.ordem, { nome: "Caio" }, { status: "em_producao" });
    assert.equal(repetida.idempotente, true);
    assert.equal(repetida.ordem.historicoOperacional.filter(item => item.tipo === "producao_iniciada").length, 1);
});

test("ordem conduz produção, instalação e conclusão do projeto", () => {
    const base = OrdemServicoOperacionalModel.estadoDoContexto(projeto(), medicao());
    const producao = OrdemServicoOperacionalModel.criarOuAtualizar(base, projeto(), medicao(), null, { nome: "Caio" }, { status: "em_producao" }).ordem;
    const projetoProducao = OrdemServicoOperacionalModel.atualizarProjeto(projeto(), producao, { nome: "Caio" });
    assert.equal(projetoProducao.status, "em_producao");
    assert.equal(projetoProducao.operacional.notaServicoId, producao.id);

    const instalacao = OrdemServicoOperacionalModel.criarOuAtualizar({ ...producao, status: "em_instalacao" }, projetoProducao, medicao(), producao, { nome: "Caio" }, { status: "em_instalacao" }).ordem;
    const projetoInstalacao = OrdemServicoOperacionalModel.atualizarProjeto(projetoProducao, instalacao, { nome: "Caio" });
    assert.equal(projetoInstalacao.status, "em_instalacao");

    const concluida = OrdemServicoOperacionalModel.criarOuAtualizar({ ...instalacao, status: "concluido" }, projetoInstalacao, medicao(), instalacao, { nome: "Caio" }, { status: "concluido" }).ordem;
    const projetoFinal = OrdemServicoOperacionalModel.atualizarProjeto(projetoInstalacao, concluida, { nome: "Caio" });
    assert.equal(projetoFinal.status, "finalizado");
    assert.equal(projetoFinal.operacional.status, "concluido");
});

test("ordem bloqueia saltos e reabertura depois de um estado terminal", () => {
    const base = OrdemServicoOperacionalModel.estadoDoContexto(projeto(), medicao());
    const producao = OrdemServicoOperacionalModel.criarOuAtualizar(
        base,
        projeto(),
        medicao(),
        null,
        { nome: "Caio" },
        { status: "em_producao" }
    ).ordem;

    const salto = OrdemServicoOperacionalModel.criarOuAtualizar(
        { ...producao, status: "concluido" },
        projeto(),
        medicao(),
        producao,
        { nome: "Caio" },
        { status: "concluido" }
    );
    assert.equal(salto.sucesso, false);
    assert.match(salto.erros.join(" "), /não é permitido/i);

    const cancelada = OrdemServicoOperacionalModel.criarOuAtualizar(
        { ...producao, status: "cancelado" },
        projeto(),
        medicao(),
        producao,
        { nome: "Caio" },
        { status: "cancelado" }
    ).ordem;
    const reabertura = OrdemServicoOperacionalModel.criarOuAtualizar(
        { ...cancelada, status: "em_producao" },
        projeto(),
        medicao(),
        cancelada,
        { nome: "Caio" },
        { status: "em_producao" }
    );
    assert.equal(reabertura.sucesso, false);
});
