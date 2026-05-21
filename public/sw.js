const CACHE = 'febecos-rev-v2';
const OFFLINE_URLS = ['/', '/portal'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network first — solo para requests del mismo origen
// Las llamadas a APIs externas (simulador-roi, supabase, etc.) NO se interceptan
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Solo manejar requests del mismo origen — nunca interceptar cross-origin
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => {
          try { c.put(e.request, clone); } catch (_) {}
        });
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
