const RK_CACHE = 'rk-vidracaria-v5.4.1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/paginas/servicos-publico.html',
  '/paginas/produtos-publico.html',
  '/paginas/galeria.html',
  '/paginas/contato.html',
  '/paginas/orcamento.html',
  '/css/style.css',
  '/js/public-site.js',
  '/js/app-install.js',
  '/js/shared/rk-navigation.js',
  '/imagens/logo.jpeg',
  '/imagens/icons/icon-192.png',
  '/imagens/icons/icon-512.png',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(RK_CACHE).then(cache => cache.addAll(APP_SHELL).catch(() => null)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== RK_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(RK_CACHE).then(cache => cache.put(request, copy)).catch(() => null);
      }
      return response;
    }).catch(() => {
      if (request.mode === 'navigate') {
        return caches.match(request).then(cached => cached || caches.match('/index.html'));
      }

      return caches.match(request);
    })
  );
});
