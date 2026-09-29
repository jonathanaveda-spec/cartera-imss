// Instalación de la app en la pantalla de inicio.
//  - Android / computador (Chrome, Edge, Brave…): el navegador ofrece "beforeinstallprompt" y se instala con un toque.
//  - iPhone / iPad: Safari no lo ofrece; se muestran los pasos (Compartir → Agregar a pantalla de inicio).
let evento = null;
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => { try { f(); } catch { /* ignorar */ } });

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); evento = e; avisar(); });
window.addEventListener('appinstalled', () => { evento = null; avisar(); });

export const esIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const instalada = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
export const puedeInstalar = () => !!evento && !instalada();
export const alCambiar = (f) => { oyentes.add(f); return () => oyentes.delete(f); };
/** El visitante llegó desde el botón "Instalar la app" de la página. */
export const pidioInstalar = () => new URLSearchParams(location.search).has('instalar');

export async function instalar() {
  if (!evento) return false;
  evento.prompt();
  const r = await evento.userChoice.catch(() => ({ outcome: 'dismissed' }));
  evento = null;
  avisar();
  return r.outcome === 'accepted';
}

/** Bloque para la pantalla de acceso: botón en Android/PC, pasos en iPhone, nada si ya está instalada. */
export function htmlZona(destacar = false) {
  if (instalada()) return '';
  if (puedeInstalar()) {
    return `<div class="instalar-zona${destacar ? ' destacar' : ''}"><button class="btn primario" type="button" data-instalar style="width:100%">⬇ Instalar la app</button>
      <p class="mini">Queda en tu pantalla de inicio, como cualquier app.</p></div>`;
  }
  if (esIOS()) {
    return `<div class="instalar-zona${destacar ? ' destacar' : ''}"><b>Instálala en tu iPhone</b>
      <ol class="mini" style="text-align:left;margin:6px 0 0;padding-left:20px">
        <li>Toca el botón <b>Compartir</b> <span aria-hidden="true">⬆︎</span> de Safari (abajo).</li>
        <li>Elige <b>«Agregar a pantalla de inicio»</b>.</li>
        <li>Abre la app desde el ícono nuevo.</li></ol></div>`;
  }
  // El navegador no ofreció el botón (aún no lo permite o no lo soporta): si la persona vino a instalar, damos los pasos a mano.
  if (destacar) {
    return `<div class="instalar-zona destacar"><b>Instálala desde el menú del navegador</b>
      <ol class="mini" style="text-align:left;margin:6px 0 0;padding-left:20px">
        <li>Toca el menú <b>⋮</b> (arriba a la derecha).</li>
        <li>Elige <b>«Instalar app»</b> o <b>«Agregar a pantalla de inicio»</b>.</li>
        <li>Si no aparece, abre esta página en <b>Chrome</b> y vuelve a intentarlo.</li></ol></div>`;
  }
  return '';
}
