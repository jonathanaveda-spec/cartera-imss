// Bloqueo de la app con PIN (y, si el teléfono lo permite, huella o Face ID).
// Es una pantalla de privacidad: si alguien toma el teléfono, no ve la cartera sin el PIN.
// Se guarda solo en este dispositivo (cada teléfono tiene su propio PIN) y va ligado a la cuenta que lo activó.
// Si se olvida el PIN: cerrar sesión y volver a entrar con correo y contraseña (los clientes están en la nube).

const CLAVE = 'cartera:bloqueo';
// Esperas que crecen con los fallos seguidos (el contador solo se reinicia al acertar):
// con 5 fallos → 30 s, 10 → 1 min, 15 → 5 min, 20 → 15 min y con 25 se cierra la sesión y se borra lo local.
// Así un PIN de 4 dígitos no se puede adivinar probando horas seguidas.
const ESPERAS = { 5: 30000, 10: 60000, 15: 300000, 20: 900000 };
export const FALLOS_PARA_CERRAR = 25;
const AVISAR_DESDE = 15; // desde aquí se muestra cuántos intentos quedan antes de cerrar la sesión

/** Texto de un tiempo de espera: «30 segundos», «1 minuto», «4 min 12 s». */
export function textoEspera(ms) {
  const s = Math.max(1, Math.ceil(ms / 1000));
  if (s < 60) return `${s} ${s === 1 ? 'segundo' : 'segundos'}`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (!r) return `${m} ${m === 1 ? 'minuto' : 'minutos'}`;
  return `${m} min ${r} s`;
}

/** Aviso de intentos restantes antes de cerrar la sesión (vacío si todavía falta mucho). */
export function textoQuedan(fallos) {
  const quedan = FALLOS_PARA_CERRAR - fallos;
  if (fallos < AVISAR_DESDE || quedan <= 0) return '';
  return `Te ${quedan === 1 ? 'queda 1 intento' : `quedan ${quedan} intentos`} antes de cerrar la sesión.`;
}

export const TIEMPOS = [
  [0, 'Cada vez que salgo de la app'],
  [1, 'Si salgo por más de 1 minuto'],
  [5, 'Si salgo por más de 5 minutos'],
  [20, 'Si salgo por más de 20 minutos'],
];

let uidActual = null;
let alOlvidar = null;
let bloqueada = false;
let ocultoDesde = null;
let escuchando = false;

const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || null; } catch { return null; } };
const escribir = (v) => { try { v ? localStorage.setItem(CLAVE, JSON.stringify(v)) : localStorage.removeItem(CLAVE); } catch { /* opcional */ } };
const config = () => { const c = leer(); return c && c.uid === uidActual ? c : null; };

const aB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const azar = (n) => crypto.getRandomValues(new Uint8Array(n));

async function huellaDe(pin, sal) {
  const datos = new TextEncoder().encode(`${sal}:${pin}`);
  return aB64(await crypto.subtle.digest('SHA-256', datos));
}

export const esIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
/** Nombre de la biometría según el teléfono, para los textos. */
export const nombreBiometria = () => (esIOS() ? 'Face ID o Touch ID' : 'huella');

/** ¿Este dispositivo puede desbloquear con huella / Face ID? */
export async function biometriaDisponible() {
  try {
    return !!(globalThis.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch { return false; }
}

export const activo = () => !!config();
export const minutos = () => config()?.minutos ?? 5;
export const conBiometria = () => !!config()?.credencial;

/** Guarda un PIN nuevo (activa el bloqueo o cambia el PIN). */
export async function guardarPin(pin, mins = minutos()) {
  const sal = aB64(azar(16));
  const previa = config();
  escribir({ uid: uidActual, sal, hash: await huellaDe(pin, sal), minutos: mins, credencial: previa?.credencial || null, fallos: 0, esperaHasta: 0 });
}

export async function pinCorrecto(pin) {
  const c = config();
  return !!c && (await huellaDe(pin, c.sal)) === c.hash;
}

export function cambiarMinutos(mins) {
  const c = config();
  if (c) escribir({ ...c, minutos: mins });
}

export function quitar() {
  if (config()) escribir(null);
}

/** Registra la huella / Face ID de este teléfono para desbloquear. */
export async function activarBiometria(correo = '') {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: azar(32),
      rp: { name: 'Cartera Asesor' },
      user: { id: azar(16), name: correo || 'asesor', displayName: correo || 'Asesor' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000,
      attestation: 'none',
    },
  });
  const c = config();
  if (c && cred) escribir({ ...c, credencial: aB64(cred.rawId) });
}

export function quitarBiometria() {
  const c = config();
  if (c) escribir({ ...c, credencial: null });
}

async function pedirBiometria() {
  const c = config();
  if (!c?.credencial) return false;
  try {
    const r = await navigator.credentials.get({
      publicKey: {
        challenge: azar(32),
        allowCredentials: [{ type: 'public-key', id: deB64(c.credencial), transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return !!r;
  } catch { return false; }
}

// ---------------------------------------------------------------- pantalla de bloqueo
function ponerInerte(si) {
  for (const el of document.body.children) {
    if (el.id !== 'bloqueo' && el.tagName !== 'SCRIPT') el.inert = si;
  }
}

function mostrar() {
  if (bloqueada || !config()) return;
  bloqueada = true;
  const bio = conBiometria();
  const el = document.createElement('div');
  el.id = 'bloqueo';
  el.className = 'bloqueo';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'App bloqueada');
  const tecla = (t, extra = '') => `<button type="button" class="tecla ${extra}" data-t="${t}">${t}</button>`;
  el.innerHTML = `<div class="bloqueo-caja">
      <img src="icons/logo.png" alt="" class="bloqueo-logo" width="72" height="72">
      <h2>Tu cartera está protegida</h2>
      <p class="bloqueo-msj" aria-live="polite">Ingresa tu PIN</p>
      <div class="bloqueo-puntos" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="teclado">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => tecla(n)).join('')}
        ${bio ? `<button type="button" class="tecla accion" data-bio aria-label="Usar ${nombreBiometria()}">${esIOS() ? '🙂' : '👆'}</button>` : '<span></span>'}
        ${tecla(0)}
        <button type="button" class="tecla accion" data-borrar aria-label="Borrar">⌫</button>
      </div>
      ${bio ? `<button type="button" class="bloqueo-enlace" data-bio>Usar ${nombreBiometria()}</button>` : ''}
      <button type="button" class="bloqueo-enlace" data-olvide>¿Olvidaste tu PIN?</button>
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add('bloqueado');
  ponerInerte(true);

  let pin = '';
  // Se buscan cada vez: «¿Olvidaste tu PIN?» → «Volver» vuelve a crear estos elementos.
  const msj = () => el.querySelector('.bloqueo-msj');
  const pintar = () => el.querySelectorAll('.bloqueo-puntos i').forEach((p, i) => p.classList.toggle('lleno', i < pin.length));
  const error = (texto) => {
    msj().textContent = texto;
    msj().classList.add('mal');
    const caja = el.querySelector('.bloqueo-puntos');
    if (!caja) return;
    caja.classList.remove('sacudir');
    void caja.offsetWidth; // reinicia la animación
    caja.classList.add('sacudir');
    navigator.vibrate?.(120);
  };
  const faltaEspera = () => (config()?.esperaHasta || 0) - Date.now();
  // Mientras dura la espera el mensaje cuenta hacia atrás solo; al terminar avisa que ya se puede intentar.
  const cuentaAtras = () => {
    clearInterval(el.reloj);
    const pintarEspera = () => {
      const falta = faltaEspera();
      const m = msj();
      if (!m) return;
      if (falta <= 0) {
        clearInterval(el.reloj);
        m.classList.remove('mal');
        m.textContent = 'Ya puedes intentar de nuevo. Ingresa tu PIN.';
        return;
      }
      m.classList.add('mal');
      const quedan = textoQuedan(config()?.fallos || 0);
      m.textContent = `Demasiados intentos. Espera ${textoEspera(falta)}.${quedan ? ' ' + quedan : ''}`;
    };
    pintarEspera();
    el.reloj = setInterval(pintarEspera, 1000);
  };
  const enEspera = () => {
    if (faltaEspera() > 0) { error(''); cuentaAtras(); return true; }
    return false;
  };
  // Con 25 fallos seguidos: se cierra la sesión y se borra lo local (el mismo camino que «¿Olvidaste tu PIN?»).
  const cerrarPorFallos = async () => {
    clearInterval(el.reloj);
    escribir(null);
    const caja = el.querySelector('.bloqueo-caja');
    caja.innerHTML = `<h2>Sesión cerrada por seguridad</h2>
      <p class="bloqueo-texto">Fueron demasiados intentos con un PIN incorrecto. Por seguridad se cerró tu sesión en este teléfono.</p>
      <p class="bloqueo-texto">Tus clientes siguen en la nube: vuelve a entrar con tu <b>correo y contraseña</b>.</p>`;
    await alOlvidar?.();
  };

  const comprobar = async () => {
    if (enEspera()) { pin = ''; pintar(); return; }
    if (await pinCorrecto(pin)) { escribir({ ...config(), fallos: 0, esperaHasta: 0 }); ocultar(); return; }
    const c = config();
    const fallos = (c.fallos || 0) + 1;
    pin = '';
    pintar();
    if (fallos >= FALLOS_PARA_CERRAR) { await cerrarPorFallos(); return; }
    const espera = ESPERAS[fallos] || 0;
    escribir({ ...c, fallos, esperaHasta: espera ? Date.now() + espera : 0 });
    if (espera) {
      error('');
      cuentaAtras();
    } else {
      error(`PIN incorrecto. Intenta de nuevo.${textoQuedan(fallos) ? ' ' + textoQuedan(fallos) : ''}`);
    }
  };

  // Si la pantalla se vuelve a bloquear en plena espera (o con pocos intentos), se muestra el estado de una vez.
  if (faltaEspera() > 0) { msj().classList.add('mal'); cuentaAtras(); } else if (textoQuedan(config()?.fallos || 0)) msj().textContent = `Ingresa tu PIN. ${textoQuedan(config().fallos)}`;

  const teclear = (t) => {
    if (pin.length >= 4 || !el.querySelector('.bloqueo-puntos')) return;
    if (faltaEspera() > 0) { enEspera(); return; }
    pin += t;
    pintar();
    msj()?.classList.remove('mal');
    if (pin.length === 4) setTimeout(comprobar, 120);
  };
  const borrar = () => { pin = pin.slice(0, -1); pintar(); };
  const usarBio = async () => {
    if (!(await pedirBiometria())) return;
    const c = config();
    if (c) escribir({ ...c, fallos: 0, esperaHasta: 0 }); // acertar con la huella también reinicia el contador
    ocultar();
  };

  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]');
    if (t) return teclear(t.dataset.t);
    if (e.target.closest('[data-borrar]')) return borrar();
    if (e.target.closest('[data-bio]')) return usarBio();
    if (e.target.closest('[data-olvide]')) { pin = ''; return olvide(el); }
  });
  el.teclado = (e) => {
    if (/^\d$/.test(e.key)) { e.preventDefault(); teclear(e.key); } else if (e.key === 'Backspace') { e.preventDefault(); borrar(); }
  };
  document.addEventListener('keydown', el.teclado, true);
  el.querySelector('.tecla').focus({ preventScroll: true });
  // En Android se puede pedir la huella de una vez; en iPhone el sistema exige que se toque el botón.
  if (bio && !esIOS()) usarBio();
}

function ocultar() {
  const el = document.getElementById('bloqueo');
  if (el) {
    clearInterval(el.reloj);
    document.removeEventListener('keydown', el.teclado, true);
    el.remove();
  }
  ponerInerte(false);
  if (!document.querySelector('#modales > *') && document.getElementById('acceso')?.hidden !== false) document.body.classList.remove('bloqueado');
  bloqueada = false;
}

function olvide(el) {
  const caja = el.querySelector('.bloqueo-caja');
  const antes = caja.innerHTML;
  caja.innerHTML = `<h2>¿Olvidaste tu PIN?</h2>
    <p class="bloqueo-texto">Cierra sesión y vuelve a entrar con tu <b>correo y contraseña</b>. El PIN se quita y podrás crear uno nuevo.</p>
    <p class="bloqueo-texto">Tus clientes están guardados en la nube: no se pierden. Hazlo <b>con internet</b> para que se guarden también los últimos cambios.</p>
    <button type="button" class="btn primario completo" data-salir>Cerrar sesión</button>
    <button type="button" class="bloqueo-enlace" data-volver>Volver a intentar con el PIN</button>`;
  caja.querySelector('[data-volver]').addEventListener('click', (e) => { e.stopPropagation(); caja.innerHTML = antes; caja.querySelector('.tecla')?.focus(); });
  caja.querySelector('[data-salir]').addEventListener('click', async (e) => {
    e.stopPropagation();
    e.currentTarget.disabled = true;
    escribir(null);
    await alOlvidar?.();
  });
}

/**
 * Se llama al entrar a la app con la cuenta `uid`. Si el bloqueo está activo, pide el PIN ya mismo
 * y queda atento a cuando la app vuelve de segundo plano.
 */
export function iniciar(uid, { salir } = {}) {
  uidActual = uid;
  alOlvidar = salir;
  if (config()) mostrar();
  if (escuchando) return;
  escuchando = true;
  document.addEventListener('visibilitychange', () => {
    if (!config()) return;
    if (document.hidden) {
      ocultoDesde = Date.now();
      // «Cada vez que salgo»: se bloquea al salir, así la vista previa de apps recientes tampoco muestra la cartera.
      if (minutos() === 0) mostrar();
    } else if (ocultoDesde != null && Date.now() - ocultoDesde >= minutos() * 60000) {
      mostrar();
    }
  });
}

/** Al cerrar sesión: el PIN de este dispositivo se olvida. */
export function alSalir() {
  escribir(null);
  uidActual = null;
}
