// Instalación de la app en la pantalla de inicio.
//  - Android / computador (Chrome, Edge, Brave…): el navegador ofrece "beforeinstallprompt" y se instala con un toque.
//  - iPhone / iPad: Safari no lo ofrece; se muestran los pasos (Compartir → Agregar a pantalla de inicio).
let evento = null;
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => { try { f(); } catch { /* ignorar */ } });

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); evento = e; avisar(); });
window.addEventListener('appinstalled', () => { evento = null; avisar(); });

const ua = () => navigator.userAgent;
export const esIOS = () => /iPhone|iPad|iPod/.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const esAndroid = () => /Android/i.test(ua());
/** Navegadores dentro de otras apps (Facebook, Instagram, TikTok…): no permiten instalar. */
export const enNavegadorDeApp = () => /FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|musical_ly|Snapchat|Twitter/i.test(ua());
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

const lista = (pasos) => `<ol class="pasos-instalar">${pasos.map((p) => `<li>${p}</li>`).join('')}</ol>`;

function pasosIOS() {
  if (/CriOS|FxiOS|EdgiOS/.test(ua())) {
    return lista([
      'Toca el botón <b>Compartir</b> <span aria-hidden="true">⬆︎</span> (arriba, junto a la dirección).',
      'Elige <b>«Agregar a pantalla de inicio»</b> y luego <b>Agregar</b>.',
      'Si no aparece, abre <b>carteraasesor.com</b> en <b>Safari</b> y repite.',
    ]);
  }
  return lista([
    'Toca el botón <b>Compartir</b> <span aria-hidden="true">⬆︎</span> de Safari (abajo). Si no lo ves, toca primero <b>⋯</b>.',
    'Baja y elige <b>«Agregar a pantalla de inicio»</b>.',
    'Toca <b>Agregar</b> (arriba a la derecha).',
  ]);
}

function pasosMenu() {
  return lista([
    'Toca el menú <b>⋮</b> del navegador (arriba a la derecha).',
    'Elige <b>«Instalar app»</b> o <b>«Agregar a pantalla de inicio»</b>.',
    'Si se queda «descargando», espera 1 o 2 minutos. Si no avanza, abre esta página en <b>Chrome</b> y repite.',
  ]);
}

/** Contenido de la pantalla dedicada a instalar (cuando la persona llegó desde "Instalar la app"). */
export function htmlPantalla() {
  if (enNavegadorDeApp()) {
    return `<p class="acceso-texto">Estás dentro de otra app (Facebook, Instagram…) y desde aquí no se puede instalar.</p>
      ${lista([
        `Toca el menú <b>⋯</b> de esta ventana.`,
        `Elige <b>«Abrir en ${esIOS() ? 'Safari' : 'el navegador'}»</b>.`,
        'Allí vuelve a tocar <b>«Instalar la app»</b>.',
      ])}`;
  }
  if (puedeInstalar()) {
    return `<button class="btn primario instalar-grande" type="button" data-instalar style="width:100%">⬇ Instalar la app</button>
      <p class="mini" style="margin-top:8px">Queda en tu pantalla de inicio, como cualquier app.</p>`;
  }
  return esIOS() ? pasosIOS() : pasosMenu();
}

/** Bloque para la pantalla de acceso: botón en Android/PC, pasos en iPhone, nada si ya está instalada. */
export function htmlZona() {
  if (instalada()) return '';
  if (puedeInstalar()) {
    return `<div class="instalar-zona"><button class="btn primario" type="button" data-instalar style="width:100%">⬇ Instalar la app</button>
      <p class="mini">Queda en tu pantalla de inicio, como cualquier app.</p></div>`;
  }
  if (esIOS()) return `<div class="instalar-zona"><b>Instálala en tu iPhone</b>${pasosIOS()}</div>`;
  return '';
}
