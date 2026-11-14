// ASTRAMED service worker. Bump CACHE to invalidate old caches.
const CACHE = 'astramed-v2';
const BASE = new URL(self.registration.scope).pathname;
const SHELL = [BASE, BASE + 'index.html', BASE + 'icon.svg', BASE + 'manifest.webmanifest'];

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  // Discover the hashed build assets referenced by the shell and by its CSS so the app works offline after first load.
  const html = await (await fetch(BASE + 'index.html', { cache: 'no-cache' })).text();
  const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((m) => m[1]);
  for (const css of assets.filter((a) => a.endsWith('.css'))) {
    const text = await (await fetch(css)).text();
    for (const m of text.matchAll(/url\(([^)]*\/assets\/[^)]+)\)/g)) assets.push(m[1]);
  }
  await cache.addAll([...new Set(assets)]);
}

self.addEventListener('install', (e) => { e.waitUntil(precache().then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => (req.mode === 'navigate' ? caches.match(BASE + 'index.html') : Response.error()))),
  );
});
