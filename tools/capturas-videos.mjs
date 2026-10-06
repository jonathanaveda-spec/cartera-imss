// Capturas para los VIDEOS de TikTok (1080×1920) con clientes INVENTADOS, sobre la demo local (Firebase simulado).
// Mismo enfoque que tools/capturas-play.mjs, pero guarda en videos/public/capturas/ (no toca las de Google Play).
// Requisitos: el servidor local corriendo (node serve.js → http://localhost:8080) y Microsoft Edge instalado.
// Uso: node tools/capturas-videos.mjs
// No usa ninguna cuenta real: el usuario, el Excel y los clientes se crean en el navegador de pruebas y se descartan al final.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'videos', 'public', 'capturas');
const BASE = 'http://localhost:8080';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PUERTO = 9334;
const PERFIL = join(tmpdir(), 'cartera-capturas-videos-edge');

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Si el servidor local no responde, se avisa y se sale (este script no lo levanta).
try { await fetch(`${BASE}/demo/`); } catch {
  console.error('El servidor local no responde en http://localhost:8080. Corre «node serve.js» y vuelve a intentar.');
  process.exit(1);
}

const borrarPerfil = async () => {
  for (let i = 0; i < 6; i++) {
    try { rmSync(PERFIL, { recursive: true, force: true }); return; } catch { await espera(700); }
  }
  console.warn('No se pudo borrar el perfil temporal (archivo ocupado); es temporal, se puede ignorar:', PERFIL);
};

// ---------------------------------------------------------------- Edge por DevTools
await borrarPerfil();
const edge = spawn(EDGE, [`--remote-debugging-port=${PUERTO}`, '--headless=new', `--user-data-dir=${PERFIL}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--lang=es-MX', 'about:blank'], { stdio: 'ignore' });

let ws, sig = 0;
const pendientes = new Map();
async function conectar() {
  for (let i = 0; i < 40; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json();
      const pag = lista.find((x) => x.type === 'page');
      if (pag) {
        ws = new WebSocket(pag.webSocketDebuggerUrl);
        await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });
        ws.onmessage = (ev) => {
          const m = JSON.parse(ev.data);
          if (m.id && pendientes.has(m.id)) { const { ok, mal } = pendientes.get(m.id); pendientes.delete(m.id); m.error ? mal(new Error(m.error.message)) : ok(m.result); }
        };
        return;
      }
    } catch { /* todavía arrancando */ }
    await espera(250);
  }
  throw new Error('No se pudo conectar con Edge');
}
const cdp = (method, params = {}) => new Promise((ok, mal) => { const id = ++sig; pendientes.set(id, { ok, mal }); ws.send(JSON.stringify({ id, method, params })); });
async function js(expr) {
  const r = await cdp('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function ir(url) { await cdp('Page.navigate', { url }); await espera(400); await js('await new Promise((r) => document.readyState === "complete" ? r() : addEventListener("load", r));'); }
async function foto(nombre) {
  await espera(500); // animaciones
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(SALIDA, nombre), Buffer.from(data, 'base64'));
  console.log('listo', nombre);
}
// 432×768 a 2.5x = 1080×1920 (9:16), del ancho de un teléfono moderno.
const telefono = () => cdp('Emulation.setDeviceMetricsOverride', { width: 432, height: 768, deviceScaleFactor: 2.5, mobile: true });

// ---------------------------------------------------------------- datos inventados
const CLIENTES = [
  // [nombre, días hasta el próximo pago (negativo = atrasado), periodicidad]
  ['José Luis Hernández Ruiz', -12, 'Mensual'],
  ['Guadalupe Martínez Soto', -5, 'Mensual'],
  ['Roberto Sánchez Mora', -2, 'Trimestral'],
  ['María Fernanda López Ortiz', 0, 'Mensual'],
  ['Juan Carlos Ramírez Peña', 3, 'Mensual'],
  ['Ana Laura Torres Vega', 6, 'Semestral'],
  ['Patricia Gómez Ríos', 11, 'Mensual'],
  ['Miguel Ángel Cruz Díaz', 15, 'Mensual'],
  ['Leticia Flores Navarro', 19, 'Trimestral'],
  ['Francisco Javier Reyes Luna', 23, 'Mensual'],
  ['Verónica Castillo Aguilar', 27, 'Mensual'],
  ['Alejandro Morales Ibarra', 34, 'Trimestral'],
  ['Rosa María Jiménez Campos', 48, 'Semestral'],
  ['Héctor Vargas Salinas', 90, 'Anual'],
  ['Claudia Mendoza Rangel', 21, 'Mensual'],
  ['Jorge Alberto Silva Ochoa', 9, 'Mensual'],
];

const preparar = `
  localStorage.clear();
  localStorage.setItem('fakefb', JSON.stringify({ users: { 'demo@cartera.test': { uid: 'u_capturas', email: 'demo@cartera.test', password: 'capturas-demo', emailVerified: true, enviado: true } }, docs: {}, current: 'demo@cartera.test' }));
  localStorage.setItem('cartera:origen', 'play');            // versión de Play: sin precios ni medios de pago
  localStorage.setItem('cartera:ocultar-instalar', '1');
  localStorage.setItem('cartera:ocultar-aviso-bloqueo', '1');
  for (const n of ['cartera-asesor']) await new Promise((r) => { const q = indexedDB.deleteDatabase(n); q.onsuccess = q.onerror = q.onblocked = r; });
  return 'ok';`;

const cargarClientes = `
  for (let i = 0; i < 60 && !(window.__cartera_ok && document.querySelector('#acceso')?.hidden); i++) await new Promise((r) => setTimeout(r, 250));
  const S = await import('/demo/js/store.js');
  const N = await import('/demo/js/nube.js');
  N.estado.perfil = { ...(N.estado.perfil || {}), nombre: 'Laura Méndez' };
  const iso = (d) => { const f = new Date(); f.setDate(f.getDate() + d); return f.toISOString().slice(0, 10); };
  // CURP con la forma de una real (4 letras + fecha + sexo + estado + 3 letras + 2), pero inventada.
  const curp = (nom, i) => { const p = nom.normalize('NFD').replace(/[^A-Za-z ]/g, '').toUpperCase().split(' ');
    const dd = String((i % 27) + 1).padStart(2, '0'), mm = String((i % 12) + 1).padStart(2, '0');
    return p[p.length - 2].slice(0, 2) + p[p.length - 1][0] + p[0][0] + String(60 + i) + mm + dd + (i % 2 ? 'H' : 'M') + 'DF' + 'RRN' + 'A' + (i % 10); };
  const datos = ${JSON.stringify(CLIENTES)};
  for (const [i, [nombre, dias, periodicidad]] of datos.entries()) {
    await S.agregarCliente({ nombre, periodicidad, proximo_pago: iso(dias), fecha_inicio: iso(-400 + i * 9),
      celular: '55 0000 ' + String(1000 + i * 37).slice(-4), curp: curp(nombre, i), nss: String(10000000000 + i * 7919337).slice(0, 11) });
  }
  await S.marcarRespaldo();
  const U = await import('/demo/js/ui.js'); U.render();
  return S.db.clientes.length;`;

const cerrarVentanas = `document.querySelectorAll('#modales .fondo-modal').forEach(() => document.querySelector('#modales .fondo-modal:last-child [data-cerrar]')?.click()); scrollTo(0, 0); return 'ok';`;

// Excel inventado (el mismo del paso «Columnas» de las capturas de Play). A Raúl le falta la fecha de próximo pago,
// para que la pantalla final muestre «Lo que sigue: ponles fecha de cobro».
const crearExcel = `if (!window.XLSX) await new Promise((ok, mal) => { const s = document.createElement('script'); s.src = '/demo/vendor/xlsx.full.min.js'; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
  const X = window.XLSX;
  const filas = [['Nombre', 'Apellidos', 'Cel', 'CURP', 'NSS', 'Frecuencia', 'Próximo pago'],
    ['Ernesto', 'Lara Pineda', '55 0000 2101', 'LAPE700512HDFRNR01', '12345678901', 'Mensual', '15/10/2026'],
    ['Sofía', 'Bravo Cortés', '55 0000 2102', 'BACS820920MDFRRF02', '23456789012', 'Trimestral', '02/11/2026'],
    ['Raúl', 'Medina Paz', '55 0000 2103', 'MEPR650101HDFDZL03', '34567890123', 'Mensual', '']];
  const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(filas), 'Clientes');
  window.__archivo = new File([X.write(wb, { type: 'array', bookType: 'xlsx' })], 'Mis clientes.xlsx');
  if (!window.__clickOriginal) {
    window.__clickOriginal = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () {
      if (this.type === 'file') { const dt = new DataTransfer(); dt.items.add(window.__archivo); this.files = dt.files; this.dispatchEvent(new Event('change')); }
      else window.__clickOriginal.call(this);
    };
  }
  return 1;`;

// Arriba del todo la última ventana abierta.
const arriba = (px = 0) => `const cs = document.querySelectorAll('#modales .modal-cuerpo'); cs[cs.length - 1].scrollTop = ${px}; await new Promise((r) => setTimeout(r, 150)); return 1;`;
const clic = (sel, ms = 400) => `document.querySelector(${JSON.stringify(sel)}).click(); await new Promise((r) => setTimeout(r, ${ms})); return 1;`;

// El navegador de pruebas no tiene huella: se simula que sí, para mostrar la opción (no se guarda ninguna huella real).
const simularHuella = `
  window.PublicKeyCredential = window.PublicKeyCredential || function () {};
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = async () => true;
  if (!navigator.credentials) Object.defineProperty(navigator, 'credentials', { value: {}, configurable: true });
  navigator.credentials.create = async () => ({ rawId: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer });
  navigator.credentials.get = () => new Promise(() => {});   // la huella «espera»: la app queda bloqueada para la foto
  return 1;`;

// ---------------------------------------------------------------- recorrido
try {
  await conectar();
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' });
  await telefono();
  mkdirSync(SALIDA, { recursive: true });

  await ir(`${BASE}/sitio/`);
  await js(preparar);
  await ir(`${BASE}/demo/?origen=play`);
  console.log('clientes inventados:', await js(cargarClientes));
  await espera(800);
  await js(cerrarVentanas);
  await js(crearExcel);

  // ---- TikTok 2: importar Excel
  // 1. Paso 1: «¿Dónde tienes tu lista de clientes?»
  await js(`(await import('/demo/js/ui.js')).abrirImportar(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
  console.log('opciones del paso 1 (esperadas 3):', await js(`return document.querySelectorAll('#modales [data-pant]').length;`));
  await js(arriba());
  await foto('importar-1-donde.png');

  // 1b. «En este teléfono» → «Elige tu archivo»
  await js(clic('[data-pant=aqui]', 300));
  await js(arriba());
  await foto('importar-1b-elegir.png');

  // 2. Elegir el archivo → «¿Qué dato tiene cada columna?»
  await js(clic('[data-elegir]', 800));
  await js(arriba());
  await foto('importar-2-columnas.png');

  // 3. Siguiente → «Último paso: revisa y confirma» (vista previa)
  await js(arriba());
  await js(clic('[data-ir="2"]', 600));
  await js(arriba());
  await foto('importar-3-revisar.png');

  // 4. Importar → «¡Listo!»
  await js(clic('[data-ok]', 1200));
  await js(arriba());
  await foto('importar-4-listo.png');

  // ---- TikTok 3: bloqueo con PIN
  await js(cerrarVentanas);
  await js(simularHuella);
  await js(`const B = await import('/demo/js/bloqueo.js'); B.iniciar('u_capturas'); return 1;`);

  // 1. Ventana «🔒 Bloqueo de la app» (activar) con el PIN ya escrito
  await js(`(await import('/demo/js/ui.js')).abrirBloqueo(); await new Promise((r) => setTimeout(r, 500));
    const f = document.querySelector('#f-pin'); f.pin.value = '2580'; f.pin2.value = '2580'; document.activeElement?.blur(); return 1;`);
  console.log('casilla de huella (esperada: true):', await js(`return !!document.querySelector('#f-pin [name=bio]');`));
  await js(arriba());
  await foto('bloqueo-1-activar.png');

  // 2. Bloqueo activado (tiempo y huella)
  await js(clic('[form="f-pin"]', 900));
  await espera(3500); // que se vaya el aviso «Bloqueo activado»
  await js(`document.activeElement?.blur(); return 1;`);
  await foto('bloqueo-2-activo.png');

  // 3. Pantalla «Tu cartera está protegida» con el teclado (sin dígitos: el video dibuja los puntos que se llenan)
  await js(cerrarVentanas);
  await js(`const B = await import('/demo/js/bloqueo.js'); B.iniciar('u_capturas'); await new Promise((r) => setTimeout(r, 300));
    document.activeElement?.blur(); return 1;`);
  await foto('pin-1-teclado.png');

  // 4. «¿Olvidaste tu PIN?»
  await js(`document.querySelector('#bloqueo [data-olvide]').click(); return 1;`);
  await foto('pin-2-olvide.png');

  // Limpieza: el navegador de pruebas se borra completo al final.
  await js(`localStorage.clear(); return 1;`);
} finally {
  try { await cdp('Browser.close'); } catch { /* ya cerrado */ }
  edge.kill();
  await espera(800);
  await borrarPerfil();
}
