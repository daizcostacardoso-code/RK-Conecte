const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const raiz = resolve(__dirname, "..");

test("icone do PWA sempre inicia pela tela de carregamento", () => {
    const manifesto = JSON.parse(readFileSync(resolve(raiz, "manifest.webmanifest"), "utf8"));
    assert.equal(manifesto.start_url, "/paginas/loading.html?app=1&origem=pwa&splash=2");
    assert.equal(manifesto.launch_handler?.client_mode, "navigate-existing");
    assert.equal(manifesto.background_color, "#041522");
    assert.equal(manifesto.theme_color, "#041522");
    assert.ok(manifesto.icons.some(icone => icone.sizes === "1024x1024" && icone.purpose === "any"));
    assert.ok(manifesto.icons.some(icone => icone.sizes === "1024x1024" && icone.purpose === "maskable" && icone.src.includes("splash2")));
    assert.equal(manifesto.background_color, manifesto.theme_color);
});

test("abertura instalada pinta o carregador antes de Firebase e scripts externos", () => {
    const entrada = readFileSync(resolve(raiz, "paginas/loading.html"), "utf8");
    const telaInicial = entrada.indexOf('id="rkPwaBootScreen"');
    const firebase = entrada.indexOf("firebase-app-compat.js");
    assert.ok(telaInicial >= 0);
    assert.ok(firebase >= 0);
    assert.match(entrada, /id="rkPwaBootStyles"/);
    assert.match(entrada, /<html[^>]+class="rk-loading-active"/);
    assert.match(entrada, /<script defer src="\/js\/shared\/rk-loading-screen\.js\?v=1\.0\.5"><\/script>/);
    assert.match(entrada, /<script defer src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.5\/firebase-app-compat\.js"><\/script>/);
    assert.ok(telaInicial > firebase, "a marcação está no body, mas os scripts externos precisam ser deferidos para não bloquear a primeira pintura");
});

test("instalacoes antigas que abrem o index sao enviadas ao carregamento", () => {
    const instalacao = readFileSync(resolve(raiz, "js/app-install.js"), "utf8");
    assert.match(instalacao, /redirectLegacyPwaLaunch/);
    assert.match(instalacao, /location\.replace\('\/paginas\/loading\.html\?app=1&origem=pwa&splash=2'\)/);
    assert.doesNotMatch(instalacao, /if \(!isLegacyEntry \|\| !isPwaLaunch\)/);
});

test("sessao autenticada abre primeiro o dashboard", () => {
    const autenticacao = readFileSync(resolve(raiz, "js/shared/rk-auth.js"), "utf8");
    const entrada = readFileSync(resolve(raiz, "paginas/loading.html"), "utf8");
    assert.match(autenticacao, /redirecionarDashboard\(\)[\s\S]*dashboard-comercial\.html/);
    assert.match(entrada, /sessao\?\.logado[\s\S]*location\.replace\("dashboard-comercial\.html"\)/);
});


test("splash nativo e carregador HTML compartilham o mesmo simbolo", () => {
    const entrada = readFileSync(resolve(raiz, "paginas/loading.html"), "utf8");
    const carregador = readFileSync(resolve(raiz, "js/shared/rk-loading-screen.js"), "utf8");
    const serviceWorker = readFileSync(resolve(raiz, "sw.js"), "utf8");
    const simbolo = resolve(raiz, "imagens/icons/rk-splash-mark-256.png");
    const cabecalho = readFileSync(simbolo);

    assert.match(entrada, /rk-splash-mark-256\.png/);
    assert.match(carregador, /rk-splash-mark-256\.png/);
    assert.match(serviceWorker, /rk-splash-mark-256\.png/);
    assert.equal(cabecalho.readUInt32BE(16), 256);
    assert.equal(cabecalho.readUInt32BE(20), 256);
});

test("icone maskable mantem fundo identico ao splash e margem de seguranca", () => {
    const icone = readFileSync(resolve(raiz, "imagens/icons/maskable-1024.png"));
    assert.equal(icone.readUInt32BE(16), 1024);
    assert.equal(icone.readUInt32BE(20), 1024);

    const serviceWorker = readFileSync(resolve(raiz, "sw.js"), "utf8");
    assert.match(serviceWorker, /splash-seamless-v9/);
    assert.match(serviceWorker, /url\.pathname === '\/paginas\/loading\.html'/);
});
