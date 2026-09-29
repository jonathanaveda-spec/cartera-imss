// Bloqueo de la app con PIN (y, si el teléfono lo permite, huella o Face ID).
// Es una pantalla de privacidad: si alguien toma el teléfono, no ve la cartera sin el PIN.
// Se guarda solo en este dispositivo (cada teléfono tiene su propio PIN) y va ligado a la cuenta que lo activó.
// Si se olvida el PIN: cerrar sesión y volver a entrar con correo y contraseña (los clientes están en la nube).

const CLAVE = 'cartera:bloqueo';
const INTENTOS_ANTES_DE_ESPERAR = 5;
const ESPERA_MS = 30000;

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
  const enEspera = () => {
    const c = config();
    const falta = (c?.esperaHasta || 0) - Date.now();
    if (falta > 0) { error(`Demasiados intentos. Espera ${Math.ceil(falta / 1000)} segundos.`); return true; }
    return false;
  };

  const comprobar = async () => {
    if (enEspera()) { pin = ''; pintar(); return; }
    if (await pinCorrecto(pin)) { escribir({ ...config(), fallos: 0, esperaHasta: 0 }); ocultar(); return; }
    const c = config();
    const fallos = (c.fallos || 0) + 1;
    const espera = fallos >= INTENTOS_ANTES_DE_ESPERAR;
    escribir({ ...c, fallos: espera ? 0 : fallos, esperaHasta: espera ? Date.now() + ESPERA_MS : 0 });
    pin = '';
    pintar();
    error(espera ? 'Demasiados intentos. Espera 30 segundos.' : 'PIN incorrecto. Intenta de nuevo.');
  };

  const teclear = (t) => {
    if (pin.length >= 4 || !el.querySelector('.bloqueo-puntos')) return;
    pin += t;
    pintar();
    msj()?.classList.remove('mal');
    if (pin.length === 4) setTimeout(comprobar, 120);
  };
  const borrar = () => { pin = pin.slice(0, -1); pintar(); };
  const usarBio = async () => { if (await pedirBiometria()) ocultar(); };

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
