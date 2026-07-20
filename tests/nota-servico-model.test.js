const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const dados = new Map();
const contexto = {
    Date,
    Intl,
    Math,
    localStorage: {
        getItem(chave) { return dados.has(chave) ? dados.get(chave) : null; },
        setItem(chave, valor) { dados.set(chave, String(valor)); },
        removeItem(chave) { dados.delete(chave); }
    }
};
contexto.globalThis = contexto;
vm.createContext(contexto);

const arquivo = path.join(__dirname, "..", "js", "notas-servico", "nota-servico-model.js");
vm.runInContext(`${fs.readFileSync(arquivo, "utf8")}\n;globalThis.NotaServicoModelTeste = NotaServicoModel;`, contexto);
const model = contexto.NotaServicoModelTeste;

const numeroAtual = model.proximoNumero();
const numeroRenovado = model.prepararNumeroNovaNota(numeroAtual);
assert.notEqual(numeroRenovado, numeroAtual);
assert.equal(model.estadoVazio().numeroNota, numeroRenovado);

const sequenciaAntes = dados.get(model.chaveSequencia);
assert.equal(model.prepararNumeroNovaNota(numeroAtual), numeroRenovado);
assert.equal(dados.get(model.chaveSequencia), sequenciaAntes);

console.log("Sequencia da nota: OK");
