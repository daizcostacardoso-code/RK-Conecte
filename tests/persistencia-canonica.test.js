const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const raiz = join(__dirname, "..");
const ler = caminho => readFileSync(join(raiz, caminho), "utf8");

test("páginas operacionais carregam rascunho sem estado E2E demonstrativo", () => {
    const paginas = [
        "paginas/clientes.html",
        "paginas/produtos.html",
        "paginas/orcamento-inteligente.html",
        "paginas/compartilhar-documento.html"
    ];

    paginas.forEach(caminho => {
        const html = ler(caminho);
        assert.match(html, /rk-draft-state\.js/);
        assert.doesNotMatch(html, /rk-e2e-demo-state\.js/);
    });
    assert.equal(existsSync(join(raiz, "js/shared/rk-e2e-demo-state.js")), false);
});

test("projetos e serviços escolhem o Firestore como persistência canônica", () => {
    const projeto = ler("js/projetos/projeto-controller.js");
    const servico = ler("js/servicos/servico-controller.js");
    const paginaProdutos = ler("paginas/produtos.html");
    const paginaOrcamento = ler("paginas/orcamento-inteligente.html");

    [projeto, servico].forEach(codigo => {
        assert.match(codigo, /criarFirestoreAdapter/);
        assert.doesNotMatch(codigo, /criarLocalStorageAdapter|criarMemoryAdapter/);
    });
    [paginaProdutos, paginaOrcamento].forEach(html => {
        assert.match(html, /storage\/firestore-adapter\.js/);
        assert.doesNotMatch(html, /storage\/(?:local-storage|memory)-adapter\.js/);
    });
});

test("dashboard e orçamento não fabricam registros quando o Firestore está vazio", () => {
    const dashboard = ler("js/dashboard/dashboard-service.js");
    const orcamento = ler("js/orcamentos/orcamento-inteligente-controller.js");

    assert.doesNotMatch(dashboard, /criarProjetosSimulados|PRJ-SIM|Obra demonstrativa/);
    assert.doesNotMatch(orcamento, /Cliente balcao|exemplo\.local|criarClientesApoio|criarProdutosApoio/);
    assert.doesNotMatch(orcamento, /RKE2EDemoState/);
});
