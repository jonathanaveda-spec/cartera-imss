// Service worker: deja la app disponible sin conexión. Los datos NO pasan por aquí (viven en IndexedDB).
const VERSION = 'cartera-imss-v4';
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/main.js', 'js/ui.js', 'js/store.js', 'js/excel.js', 'js/logic.js', 'js/nube.js', 'js/sincro.js', 'js/acceso.js', 'js/nube-config.js',
  'vendor/xlsx.full.min.js', 'vendor/firebase.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

// Instalación atómica: todos los archivos se descargan juntos y saltándose la caché HTTP (GitHub Pages guarda
// los archivos 10 minutos y eso mezclaba versiones viejas y nuevas). Si algo falla, se queda la versión anterior.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.all(ARCHIVOS.map((u) => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Todo sale de la caché de la versión instalada (conjunto consistente). Las actualizaciones llegan al instalarse
// una versión nueva del service worker (al subir de VERSION), nunca archivo por archivo.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const guardado = await cache.match(req, { ignoreSearch: true });
      if (guardado) return guardado;
      try {
        const r = await fetch(req);
        if (r && r.ok) cache.put(req, r.clone());
        return r;
      } catch {
        return req.mode === 'navigate' ? cache.match('index.html') : Response.error();
      }
    })
  );
});
