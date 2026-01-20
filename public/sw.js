const CACHE_NAME = 'linksoc-static-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass-through simples para rede
    // O cache de dados é gerenciado manualmente pelo app (Cache API)
    event.respondWith(fetch(event.request).catch(() => {
        return caches.match(event.request);
    }));
});
