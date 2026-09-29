// Actualizaciones automáticas (app de asesores y panel de administración).
// Cada publicación trae un service worker nuevo: GitHub Actions le pone como versión el código del commit
// (tools/sello-sw.py). Aquí se busca esa versión nueva al abrir, al volver a la app y cada 30 minutos;
// cuando toma el control, la página se recarga sola. Si hay una ventana abierta o se está escribiendo,
// se espera a que termine para no perder lo que la persona estaba haciendo.
const CADA = 30 * 60 * 1000;

function ocupado() {
  if (document.querySelector('#modales .fondo-modal')) return true;
  const a = document.activeElement;
  return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.value);
}

export function activarActualizaciones() {
  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  const yaHabiaVersion = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    const buscar = () => reg.update().catch(() => { /* sin conexión: se reintenta después */ });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') buscar(); });
    window.addEventListener('online', buscar);
    setInterval(buscar, CADA);
  }).catch(() => { /* funciona igual, solo sin modo sin conexión */ });

  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // En la primera visita no hace falta recargar: la página ya es la versión más reciente.
    if (!yaHabiaVersion || recargando) return;
    const recargar = () => { if (!recargando) { recargando = true; location.reload(); } };
    if (!ocupado()) return recargar();
    const espera = setInterval(() => { if (!ocupado()) { clearInterval(espera); recargar(); } }, 1500);
  });
}
