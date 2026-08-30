// StockBit Pro service worker
//  • Navigations (HTML): network-first, so every deploy reaches users; cached shell is the offline fallback.
//  • Hashed build assets (/assets/*): cache-first (immutable by name).
//  • Other same-origin GETs: stale-while-revalidate.
//  • Never touches non-GET requests or cross-origin API calls (Supabase, Paystack, Google).
const CACHE_NAME = 'stockbit-pro-v3';
const SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let the browser handle APIs/CDNs

  // HTML navigations: network first.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Immutable hashed assets: cache first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(request, res.clone())).catch(() => {});
        return res;
      }))
    );
    return;
  }

  // Everything else same-origin: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') caches.open(CACHE_NAME).then((c) => c.put(request, res.clone())).catch(() => {});
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
