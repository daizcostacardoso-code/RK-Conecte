const RK_CACHE = 'rk-vidracaria-v3.2.0';
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/imagens/logo.jpeg',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(RK_CACHE).then(cache => cache.addAll(APP_SHELL).catch(() => null)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== RK_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    fetch(request).then(response => {
      const copy = response.clone();
      caches.open(RK_CACHE).then(cache => cache.put(request, copy)).catch(() => null);
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
  );
});
