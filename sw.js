// Version substituée à chaque déploiement (Netlify build) via bump-sw-version.sh
const SW_VERSION = '0.0.3';
const CACHE_NAME = `test-pwa-cache-v1-${SW_VERSION}`;
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app.js',
  '/styles.css'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith('test-pwa-cache-v1-') || k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Réception de messages du client (skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});


