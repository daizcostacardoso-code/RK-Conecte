const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const raiz = join(__dirname, "..");
const ler = caminho => readFileSync(join(raiz, caminho), "utf8");

test("rascunhos não gravam mais no documento global orcamentos/atual", () => {
    const arquivos = [
        "js/orcamentos/orcamento-storage.js",
        "js/orcamentos/orcamento-inteligente-controller.js"
    ];

    arquivos.forEach(caminho => {
        const codigo = ler(caminho);
        assert.doesNotMatch(codigo, /collection\(["']orcamentos["']\)/);
        assert.doesNotMatch(codigo, /doc\(["']atual["']\)/);
    });
});

test("telas comerciais carregam o modelo canônico antes do repositório de documentos", () => {
    const paginas = [
        "paginas/orcamento-inteligente.html",
        "paginas/arquivos.html",
        "paginas/compartilhar-documento.html",
        "paginas/dashboard-comercial.html",
        "paginas/clientes.html"
    ];

    paginas.forEach(caminho => {
        const html = ler(caminho);
        const modelo = html.indexOf("orcamento-aprovacao-model.js");
        const repositorio = html.indexOf("document-pdf-repository.js");
        assert.ok(modelo >= 0, `${caminho} sem modelo canônico`);
        assert.ok(repositorio > modelo, `${caminho} carrega o repositório antes do modelo`);
    });

    const novo = ler("paginas/orcamento-inteligente.html");
    const ordem = [
        "orcamento-aprovacao-model.js",
        "orcamento-aprovacao-validator.js",
        "orcamento-aprovacao-repository.js",
        "orcamento-aprovacao-service.js",
        "document-pdf-repository.js"
    ].map(script => novo.indexOf(script));
    assert.deepEqual(ordem, [...ordem].sort((a, b) => a - b));
    assert.ok(ordem.every(indice => indice >= 0));
});

test("arquivo comercial cancela sem excluir o histórico do orçamento", () => {
    const repositorio = ler("js/documentos/document-pdf-repository.js");
    const controlador = ler("js/documentos/document-archive-controller.js");
    const store = ler("js/shared/rk-firestore-store.js");

    assert.match(repositorio, /OrcamentoAprovacaoService\.cancelar/);
    assert.doesNotMatch(repositorio, /lote\.delete|\.delete\(doc\.ref\)/);
    assert.match(controlador, /histórico preservado|histórico comercial/);
    assert.match(store, /orcamentos: \{ colecao: "orcamentos_emitidos", id: "orcamento_id", excluir: "cancelar" \}/);
});

test("regras deixam a coleção legada somente para leitura", () => {
    const regras = ler("firestore.rules");
    const blocoLegado = regras.match(/match \/orcamentos\/\{documento\} \{([\s\S]*?)\n\s*\}/)?.[1] || "";
    const blocoCanonico = regras.match(/match \/orcamentos_emitidos\/\{documento\} \{([\s\S]*?)\n\s*\}/)?.[1] || "";

    assert.match(blocoLegado, /allow read: if autorizado\(\)/);
    assert.match(blocoLegado, /allow write: if false/);
    assert.match(blocoCanonico, /allow read, create, update: if autorizado\(\)/);
    assert.match(blocoCanonico, /allow delete: if false/);
});
