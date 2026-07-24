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
  const timers = [null];
  const create = id => {
    const classes = new Set();
    const attributes = new Map();
    return {
      id,
      dataset: {},
      hidden: false,
      textContent: "",
      innerHTML: "",
      classList: {
        add: (...items) => items.forEach(item => classes.add(item)),
        remove: (...items) => items.forEach(item => classes.delete(item))
      },
      style: {},
      setAttribute: (name, value) => attributes.set(name, String(value)),
      getAttribute: name => attributes.get(name),
      addEventListener() {}
    };
  };
  const document = {
    body: {
      prepend(node) {
        nodes.set(node.id, node);
        for (const id of [
          "rk-loading-message",
          "rk-loading-title",
          "rk-loading-retry",
          "rk-loading-percent",
          "rk-loading-bar",
          "rk-loading-progress",
          "rk-loading-network"
        ]) nodes.set(id, create(id));
      }
    },
    documentElement: {
      classList: {
        add: (...items) => items.forEach(item => classSet.add(item)),
        remove: (...items) => items.forEach(item => classSet.delete(item))
      }
    },
    createElement: () => create("rk-global-loading"),
    getElementById: id => nodes.get(id) || null,
    addEventListener() {}
  };
  const listeners = {};
  const context = {
    document,
    navigator: { onLine: true },
    location: { reload() {} },
    addEventListener: (name, callback) => { listeners[name] = callback; },
    setTimeout: callback => {
      timers.push({ callback, cleared: false });
      return timers.length - 1;
    },
    clearTimeout: id => {
      if (timers[id]) timers[id].cleared = true;
    }
  };
  context.window = context;
  vm.runInNewContext(source, context);
  const runTimer = id => {
    const timer = timers[id];
    if (!timer || timer.cleared) return false;
    timer.cleared = true;
    timer.callback();
    return true;
  };
  return { api: context.RKLoading, classSet, context, listeners, nodes, timers, runTimer };
}

test("controlador central deduplica e conclui tarefas reais", () => {
  const { api, classSet, timers, runTimer } = environment();
  assert.equal(api.adicionarTarefa("perfil"), true);
  assert.equal(api.adicionarTarefa("perfil"), false);
  assert.deepEqual(Array.from(api.tarefasPendentes()), ["rk:initial", "perfil"]);
  assert.equal(api.concluirTarefa("perfil"), true);
  assert.equal(api.concluirTarefa("perfil"), false);
  api.concluirInicializacao();
  runTimer(timers.length - 1);
  assert.equal(classSet.has("rk-app-iniciando"), false);
});

test("nova tarefa cancela a transição antiga e evita tela azul congelada", () => {
  const { api, classSet, nodes, timers, runTimer } = environment();
  const root = nodes.get("rk-global-loading");

  api.adicionarTarefa("primeira", "Primeira tarefa");
  api.concluirInicializacao();
  api.concluirTarefa("primeira");
  const primeiraSaida = timers.length - 1;
  assert.equal(runTimer(primeiraSaida), true);
  const transicaoAntiga = timers.length - 1;

  api.adicionarTarefa("rapida", "Nova tarefa");
  api.concluirTarefa("rapida");
  const segundaSaida = timers.length - 1;

  assert.equal(runTimer(transicaoAntiga), false);
  assert.equal(root.hidden, false);
  assert.equal(classSet.has("rk-app-iniciando"), true);

  assert.equal(runTimer(segundaSaida), true);
  const transicaoAtual = timers.length - 1;
  assert.equal(runTimer(transicaoAtual), true);
  assert.equal(root.hidden, true);
  assert.equal(classSet.has("rk-app-iniciando"), false);
});

test("controlador oferece erro, retry e timeout de segurança", () => {
  const css = fs.readFileSync(path.join(root, "css/rk-loading-critical.css"), "utf8");
  assert.match(source, /mostrarErro:\s*showError/);
  assert.match(source, /typeof retry === "function"/);
  assert.match(source, /DEFAULT_TIMEOUT_MS = 18000/);
  assert.match(source, /aria-live/);
  assert.match(source, /MINIMUM_VISIBLE_MS/);
  assert.match(source, /loadingVersion/);
  assert.match(source, /rk-loading-network/);
  assert.match(source, /atualizar:\s*updateProgress/);
  assert.match(css, /rk-loading-leaving/);
  assert.match(css, /rk-loading-offline/);
  assert.match(css, /body\.rk-app-interna #rk-global-loading/);
  assert.match(css, /top:\s*82px/);
  assert.match(css, /bottom:\s*calc\(var\(--rk-mobile-navigation-height/);
  assert.match(css, /prefers-reduced-motion/);
});

test("progresso e conectividade atualizam o estado acessível", () => {
  const { api, context, listeners, nodes } = environment();
  assert.equal(api.atualizar(64, "Sincronizando dados"), 64);
  assert.equal(nodes.get("rk-loading-percent").textContent, "64%");
  assert.equal(nodes.get("rk-loading-bar").getAttribute("aria-valuenow"), "64");
  assert.equal(nodes.get("rk-loading-progress").style.transform, "scaleX(0.64)");
  assert.equal(nodes.get("rk-loading-message").textContent, "Sincronizando dados");

  context.navigator.onLine = false;
  listeners.offline();
  assert.equal(nodes.get("rk-loading-network").textContent, "Modo offline");
});

test("páginas protegidas carregam o shell crítico antes do Firebase", () => {
  for (const name of ["dashboard-comercial.html", "clientes.html", "acessos.html", "projetos.html"]) {
    const html = fs.readFileSync(path.join(root, "paginas", name), "utf8");
    assert.match(html, /<html[^>]+rk-app-iniciando/);
    assert.ok(html.indexOf("rk-loading-critical.css") < html.indexOf("gstatic.com/firebasejs"), name);
    assert.ok(html.indexOf("rk-loading.js") < html.indexOf("gstatic.com/firebasejs"), name);
  }
});

test("loading aguarda DOM, shell persistente e autenticação", () => {
  assert.match(source, /rk:shell-ready/);
  assert.match(source, /marcarShellPronto/);
  assert.match(source, /marcarAutenticacaoPronta/);
  const auth = fs.readFileSync(path.join(root, "js/shared/rk-auth.js"), "utf8");
  const navigation = fs.readFileSync(path.join(root, "js/shared/rk-navigation.js"), "utf8");
  assert.match(auth, /:not\(\.rk-internal-header\)/);
  assert.match(auth, /:not\(\.rk-adaptive-mobile-navigation\)/);
  assert.match(navigation, /prepararShellInicial\(\)/);
  assert.doesNotMatch(navigation, /querySelectorAll\("\.rk-adaptive-mobile-navigation[^;]+\.remove\(\)/);
});

test("service worker mantém shell offline seguro da v1.0.0", () => {
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  assert.match(sw, /rk-conecte-v1\.0\.0/);
  for (const asset of ["rk-loading.js", "rk-loading-critical.css", "imagens/logo.jpeg", "assets/conecte-logo.png", "404.html"]) {
    assert.ok(sw.includes(asset), asset);
  }
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
