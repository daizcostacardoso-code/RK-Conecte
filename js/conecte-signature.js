(function (global, document) {
  "use strict";

  if (!document || global.__conecteStatusBarLoaded) return;
  global.__conecteStatusBarLoaded = true;

  const SCRIPT_URL = document.currentScript?.src || "";
  const WEATHER_CACHE_KEY = "conecte_weather_v1";
  const WEATHER_CACHE_MS = 15 * 60 * 1000;
  const DEFAULT_LOCATION = { latitude: -16.4497, longitude: -39.0647, label: "Porto Seguro" };

  function project() {
    const title = document.title.toLowerCase();
    if (title.includes("rk") || title.includes("vidra")) {
      return { company: "RK Vidraçaria", cnpj: "60.332.101/0001-91", logo: "../assets/conecte-logo.png" };
    }
    return { company: "Conecte", cnpj: "", logo: "../assets/conecte-logo.png" };
  }

  function logoUrl() {
    const relative = project().logo;
    try { return new URL(relative, SCRIPT_URL).href; } catch (_) { return relative; }
  }

  function addStyles() {
    if (document.getElementById("conecte-status-bar-styles")) return;
    const style = document.createElement("style");
    style.id = "conecte-status-bar-styles";
    style.textContent = `
      .conecte-signature,.conecte-signature *{box-sizing:border-box}
      .conecte-signature{width:100%;max-width:100%;flex:0 0 auto;overflow:hidden;border-top:1px solid rgba(255,255,255,.09);background:#181c20;color:#edf4f7;font:600 12px/1.25 Inter,Arial,sans-serif;position:relative;z-index:20}
      body.rk-app-interna{min-height:100vh;min-height:100dvh}
      body.rk-app-interna>.conecte-signature{margin-top:auto}
      .conecte-signature__trigger{appearance:none;width:100%;min-height:48px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;margin:0;border:0;background:transparent;color:inherit;padding:8px max(14px,env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) max(14px,env(safe-area-inset-left,0px));font:inherit;text-align:left;cursor:pointer}
      .conecte-signature__trigger:hover{background:rgba(255,255,255,.045)}
      .conecte-signature__trigger:focus-visible{outline:2px solid #71f39b;outline-offset:-3px}
      .conecte-signature__side{min-width:0;display:flex;align-items:center;gap:clamp(10px,2vw,24px)}
      .conecte-signature__side--left{grid-column:1;justify-content:flex-start}
      .conecte-signature__side--right{grid-column:3;justify-content:flex-end}
      .conecte-signature__brand{grid-column:2;grid-row:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:0;justify-self:center}
      .conecte-signature__brand img{display:block;width:clamp(96px,10vw,120px);max-width:100%;height:auto;max-height:24px;object-fit:contain}
      .conecte-signature__item{display:inline-flex;align-items:center;gap:6px;min-width:0;color:#c4d0d6;white-space:nowrap}
      .conecte-signature__item svg{width:15px;height:15px;flex:0 0 auto;color:#71f39b}
      .conecte-signature__item strong{min-width:0;max-width:180px;overflow:hidden;color:#fff;text-overflow:ellipsis}
      .conecte-signature__dot{width:8px;height:8px;flex:0 0 auto;border-radius:50%;background:#2ee66b;box-shadow:0 0 0 3px rgba(46,230,107,.13)}
      .conecte-signature.is-offline .conecte-signature__dot{background:#ffc857;box-shadow:0 0 0 3px rgba(255,200,87,.13)}
      .conecte-signature__user[hidden]{display:none!important}
      .conecte-about{position:fixed;inset:0;z-index:2147483000;display:none;place-items:center;padding:max(18px,env(safe-area-inset-top,0px)) max(18px,env(safe-area-inset-right,0px)) max(18px,env(safe-area-inset-bottom,0px)) max(18px,env(safe-area-inset-left,0px));font-family:Inter,Arial,sans-serif}
      .conecte-about[aria-hidden=false]{display:grid}
      .conecte-about__backdrop{position:absolute;inset:0;background:rgba(5,11,17,.78);backdrop-filter:blur(5px)}
      .conecte-about__dialog{position:relative;width:min(100%,430px);border:1px solid rgba(255,255,255,.1);border-radius:22px;background:#111a22;color:#eef4f7;box-shadow:0 24px 80px rgba(0,0,0,.48);padding:26px;text-align:left}
      .conecte-about__close{position:absolute;right:14px;top:14px;width:44px;height:44px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:rgba(255,255,255,.06);color:#fff;font-size:24px;cursor:pointer}
      .conecte-about__dialog img{display:block;width:auto;height:30px;max-width:145px}
      .conecte-about__dialog h2{margin:24px 0 8px;font-size:25px}
      .conecte-about__dialog p{margin:0;color:#aebdc5;line-height:1.55}
      .conecte-about__license{margin-top:18px;padding:15px;border:1px solid rgba(113,243,155,.16);border-radius:14px;background:rgba(113,243,155,.06)}
      .conecte-about__license span{display:block;color:#91a3ad;font-size:11px;text-transform:uppercase;letter-spacing:.08em}
      .conecte-about__license strong{display:block;margin-top:5px;color:#fff;font-size:17px}
      .conecte-about__cnpj{margin-top:5px!important;color:#b9c8cf!important;font-size:13px}
      .conecte-about__meta{margin-top:12px!important;font-size:12px!important}
      body.conecte-modal-open{overflow:hidden}
      @media(max-width:760px){
        .conecte-signature__trigger{gap:8px;padding-inline:max(12px,env(safe-area-inset-left,0px)) max(12px,env(safe-area-inset-right,0px))}
        .conecte-signature__clock,.conecte-signature__user{display:none!important}
        .conecte-signature__side--right{visibility:hidden}
        .conecte-signature__item strong{max-width:76px}
        .conecte-signature__brand img{width:clamp(92px,24vw,108px)}
      }
      @media(max-width:430px){
        .conecte-signature__trigger{min-height:50px;grid-template-columns:minmax(44px,1fr) auto minmax(44px,1fr);padding-top:7px;padding-bottom:calc(7px + env(safe-area-inset-bottom,0px))}
        .conecte-signature__side--left{grid-column:3;justify-self:end;justify-content:flex-end}
        .conecte-signature__weather{display:none!important}
        .conecte-signature__connection{display:inline-flex!important;font-size:11px}
        .conecte-signature__side--right{display:none!important}
        .conecte-signature__brand img{width:clamp(88px,28vw,102px)}
        .conecte-about__dialog{padding:24px 20px}
      }
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
    `;
    document.head.appendChild(style);
  }

  function icon(path) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function buildBar() {
    document.querySelectorAll(".rk-version-signature").forEach(node => node.remove());
    const bars = Array.from(document.querySelectorAll(".conecte-signature"));
    const bar = bars.shift() || document.createElement("div");
    bars.forEach(node => node.remove());

    bar.className = "conecte-signature";
    bar.setAttribute("role", "contentinfo");
    bar.setAttribute("aria-label", "Barra de status Conecte");
    bar.innerHTML = `<button class="conecte-signature__trigger" type="button" aria-label="Abrir informações da Conecte">
      <span class="conecte-signature__side conecte-signature__side--left">
        <span class="conecte-signature__item conecte-signature__weather" title="Temperatura atual em Porto Seguro">${icon("M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8")}<strong data-temperature>--°C</strong></span>
        <span class="conecte-signature__item conecte-signature__connection"><span data-connection>Online</span></span>
      </span>
      <span class="conecte-signature__brand"><img src="${logoUrl()}" alt="Conecte" decoding="async"><span class="conecte-signature__dot" aria-hidden="true"></span></span>
      <span class="conecte-signature__side conecte-signature__side--right">
        <span class="conecte-signature__item conecte-signature__user" hidden>${icon("M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8")}<strong data-user></strong></span>
        <time class="conecte-signature__item conecte-signature__clock">${icon("M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20m0-14v5l3 2")}<span data-clock>--:--</span></time>
      </span>
    </button>`;

    document.body.appendChild(bar);
    return bar;
  }

  function userName() {
    const candidates = [];
    try {
      candidates.push(global.RKAuth?.obterSessao?.(), global.auth?.currentUser, global.firebase?.auth?.()?.currentUser);
    } catch (_) {}
    const user = candidates.find(Boolean);
    return user?.nomeUsuario || user?.displayName || user?.nome || user?.email || "";
  }

  function updateUser(bar) {
    const item = bar.querySelector(".conecte-signature__user");
    const output = bar.querySelector("[data-user]");
    if (!item || !output) return;
    const name = userName();
    item.hidden = !name;
    output.textContent = name;
  }

  function updateConnection(bar) {
    const output = bar.querySelector("[data-connection]");
    if (!output) return;
    const online = global.navigator?.onLine !== false;
    bar.classList.toggle("is-offline", !online);
    output.textContent = online ? "Online" : "Offline";
  }

  function updateClock(bar) {
    const clock = bar.querySelector("[data-clock]");
    if (!clock) return;
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    clock.closest("time")?.setAttribute("datetime", now.toISOString());
  }

  async function updateWeather(bar) {
    const output = bar.querySelector("[data-temperature]");
    if (!output) return;
    try {
      const cached = JSON.parse(global.localStorage?.getItem(WEATHER_CACHE_KEY) || "null");
      if (cached && Date.now() - cached.at < WEATHER_CACHE_MS) {
        output.textContent = `${Math.round(cached.value)}°C`;
        return;
      }
      if (global.navigator?.onLine === false) throw new Error("offline");
      const { latitude, longitude, label } = DEFAULT_LOCATION;
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timeout = global.setTimeout(() => controller?.abort(), 6000);
      const response = await global.fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=America%2FBahia`, {
        signal: controller?.signal
      });
      global.clearTimeout(timeout);
      if (!response.ok) throw new Error("weather");
      const value = Number((await response.json())?.current?.temperature_2m);
      if (!Number.isFinite(value)) throw new Error("weather");
      global.localStorage?.setItem(WEATHER_CACHE_KEY, JSON.stringify({ value, at: Date.now() }));
      output.textContent = `${Math.round(value)}°C`;
      output.closest(".conecte-signature__weather")?.setAttribute("title", `Temperatura atual em ${label}`);
    } catch (_) {
      output.textContent = "--°C";
    }
  }

  function buildModal(bar) {
    document.querySelector(".conecte-about")?.remove();
    const node = document.createElement("div");
    const info = project();
    node.className = "conecte-about";
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = `<div class="conecte-about__backdrop" data-close></div><section class="conecte-about__dialog" role="dialog" aria-modal="true" aria-labelledby="conecte-about-title"><button class="conecte-about__close" type="button" aria-label="Fechar" data-close>×</button><img src="${logoUrl()}" alt="Conecte"><h2 id="conecte-about-title">Conecte Desenvolvimentos</h2><p>Solução digital desenvolvida, mantida e evoluída pela Conecte.</p><div class="conecte-about__license"><span>Licenciado para</span><strong>${info.company}</strong>${info.cnpj ? `<p class="conecte-about__cnpj">CNPJ ${info.cnpj}</p>` : ""}</div><p class="conecte-about__meta">Versão ${global.RK_VERSION || "v1.0.1"}</p></section>`;
    document.body.appendChild(node);

    const close = () => {
      node.setAttribute("aria-hidden", "true");
      document.body.classList.remove("conecte-modal-open");
      bar.querySelector(".conecte-signature__trigger")?.focus();
    };
    bar.querySelector(".conecte-signature__trigger")?.addEventListener("click", () => {
      node.setAttribute("aria-hidden", "false");
      document.body.classList.add("conecte-modal-open");
      node.querySelector(".conecte-about__close")?.focus();
    });
    node.querySelectorAll("[data-close]").forEach(element => element.addEventListener("click", close));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && node.getAttribute("aria-hidden") === "false") close();
    });
  }

  function init() {
    if (!document.body) return;
    addStyles();
    const bar = buildBar();
    updateConnection(bar);
    updateClock(bar);
    updateUser(bar);
    updateWeather(bar);
    buildModal(bar);

    global.addEventListener("online", () => { updateConnection(bar); updateWeather(bar); });
    global.addEventListener("offline", () => updateConnection(bar));
    global.addEventListener("rk:auth-state-changed", () => updateUser(bar));
    global.setInterval(() => { updateClock(bar); updateUser(bar); }, 30000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
