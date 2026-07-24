const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function carregarObjeto(caminho, nome, contexto = {}) {
    const sandbox = { console, ...contexto };
    vm.createContext(sandbox);
    vm.runInContext(`${fs.readFileSync(caminho, "utf8")}\nglobalThis.resultado = ${nome};`, sandbox);
    return sandbox.resultado;
}

const adapter = carregarObjeto("js/export/adapters/pdf-adapter.js", "PdfAdapter");
let camposAdapter = [];
adapter.desenharSecao = () => {};
adapter.desenharCampos = (_estado, campos) => { camposAdapter = campos; };
adapter.formatarMoeda = valor => Number(valor);
adapter.desenharResumoFinanceiro({}, {
    produtos: [
        { descricaoAdicional: "Ferragem A", valorAdicional: 50 },
        { descricaoAdicional: "Acessorio B", valorAdicional: 75 }
    ],
    totais: { subtotal: 1000, totalAdicionais: 125, desconto: 100, totalGeral: 1025 }
});

const linhasFerragens = camposAdapter.filter(campo => campo[0] === "Ferragens/Acessórios");
assert.equal(linhasFerragens.length, 1);
assert.equal(linhasFerragens[0][1], 125);
assert.equal(camposAdapter.some(campo => campo[0] === "Ferragem A" || campo[0] === "Acessorio B"), false);
assert.deepEqual(
    Array.from(camposAdapter.slice(-3), campo => `${campo[0]}=${campo[1]}`),
    ["Total sem desconto=1125", "Desconto à vista=100", "Valor à vista=1025"]
);

console.log("PDF com ferragens/acessorios consolidados: OK");
