const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const raiz = resolve(__dirname, "..");
const paginasComAuth = [
    "paginas/acessos.html",
    "paginas/arquivos.html",
    "paginas/caixa.html",
    "paginas/clientes.html",
    "paginas/compartilhar-documento.html",
    "paginas/dashboard-comercial.html",
    "paginas/funcionario.html",
    "paginas/loading.html",
    "paginas/login.html",
    "paginas/medicao-obra.html",
    "paginas/nota-servico.html",
    "paginas/novo-orcamento.html",
    "paginas/orcamento-inteligente.html",
    "paginas/orcamento.html",
    "paginas/produtos.html",
    "paginas/projetos.html",
    "paginas/valores.html"
];

function contar(texto, trecho) {
    return texto.split(trecho).length - 1;
}

test("Páginas autenticadas carregam uma única pilha Firebase na ordem segura", () => {
    paginasComAuth.forEach(caminho => {
        const html = readFileSync(resolve(raiz, caminho), "utf8");
        const app = "firebase-app-compat.js";
        const auth = "firebase-auth-compat.js";
        const bootstrap = "firebase-auth-bootstrap.js";
        const guard = "rk-auth.js";

        assert.equal(contar(html, app), 1, `${caminho}: Firebase App duplicado ou ausente`);
        assert.equal(contar(html, auth), 1, `${caminho}: Firebase Auth duplicado ou ausente`);
        assert.equal(contar(html, bootstrap), 1, `${caminho}: bootstrap duplicado ou ausente`);
        assert.equal(contar(html, guard), 1, `${caminho}: guard duplicado ou ausente`);
        assert.ok(html.indexOf(app) < html.indexOf(auth), `${caminho}: App deve vir antes de Auth`);
        assert.ok(html.indexOf(auth) < html.indexOf(bootstrap), `${caminho}: Auth deve vir antes do bootstrap`);
        assert.ok(html.indexOf(bootstrap) < html.indexOf(guard), `${caminho}: bootstrap deve vir antes do guard`);
    });
});

test("Login não mantém usuário ou senha padrão no formulário", () => {
    const html = readFileSync(resolve(raiz, "paginas/login.html"), "utf8");
    assert.match(html, /type="email" id="email"/);
    assert.doesNotMatch(html, /placeholder="1234"/);
    assert.doesNotMatch(html, /id="usuario"/);
});

test("Login local informa a liberação necessária do endereço 127.0.0.1", () => {
    const login = readFileSync(resolve(raiz, "js/login.js"), "utf8");
    assert.match(login, /Adicione 127\.0\.0\.1 aos domínios autorizados/);
    assert.match(login, /Persistence\.SESSION/);
    assert.match(login, /"127\.0\.0\.1"/);
});

test("navegacao inferior e compartilhada na area interna", () => {
    const navegacao = readFileSync(resolve(raiz, "js/shared/rk-navigation.js"), "utf8");
    const css = readFileSync(resolve(raiz, "css/style.css"), "utf8");
    const arquivos = readFileSync(resolve(raiz, "paginas/arquivos.html"), "utf8");

    assert.match(navegacao, /renderizarMenuInferior\(\)/);
    assert.match(navegacao, /rk-mobile-nav-handle/);
    assert.match(navegacao, /rk-menu-inferior--oculto/);
    assert.match(navegacao, /rk-mobile-more/);
    assert.match(navegacao, /requestAnimationFrame/);
    for (const pagina of ["dashboard-comercial.html", "orcamento-inteligente.html", "projetos.html", "clientes.html", "caixa.html"]) {
        assert.match(navegacao, new RegExp(pagina), pagina);
    }
    assert.match(css, /\.rk-menu-inferior/);
    assert.match(css, /overflow-wrap: anywhere/);
    assert.doesNotMatch(arquivos, /Arquivos de orçamentos/);
});

test("área interna verifica atualizações do service worker a cada carregamento", () => {
    const navegacao = readFileSync(resolve(raiz, "js/shared/rk-navigation.js"), "utf8");
    const serviceWorker = readFileSync(resolve(raiz, "sw.js"), "utf8");
    assert.match(navegacao, /atualizarCacheAplicacao/);
    assert.match(navegacao, /registro\?\.update\(\)/);
    assert.match(navegacao, /controllerchange/);
    assert.match(serviceWorker, /cache: 'no-cache'/);
});
