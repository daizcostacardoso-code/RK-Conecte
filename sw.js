const RK_CACHE = 'rk-conecte-v0.9.1-loading-v4';
const APP_SHELL = [
  '/',
  '/index.html',
  '/404.html',
  '/paginas/login.html',
  '/paginas/loading.html',
  '/paginas/dashboard-comercial.html',
  '/paginas/clientes.html',
  '/paginas/funcionario.html',
  '/paginas/orcamento-inteligente.html',
  '/paginas/novo-orcamento.html',
  '/paginas/orcamento.html',
  '/paginas/projetos.html',
  '/paginas/produtos.html',
  '/paginas/valores.html',
  '/paginas/arquivos.html',
  '/paginas/compartilhar-documento.html',
  '/paginas/servicos-publico.html',
  '/paginas/produtos-publico.html',
  '/paginas/galeria.html',
  '/paginas/contato.html',
  '/paginas/medicao-obra.html',
  '/paginas/nota-servico.html',
  '/paginas/caixa.html',
  '/paginas/acessos.html',
  '/css/style.css',
  '/css/medicao-obra.css',
  '/css/nota-servico.css',
  '/css/caixa-basico.css',
  '/css/acessos.css',
  '/js/public-site.js',
  '/js/app-install.js',
  '/js/conecte-signature.js',
  '/js/shared/rk-loading-screen.js',
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
  '/js/caixa/financeiro-operacional-model.js',
  '/js/caixa/financeiro-operacional-repository.js',
  '/js/acessos/acesso-model.js',
  '/js/acessos/acesso-repository.js',
  '/js/acessos/acesso-controller.js',
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
  event.waitUntil(caches.open(RK_CACHE).then(cache => Promise.allSettled(APP_SHELL.map(item => cache.add(item)))));
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

  if (url.pathname === '/js/shared/rk-loading-screen.js' || url.pathname === '/imagens/logo.jpeg' || url.pathname === '/assets/conecte-logo.png') {
    const atualizacao = fetch(request).then(response => {
      if (response && response.ok) caches.open(RK_CACHE).then(cache => cache.put(request, response.clone())).catch(() => null);
      return response;
    });
    event.waitUntil(atualizacao.catch(() => null));
    event.respondWith(caches.match(request, { ignoreSearch: true }).then(cached => cached || atualizacao));
    return;
  }

  if (request.mode === 'navigate') {
    const atualizacao = fetch(request).then(response => {
      if (response && response.ok) caches.open(RK_CACHE).then(cache => cache.put(request, response.clone())).catch(() => null);
      return response;
    });
    event.waitUntil(atualizacao.catch(() => null));
    event.respondWith(caches.match(request, { ignoreSearch: true }).then(cached => {
      if (!cached) return atualizacao.catch(() => caches.match('/index.html'));
      const redeSegura = atualizacao.then(response => response?.ok ? response : cached).catch(() => cached);
      const limite = new Promise(resolve => setTimeout(() => resolve(cached), 550));
      return Promise.race([redeSegura, limite]);
    }));
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
      return caches.match(request, { ignoreSearch: true });
    })
  );
});
