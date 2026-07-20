const assert = require("node:assert/strict");

class Documento {
    constructor(colecao, id, dados) {
        this.id = id;
        this._colecao = colecao;
        this._dados = dados;
        this.ref = { colecao, id };
    }

    data() { return structuredClone(this._dados); }
}

class FirestoreFalso {
    constructor() { this.colecoes = new Map(); }

    mapa(nome) {
        if (!this.colecoes.has(nome)) this.colecoes.set(nome, new Map());
        return this.colecoes.get(nome);
    }

    collection(nome) {
        const firestore = this;
        return {
            async get() {
                return { docs: [...firestore.mapa(nome)].map(([id, dados]) => new Documento(nome, id, dados)) };
            },
            doc(id) {
                return {
                    async set(dados, opcoes = {}) {
                        const atual = firestore.mapa(nome).get(id) || {};
                        firestore.mapa(nome).set(id, structuredClone(opcoes.merge ? { ...atual, ...dados } : dados));
                    }
                };
            }
        };
    }

    batch() {
        const firestore = this;
        const operacoes = [];
        return {
            set(ref, dados, opcoes = {}) { operacoes.push({ tipo: "set", ref, dados, opcoes }); },
            delete(ref) { operacoes.push({ tipo: "delete", ref }); },
            async commit() {
                operacoes.forEach(operacao => {
                    const mapa = firestore.mapa(operacao.ref.colecao);
                    if (operacao.tipo === "delete") return mapa.delete(operacao.ref.id);
                    const atual = mapa.get(operacao.ref.id) || {};
                    mapa.set(operacao.ref.id, structuredClone(operacao.opcoes.merge ? { ...atual, ...operacao.dados } : operacao.dados));
                });
            }
        };
    }
}

async function executar() {
    global.window = global;
    global.db = new FirestoreFalso();
    require("../js/shared/rk-firestore-store.js");

    let resposta = await RKFirestoreStore.fetch("/caixa", {
        method: "POST",
        body: JSON.stringify({ descricao: "Venda", tipo: "entrada", valor: 150, data_movimento: "2026-07-14" })
    });
    assert.equal(resposta.status, 201);
    const criado = await resposta.json();
    assert.ok(criado.caixa_id.startsWith("rk_"));

    resposta = await RKFirestoreStore.fetch(`/caixa/${criado.caixa_id}`, {
        method: "PUT",
        body: JSON.stringify({ valor: 175 })
    });
    assert.equal(resposta.ok, true);

    resposta = await RKFirestoreStore.fetch(`/caixa/${criado.caixa_id}`);
    assert.equal((await resposta.json()).dados.valor, 175);

    resposta = await RKFirestoreStore.fetch(`/caixa/${criado.caixa_id}`, { method: "DELETE" });
    assert.equal(resposta.ok, true);
    resposta = await RKFirestoreStore.fetch(`/caixa/${criado.caixa_id}`);
    assert.equal((await resposta.json()).dados.status, "cancelado");

    resposta = await RKFirestoreStore.fetch("/orcamentos", {
        method: "POST",
        body: JSON.stringify({ registro: { numero: "ORC-TESTE", dataEmissao: "2026-07-14", clienteNome: "Cliente Teste" } })
    });
    assert.equal(resposta.status, 201);
    resposta = await RKFirestoreStore.fetch("/orcamentos/ORC-TESTE/definitivo", { method: "DELETE" });
    assert.equal(resposta.ok, true);
    resposta = await RKFirestoreStore.fetch("/orcamentos");
    const orcamentos = (await resposta.json()).dados;
    assert.equal(orcamentos.length, 1);
    assert.equal(orcamentos[0].status, "cancelado");
    assert.equal(orcamentos[0].historicoStatus.at(-1).acao, "orcamento_cancelado");

    const nota = { id: "nota-teste", numeroNota: "NS-TESTE", clienteNome: "Cliente Nota", servicos: [] };
    resposta = await RKFirestoreStore.fetch("/notas", { method: "POST", body: JSON.stringify(nota) });
    assert.equal(resposta.status, 201);
    assert.equal((await resposta.json()).nota_id, "nota-teste");

    resposta = await RKFirestoreStore.fetch("/notas", { method: "POST", body: JSON.stringify({ ...nota, clienteNome: "Cliente Atualizado" }) });
    assert.equal(resposta.status, 201);
    resposta = await RKFirestoreStore.fetch("/notas");
    let notas = (await resposta.json()).dados;
    assert.equal(notas.length, 1);
    assert.equal(notas[0].clienteNome, "Cliente Atualizado");

    resposta = await RKFirestoreStore.fetch("/notas/nota-teste", { method: "DELETE" });
    assert.equal(resposta.ok, true);
    resposta = await RKFirestoreStore.fetch("/notas");
    notas = (await resposta.json()).dados;
    assert.equal(notas.length, 0);

    console.log("Firestore CRUD: OK");
}

executar().catch(erro => {
    console.error(erro);
    process.exitCode = 1;
});
