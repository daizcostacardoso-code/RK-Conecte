const test = require("node:test");
const assert = require("node:assert/strict");

const { OrcamentoAprovacaoModel } = require("../js/orcamentos/orcamento-aprovacao-model.js");
const { ProjetoModel } = require("../js/projetos/projeto-model.js");
global.OrcamentoAprovacaoModel = OrcamentoAprovacaoModel;
global.ProjetoModel = ProjetoModel;
const { ProjetoOperacionalModel } = require("../js/projetos/projeto-operacional-model.js");
global.ProjetoOperacionalModel = ProjetoOperacionalModel;
const { ProjetoOperacionalRepository } = require("../js/projetos/projeto-operacional-repository.js");

class FirestoreFalso {
    constructor() { this.colecoes = new Map(); }
    mapa(nome) {
        if (!this.colecoes.has(nome)) this.colecoes.set(nome, new Map());
        return this.colecoes.get(nome);
    }
    snapshot(referencia) {
        const mapa = this.mapa(referencia.colecao);
        const existe = mapa.has(referencia.id);
        return { id: referencia.id, exists: existe, data: () => existe ? structuredClone(mapa.get(referencia.id)) : undefined };
    }
    collection(nome) {
        return { doc: id => ({ colecao: nome, id: String(id) }) };
    }
    async runTransaction(executor) {
        const firestore = this;
        return executor({
            get: async referencia => firestore.snapshot(referencia),
            set(referencia, dados, opcoes = {}) {
                const mapa = firestore.mapa(referencia.colecao);
                const atual = mapa.get(referencia.id) || {};
                mapa.set(referencia.id, structuredClone(opcoes.merge ? { ...atual, ...dados } : dados));
            }
        });
    }
}

function registro(status = "aprovado") {
    return {
        id: "orcamento-91",
        numero: "000091",
        status,
        cliente: { id: "cliente-9", nome: "Cliente 9" },
        total: 3150,
        aprovacao: { status, aprovadoEm: "2026-07-20T09:00:00.000Z", valorAprovadoCentavos: 315000 },
        historicoStatus: [{
            id: "hist-aprovacao",
            statusAnterior: "enviado",
            statusAtual: status,
            acao: status === "aprovado" ? "orcamento_aprovado" : "orcamento_enviado",
            realizadoEm: "2026-07-20T09:00:00.000Z"
        }]
    };
}

test("repositório abre projeto e vincula orçamento na mesma transação", async () => {
    const firestore = new FirestoreFalso();
    firestore.mapa("orcamentos_emitidos").set("orcamento-91", registro());
    global.db = firestore;

    const primeiro = await ProjetoOperacionalRepository.abrirDeOrcamento("orcamento-91", {
        usuario: { uid: "admin-1", nome: "Admin RK" }
    });
    assert.equal(primeiro.sucesso, true);
    assert.equal(primeiro.criado, true);
    assert.equal(firestore.mapa("projetos").size, 1);
    assert.equal(primeiro.orcamento.vinculos.projetoId, "prj_orc_orcamento-91");

    const repetido = await ProjetoOperacionalRepository.abrirDeOrcamento("orcamento-91", {
        usuario: { uid: "admin-1", nome: "Admin RK" }
    });
    assert.equal(repetido.sucesso, true);
    assert.equal(repetido.idempotente, true);
    assert.equal(firestore.mapa("projetos").size, 1);
    assert.equal(repetido.projeto.historico.filter(item => item.tipo === "operacao_aberta").length, 1);
    assert.equal(repetido.orcamento.historicoStatus.filter(item => item.acao === "operacao_aberta").length, 1);

    const salvo = firestore.mapa("orcamentos_emitidos").get("orcamento-91");
    firestore.mapa("orcamentos_emitidos").set("orcamento-91", {
        ...salvo,
        status: "cancelado",
        aprovacao: { ...salvo.aprovacao, status: "cancelado" },
        operacao: { ...salvo.operacao, status: "cancelada" }
    });
    const cancelado = await ProjetoOperacionalRepository.cancelarDeOrcamento("orcamento-91", {
        usuario: { uid: "admin-1", nome: "Admin RK" },
        observacao: "Cliente cancelou o serviço."
    });
    assert.equal(cancelado.sucesso, true);
    assert.equal(cancelado.projeto.status, "cancelado");
    assert.equal(cancelado.projeto.ativo, false);
    assert.equal(cancelado.projeto.historico.filter(item => item.tipo === "operacao_cancelada").length, 1);

    const canceladoNovamente = await ProjetoOperacionalRepository.cancelarDeOrcamento("orcamento-91", {
        usuario: { uid: "admin-1", nome: "Admin RK" }
    });
    assert.equal(canceladoNovamente.idempotente, true);
    assert.equal(canceladoNovamente.projeto.historico.filter(item => item.tipo === "operacao_cancelada").length, 1);
});

test("repositório bloqueia abertura antes da aprovação", async () => {
    const firestore = new FirestoreFalso();
    firestore.mapa("orcamentos_emitidos").set("orcamento-91", registro("enviado"));
    global.db = firestore;

    const resultado = await ProjetoOperacionalRepository.abrirDeOrcamento("orcamento-91", {
        usuario: { uid: "admin-1", nome: "Admin RK" }
    });
    assert.equal(resultado.sucesso, false);
    assert.match(resultado.erros[0], /aprovados/);
    assert.equal(firestore.mapa("projetos").size, 0);
});
