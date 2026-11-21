const CACHE_NAME = 'qing-shengshi-__BUILD_CACHE_ID__';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const res = await fetch('./sw-precache.json', { cache: 'no-cache' });
        if (res.ok) {
          const manifest = await res.json();
          const urls = ['./', './index.html', './manifest.webmanifest', ...(manifest.precache || [])];
          await Promise.allSettled(urls.map((u) => cache.add(u)));
        }
      } catch {
        // Ignore install precache errors on restricted school networks
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('qing-shengshi-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. HTML Navigation: Network-first with 4s classroom Wi-Fi timeout -> Cache fallback
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        try {
          const fresh = await fetch(request, { signal: controller.signal });
          clearTimeout(timer);
          if (fresh && fresh.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          clearTimeout(timer);
          const cached =
            (await caches.match(request)) ||
            (await caches.match('./index.html')) ||
            (await caches.match('./'));
          if (cached) return cached;
          return fetch(request);
        }
      })()
    );
    return;
  }

  // 2. Static Game Assets (.webp, .png, .svg, .js, .css, .webmanifest): Cache-first
  if (
    url.pathname.includes('/assets/') ||
    /\.(?:webp|png|svg|js|css|webmanifest)$/i.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const resp = await fetch(request);
        if (resp && resp.ok && resp.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, resp.clone());
        }
        return resp;
      })()
    );
  }
});
