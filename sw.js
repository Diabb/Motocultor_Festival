const CACHE = 'motocultor-v8';
const ASSETS = ['./index.html', './data.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    // 1. Stratégie "Network-First" : on essaie d'abord de récupérer la dernière version en ligne
    fetch(e.request).then(res => {
      const clone = res.clone();
      // Si ça marche, on met à jour notre cache silencieusement
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => {
      // 2. Si la requête échoue (ex: mode hors-ligne sur le site du festival), on pioche dans le cache
      return caches.match(e.request).then(r => {
        return r || caches.match('./index.html');
      });
    })
  );
});