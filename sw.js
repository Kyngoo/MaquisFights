const CACHE = 'maquisfights-v13';
const ASSETS = ['/style.css', '/cards.js?v=11', '/game.js?v=11', '/manifest.json', '/db.js?v=11', '/config.js?v=11'];

// Install — cachear solo assets, NUNCA index.html
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — borrar todos los caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — index.html SIEMPRE de red; resto: red primero, caché de fallback
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  const url = new URL(e.request.url);
  // index.html nunca se cachea — siempre fresco
  if(url.pathname === '/' || url.pathname === '/index.html'){
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
