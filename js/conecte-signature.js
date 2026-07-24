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
    if (title.includes("bps")) return { company: "BPS Rent a Car", cnpj: "", logo: "../assets/conecte-logo.png" };
    if (title.includes("maiquele") || title.includes("mm conecte") || document.querySelector(".cliente-body, .admin-body")) return { company: "Maiquele Martins Nail Designer", cnpj: "", logo: "../assets/conecte-logo.png" };
    if (title.includes("rk") || title.includes("vidra")) return { company: "RK Vidraçaria", cnpj: "60.332.101/0001-91", logo: "../assets/conecte-logo.png" };
    return { company: "Conecte", cnpj: "", logo: "../assets/logo/conecte-logo.png" };
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
      .conecte-signature{width:100%;flex:0 0 auto;border-top:1px solid rgba(255,255,255,.09);background:#181c20;color:#edf4f7;font:600 12px/1.25 Inter,Arial,sans-serif;padding:0;position:relative;z-index:20}
      .conecte-signature__trigger{appearance:none;width:100%;min-height:44px;border:0;background:transparent;color:inherit;cursor:pointer;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;margin:0;padding:7px max(14px,env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));font:inherit;text-align:left}
      .conecte-signature__trigger:hover{background:rgba(255,255,255,.045)}
      .conecte-signature__trigger:focus-visible{outline:2px solid #71f39b;outline-offset:-3px}
      .conecte-signature__side{min-width:0;display:flex;align-items:center;gap:clamp(10px,2vw,24px)}
      .conecte-signature__side--left{justify-content:flex-start}.conecte-signature__side--right{justify-content:flex-end}
      .conecte-signature__brand{grid-column:2;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:118px}
      .conecte-signature__brand img{display:block;width:auto;height:20px;max-width:112px;object-fit:contain}
      .conecte-signature__item{display:inline-flex;align-items:center;gap:6px;min-width:0;color:#c4d0d6;white-space:nowrap}
      .conecte-signature__item svg{width:15px;height:15px;flex:0 0 auto;color:#71f39b}
      .conecte-signature__item strong{color:#fff;max-width:190px;overflow:hidden;text-overflow:ellipsis}
      .conecte-signature__dot{width:8px;height:8px;border-radius:50%;background:#2ee66b;box-shadow:0 0 0 3px rgba(46,230,107,.13)}
      .conecte-signature.is-offline .conecte-signature__dot{background:#ffc857;box-shadow:0 0 0 3px rgba(255,200,87,.13)}
      .conecte-signature__user[hidden]{display:none}
      .conecte-about{position:fixed;inset:0;z-index:2147483000;display:none;place-items:center;padding:18px;font-family:Inter,Arial,sans-serif}
      .conecte-about[aria-hidden=false]{display:grid}.conecte-about__backdrop{position:absolute;inset:0;background:rgba(5,11,17,.78);backdrop-filter:blur(5px)}
      .conecte-about__dialog{position:relative;width:min(100%,430px);border:1px solid rgba(255,255,255,.1);border-radius:22px;background:#111a22;color:#eef4f7;box-shadow:0 24px 80px rgba(0,0,0,.48);padding:26px;text-align:left}
      .conecte-about__close{position:absolute;right:14px;top:14px;width:38px;height:38px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:rgba(255,255,255,.06);color:#fff;font-size:22px;cursor:pointer}
      .conecte-about__dialog img{width:auto;height:30px;max-width:145px}.conecte-about__dialog h2{margin:24px 0 8px;font-size:25px}.conecte-about__dialog p{margin:0;color:#aebdc5;line-height:1.55}.conecte-about__license{margin-top:18px;padding:15px;border:1px solid rgba(113,243,155,.16);border-radius:14px;background:rgba(113,243,155,.06)}
      .conecte-about__license span{display:block;color:#91a3ad;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.conecte-about__license strong{display:block;margin-top:5px;color:#fff;font-size:17px}.conecte-about__cnpj{margin-top:5px!important;color:#b9c8cf!important;font-size:13px}
      .conecte-about__details{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.conecte-about__details div{min-width:0;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.045);padding:10px}.conecte-about__details span{display:block;color:#7f939d;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.conecte-about__details strong{display:block;margin-top:4px;color:#eef6f8;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      body.conecte-modal-open{overflow:hidden}
      @media(max-width:760px){.conecte-signature__trigger{grid-template-columns:1fr auto 1fr;gap:8px}.conecte-signature__connection,.conecte-signature__clock,.conecte-signature__user{display:none!important}.conecte-signature__side--left{justify-content:flex-start}.conecte-signature__side--right{justify-content:flex-end}.conecte-signature__item strong{max-width:72px}.conecte-signature__brand img{max-width:96px;height:19px}}
      @media(max-width:430px){.conecte-signature__trigger{padding-inline:10px}.conecte-signature__brand{min-width:96px}.conecte-signature__brand img{max-width:88px}.conecte-about__details{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
    `;
    document.head.appendChild(style);
  }

  function icon(path) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function buildBar() {
    document.querySelectorAll(".conecte-signature").forEach((node, index) => { if (index) node.remove(); });
    let bar = document.querySelector(".conecte-signature");
    if (!bar) { bar = document.createElement("div"); bar.className = "conecte-signature"; }
    bar.className = "conecte-signature";
    bar.setAttribute("role", "contentinfo");
    bar.setAttribute("aria-label", "Conecte");
    bar.innerHTML = `<button class="conecte-signature__trigger" type="button" aria-label="Abrir informações da Conecte">
      <span class="conecte-signature__side conecte-signature__side--left">
        <span class="conecte-signature__item conecte-signature__weather" title="Temperatura atual em Porto Seguro">${icon("M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8") }<strong data-temperature>--°C</strong></span>
        <span class="conecte-signature__item conecte-signature__connection"><span data-connection>Online</span></span>
      </span>
      <span class="conecte-signature__brand"><img src="${logoUrl()}" alt="Conecte" decoding="async"><span class="conecte-signature__dot" aria-hidden="true"></span></span>
      <span class="conecte-signature__side conecte-signature__side--right">
        <span class="conecte-signature__item conecte-signature__user" hidden>${icon("M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8") }<strong data-user></strong></span>
        <time class="conecte-signature__item conecte-signature__clock">${icon("M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20m0-14v5l3 2") }<span data-clock>--:--</span></time>
      </span>
    </button>`;
    const footer = document.querySelector("body > footer:last-of-type");
    if (footer) footer.insertAdjacentElement("afterend", bar); else document.body.appendChild(bar);
    return bar;
  }

  function userName() {
    const candidates = [];
    try {
      candidates.push(global.RKAuth?.obterSessao?.(), global.mmAuthContext?.perfil, global.mmAuthContext?.usuario);
      candidates.push(global.auth?.currentUser, global.firebase?.auth?.()?.currentUser);
      ["vidracaria_sessao_funcionario", "bps_funcionario_logado"].forEach(key => candidates.push(JSON.parse(localStorage.getItem(key) || "null")));
    } catch (_) {}
    const user = candidates.find(Boolean);
    return user?.nomeUsuario || user?.displayName || user?.nome || user?.email || "";
  }

  function updateUser(bar) {
    const name = userName();
    const item = bar.querySelector(".conecte-signature__user");
    item.hidden = !name;
    if (name) bar.querySelector("[data-user]").textContent = name;
  }

  function updateConnection(bar) {
    const online = navigator.onLine !== false;
    bar.classList.toggle("is-offline", !online);
    bar.querySelector("[data-connection]").textContent = online ? "Online" : "Offline";
  }

  function updateClock(bar) {
    const now = new Date();
    const clock = bar.querySelector("[data-clock]");
    clock.textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    clock.parentElement.dateTime = now.toISOString();
  }

  async function updateWeather(bar) {
    const output = bar.querySelector("[data-temperature]");
    try {
      const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || "null");
      if (cached && Date.now() - cached.at < WEATHER_CACHE_MS) { output.textContent = `${Math.round(cached.value)}°C`; return; }
      if (navigator.onLine === false) throw new Error("offline");
      const { latitude, longitude, label } = DEFAULT_LOCATION;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=America%2FBahia`;
      const response = await fetch(url, { signal: AbortSignal.timeout?.(6000) });
      if (!response.ok) throw new Error("weather");
      const value = Number((await response.json())?.current?.temperature_2m);
      if (!Number.isFinite(value)) throw new Error("weather");
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ value, at: Date.now() }));
      output.textContent = `${Math.round(value)}°C`;
      output.closest(".conecte-signature__weather").title = `Temperatura atual em ${label}`;
    } catch (_) { output.textContent = "--°C"; }
  }

  function modal(bar) {
    document.querySelector(".conecte-about")?.remove();
    const node = document.createElement("div");
    node.className = "conecte-about"; node.setAttribute("aria-hidden", "true");
    const info = project();
    node.innerHTML = `<div class="conecte-about__backdrop" data-close></div><section class="conecte-about__dialog" role="dialog" aria-modal="true" aria-labelledby="conecte-about-title"><button class="conecte-about__close" type="button" aria-label="Fechar" data-close>×</button><img src="${logoUrl()}" alt="Conecte"><h2 id="conecte-about-title">Conecte Desenvolvimentos</h2><p>Solução digital desenvolvida, mantida e evoluída pela Conecte.</p><div class="conecte-about__license"><span>Licenciado para</span><strong>${info.company}</strong>${info.cnpj ? `<p class="conecte-about__cnpj">CNPJ ${info.cnpj}</p>` : ""}</div><div class="conecte-about__details" aria-label="Informações do sistema"><div><span>Situação</span><strong data-modal-connection>Online</strong></div><div><span>Temperatura</span><strong data-modal-temperature>--°C</strong></div><div><span>Usuário</span><strong data-modal-user>Acesso público</strong></div></div></section>`;
    document.body.appendChild(node);
    const close = () => { node.setAttribute("aria-hidden", "true"); document.body.classList.remove("conecte-modal-open"); };
    bar.querySelector(".conecte-signature__trigger").addEventListener("click", () => {
      node.querySelector("[data-modal-connection]").textContent = bar.querySelector("[data-connection]")?.textContent || "Indisponível";
      node.querySelector("[data-modal-temperature]").textContent = bar.querySelector("[data-temperature]")?.textContent || "--°C";
      node.querySelector("[data-modal-user]").textContent = bar.querySelector("[data-user]")?.textContent || "Acesso público";
      node.setAttribute("aria-hidden", "false"); document.body.classList.add("conecte-modal-open"); node.querySelector("button").focus();
    });
    node.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", close));
    document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  }

  function init() {
    if (!document.body) return;
    addStyles();
    const bar = buildBar();
    updateConnection(bar); updateClock(bar); updateUser(bar); updateWeather(bar); modal(bar);
    global.addEventListener("online", () => { updateConnection(bar); updateWeather(bar); });
    global.addEventListener("offline", () => updateConnection(bar));
    global.addEventListener("rk-auth-state", () => updateUser(bar));
    global.addEventListener("mm-auth-ready", () => updateUser(bar));
    setInterval(() => { updateClock(bar); updateUser(bar); }, 30000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})(window, document);
