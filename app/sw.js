// Service worker: deja la app disponible sin conexión. Los datos NO pasan por aquí (viven en IndexedDB).
const VERSION = 'cartera-imss-v2';
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/main.js', 'js/ui.js', 'js/store.js', 'js/excel.js', 'js/logic.js',
  'vendor/xlsx.full.min.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Responde desde la caché y actualiza en segundo plano (la siguiente apertura ya trae la versión nueva).
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const guardado = await cache.match(req, { ignoreSearch: true });
      const red = fetch(req).then((r) => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
      return guardado || (await red) || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
    })
  );
});
