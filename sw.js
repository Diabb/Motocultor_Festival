const CACHE_NAME = 'motocultor-v9';
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. STRATÉGIE "CACHE-ONLY" (SÉCURITÉ MAXIMALE)
  // On ne sollicite JAMAIS le réseau pour les assets statiques.
  // Ils ont été téléchargés lors de l'installation.
  if (ASSETS.includes(url.pathname) || url.pathname.endsWith('.png')) {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
    return;
  }

  // 2. STRATÉGIE "STALE-WHILE-REVALIDATE" (DATA)
  // On affiche le cache instantanément. On vérifie le réseau en tâche de fond.
  e.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(e.request);
      const networkPromise = fetch(e.request).then((networkResponse) => {
        cache.put(e.request, networkResponse.clone());
        return networkResponse;
      }).catch(() => console.log('Réseau indisponible, maintien du cache'));
      
      return cachedResponse || networkPromise;
    })
  );
});