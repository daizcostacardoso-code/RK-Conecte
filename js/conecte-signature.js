(function () {
  "use strict";

  const SIGNATURE_CLASS = "conecte-signature";
  const SCRIPT_URL = document.currentScript?.src || "";
  const COMPANY_NAME = "RK Vidraçaria";
  const COMPANY_CNPJ = "60.332.101/0001-91";
  const SITE_URL = "";

  function addStyles() {
    if (document.getElementById("conecte-signature-styles")) return;

    const style = document.createElement("style");
    style.id = "conecte-signature-styles";
    style.textContent = `
      .${SIGNATURE_CLASS}, .${SIGNATURE_CLASS} * { box-sizing: border-box; }
      .${SIGNATURE_CLASS} {
        width: 100%; flex: 0 0 auto; border-top: 1px solid rgba(255,255,255,.08);
        background: #181c20; padding: 0; text-align: center; line-height: 1;
      }
      body > footer.company-footer-standard {
        box-sizing: border-box; display: block; width: 100%; flex: 0 0 auto; margin: 0;
        border: 0; border-radius: 0; background: #101923; color: #b8c5d1;
        padding: 18px 12px; text-align: center;
      }
      body > footer.company-footer-standard p {
        max-width: none; margin: 0; color: inherit; font: 400 14px/1.55 Arial, Helvetica, sans-serif;
      }
      body.conecte-footer-layout { min-height: 100vh; display: flex; flex-direction: column; }
      body.conecte-footer-layout > footer.company-footer-standard { margin-top: auto; }
      body.conecte-modal-open { overflow: hidden; }
      .${SIGNATURE_CLASS}__trigger {
        appearance: none; width: 100%; min-height: 40px; border: 0; margin: 0;
        padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px)); background: transparent;
        color: #fff; cursor: pointer; font: inherit;
      }
      .${SIGNATURE_CLASS}__trigger:hover { background: rgba(255,255,255,.045); }
      .${SIGNATURE_CLASS}__trigger:focus-visible { outline: 2px solid #71f39b; outline-offset: -3px; }
      .${SIGNATURE_CLASS}__content { display: inline-flex; align-items: center; justify-content: center; gap: 7px; }
      .${SIGNATURE_CLASS} img { display: inline-block; width: auto; height: 20px; max-width: min(100%,120px); object-fit: contain; vertical-align: middle; }
      .${SIGNATURE_CLASS}__online {
        display: inline-block; width: 9px; height: 9px; flex: 0 0 9px; border-radius: 50%;
        background: #2ee66b; box-shadow: 0 0 0 0 rgba(46,230,107,.72);
        animation: conecte-online-pulse 1.6s ease-out infinite;
      }
      @keyframes conecte-online-pulse {
        0% { box-shadow: 0 0 0 0 rgba(46,230,107,.72); transform: scale(.92); }
        55% { box-shadow: 0 0 0 7px rgba(46,230,107,0); transform: scale(1); }
        100% { box-shadow: 0 0 0 0 rgba(46,230,107,0); transform: scale(.92); }
      }
      .conecte-about { position: fixed; inset: 0; z-index: 2147483000; display: none; place-items: center; padding: 20px; font-family: Inter, Arial, Helvetica, sans-serif; line-height: 1.5; }
      .conecte-about[aria-hidden="false"] { display: grid; }
      .conecte-about__backdrop { position: absolute; inset: 0; background: rgba(5,11,17,.76); backdrop-filter: blur(5px); }
      .conecte-about__dialog {
        position: relative; width: min(100%, 480px); max-height: min(760px, calc(100vh - 40px)); overflow: auto;
        border: 1px solid rgba(255,255,255,.1); border-radius: 24px; background: #111a22; color: #eef4f7;
        box-shadow: 0 24px 80px rgba(0,0,0,.48); padding: 28px;
        animation: conecte-modal-in .2s ease-out both;
      }
      @keyframes conecte-modal-in { from { opacity: 0; transform: translateY(10px) scale(.98); } }
      .conecte-about__close {
        position: absolute; top: 16px; right: 16px; width: 38px; height: 38px; border: 1px solid rgba(255,255,255,.1);
        border-radius: 50%; background: rgba(255,255,255,.06); color: #dce7ec; cursor: pointer; font: 400 24px/1 Arial;
      }
      .conecte-about__close:hover { background: rgba(255,255,255,.12); }
      .conecte-about__close:focus-visible, .conecte-about__site:focus-visible { outline: 2px solid #71f39b; outline-offset: 3px; }
      .conecte-about__brand { display: flex; align-items: center; gap: 14px; padding-right: 42px; }
      .conecte-about__brand img { width: auto; max-width: 145px; height: 32px; object-fit: contain; }
      .conecte-about__status { display: inline-flex; align-items: center; gap: 7px; margin-top: 6px; color: #91a3ad; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
      .conecte-about__status::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #2ee66b; box-shadow: 0 0 12px rgba(46,230,107,.65); }
      .conecte-about__eyebrow { margin: 26px 0 7px; color: #71f39b; font-size: 12px; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
      .conecte-about h2 { margin: 0; color: #fff; font-size: clamp(25px, 6vw, 32px); line-height: 1.15; letter-spacing: -.025em; }
      .conecte-about__intro { margin: 12px 0 22px; color: #aebdc5; font-size: 15px; }
      .conecte-about__license { padding: 18px; border: 1px solid rgba(113,243,155,.16); border-radius: 16px; background: linear-gradient(135deg, rgba(113,243,155,.08), rgba(255,255,255,.025)); }
      .conecte-about__label { display: block; margin-bottom: 5px; color: #91a3ad; font-size: 11px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
      .conecte-about__company { display: block; color: #fff; font-size: 18px; line-height: 1.3; }
      .conecte-about__cnpj { display: block; margin-top: 6px; color: #aebdc5; font-size: 14px; }
      .conecte-about__note { margin: 14px 0 0; color: #8fa0aa; font-size: 13px; }
      .conecte-about__site {
        display: flex; align-items: center; justify-content: center; width: 100%; min-height: 46px; margin-top: 22px;
        border: 0; border-radius: 13px; background: #2ee66b; color: #07130b; text-decoration: none;
        font-size: 14px; font-weight: 800; cursor: pointer;
      }
      .conecte-about__site:hover { background: #71f39b; }
      .conecte-about__site[aria-disabled="true"] { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.055); color: #8fa0aa; cursor: default; }
      .conecte-about__footer { margin: 18px 0 0; color: #71848e; font-size: 11px; text-align: center; }
      @media (max-width: 520px) { .conecte-about { padding: 12px; } .conecte-about__dialog { padding: 24px 20px; border-radius: 20px; } }
      @media (prefers-reduced-motion: reduce) { .${SIGNATURE_CLASS}__online { animation: none; } .conecte-about__dialog { animation: none; } }
    `;
    document.head.appendChild(style);
  }

  function normalizeCompanyFooter() {
    if (getComputedStyle(document.body).display === "block") document.body.classList.add("conecte-footer-layout");
    let footer = document.querySelector("body > footer:last-of-type");
    if (!footer) { footer = document.createElement("footer"); document.body.appendChild(footer); }
    footer.className = "company-footer-standard";
    footer.setAttribute("aria-label", `Rodapé ${COMPANY_NAME}`);
    footer.innerHTML = "";
    const copyright = document.createElement("p");
    copyright.textContent = `© ${new Date().getFullYear()} ${COMPANY_NAME}. Todos os direitos reservados.`;
    footer.appendChild(copyright);
    return footer;
  }

  function createModal(logoUrl) {
    const modal = document.createElement("div");
    modal.className = "conecte-about";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="conecte-about__backdrop" data-conecte-close></div>
      <section class="conecte-about__dialog" role="dialog" aria-modal="true" aria-labelledby="conecte-about-title" aria-describedby="conecte-about-description">
        <button class="conecte-about__close" type="button" aria-label="Fechar" data-conecte-close>&times;</button>
        <div class="conecte-about__brand"><img src="${logoUrl}" alt="Conecte"><span class="conecte-about__status">Sistema ativo</span></div>
        <p class="conecte-about__eyebrow">Desenvolvimento de software</p>
        <h2 id="conecte-about-title">Conecte Desenvolvimentos</h2>
        <p class="conecte-about__intro" id="conecte-about-description">Solução digital desenvolvida, mantida e evoluída pela Conecte.</p>
        <div class="conecte-about__license">
          <span class="conecte-about__label">Licenciado para</span>
          <strong class="conecte-about__company"></strong>
          <span class="conecte-about__cnpj" hidden></span>
        </div>
        <p class="conecte-about__note">Tecnologia para organizar, organização para crescer.</p>
        <a class="conecte-about__site" target="_blank" rel="noopener noreferrer">Conhecer a Conecte</a>
        <p class="conecte-about__footer">© ${new Date().getFullYear()} Conecte Desenvolvimentos · Todos os direitos reservados.</p>
      </section>`;
    modal.querySelector(".conecte-about__company").textContent = COMPANY_NAME;
    const cnpj = modal.querySelector(".conecte-about__cnpj");
    if (COMPANY_CNPJ) { cnpj.textContent = `CNPJ: ${COMPANY_CNPJ}`; cnpj.hidden = false; }
    const site = modal.querySelector(".conecte-about__site");
    if (SITE_URL) site.href = SITE_URL;
    else { site.textContent = "Site da Conecte · em breve"; site.setAttribute("aria-disabled", "true"); site.removeAttribute("target"); }
    document.body.appendChild(modal);
    return modal;
  }

  function setupInteraction(signature, modal) {
    const trigger = signature.querySelector(`.${SIGNATURE_CLASS}__trigger`);
    const dialog = modal.querySelector(".conecte-about__dialog");
    const closeButton = modal.querySelector(".conecte-about__close");
    let lastFocus = null;
    const close = () => { modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("conecte-modal-open"); lastFocus?.focus(); };
    const open = () => { lastFocus = document.activeElement; modal.setAttribute("aria-hidden", "false"); document.body.classList.add("conecte-modal-open"); closeButton.focus(); };
    trigger.addEventListener("click", open);
    modal.querySelectorAll("[data-conecte-close]").forEach(element => element.addEventListener("click", close));
    modal.addEventListener("click", event => { if (event.target.closest('[aria-disabled="true"]')) event.preventDefault(); });
    document.addEventListener("keydown", event => {
      if (modal.getAttribute("aria-hidden") === "true") return;
      if (event.key === "Escape") { close(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function enhanceSignature(signature, logoUrl) {
    if (signature.querySelector(`.${SIGNATURE_CLASS}__trigger`)) return;
    const existingLogo = signature.querySelector("img");
    const logo = existingLogo || document.createElement("img");
    if (!existingLogo) { logo.src = logoUrl; logo.alt = "Conecte"; logo.decoding = "async"; }
    signature.innerHTML = "";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = `${SIGNATURE_CLASS}__trigger`;
    trigger.setAttribute("aria-label", "Sobre a Conecte Desenvolvimentos");
    trigger.title = "Sobre a Conecte Desenvolvimentos";
    const content = document.createElement("span");
    content.className = `${SIGNATURE_CLASS}__content`;
    content.appendChild(logo);
    const online = document.createElement("span");
    online.className = `${SIGNATURE_CLASS}__online`;
    online.setAttribute("aria-hidden", "true");
    content.appendChild(online);
    trigger.appendChild(content);
    signature.appendChild(trigger);
  }

  function addSignature() {
    if (!document.body) return;
    addStyles();
    const footer = normalizeCompanyFooter();
    const logoUrl = SCRIPT_URL ? new URL("../assets/conecte-logo.png", SCRIPT_URL).href : "assets/conecte-logo.png";
    let signature = document.querySelector(`.${SIGNATURE_CLASS}`);
    if (!signature) { signature = document.createElement("div"); signature.className = `${SIGNATURE_CLASS} rk-version-signature`; }
    signature.setAttribute("role", "contentinfo");
    signature.setAttribute("aria-label", "Conecte Desenvolvimentos");
    enhanceSignature(signature, logoUrl);
    footer.insertAdjacentElement("afterend", signature);
    const oldModal = document.querySelector(".conecte-about");
    if (oldModal) oldModal.remove();
    setupInteraction(signature, createModal(logoUrl));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addSignature, { once: true });
  else addSignature();
})();
