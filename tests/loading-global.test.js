const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "js/shared/rk-loading.js"), "utf8");

function environment() {
  const nodes = new Map();
  const classSet = new Set();
  const create = id => ({ id, hidden: false, textContent: "", innerHTML: "", classList: { add() {}, remove() {} }, style: {}, setAttribute() {}, addEventListener() {} });
  const document = {
    body: { prepend(node) { nodes.set(node.id, node); for (const id of ["rk-loading-message","rk-loading-title","rk-loading-retry"]) nodes.set(id, create(id)); } },
    documentElement: { classList: { add: (...items) => items.forEach(x => classSet.add(x)), remove: (...items) => items.forEach(x => classSet.delete(x)) } },
    createElement: () => create("rk-global-loading"),
    getElementById: id => nodes.get(id) || null,
    addEventListener() {}
  };
  const listeners = {};
  const context = { document, location: { reload() {} }, addEventListener: (name, cb) => { listeners[name] = cb; }, setTimeout: () => 1, clearTimeout() {} };
  context.window = context;
  vm.runInNewContext(source, context);
  return { api: context.RKLoading, classSet };
}

test("controlador central deduplica e conclui tarefas reais", () => {
  const { api, classSet } = environment();
  assert.equal(api.adicionarTarefa("perfil"), true);
  assert.equal(api.adicionarTarefa("perfil"), false);
  assert.deepEqual(Array.from(api.tarefasPendentes()), ["rk:initial", "perfil"]);
  assert.equal(api.concluirTarefa("perfil"), true);
  assert.equal(api.concluirTarefa("perfil"), false);
  api.concluirInicializacao();
  assert.equal(classSet.has("rk-app-iniciando"), false);
});

test("controlador oferece erro, retry e timeout de segurança", () => {
  const css = fs.readFileSync(path.join(root, "css/rk-loading-critical.css"), "utf8");
  assert.match(source, /mostrarErro:\s*showError/);
  assert.match(source, /typeof retry === "function"/);
  assert.match(source, /15000/);
  assert.match(source, /aria-live/);
  assert.match(css, /prefers-reduced-motion/);
});

test("páginas protegidas carregam o shell crítico antes do Firebase", () => {
  for (const name of ["dashboard-comercial.html", "clientes.html", "acessos.html", "projetos.html"]) {
    const html = fs.readFileSync(path.join(root, "paginas", name), "utf8");
    assert.match(html, /<html[^>]+rk-app-iniciando/);
    assert.ok(html.indexOf("rk-loading-critical.css") < html.indexOf("gstatic.com/firebasejs"), name);
    assert.ok(html.indexOf("rk-loading.js") < html.indexOf("gstatic.com/firebasejs"), name);
  }
});

test("service worker mantém shell offline seguro da v1.0.0", () => {
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  assert.match(sw, /rk-conecte-v1\.0\.0/);
  for (const asset of ["rk-loading.js", "rk-loading-critical.css", "imagens/logo.jpeg", "assets/conecte-logo.png", "404.html"]) assert.ok(sw.includes(asset), asset);
  assert.match(sw, /request\.mode === 'navigate'/);
  assert.match(sw, /request\.method !== 'GET'/);
  assert.match(sw, /maskable-512-v1\.0\.1\.png\?v=1\.0\.2/);
  assert.match(sw, /launch-background\.png\?v=1\.0\.2/);
});

test("entrada da PWA usa o mesmo shell e startup visual do carregador", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const manifest = fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8");
  assert.match(html, /class="rk-app-iniciando"/);
  assert.ok(html.indexOf("rk-loading-critical.css") < html.indexOf("rk-auth.js"));
  assert.ok(html.indexOf("rk-loading.js") < html.indexOf("rk-auth.js"));
  assert.match(html, /apple-touch-startup-image/);
  assert.match(html, /launch-background\.png\?v=1\.0\.2/);
  assert.doesNotMatch(html, /launch-1170x2532\.png/);
  assert.match(manifest, /"background_color": "#071c2b"/);
  assert.match(manifest, /maskable-512-v1\.0\.1\.png\?v=1\.0\.2/);
});
