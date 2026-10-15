// Capturas para el VIDEO EXPLICATIVO de corredores de seguros de VENEZUELA (perfil de país VE; todo inventado: nombres venezolanos, celulares 0414 000 xxxx, sin CURP ni NSS).
// Uso: node tools/capturas-ve.mjs   (CAPTURAS_SALIDA=<carpeta> para no pisar las buenas; por defecto videos/public/capturas/ con prefijo «ve-»)
// Antes: el servidor local corriendo (node serve.js → http://localhost:8080). Basado en tools/capturas-videos.mjs.
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
const SALIDA = process.env.CAPTURAS_SALIDA || join(RAIZ, 'videos', 'public', 'capturas'); // CAPTURAS_SALIDA=<carpeta> para no pisar las buenas
const BASE = 'http://localhost:8080';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PUERTO = 9334;
const PERFIL = join(tmpdir(), 'cartera-capturas-videos-edge');

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Parte a capturar: sin argumento = todo (Excel, PIN y cobro); «excel-pin» o «cobro» = solo esa parte.
const SOLO = process.argv[2] || '';
const hacer = (parte) => (!SOLO && parte !== 'semana') || SOLO === parte; // «semana» NO entra en «todo»: son las capturas del 12 al 18 de octubre (prefijo «sem-»)

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

// ---------------------------------------------------------------- datos inventados de VENEZUELA
const CLIENTES_VE = [
  // [nombre, días hasta el próximo pago (negativo = atrasado), periodicidad]
  ['Luis Alberto Rondón', -9, 'Mensual'],
  ['Yaneth Colmenares', -4, 'Mensual'],
  ['Jesús Mendoza', -2, 'Trimestral'],
  ['María Gabriela Ferrer', 0, 'Mensual'],
  ['Carlos Eduardo Pacheco', 3, 'Mensual'],
  ['Daniela Salazar', 5, 'Semestral'],
  ['Pedro José Briceño', 11, 'Mensual'],
  ['Rosa Elena Quintero', 15, 'Mensual'],
  ['Andrés Villalobos', 19, 'Trimestral'],
  ['Yolimar Aponte', 23, 'Mensual'],
  ['Johan Márquez', 27, 'Mensual'],
  ['Neyda Ramírez', 34, 'Trimestral'],
  ['Wilmer Escalona', 48, 'Semestral'],
  ['Maribel Cedeño', 90, 'Anual'],
  ['Gustavo Linares', 21, 'Mensual'],
  ['Eglis Torrealba', 9, 'Mensual'],
];

const cargarClientesVE = `
  for (let i = 0; i < 60 && !(window.__cartera_ok && document.querySelector('#acceso')?.hidden); i++) await new Promise((r) => setTimeout(r, 250));
  const S = await import('/demo/js/store.js');
  const N = await import('/demo/js/nube.js');
  N.estado.perfil = { ...(N.estado.perfil || {}), nombre: 'Mariana Rojas', pais: 'VE' };
  const iso = (d) => { const f = new Date(); f.setDate(f.getDate() + d); return f.toISOString().slice(0, 10); };
  const datos = ${JSON.stringify(CLIENTES_VE)};
  for (const [i, [nombre, dias, periodicidad]] of datos.entries()) {
    await S.agregarCliente({ nombre, periodicidad, proximo_pago: iso(dias), fecha_inicio: iso(-400 + i * 9),
      celular: '0414 000 ' + String(1000 + i * 37).slice(-4) });
  }
  await S.marcarRespaldo();
  const U = await import('/demo/js/ui.js'); U.render();
  return S.db.clientes.length;`;

// Excel inventado de un corredor venezolano (sin CURP/NSS). A Wilfredo le falta la fecha.
const crearExcelVE = `if (!window.XLSX) await new Promise((ok, mal) => { const s = document.createElement('script'); s.src = '/demo/vendor/xlsx.full.min.js'; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
  const X = window.XLSX;
  const filas = [['Cliente', 'Teléfono', 'Cuota', 'Cada cuánto', 'Próxima cuota'],
    ['Yoselin Barrios', '0414 000 2101', 45, 'Mensual', '15/11/2026'],
    ['Héctor Sandoval', '0424 000 2102', 120, 'Trimestral', '02/12/2026'],
    ['Wilfredo Pineda', '0412 000 2103', 60, 'Mensual', '']];
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

const esperar = (ms) => `await new Promise((r) => setTimeout(r, ${ms}));`;
const subirA = (sel, margen = 76) => `const el = document.querySelector(${JSON.stringify(sel)}); scrollTo(0, el.getBoundingClientRect().top + scrollY - ${margen}); ${esperar(400)} return 1;`;

// ---------------------------------------------------------------- recorrido
try {
  await conectar();
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' });
  await telefono();
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'delete Navigator.prototype.serviceWorker;' });
  if (process.env.DIAS_ADELANTE) {
    const desfase = Number(process.env.DIAS_ADELANTE) * 86400000;
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const D = Date, off = ${desfase}; class F extends D { constructor(...a) { if (a.length === 0) super(D.now() + off); else super(...a); } static now() { return D.now() + off; } } window.Date = F; })();` });
  }
  mkdirSync(SALIDA, { recursive: true });

  await ir(`${BASE}/sitio/`);
  await js(preparar);
  await ir(`${BASE}/demo/?origen=play`);
  console.log('clientes venezolanos inventados:', await js(cargarClientesVE));
  await espera(800);
  await js(cerrarVentanas);
  await js(crearExcelVE);

  // Un pago de hoy, para que el inicio también muestre «Pagaron hoy»
  await js(`const S = await import('/demo/js/store.js'); const U = await import('/demo/js/ui.js');
    const c = S.db.clientes.find((x) => x.nombre.startsWith('Pedro'));
    await S.registrarPago(c.id, { fecha_pago: new Date().toISOString().slice(0, 10), monto: 45, metodo: 'Zelle' });
    U.render(); ${esperar(500)} return 1;`);
  await js(`document.activeElement?.blur(); scrollTo(0, 0); return 1;`);

  // 1. Inicio: semáforo (al día / por vencer / morosos)
  await foto('ve-inicio.png');

  // 2. Lista de morosos (con «Recordar»)
  await js(`scrollTo(0,0); document.querySelector('#resumen [data-cod="MOROSO"]').click(); ${esperar(500)} return 1;`);
  await js(subirA('#lista', 80));
  await foto('ve-morosos.png');
  await js(`scrollTo(0,0); document.querySelector('#resumen [data-cod="todos"]').click(); ${esperar(300)} scrollTo(0,0); return 1;`);

  // 3. Registrar un pago (cuota de $45 por Zelle) a un cliente atrasado y el comprobante por WhatsApp
  await js(`const S = await import('/demo/js/store.js'); const U = await import('/demo/js/ui.js');
    U.abrirPago(S.db.clientes.find((x) => x.nombre.startsWith('Yaneth')).id); ${esperar(600)}
    const f = document.querySelector('#modales form'); if (f.monto) f.monto.value = '45'; if (f.metodo) f.metodo.value = 'Zelle';
    f.dispatchEvent(new Event('input', { bubbles: true })); document.activeElement?.blur(); ${esperar(300)} return 1;`);
  await js(arriba());
  await foto('ve-pago.png');
  await js(`document.querySelector('#modales button[type=submit]')?.click(); ${esperar(900)} return 1;`);
  await js(arriba());
  await foto('ve-comprobante.png');
  await js(`document.querySelector('#modales [data-cerrar]')?.click(); scrollTo(0,0); ${esperar(400)} return 1;`);
  await js(cerrarVentanas);

  // 4. Mensajes de cobro (el recordatorio ya viene listo)
  await js(`(await import('/demo/js/ui.js')).abrirMensajesCobro(); ${esperar(500)} document.activeElement?.blur(); return 1;`);
  await js(arriba());
  await foto('ve-mensajes.png');
  await js(cerrarVentanas);

  // 5. Importar el Excel tal cual
  await js(`(await import('/demo/js/ui.js')).abrirImportar(); ${esperar(500)} return 1;`);
  await js(arriba());
  await foto('ve-importar-1.png');
  await js(clic('[data-pant=aqui]', 300));
  await js(clic('[data-elegir]', 800));
  await js(arriba());
  await foto('ve-importar-2.png');
  await js(arriba());
  await js(clic('[data-ir="2"]', 600));
  await js(arriba());
  await foto('ve-importar-3.png');
  await js(cerrarVentanas);

  // 6. Sin conexión
  console.log('aviso sin conexión:', JSON.stringify(await js(`Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true }); (await import('/demo/js/ui.js')).render(); scrollTo(0,0); ${esperar(500)} return document.querySelector('#avisos').innerText;`)));
  await foto('ve-sin-conexion.png');
  await js(`delete navigator.onLine; (await import('/demo/js/ui.js')).render(); return navigator.onLine;`);

  // 7. Bloqueo con PIN (activado y pantalla de PIN)
  await js(cerrarVentanas);
  await js(simularHuella);
  await js(`const B = await import('/demo/js/bloqueo.js'); B.iniciar('u_capturas'); return 1;`);
  await js(`(await import('/demo/js/ui.js')).abrirBloqueo(); ${esperar(500)}
    const f = document.querySelector('#f-pin'); f.pin.value = '2580'; f.pin2.value = '2580'; document.activeElement?.blur(); return 1;`);
  await js(clic('[form="f-pin"]', 900));
  await espera(3500);
  await js(`document.activeElement?.blur(); return 1;`);
  await foto('ve-bloqueo-activo.png');
  await js(cerrarVentanas);
  await js(`const B = await import('/demo/js/bloqueo.js'); B.iniciar('u_capturas'); ${esperar(300)} document.activeElement?.blur(); return 1;`);
  await foto('ve-pin-teclado.png');

  await js(`localStorage.clear(); return 1;`);

} finally {
  try { await cdp('Browser.close'); } catch { /* ya cerrado */ }
  edge.kill();
  await espera(800);
  await borrarPerfil();
}
