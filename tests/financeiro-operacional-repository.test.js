const test = require("node:test");
const assert = require("node:assert/strict");

const { ProjetoModel } = require("../js/projetos/projeto-model.js");
global.ProjetoModel = ProjetoModel;
const { FinanceiroOperacionalModel } = require("../js/caixa/financeiro-operacional-model.js");
global.FinanceiroOperacionalModel = FinanceiroOperacionalModel;
const { FinanceiroOperacionalRepository } = require("../js/caixa/financeiro-operacional-repository.js");

class FirestoreFalso {
    constructor() { this.colecoes = new Map(); }
    mapa(nome) { if (!this.colecoes.has(nome)) this.colecoes.set(nome, new Map()); return this.colecoes.get(nome); }
    collection(nome) {
        const banco = this;
        return {
            doc: id => ({ colecao: nome, id: String(id) }),
            async get() {
                const docs = [...banco.mapa(nome)].map(([id, dados]) => ({ id, data: () => structuredClone(dados) }));
                return { docs };
            }
        };
    }
    snapshot(ref) {
        const mapa = this.mapa(ref.colecao);
        const exists = mapa.has(ref.id);
        return { id: ref.id, exists, data: () => exists ? structuredClone(mapa.get(ref.id)) : undefined };
    }
    async runTransaction(executor) {
        return executor({
            get: async ref => this.snapshot(ref),
            set: (ref, dados, opcoes = {}) => {
                const mapa = this.mapa(ref.colecao);
                mapa.set(ref.id, structuredClone(opcoes.merge ? { ...(mapa.get(ref.id) || {}), ...dados } : dados));
            }
        });
    }
}

test("repositório registra recebimento uma vez no financeiro, caixa e projeto", async () => {
    const banco = new FirestoreFalso();
    banco.mapa("projetos").set("projeto-1", {
        id: "projeto-1",
        numero: "PRJ-001",
        origem: "orcamento_aprovado",
        status: "em_producao",
        cliente: { id: "cliente-1", nome: "Cliente 1" },
        orcamento: { id: "orcamento-1", numero: "000001", total: 1200 },
        financeiro: { valorTotal: 1200 },
        historico: []
    });
    global.db = banco;

    const primeiro = await FinanceiroOperacionalRepository.registrarRecebimento("projeto-1", {
        id: "rec-projeto-1-1", valor: 300, data: "2026-07-20", formaPagamento: "PIX"
    }, { uid: "admin-1", nomeUsuario: "Admin RK" });
    assert.equal(primeiro.sucesso, true);
    assert.equal(primeiro.financeiro.status, "parcial");
    assert.equal(banco.mapa("financeiro_operacional").size, 1);
    assert.equal(banco.mapa("caixa_empresa").size, 1);
    assert.equal(banco.mapa("projetos").get("projeto-1").financeiro.valorRecebido, 300);

    const repetido = await FinanceiroOperacionalRepository.registrarRecebimento("projeto-1", {
        id: "rec-projeto-1-1", valor: 300, data: "2026-07-20", formaPagamento: "PIX"
    }, { uid: "admin-1", nomeUsuario: "Admin RK" });
    assert.equal(repetido.idempotente, true);
    assert.equal(banco.mapa("financeiro_operacional").get("fin_projeto-1").recebimentos.length, 1);
    assert.equal(banco.mapa("caixa_empresa").size, 1);
});
