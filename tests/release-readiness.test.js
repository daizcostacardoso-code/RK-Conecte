const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const count = (text, fragment) => text.split(fragment).length - 1;

const internalPages = [
  "paginas/acessos.html",
  "paginas/arquivos.html",
  "paginas/caixa.html",
  "paginas/clientes.html",
  "paginas/compartilhar-documento.html",
  "paginas/dashboard-comercial.html",
  "paginas/funcionario.html",
  "paginas/medicao-obra.html",
  "paginas/nota-servico.html",
  "paginas/novo-orcamento.html",
  "paginas/orcamento-inteligente.html",
  "paginas/produtos.html",
  "paginas/projetos.html",
  "paginas/valores.html"
];

const publicPagesWithFooter = [
  "index.html",
  "paginas/contato.html",
  "paginas/galeria.html",
  "paginas/orcamento.html",
  "paginas/produtos-publico.html",
  "paginas/servicos-publico.html"
];

test("PWA usa o dashboard como entrada e loading legado não cria segunda tela", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  const legacy = read("paginas/loading.html");
  assert.equal(manifest.start_url, "/paginas/dashboard-comercial.html?app=1&origem=pwa");
  assert.equal(manifest.launch_handler.client_mode, "navigate-existing");
  assert.match(legacy, /location\.replace\(destino\.href\)/);
  assert.match(legacy, /dashboard-comercial\.html/);
  assert.doesNotMatch(legacy, /firebase-(?:app|auth)-compat/);
  assert.doesNotMatch(legacy, /rk-loading(?:\.js|-critical)/);
  assert.doesNotMatch(legacy, /conecte-signature\.js/);
});

test("home restaura Firebase antes do guard e redireciona sessão ativa", () => {
  const home = read("index.html");
  const auth = read("js/shared/rk-auth.js");
  assert.equal(count(home, "firebase-app-compat.js"), 1);
  assert.equal(count(home, "firebase-auth-compat.js"), 1);
  assert.equal(count(home, "firebase-auth-bootstrap.js"), 1);
  assert.equal(count(home, "rk-auth.js"), 1);
  assert.ok(home.indexOf("firebase-app-compat.js") < home.indexOf("firebase-auth-compat.js"));
  assert.ok(home.indexOf("firebase-auth-compat.js") < home.indexOf("firebase-auth-bootstrap.js"));
  assert.ok(home.indexOf("firebase-auth-bootstrap.js") < home.indexOf("rk-auth.js"));
  assert.match(home, /data-rk-auth="home"/);
  assert.match(auth, /modoAtual === "home"[\s\S]*if \(sessao\) this\.redirecionarDashboard\(\)/);
});

test("área interna não contém rodapé institucional e mantém uma barra Conecte", () => {
  for (const file of internalPages) {
    const html = read(file);
    assert.doesNotMatch(html, /<footer\b/i, `${file}: footer institucional ainda presente`);
    assert.equal(count(html, "conecte-signature.js"), 1, `${file}: barra Conecte ausente ou duplicada`);
  }
  for (const file of publicPagesWithFooter) {
    assert.match(read(file), /<footer\b[^>]*class="public-footer"/i, `${file}: footer público removido indevidamente`);
  }
});

test("somente conecte-signature cria a barra e o mobile possui layout dedicado", () => {
  const navigation = read("js/shared/rk-navigation.js");
  const signature = read("js/conecte-signature.js");
  assert.doesNotMatch(navigation, /renderizarAssinaturaVersao|rk-version-signature conecte-signature/);
  assert.match(signature, /@media\(max-width:430px\)/);
  assert.match(signature, /safe-area-inset-bottom/);
  assert.match(signature, /min-height:50px/);
  assert.match(signature, /grid-template-columns:minmax\(44px,1fr\) auto minmax\(44px,1fr\)/);
  assert.match(signature, /rk:auth-state-changed/);
});

test("Firebase Hosting publica exclusivamente o pacote dist validado", () => {
  const firebase = JSON.parse(read("firebase.json"));
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(firebase.hosting.public, "dist");
  assert.deepEqual(firebase.hosting.predeploy, ["npm run release:prepare"]);
  assert.match(packageJson.scripts["build:hosting"], /build-hosting\.mjs/);
  assert.match(packageJson.scripts["check:hosting"], /check-hosting-package\.mjs/);
  assert.match(packageJson.scripts["release:prepare"], /build:hosting/);
});
