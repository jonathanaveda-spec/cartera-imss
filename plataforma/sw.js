// Service worker: deja la app disponible sin conexión. Los datos NO pasan por aquí (viven en IndexedDB).
const VERSION = 'cartera-asesor-v23'; // al publicar, GitHub Actions la cambia por el código del commit (tools/sello-sw.py)
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/main.js', 'js/ui.js', 'js/store.js', 'js/excel.js', 'js/logic.js', 'js/nube.js', 'js/sincro.js', 'js/acceso.js', 'js/nube-config.js', 'js/plan.js', 'js/marca.js', 'js/instalar.js', 'js/pantalla.js', 'js/actualizar.js', 'privacidad.html', 'terminos.html',
  'admin.html', 'admin.webmanifest', 'js/admin.js',
  'vendor/xlsx.full.min.js', 'vendor/firebase.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/logo.png',
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
        // Lo que no está en ARCHIVOS se pide saltándose la caché HTTP (GitHub Pages guarda 10 minutos):
        // si no, se podía guardar aquí una copia vieja y quedarse pegada hasta la siguiente versión.
        const r = await fetch(req.mode === 'navigate' ? req : new Request(req, { cache: 'no-cache' }));
        if (r && r.ok) cache.put(req, r.clone());
        return r;
      } catch {
        return req.mode === 'navigate' ? cache.match('index.html') : Response.error();
      }
    })
  );
});

// ---------- Aviso diario («Hoy pagan 3 · 2 morosos») ----------
// Lo manda GitHub Actions por Firebase Cloud Messaging (tools/enviar-avisos.mjs) como mensaje de datos:
// { titulo, cuerpo, url }. Se muestra aunque la app esté cerrada; al tocarlo abre (o trae al frente) la app.
self.addEventListener('push', (e) => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch { m = { data: { cuerpo: e.data && e.data.text() } }; }
  const d = { ...(m.notification || {}), ...(m.data || {}) };
  const titulo = d.titulo || d.title || 'Cartera Asesor';
  e.waitUntil(self.registration.showNotification(titulo, {
    body: d.cuerpo || d.body || 'Revisa tus cobros de hoy.',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'aviso-diario',          // un aviso nuevo reemplaza al de ayer
    data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
    const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
    return abierta ? abierta.focus() : self.clients.openWindow(destino);
  }));
});
