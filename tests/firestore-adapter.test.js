const test = require("node:test");
const assert = require("node:assert/strict");
const { FirestoreAdapter, criarFirestoreAdapter } = require("../js/storage/firestore-adapter.js");

function criarBancoFalso() {
    const colecoes = new Map();
    const obterMapa = nome => {
        if (!colecoes.has(nome)) colecoes.set(nome, new Map());
        return colecoes.get(nome);
    };
    const snapshot = (id, valor) => ({
        id,
        exists: valor !== undefined,
        data: () => valor === undefined ? undefined : JSON.parse(JSON.stringify(valor))
    });

    return {
        colecoes,
        collection(nome) {
            const registros = obterMapa(nome);
            return {
                doc(id) {
                    return {
                        async set(dados, opcoes = {}) {
                            const atual = registros.get(id) || {};
                            registros.set(id, JSON.parse(JSON.stringify(opcoes.merge ? { ...atual, ...dados } : dados)));
                        },
                        async get() {
                            return snapshot(id, registros.get(id));
                        },
                        async delete() {
                            registros.delete(id);
                        }
                    };
                },
                async get() {
                    return {
                        docs: [...registros.entries()].map(([id, dados]) => snapshot(id, dados))
                    };
                }
            };
        }
    };
}

test("FirestoreAdapter mantém CRUD de projetos e serviços no Firestore", async () => {
    const banco = criarBancoFalso();
    global.RKFirebase = { db: banco };
    const adapter = criarFirestoreAdapter();

    const salvo = await adapter.save("projetos", "prj_1", { nome: "Obra real", status: "rascunho" });
    assert.deepEqual(salvo, { id: "prj_1", nome: "Obra real", status: "rascunho" });
    assert.deepEqual(await adapter.get("projetos", "prj_1"), salvo);

    const atualizado = await adapter.update("projetos", "prj_1", { status: "aprovado" });
    assert.equal(atualizado.status, "aprovado");
    assert.equal((await adapter.list("projetos")).length, 1);

    assert.equal(await adapter.delete("projetos", "prj_1"), true);
    assert.equal(await adapter.get("projetos", "prj_1"), null);
    assert.equal(await adapter.delete("projetos", "prj_1"), false);

    delete global.RKFirebase;
});

test("FirestoreAdapter bloqueia coleções não mapeadas e IDs inválidos", async () => {
    global.RKFirebase = { db: criarBancoFalso() };
    await assert.rejects(() => FirestoreAdapter.list("usuarios_autorizados"), /Colecao nao autorizada/);
    await assert.rejects(() => FirestoreAdapter.get("projetos", "caminho/invalido"), /Id invalido/);
    delete global.RKFirebase;
});
