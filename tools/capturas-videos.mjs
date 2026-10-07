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
  if (hacer('excel-pin')) await js(crearExcel);

  if (hacer('excel-pin')) {
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
  }

  if (hacer('cobro')) {
  // ---- TikTok 4 y H1: mensajes de cobro, resumen del día y cliente moroso (todo inventado)
  // Un pago registrado hoy, para que el resumen del día también muestre «ya pagó hoy».
  await js(`const S = await import('/demo/js/store.js'); const U = await import('/demo/js/ui.js');
    const c = S.db.clientes.find((x) => x.nombre.startsWith('Miguel'));
    await S.registrarPago(c.id, { fecha_pago: new Date().toISOString().slice(0, 10), monto: 1500, metodo: 'Transferencia' });
    U.render(); await new Promise((r) => setTimeout(r, 400)); return 1;`);

  // 1. Resumen del día (lo primero que se ve al abrir la app)
  await js(cerrarVentanas);
  await js(`document.activeElement?.blur(); scrollTo(0, 0); return 1;`);
  await foto('cobro-3-resumen-dia.png');

  // 2. Solo morosos: tarjetas en rojo con su botón «Recordar»
  await js(`document.querySelector('#resumen [data-estado="MOROSO"], #resumen [data-cod="MOROSO"]')?.click(); await new Promise((r) => setTimeout(r, 500));
    const f = document.querySelector('.fila.est-moroso'); if (f) scrollTo(0, f.getBoundingClientRect().top + scrollY - 190); await new Promise((r) => setTimeout(r, 300)); return 1;`);
  await foto('cobro-4-morosos.png');

  // 3. Detalle de un cliente moroso, con «💬 Recordar»
  await js(`document.querySelector('tr.fila.est-moroso, .fila.est-moroso')?.click(); await new Promise((r) => setTimeout(r, 600)); return 1;`);
  await js(arriba());
  await foto('cobro-2-cliente.png');

  // 4. Ajustes → «📲 Mensajes de cobro»
  await js(cerrarVentanas);
  await js(`(await import('/demo/js/ui.js')).abrirMensajesCobro(); await new Promise((r) => setTimeout(r, 500)); document.activeElement?.blur(); return 1;`);
  await js(arriba());
  await foto('cobro-1-mensajes.png');
  }

  if (hacer('semana')) {
  // ---- Semana del 12 al 18 de octubre: P05–P11 y H02–H05 (todo inventado). Archivos con prefijo «sem-».
  const esperar = (ms) => `await new Promise((r) => setTimeout(r, ${ms}));`;
  const subirA = (sel, margen = 76) => `const el = document.querySelector(${JSON.stringify(sel)}); scrollTo(0, el.getBoundingClientRect().top + scrollY - ${margen}); ${esperar(400)} return 1;`;
  const hoyIso = `const iso = (d) => { const f = new Date(); f.setDate(f.getDate() + d); return f.toISOString().slice(0, 10); };`;
  const esperarApp = `for (let i = 0; i < 60 && !(window.__cartera_ok && document.querySelector('#acceso')?.hidden); i++) await new Promise((r) => setTimeout(r, 250));`;
  await js(cerrarVentanas);
  // Clientes extra: 2 más que pagan hoy (la quincena), Patricia Ruiz (la de «ya te pagué») y un pago de hoy.
  await js(`${hoyIso}
    const S = await import('/demo/js/store.js'); const U = await import('/demo/js/ui.js');
    await S.agregarCliente({ nombre: 'Sandra Iturbe Cano', periodicidad: 'Mensual', proximo_pago: iso(0), fecha_inicio: iso(-300), celular: '55 0000 3301', curp: 'IUCS780415MDFTNN05', nss: '45678901234' });
    await S.agregarCliente({ nombre: 'Mario Esquivel Lara', periodicidad: 'Trimestral', proximo_pago: iso(0), fecha_inicio: iso(-200), celular: '55 0000 3302', curp: 'EULM810203HDFSRR06', nss: '56789012345' });
    await S.agregarCliente({ nombre: 'Patricia Ruiz Salas', periodicidad: 'Mensual', proximo_pago: iso(-4), fecha_inicio: iso(-250), celular: '55 0000 3303', curp: 'RUSP790911MDFZLT07', nss: '67890123456' });
    const c = S.db.clientes.find((x) => x.nombre.startsWith('Miguel'));
    await S.registrarPago(c.id, { fecha_pago: iso(0), monto: 1500, metodo: 'Transferencia' });
    U.render(); ${esperar(500)} return S.db.clientes.length;`);
  await js(`document.activeElement?.blur(); scrollTo(0, 0); return 1;`);

  // 1. Inicio nuevo: saludo + tarjetas de estado + «Pagan hoy / Pagaron hoy»
  await foto('sem-inicio.png');

  // 2. Filtro «📅 Pagan hoy» activo
  await js(`document.querySelector('#rapidos [data-cod="pagan_hoy"]').click(); ${esperar(500)} return 1;`);
  await js(subirA('#rapidos'));
  await foto('sem-pagan-hoy.png');
  await js(`document.querySelector('#rapidos [data-cod="pagan_hoy"]').click(); ${esperar(300)} scrollTo(0,0); return 1;`);

  // 3. Las tres listas del semáforo (se toca la tarjeta de cada estado)
  for (const [cod, nombre] of [['MOROSO', 'sem-lista-rojo.png'], ['POR_VENCER', 'sem-lista-amarillo.png'], ['AL_DIA', 'sem-lista-verde.png']]) {
    await js(`scrollTo(0,0); document.querySelector('#resumen [data-cod="${cod}"]').click(); ${esperar(500)} return 1;`);
    await js(subirA('#lista', 80));
    await foto(nombre);
  }
  await js(`scrollTo(0,0); document.querySelector('#resumen [data-cod="todos"]').click(); ${esperar(300)} scrollTo(0,0); return 1;`);

  // 4. Detalle de un cliente por vencer (se ve su fecha y su color)
  await js(`const f = [...document.querySelectorAll('.fila')].find((x) => x.textContent.includes('Juan Carlos')); f.click(); ${esperar(600)} return 1;`);
  await js(arriba());
  await foto('sem-cliente.png');

  // 5. Registrar un pago a Patricia Ruiz (atrasada) y el comprobante por WhatsApp
  await js(cerrarVentanas);
  await js(`const S = await import('/demo/js/store.js'); const U = await import('/demo/js/ui.js');
    U.abrirPago(S.db.clientes.find((x) => x.nombre.startsWith('Patricia Ruiz')).id); ${esperar(600)}
    const f = document.querySelector('#modales form'); if (f.monto) f.monto.value = '1250'; if (f.metodo) f.metodo.value = 'Efectivo';
    f.dispatchEvent(new Event('input', { bubbles: true })); document.activeElement?.blur(); ${esperar(300)} return 1;`);
  await js(arriba());
  await foto('sem-pago.png');
  await js(`document.querySelector('#modales button[type=submit]')?.click(); ${esperar(900)} return 1;`);
  await js(arriba());
  await foto('sem-comprobante.png');
  await js(`document.querySelector('#modales [data-cerrar]')?.click(); scrollTo(0,0); ${esperar(400)} return 1;`);
  await js(cerrarVentanas);

  // 6. Buscador: 3 letras y resultado; y los filtros abiertos
  await js(`scrollTo(0,0); const q = document.querySelector('#q'); q.value = 'lop'; q.dispatchEvent(new Event('input', { bubbles: true })); q.blur(); ${esperar(500)} return 1;`);
  await js(subirA('.herramientas', 76));
  await foto('sem-buscar.png');
  await js(`const q = document.querySelector('#q'); q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#btnFiltros').click(); ${esperar(500)} return 1;`);
  await js(subirA('.herramientas', 76));
  await foto('sem-filtros.png');
  await js(`document.querySelector('#btnFiltros').click(); ${esperar(300)} scrollTo(0,0); return 1;`);

  // 7. Sin conexión
  console.log('aviso sin conexión:', JSON.stringify(await js(`Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true }); (await import('/demo/js/ui.js')).render(); scrollTo(0,0); ${esperar(500)} return document.querySelector('#avisos').innerText;`)));
  await foto('sem-sin-conexion.png');
  await js(`delete navigator.onLine; (await import('/demo/js/ui.js')).render(); return navigator.onLine;`);

  // 8. Aviso «Instala la app» (Android): se simula el evento del navegador
  console.log('aviso Android:', JSON.stringify(await js(`localStorage.removeItem('cartera:ocultar-instalar');
    const e = new Event('beforeinstallprompt'); e.prompt = () => {}; e.userChoice = Promise.resolve({ outcome: 'dismissed' }); window.dispatchEvent(e);
    (await import('/demo/js/ui.js')).render(); scrollTo(0,0); ${esperar(500)} return document.querySelector('#avisos').innerText;`)));
  await foto('sem-instalar-android.png');

  // 9. iPhone: se recarga como si fuera un iPhone (el aviso dice «Ver cómo (4 pasos)») y se abre la guía
  await cdp('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', platform: 'iPhone' });
  // Edge de escritorio sí ofrece instalar: se tapa ese evento para que salga el aviso de iPhone
  const bloqueo = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: "window.addEventListener('beforeinstallprompt', (e) => e.stopImmediatePropagation(), true);" });
  await ir(`${BASE}/demo/?origen=play`);
  console.log('aviso iPhone:', JSON.stringify(await js(`${esperarApp} const N = await import('/demo/js/nube.js'); N.estado.perfil = { ...(N.estado.perfil || {}), nombre: 'Laura Méndez' }; (await import('/demo/js/ui.js')).render(); ${esperar(800)} return document.querySelector('#avisos').innerText;`)));
  await foto('sem-instalar-iphone.png');
  await js(`document.querySelector('[data-accion="guia-instalar"]')?.click(); ${esperar(600)} return 1;`);
  await js(arriba());
  await foto('sem-guia-iphone.png');
  await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: bloqueo.identifier });
  await cdp('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36', platform: 'Linux armv8l' });
  await ir(`${BASE}/demo/?origen=play`);
  await js(`${esperarApp} localStorage.setItem('cartera:ocultar-instalar', '1'); const N = await import('/demo/js/nube.js'); N.estado.perfil = { ...(N.estado.perfil || {}), nombre: 'Laura Méndez' }; ${esperar(500)} return 1;`);

  // 10. Fechas de cobro: dos clientes sin fecha → asistente (paso 1 y paso 2 con «Personalizado: cada 15 días»)
  await js(`${hoyIso}
    const S = await import('/demo/js/store.js'); const U = await import('/demo/js/ui.js');
    await S.agregarCliente({ nombre: 'Elena Duarte Paredes', celular: '55 0000 3304', fecha_inicio: iso(-120), curp: 'DUPE850625MDFRRL08', nss: '78901234567' });
    await S.agregarCliente({ nombre: 'Rubén Olvera Tapia', celular: '55 0000 3305', fecha_inicio: iso(-75), curp: 'OETR880130HDFLPB09', nss: '89012345678' });
    U.render(); ${esperar(500)} U.abrirAsistente(); ${esperar(600)} return 1;`);
  await js(arriba());
  await foto('sem-asistente-1.png');
  await js(clic('[data-ir="2"]', 500));
  await js(`const r = document.querySelector('#modales input[name=periodicidad][value=personalizado]'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); ${esperar(400)}
    const d = document.querySelector('#modales input[name=dias_per]'); d.value = '15'; d.dispatchEvent(new Event('input', { bubbles: true })); d.dispatchEvent(new Event('change', { bubbles: true })); d.blur(); ${esperar(400)} return 1;`);
  await js(arriba());
  await foto('sem-periodicidad.png');
  await js(`document.querySelector('#modales [data-cerrar]')?.click(); ${esperar(300)} return 1;`);
  await js(cerrarVentanas);

  // 11. Pago de un cliente que paga «Cada 15 días»: periodicidad personalizada y próximo pago calculado
  await js(`${hoyIso}
    const S = await import('/demo/js/store.js'); const U = await import('/demo/js/ui.js'); const L = await import('/demo/js/logic.js');
    await S.agregarCliente({ nombre: 'Daniela Fuentes Rojas', periodicidad: L.periodicidadDias(15), proximo_pago: iso(0), fecha_inicio: iso(-90), celular: '55 0000 3306', curp: 'FURD900818MDFNJN10', nss: '90123456789' });
    U.abrirPago(S.db.clientes.find((x) => x.nombre.startsWith('Daniela')).id); ${esperar(700)}
    const f = document.querySelector('#modales form'); if (f.monto) f.monto.value = '800'; if (f.metodo) f.metodo.value = 'Efectivo';
    f.dispatchEvent(new Event('input', { bubbles: true })); document.activeElement?.blur(); ${esperar(400)} return 1;`);
  await js(arriba());
  await foto('sem-pago-15dias.png');
  await js(cerrarVentanas);
  }

  // Limpieza: el navegador de pruebas se borra completo al final.
  await js(`localStorage.clear(); return 1;`);
} finally {
  try { await cdp('Browser.close'); } catch { /* ya cerrado */ }
  edge.kill();
  await espera(800);
  await borrarPerfil();
}
