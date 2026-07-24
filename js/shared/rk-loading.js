(function (global) {
  "use strict";

  if (!global.document) return;

  const doc = global.document;
  const SCREEN_ID = "rk-global-loading";
  const VERSION = "3";
  const INITIAL = "rk:initial";
  const MINIMUM_VISIBLE_MS = 320;
  const TRANSITION_MS = 180;
  const DEFAULT_TIMEOUT_MS = 18000;

  if (global.RKLoading) {
    if (typeof doc.querySelectorAll === "function") {
      const telas = Array.from(doc.querySelectorAll(`#${SCREEN_ID}`));
      telas.slice(1).forEach(tela => tela.remove());
    }
    return;
  }

  const state = {
    tasks: new Set([INITIAL]),
    progress: 8,
    sequence: 0,
    shownAt: Date.now(),
    progressTimer: null,
    hideTimer: null,
    transitionTimer: null,
    safetyTimer: null,
    retry: null,
    error: false,
    readiness: {
      dom: doc.readyState !== "loading",
      shell: !String(global.location && global.location.pathname || "").includes("/paginas/"),
      auth: false
    }
  };

  function finishInitialWhenReady() {
    if (!state.readiness.dom || !state.readiness.shell || !state.readiness.auth) return false;
    return finishTask(INITIAL);
  }

  function markReady(part) {
    if (Object.prototype.hasOwnProperty.call(state.readiness, part)) state.readiness[part] = true;
    return finishInitialWhenReady();
  }

  function notify(name, detail) {
    if (typeof global.CustomEvent === "function" && typeof global.dispatchEvent === "function") {
      global.dispatchEvent(new global.CustomEvent(name, { detail: detail || {} }));
    }
  }

  function loadingScreens() {
    if (typeof doc.querySelectorAll !== "function") {
      const tela = doc.getElementById(SCREEN_ID);
      return tela ? [tela] : [];
    }
    return Array.from(doc.querySelectorAll(`#${SCREEN_ID}`));
  }

  function currentScreen() {
    const telas = loadingScreens();
    const atual = telas.find(tela => tela.dataset && tela.dataset.loadingVersion === VERSION) || null;
    telas.forEach(tela => {
      if (tela !== atual && typeof tela.remove === "function") tela.remove();
    });
    return atual;
  }

  function setText(id, value) {
    const node = doc.getElementById(id);
    if (node && value !== undefined && value !== null) node.textContent = String(value);
  }

  function mount() {
    if (!doc.body) return null;
    let root = currentScreen();

    if (!root) {
      root = doc.createElement("div");
      root.id = SCREEN_ID;
      if (root.dataset) root.dataset.loadingVersion = VERSION;
      root.setAttribute("role", "status");
      root.setAttribute("aria-live", "polite");
      root.setAttribute("aria-label", "Carregando informações do sistema");
      root.setAttribute("aria-busy", "true");
      const areaInterna = String(global.location && global.location.pathname || "").includes("/paginas/");
      root.innerHTML = [
        '<section class="rk-loading-card" aria-labelledby="rk-loading-title">',
        '<header class="rk-loading-brand">',
        '<img class="rk-loading-logo" src="/imagens/logo.jpeg" alt="">',
        '<span class="rk-loading-brand-copy"><strong>RK Conecte</strong><span>Gestão integrada de vidraçaria</span></span>',
        '</header>',
        '<div class="rk-loading-content">',
        '<h1 id="rk-loading-title">Preparando o painel</h1>',
        '<p id="rk-loading-message">Carregando sua área de trabalho...</p>',
        '</div>',
        '<div class="rk-loading-progress-wrap">',
        '<div class="rk-loading-progress-top"><span>Sincronizando informações</span><strong id="rk-loading-percent">8%</strong></div>',
        '<div class="rk-loading-line" id="rk-loading-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="8"><span id="rk-loading-progress"></span></div>',
        '</div>',
        '<div class="rk-loading-status">',
        '<span class="rk-loading-network" id="rk-loading-network">Verificando conexão</span>',
        '<span class="rk-loading-protection">Ambiente protegido</span>',
        '</div>',
        '<button class="rk-loading-reload" id="rk-loading-retry" type="button" hidden>Recarregar página</button>',
        areaInterna ? "" : '<footer class="rk-loading-powered"><span>Tecnologia</span><img src="/assets/conecte-logo.png" alt="Conecte"></footer>',
        '</section>'
      ].join("");
      root.hidden = state.tasks.size === 0 && !state.error;
      doc.body.prepend(root);

      const retryButton = doc.getElementById("rk-loading-retry");
      if (retryButton) {
        retryButton.addEventListener("click", function () {
          const retry = state.retry;
          state.retry = null;
          if (typeof retry === "function") retry();
          else global.location.reload();
        });
      }
    }

    updateNetwork();
    updateProgress(state.progress);
    return root;
  }

  function updateProgress(value, message) {
    const amount = Math.max(0, Math.min(100, Number(value) || 0));
    state.progress = amount;
    const rounded = Math.round(amount);
    const bar = doc.getElementById("rk-loading-bar");
    const fill = doc.getElementById("rk-loading-progress");
    if (bar) bar.setAttribute("aria-valuenow", String(rounded));
    if (fill && fill.style) fill.style.transform = `scaleX(${amount / 100})`;
    setText("rk-loading-percent", `${rounded}%`);
    if (message) setText("rk-loading-message", message);
    notify("rk:loading-progress", { progress: rounded, message: message || "" });
    return rounded;
  }

  function stopAutoProgress() {
    if (!state.progressTimer || typeof global.clearInterval !== "function") return;
    global.clearInterval(state.progressTimer);
    state.progressTimer = null;
  }

  function startAutoProgress() {
    if (state.progressTimer || typeof global.setInterval !== "function") return;
    state.progressTimer = global.setInterval(function () {
      if (!state.tasks.size || state.error || state.progress >= 92) return;
      const increment = state.progress < 45 ? 4 : state.progress < 75 ? 2 : 0.7;
      updateProgress(Math.min(92, state.progress + increment));
    }, 420);
  }

  function updateNetwork() {
    const online = !global.navigator || global.navigator.onLine !== false;
    const root = currentScreen();
    if (root && root.classList) {
      if (online) root.classList.remove("rk-loading-offline");
      else root.classList.add("rk-loading-offline");
    }
    setText("rk-loading-network", online ? "Conexão disponível" : "Modo offline");
    return online;
  }

  function clearSafetyTimeout() {
    if (state.safetyTimer) global.clearTimeout(state.safetyTimer);
    state.safetyTimer = null;
  }

  function clearExitTimers() {
    if (state.hideTimer) global.clearTimeout(state.hideTimer);
    if (state.transitionTimer) global.clearTimeout(state.transitionTimer);
    state.hideTimer = null;
    state.transitionTimer = null;
  }

  function armSafetyTimeout(maxMs) {
    clearSafetyTimeout();
    state.safetyTimer = global.setTimeout(function () {
      if (state.tasks.size && !state.error) {
        showError(
          "O carregamento demorou mais que o esperado. Verifique sua conexão.",
          function () { global.location.reload(); }
        );
      }
    }, Math.max(1000, Number(maxMs) || DEFAULT_TIMEOUT_MS));
  }

  function show(message, options) {
    clearExitTimers();

    const root = mount();
    if (!root) return false;
    if (root.hidden) state.shownAt = Date.now();

    state.error = false;
    root.hidden = false;
    root.classList.remove("rk-loading-leaving", "rk-loading-error");
    root.setAttribute("role", "status");
    root.setAttribute("aria-busy", "true");
    doc.documentElement.classList.add("rk-app-iniciando");

    const title = doc.getElementById("rk-loading-title");
    const button = doc.getElementById("rk-loading-retry");
    if (title) title.textContent = "Preparando o painel";
    if (button) button.hidden = true;
    if (state.progress >= 100) updateProgress(8);
    if (message) setText("rk-loading-message", message);

    updateNetwork();
    startAutoProgress();
    armSafetyTimeout(options && options.maxMs);
    notify("rk:loading-start", { message: message || "" });
    return true;
  }

  function hide() {
    if (state.tasks.size || state.error) return false;

    clearSafetyTimeout();
    stopAutoProgress();
    updateProgress(100, "Tudo pronto.");

    const wait = Math.max(80, MINIMUM_VISIBLE_MS - (Date.now() - state.shownAt));
    clearExitTimers();
    state.hideTimer = global.setTimeout(function () {
      state.hideTimer = null;
      const root = currentScreen();
      if (!root || state.tasks.size || state.error) return;

      root.classList.add("rk-loading-leaving");
      doc.documentElement.classList.remove("rk-app-iniciando", "rk-auth-pending", "rk-app-interna-preload");
      notify("rk:loading-end");

      state.transitionTimer = global.setTimeout(function () {
        state.transitionTimer = null;
        if (!state.tasks.size && !state.error) {
          root.hidden = true;
          root.classList.remove("rk-loading-leaving");
        }
      }, TRANSITION_MS);
    }, wait);
    return true;
  }

  function addTask(name, message, options) {
    const key = String(name || "").trim();
    if (!key) throw new TypeError("A tarefa de carregamento precisa de um nome.");
    const added = !state.tasks.has(key);
    state.tasks.add(key);
    show(message, options);
    return added;
  }

  function finishTask(name) {
    const removed = state.tasks.delete(String(name || "").trim());
    hide();
    return removed;
  }

  function showError(message, retryCallback) {
    clearExitTimers();
    clearSafetyTimeout();
    stopAutoProgress();

    state.error = true;
    state.tasks.clear();
    state.retry = typeof retryCallback === "function" ? retryCallback : null;

    const root = mount();
    if (!root) return false;
    root.hidden = false;
    root.classList.remove("rk-loading-leaving");
    root.classList.add("rk-loading-error");
    root.setAttribute("role", "alert");
    root.setAttribute("aria-busy", "false");
    doc.documentElement.classList.add("rk-app-iniciando");

    const title = doc.getElementById("rk-loading-title");
    const button = doc.getElementById("rk-loading-retry");
    if (title) title.textContent = "Não foi possível concluir";
    if (button) button.hidden = false;
    updateProgress(100);
    setText("rk-loading-message", message || "Tente novamente em instantes.");
    notify("rk:loading-error", { message: message || "" });
    return true;
  }

  async function run(name, operation, message, options) {
    const token = String(name || "").trim() || `rk:task:${++state.sequence}`;
    addTask(token, message, options);
    try {
      return await (typeof operation === "function" ? operation() : operation);
    } catch (cause) {
      showError(cause && cause.message);
      throw cause;
    } finally {
      finishTask(token);
    }
  }

  global.RKLoading = Object.freeze({
    versao: VERSION,
    iniciar: show,
    adicionarTarefa: addTask,
    concluirTarefa: finishTask,
    atualizar: updateProgress,
    mostrar: show,
    ocultar: hide,
    mostrarErro: showError,
    executar: run,
    tarefasPendentes: function () { return Array.from(state.tasks); },
    concluirInicializacao: function () { return finishTask(INITIAL); },
    marcarDomPronto: function () { return markReady("dom"); },
    marcarShellPronto: function () { return markReady("shell"); },
    marcarAutenticacaoPronta: function () { return markReady("auth"); }
  });

  doc.documentElement.classList.add("rk-app-iniciando");
  if (doc.body) mount();
  else doc.addEventListener("DOMContentLoaded", function () {
    mount();
    markReady("dom");
  }, { once: true });
  armSafetyTimeout(DEFAULT_TIMEOUT_MS);
  global.addEventListener("online", updateNetwork);
  global.addEventListener("offline", updateNetwork);
  global.addEventListener("rk:shell-ready", function () { markReady("shell"); }, { once: true });
  global.addEventListener("rk:auth-state-changed", function () { markReady("auth"); }, { once: true });
  global.addEventListener("rk:auth-error", function (event) {
    showError(event.detail && event.detail.mensagem);
  }, { once: true });
})(typeof window !== "undefined" ? window : globalThis);
