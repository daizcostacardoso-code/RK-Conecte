const RK_CACHE = 'rk-conecte-v1.0.0-20260724231235267';
const OFFLINE_FALLBACK = '/404.html';
const APP_SHELL = [
  '/', '/index.html', OFFLINE_FALLBACK, '/paginas/login.html', '/paginas/loading.html',
  '/paginas/dashboard-comercial.html', '/paginas/clientes.html',
  '/paginas/orcamento-inteligente.html', '/paginas/orcamento.html',
  '/paginas/projetos.html', '/paginas/produtos.html', '/paginas/arquivos.html',
  '/paginas/compartilhar-documento.html', '/paginas/medicao-obra.html', '/paginas/nota-servico.html',
  '/paginas/caixa.html', '/paginas/acessos.html', '/css/style.css', '/css/rk-loading-critical.css',
  '/css/medicao-obra.css', '/css/nota-servico.css', '/css/caixa-basico.css', '/css/acessos.css',
  '/js/app-install.js', '/js/shared/rk-loading.js', '/js/shared/rk-version.js',
  '/imagens/logo.jpeg', '/assets/conecte-logo.png', '/imagens/icons/icon-192.png?v=1.0.2',
  '/imagens/icons/icon-512.png?v=1.0.2', '/imagens/icons/maskable-192-v1.0.1.png?v=1.0.2',
  '/imagens/icons/maskable-512-v1.0.1.png?v=1.0.2', '/assets/pwa/launch-background.png?v=1.0.2',
  '/manifest.webmanifest?v=1.0.2'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(RK_CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('rk-conecte-') && key !== RK_CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

function cacheable(response) {
  return Boolean(response && response.ok && (response.type === 'basic' || response.type === 'cors'));
}

async function navigation(request) {
  try { return await fetch(request); }
  catch (_) { return (await caches.match(request, { ignoreSearch: true })) || caches.match(OFFLINE_FALLBACK); }
}

async function staticAsset(request) {
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (cacheable(response)) (await caches.open(RK_CACHE)).put(request, response.clone());
    return response;
  } catch (_) {
    return (await caches.match(request, { ignoreSearch: true })) || Response.error();
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/firestore.googleapis.com/') || url.pathname.includes('/identitytoolkit.googleapis.com/')) return;
  if (request.mode === 'navigate') { event.respondWith(navigation(request)); return; }
  if (['style', 'script', 'image', 'font', 'manifest'].includes(request.destination)) event.respondWith(staticAsset(request));
});
