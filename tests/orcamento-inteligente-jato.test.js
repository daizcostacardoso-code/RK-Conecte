const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const contexto = { Date, Intl, Math, console };
contexto.globalThis = contexto;
vm.createContext(contexto);

function carregar(arquivo, nomeGlobal) {
    const caminho = path.join(__dirname, "..", arquivo);
    vm.runInContext(`${fs.readFileSync(caminho, "utf8")}\n;globalThis.${nomeGlobal}Teste = ${nomeGlobal};`, contexto);
    return contexto[`${nomeGlobal}Teste`];
}

carregar("js/calculos/calculo-model.js", "CalculoModel");
carregar("js/calculos/calculo-validator.js", "CalculoValidator");
carregar("js/calculos/calculo-engine.js", "CalculoEngine");
const calculoService = carregar("js/calculos/calculo-service.js", "CalculoService");
const documentModel = carregar("js/documentos/document-model.js", "DocumentModel");
const documentBuilder = carregar("js/documentos/document-builder.js", "DocumentBuilder");
carregar("js/documentos/document-renderer.js", "DocumentRenderer");
const htmlRenderer = carregar("js/documentos/document-html-renderer.js", "DocumentHtmlRenderer");

const resultado = calculoService.calcularItens({
    itens: [{
        produtoId: "vidro-jateado",
        descricao: "Vidro jateado",
        larguraCm: 100,
        alturaCm: 100,
        quantidade: 1,
        valorUnitario: 200,
        valorAdicional: 30,
        valorAluminio: 20,
        valorJato: 50,
        percentualEngenharia: 25
    }]
});

assert.equal(resultado.sucesso, true);
assert.equal(resultado.detalhes.subtotal, 200);
assert.equal(resultado.detalhes.totalAdicionais, 30);
assert.equal(resultado.detalhes.totalAluminio, 20);
assert.equal(resultado.detalhes.totalJato, 50);
assert.equal(resultado.detalhes.totalGeral, 300);
assert.equal(resultado.detalhes.itens[0].valorJato, 50);
assert.equal("valorAdicionalEngenharia" in resultado.detalhes.itens[0], false);

const documento = documentBuilder.montarDocumento(documentModel.criar({
    produtos: resultado.detalhes.itens,
    totais: resultado.detalhes.totais
}));
const renderizacao = htmlRenderer.renderizar(documento);
assert.equal(renderizacao.sucesso, true);
const html = renderizacao.html;

assert.match(html, /Ferragens\/Acessórios/);
assert.match(html, />Aluminio</);
assert.match(html, />Jato</);
assert.doesNotMatch(html, /Engenharia/);

console.log("Orcamento inteligente - adicional do jato: OK");
