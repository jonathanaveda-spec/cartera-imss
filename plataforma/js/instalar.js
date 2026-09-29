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

// ---------- iPhone: guía visual ----------
// Íconos dibujados como los de Safari, para que la persona reconozca qué botón buscar.
const ICONO = {
  compartir: '<svg class="ico-ios" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  mas: '<svg class="ico-ios" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>',
  agregar: '<svg class="ico-ios" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};
const ENLACE = 'https://carteraasesor.com/app/?instalar=1';
/** Safari de iOS 26 en adelante: Compartir quedó dentro del botón ••• de la barra. */
const safariNuevo = () => Number((/Version\/(\d+)/.exec(ua()) || [])[1]) >= 26;
const otroNavegadorIOS = () => /CriOS|FxiOS|EdgiOS|GSA\//.test(ua());
export const esIPhone = () => /iPhone|iPod/.test(ua());

const paso = (n, html) => `<li class="paso-ios"><span class="num">${n}</span><div>${html}</div></li>`;

/** Guía de 4 pasos con íconos. `flecha`: muestra una flecha que apunta a la barra de Safari. */
export function guiaIOS({ flecha = false } = {}) {
  const nuevo = safariNuevo();
  const otro = otroNavegadorIOS();
  const paso1 = otro
    ? `Toca ${ICONO.compartir} <b>Compartir</b> (arriba, junto a la dirección).`
    : nuevo
      ? `Toca ${ICONO.mas} <b>(tres puntos)</b> en la barra de abajo y luego ${ICONO.compartir} <b>Compartir</b>.`
      : `Toca ${ICONO.compartir} <b>Compartir</b> en la barra de abajo de Safari (el cuadrito con flecha).<div class="mini">¿No ves la barra? Toca una vez la parte de abajo de la pantalla.</div>`;
  return `<ol class="guia-ios">
      ${paso(1, paso1)}
      ${paso(2, `Desliza la lista hacia arriba y toca ${ICONO.agregar} <b>«Agregar a inicio»</b>.<div class="mini">En algunos iPhone dice «Agregar a pantalla de inicio».</div>`)}
      ${paso(3, 'Si aparece <b>«Abrir como app web»</b>, déjalo encendido. Toca <b>Agregar</b> (arriba a la derecha).')}
      ${paso(4, 'Listo: busca el ícono <b>Cartera</b> en tu pantalla de inicio y entra siempre desde ahí.')}
    </ol>
    ${otro ? '<p class="mini">Si no te aparece «Agregar a inicio», abre la página en <b>Safari</b> (la brújula azul) y repite.</p>' : ''}
    <details class="ayuda-ios"><summary>¿No encuentras los botones?</summary>
      <p>Si abriste el enlace desde <b>WhatsApp</b> u otra app, primero ábrelo en Safari: toca el ícono de la <b>brújula</b> o <b>«Abrir en Safari»</b> (abajo a la derecha).</p>
      <p>O copia el enlace y pégalo en Safari:</p>
      <button class="btn chico" type="button" data-copiar-enlace>📋 Copiar enlace</button>
    </details>
    ${flecha && esIPhone() && !otro ? `<div class="flecha-safari${nuevo ? ' derecha' : ''}" aria-hidden="true">⬇</div>` : ''}`;
}

/** Enlaza el botón «Copiar enlace» de la guía (si está dentro de `raiz`). */
export function enlazarGuia(raiz) {
  raiz.querySelector('[data-copiar-enlace]')?.addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(ENLACE); e.target.textContent = '✅ Enlace copiado: pégalo en Safari'; } catch { e.target.textContent = ENLACE; }
  });
}

function pasosIOS() {
  return guiaIOS();
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
  return esIOS() ? `<p class="acceso-texto">En iPhone se instala desde Safari en 4 pasos:</p>${guiaIOS({ flecha: true })}` : pasosMenu();
}

/** Bloque para la pantalla de acceso: botón en Android/PC, pasos en iPhone, nada si ya está instalada. */
export function htmlZona() {
  if (instalada()) return '';
  if (puedeInstalar()) {
    return `<div class="instalar-zona"><button class="btn primario" type="button" data-instalar style="width:100%">⬇ Instalar la app</button>
      <p class="mini">Queda en tu pantalla de inicio, como cualquier app.</p></div>`;
  }
  if (esIOS()) return `<details class="instalar-zona instalar-ios"><summary><b>📲 Instálala en tu iPhone</b> <span class="mini">· ver cómo (4 pasos)</span></summary>${pasosIOS()}</details>`;
  return '';
}
