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
