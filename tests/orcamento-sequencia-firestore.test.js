const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function criarFirestoreFalso() {
    let sequencia = null;
    let fila = Promise.resolve();
    const sequenciaRef = {
        async get() {
            return {
                exists: sequencia !== null,
                data: () => sequencia === null ? undefined : { ultimoNumero: sequencia }
            };
        }
    };
    const orcamentos = [
        { id: "000009", data: () => ({ numero: "000009" }) },
        { id: "orc-antigo", data: () => ({ registro: { numero: "ORC-000012" } }) }
    ];

    return {
        collection(nome) {
            if (nome === "orcamentos_emitidos") {
                return { get: async () => ({ docs: orcamentos }) };
            }
            if (nome === "configuracoes") {
                return { doc: () => sequenciaRef };
            }
            throw new Error(`Colecao inesperada: ${nome}`);
        },
        runTransaction(executar) {
            const operacao = fila.then(async () => {
                let proximaSequencia = sequencia;
                const transaction = {
                    get: async () => ({
                        exists: sequencia !== null,
                        data: () => sequencia === null ? undefined : { ultimoNumero: sequencia }
                    }),
                    set: (_ref, dados) => {
                        proximaSequencia = dados.ultimoNumero;
                    }
                };
                const resultado = await executar(transaction);
                sequencia = proximaSequencia;
                return resultado;
            });
            fila = operacao.then(() => undefined, () => undefined);
            return operacao;
        },
        obterSequencia: () => sequencia
    };
}

(async () => {
    const db = criarFirestoreFalso();
    const contexto = {
        window: {},
        db,
        URL,
        Response,
        Date,
        Math,
        crypto: { randomUUID: () => "teste" },
        console
    };
    contexto.window = contexto;
    vm.createContext(contexto);
    vm.runInContext(fs.readFileSync("js/shared/rk-firestore-store.js", "utf8"), contexto);

    const numeros = await Promise.all([
        contexto.RKFirestoreStore.reservarNumeroOrcamento(),
        contexto.RKFirestoreStore.reservarNumeroOrcamento()
    ]);

    assert.deepEqual([...numeros].sort(), ["000013", "000014"]);
    assert.equal(db.obterSequencia(), 14);
    console.log("Sequencia central de orcamentos: OK");
})().catch(erro => {
    console.error(erro);
    process.exitCode = 1;
});
