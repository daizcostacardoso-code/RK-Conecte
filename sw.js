const RK_CACHE = 'rk-conecte-v0.8.0';
const APP_SHELL = [
  '/',
  '/index.html',
  '/paginas/servicos-publico.html',
  '/paginas/produtos-publico.html',
  '/paginas/galeria.html',
  '/paginas/contato.html',
  '/paginas/orcamento.html',
  '/paginas/projetos.html',
  '/paginas/medicao-obra.html',
  '/paginas/nota-servico.html',
  '/paginas/caixa.html',
  '/css/style.css',
  '/css/medicao-obra.css',
  '/css/nota-servico.css',
  '/css/caixa-basico.css',
  '/js/public-site.js',
  '/js/app-install.js',
  '/js/conecte-signature.js',
  '/js/shared/rk-navigation.js',
  '/js/shared/rk-firestore-store.js',
  '/js/shared/rk-draft-state.js',
  '/js/projetos/projeto-operacional-model.js',
  '/js/projetos/projeto-operacional-repository.js',
  '/js/projetos/projeto-operacional-service.js',
  '/js/storage/firestore-adapter.js',
  '/js/medicoes/medicao-model.js',
  '/js/medicoes/medicao-operacional-model.js',
  '/js/medicoes/medicao-operacional-repository.js',
  '/js/medicoes/medicao-ui.js',
  '/js/medicoes/medicao-controller.js',
  '/js/medicoes/medicao-pdf.js',
  '/js/notas-servico/nota-servico-model.js',
  '/js/notas-servico/ordem-servico-operacional-model.js',
  '/js/notas-servico/ordem-servico-operacional-repository.js',
  '/js/notas-servico/nota-servico-ui.js',
  '/js/notas-servico/nota-servico-controller.js',
  '/js/notas-servico/nota-servico-pdf.js',
  '/js/caixa/caixa-model.js',
  '/js/caixa/caixa-validator.js',
  '/js/caixa/caixa-repository.js',
  '/js/caixa/caixa-export.js',
  '/js/caixa/caixa-service.js',
  '/js/caixa/caixa-basico-controller.js',
  '/js/vendor/pdf-lib.min.js',
  '/imagens/logo.jpeg',
  '/assets/conecte-logo.png',
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
