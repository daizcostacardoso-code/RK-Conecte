(function (global) {
  "use strict";
  if (!global.document || global.RKLoading) return;

  const doc = global.document;
  const INITIAL = "rk:initial";
  const tasks = new Set([INITIAL]);
  let timeoutId = null;
  let retry = null;
  let error = false;

  function mount() {
    if (doc.getElementById("rk-global-loading") || !doc.body) return;
    const root = doc.createElement("div");
    root.id = "rk-global-loading";
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-busy", "true");
    root.innerHTML = '<section class="rk-loading-card"><img class="rk-loading-logo" src="/imagens/logo.jpeg" alt="RK Vidraçaria"><p class="rk-loading-kicker">RK VIDRAÇARIA</p><h1 id="rk-loading-title">Preparando o sistema</h1><div class="rk-loading-line" aria-hidden="true"><span></span></div><p id="rk-loading-message">Carregando informações essenciais…</p><button id="rk-loading-retry" type="button" hidden>Tentar novamente</button><footer><span>Desenvolvido por</span><img src="/assets/conecte-logo.png" alt="Conecte"></footer></section>';
    root.hidden = tasks.size === 0 && !error;
    doc.body.prepend(root);
    doc.getElementById("rk-loading-retry").addEventListener("click", function () {
      if (typeof retry === "function") retry();
      else global.location.reload();
    });
  }

  function setMessage(message) {
    const node = doc.getElementById("rk-loading-message");
    if (node && message) node.textContent = String(message);
  }

  function armSafetyTimeout(maxMs) {
    global.clearTimeout(timeoutId);
    timeoutId = global.setTimeout(function () {
      if (tasks.size) showError("O carregamento demorou mais que o esperado. Verifique sua conexão.", function () { global.location.reload(); });
    }, Math.max(1000, Number(maxMs) || 15000));
  }

  function show(message, options) {
    mount();
    error = false;
    doc.documentElement.classList.add("rk-app-iniciando");
    const root = doc.getElementById("rk-global-loading");
    if (root) { root.hidden = false; root.classList.remove("rk-loading-error"); root.setAttribute("aria-busy", "true"); }
    const button = doc.getElementById("rk-loading-retry");
    if (button) button.hidden = true;
    setMessage(message || "Carregando informações essenciais…");
    armSafetyTimeout(options && options.maxMs);
  }

  function hide() {
    if (tasks.size || error) return false;
    global.clearTimeout(timeoutId);
    const root = doc.getElementById("rk-global-loading");
    if (root) { root.hidden = true; root.setAttribute("aria-busy", "false"); }
    doc.documentElement.classList.remove("rk-app-iniciando", "rk-auth-pending", "rk-app-interna-preload");
    return true;
  }

  function addTask(name, message) {
    const key = String(name || "").trim();
    if (!key) throw new TypeError("A tarefa de carregamento precisa de um nome.");
    const added = !tasks.has(key);
    tasks.add(key);
    show(message);
    return added;
  }

  function finishTask(name) {
    const removed = tasks.delete(String(name || "").trim());
    hide();
    return removed;
  }

  function showError(message, retryCallback) {
    mount();
    global.clearTimeout(timeoutId);
    error = true;
    tasks.clear();
    retry = typeof retryCallback === "function" ? retryCallback : null;
    const root = doc.getElementById("rk-global-loading");
    if (root) { root.hidden = false; root.classList.add("rk-loading-error"); root.setAttribute("role", "alert"); root.setAttribute("aria-busy", "false"); }
    const title = doc.getElementById("rk-loading-title");
    const button = doc.getElementById("rk-loading-retry");
    if (title) title.textContent = "Não foi possível concluir";
    if (button) button.hidden = false;
    setMessage(message || "Tente novamente em instantes.");
  }

  async function run(name, operation, message) {
    addTask(name, message);
    try { return await (typeof operation === "function" ? operation() : operation); }
    catch (cause) { showError(cause && cause.message); throw cause; }
    finally { finishTask(name); }
  }

  global.RKLoading = Object.freeze({
    iniciar: show,
    adicionarTarefa: addTask,
    concluirTarefa: finishTask,
    mostrar: show,
    ocultar: hide,
    mostrarErro: showError,
    executar: run,
    tarefasPendentes: function () { return Array.from(tasks); },
    concluirInicializacao: function () { return finishTask(INITIAL); }
  });

  doc.documentElement.classList.add("rk-app-iniciando");
  if (doc.body) mount(); else doc.addEventListener("DOMContentLoaded", mount, { once: true });
  armSafetyTimeout(15000);
  global.addEventListener("rk:auth-state-changed", function () { global.RKLoading.concluirInicializacao(); }, { once: true });
  global.addEventListener("rk:auth-error", function (event) { showError(event.detail && event.detail.mensagem); }, { once: true });
})(typeof window !== "undefined" ? window : globalThis);
