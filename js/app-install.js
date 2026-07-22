(() => {
  'use strict';

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  let deferredPrompt = null;

  function redirectLegacyPwaLaunch(){
    if (!isStandalone) return false;
    const path = (location.pathname || '/').toLowerCase();
    const isLegacyEntry = path === '/' || path.endsWith('/index.html');
    if (!isLegacyEntry) return false;
    location.replace('/paginas/loading.html?app=1&origem=pwa');
    return true;
  }

  if (redirectLegacyPwaLaunch()) return;

  function registerSW(){
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        const prefix = location.pathname.includes('/paginas/') ? '../' : './';
        navigator.serviceWorker.register(prefix + 'sw.js').catch(() => null);
      });
    });
  }

  function createInstallButton(){
    const path = (location.pathname || '').toLowerCase();
    const paginaInterna = path.includes('/login.html') || path.includes('/funcionario.html') || path.includes('/loading.html');
    if (paginaInterna || isStandalone || document.getElementById('btnInstalarAppRK')) return;

    const btn = document.createElement('button');
    btn.id = 'btnInstalarAppRK';
    btn.type = 'button';
    btn.className = 'btn-instalar-app oculto';
    btn.innerHTML = '<span>📲</span><strong>App</strong>';
    document.body.appendChild(btn);

    const tip = document.createElement('div');
    tip.id = 'dicaInstalarAppRK';
    tip.className = 'dica-instalar-app oculto';
    tip.innerHTML = '<strong>Instalar RK Vidraçaria</strong><p>Toque em compartilhar/opções do navegador e escolha “Adicionar à tela inicial”.</p><button type="button">Entendi</button>';
    document.body.appendChild(tip);

    tip.querySelector('button').addEventListener('click', () => tip.classList.add('oculto'));

    btn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice.catch(() => null);
        deferredPrompt = null;
        btn.classList.add('oculto');
      } else {
        tip.classList.toggle('oculto');
      }
    });

    setTimeout(() => {
      if (!isStandalone) btn.classList.remove('oculto');
    }, 3500);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    const btn = document.getElementById('btnInstalarAppRK');
    if (btn && !isStandalone) btn.classList.remove('oculto');
  });

  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('btnInstalarAppRK');
    if (btn) btn.classList.add('oculto');
  });

  document.addEventListener('DOMContentLoaded', () => {
    createInstallButton();
    document.body.classList.add('pwa-ready');
  });

  registerSW();
})();
