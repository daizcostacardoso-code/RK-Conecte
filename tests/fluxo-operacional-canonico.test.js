const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const raiz = join(__dirname, "..");
const ler = caminho => readFileSync(join(raiz, caminho), "utf8");

test("aprovação comercial garante a abertura operacional", () => {
    const service = ler("js/orcamentos/orcamento-aprovacao-service.js");
    assert.match(service, /garantirAbertura\(resultado\.registro\.id/);
    assert.match(service, /operacaoPendente/);
    assert.match(service, /async abrirOperacao/);
    assert.match(service, /cancelarDeOrcamento\(resultado\.registro\.id/);
});

test("arquivo comercial carrega o contrato operacional na ordem segura", () => {
    const html = ler("paginas/arquivos.html");
    const ordem = [
        "orcamento-aprovacao-model.js",
        "projeto-model.js",
        "projeto-operacional-model.js",
        "projeto-operacional-repository.js",
        "projeto-operacional-service.js",
        "orcamento-aprovacao-service.js",
        "document-archive-controller.js"
    ].map(arquivo => html.indexOf(arquivo));
    assert.ok(ordem.every(indice => indice >= 0));
    assert.deepEqual(ordem, [...ordem].sort((a, b) => a - b));

    const controller = ler("js/documentos/document-archive-controller.js");
    assert.match(controller, /Abrir operação/);
    assert.match(controller, /medicao-obra\.html\?projetoId=/);
    assert.match(controller, /ProjetoOperacionalService|abrirOperacao/);
});

test("projetos operacionais possuem tela própria e medição contextual", () => {
    const projetos = ler("paginas/projetos.html");
    const medicao = ler("js/medicoes/medicao-controller.js");
    const modeloMedicao = ler("js/medicoes/medicao-model.js");
    assert.doesNotMatch(projetos, /http-equiv="refresh"/);
    assert.match(projetos, /id="formProjeto"/);
    assert.match(projetos, /id="projetosTabelaCorpo"/);
    assert.match(medicao, /collection\("projetos"\)/);
    assert.match(medicao, /parametros\.get\("projetoId"\)/);
    assert.match(modeloMedicao, /chaveRascunhoBase/);
    assert.match(modeloMedicao, /contexto\.projetoId/);
});

test("projetos preservam histórico e não aceitam exclusão definitiva", () => {
    const regras = ler("firestore.rules");
    const bloco = regras.match(/match \/projetos\/\{documento\} \{([\s\S]*?)\n\s*\}/)?.[1] || "";
    assert.match(bloco, /allow create: if autorizado\(\) && projetoOperacionalValido\(\)/);
    assert.match(bloco, /allow update: if autorizado\(\) && \(projetoOperacionalValido\(\) \|\| vinculoOperacionalExistentePreservado\(\)\)/);
    assert.match(bloco, /allow delete: if false/);
    assert.match(regras, /get\(\/databases\/\$\(database\)\/documents\/orcamentos_emitidos\/\$\(projeto\.orcamento\.id\)\)\.data\.status == 'aprovado'/);
});
