/* Service worker: bewaart de app op het toestel zodat ze ook zonder internet werkt.
   Strategie "network-first": haal altijd eerst de nieuwste versie op (zo passen HTML,
   CSS en JS altijd bij elkaar) en val alleen zonder internet terug op de bewaarde kopie.
   Verhoog VERSION bij een nieuwe versie om oude bestanden op te ruimen. */
const VERSION = 'v24';
const CACHE = 'verkeer-in-beeld-' + VERSION;
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/types.js',
  'js/presets.js',
  'fonts/lexend-latin.woff2',
  'fonts/lexend-latin-ext.woff2',
  'icons/icon.svg',
  'icons/pattern.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
