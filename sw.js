/* Service worker: bewaart de app op het toestel zodat ze ook zonder internet werkt.
   Strategie "stale-while-revalidate": toon meteen de bewaarde versie en haal op de
   achtergrond de nieuwste op; die is er bij de volgende keer openen.
   Verhoog VERSION bij een grote wijziging om oude bestanden meteen op te ruimen. */
const VERSION = 'v3';
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
    caches.open(CACHE).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((cached) => {
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        if (cached) e.waitUntil(fresh);
        return cached || fresh;
      })
    )
  );
});
