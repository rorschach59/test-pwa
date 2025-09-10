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


// Réception d'un push et affichage d'une notification
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { title: 'Notification', body: event.data ? event.data.text() : 'Push reçu' };
  }

  const title = payload.title || 'Push 🔔';
  const options = {
    body: payload.body || 'Push reçu',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data || {},
    tag: payload.tag,
    actions: payload.actions,
    silent: payload.silent || false,
    requireInteraction: payload.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Interaction sur la notification (focus ou ouverture)
self.addEventListener('notificationclick', (event) => {
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const target = new URL(url, self.location.origin).href;
      for (const client of clientList) {
        // Focus si un onglet de la même origine est déjà ouvert
        if (client.url === target || client.url === self.location.origin + '/' || client.url.startsWith(self.location.origin)) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

