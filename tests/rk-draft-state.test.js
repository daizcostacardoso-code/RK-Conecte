const test = require("node:test");
const assert = require("node:assert/strict");
const { RKDraftState } = require("../js/shared/rk-draft-state.js");

function criarStorage(inicial = {}) {
    const dados = new Map(Object.entries(inicial));
    return {
        getItem: chave => dados.has(chave) ? dados.get(chave) : null,
        setItem: (chave, valor) => dados.set(chave, String(valor)),
        removeItem: chave => dados.delete(chave)
    };
}

test("rascunho remove o estado demonstrativo legado e não cria dados fictícios", () => {
    global.localStorage = criarStorage({
        rk_conecte_e2e_demo_state: JSON.stringify({ demo: true, clientes: [{ nome: "Demo" }] })
    });

    RKDraftState.iniciar();

    assert.equal(global.localStorage.getItem("rk_conecte_e2e_demo_state"), null);
    assert.equal(RKDraftState.carregar(), null);
    delete global.localStorage;
});

test("rascunho persiste somente campos do fluxo em andamento", () => {
    global.localStorage = criarStorage();
    RKDraftState.salvarFluxo({
        clienteSelecionado: { id: "cli_1", nome: "Cliente real" },
        documentoAtual: { id: "doc_1" },
        clientes: [{ id: "nao_persistir" }],
        demo: true,
        senha: "nao-persistir"
    });

    assert.deepEqual(RKDraftState.carregar(), {
        clienteSelecionado: { id: "cli_1", nome: "Cliente real" },
        documentoAtual: { id: "doc_1" }
    });
    delete global.localStorage;
});
