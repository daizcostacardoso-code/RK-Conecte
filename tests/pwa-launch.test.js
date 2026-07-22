const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const raiz = resolve(__dirname, "..");

test("icone do PWA sempre inicia pela tela de carregamento", () => {
    const manifesto = JSON.parse(readFileSync(resolve(raiz, "manifest.webmanifest"), "utf8"));
    assert.equal(manifesto.start_url, "/paginas/loading.html?app=1&origem=pwa");
    assert.equal(manifesto.launch_handler?.client_mode, "navigate-existing");
});

test("instalacoes antigas que abrem o index sao enviadas ao carregamento", () => {
    const instalacao = readFileSync(resolve(raiz, "js/app-install.js"), "utf8");
    assert.match(instalacao, /redirectLegacyPwaLaunch/);
    assert.match(instalacao, /location\.replace\('\/paginas\/loading\.html\?app=1&origem=pwa'\)/);
    assert.doesNotMatch(instalacao, /if \(!isLegacyEntry \|\| !isPwaLaunch\)/);
});

test("sessao autenticada abre primeiro o dashboard", () => {
    const autenticacao = readFileSync(resolve(raiz, "js/shared/rk-auth.js"), "utf8");
    const entrada = readFileSync(resolve(raiz, "paginas/loading.html"), "utf8");
    assert.match(autenticacao, /redirecionarDashboard\(\)[\s\S]*dashboard-comercial\.html/);
    assert.match(entrada, /sessao\?\.logado[\s\S]*location\.replace\("dashboard-comercial\.html"\)/);
});
