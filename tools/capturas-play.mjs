// Capturas para Google Play (1080×1920) con clientes INVENTADOS, sobre la demo local (Firebase simulado).
// Requisitos: el servidor local corriendo (node serve.js → http://localhost:8080) y Microsoft Edge instalado.
// Uso: node tools/capturas-play.mjs   → tienda/capturas/crudas/*.png (pantalla sola) y tienda/capturas/*.png (con marco)
// No usa ninguna cuenta real: el usuario y los clientes se crean en el navegador de pruebas y se descartan al final.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'tienda', 'capturas');
const CRUDAS = join(SALIDA, 'crudas');
const BASE = 'http://localhost:8080';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PUERTO = 9333;
const PERFIL = join(tmpdir(), 'cartera-capturas-edge');

const PANTALLAS = [
  { id: '1-inicio', t: 'Sabe al instante quién te debe', s: 'Al día, por vencer y morosos, calculados solos' },
  { id: '2-cliente', t: 'Todo de cada cliente a un toque', s: 'Recuérdale su pago por WhatsApp o llámalo' },
  { id: '3-pago', t: 'La próxima fecha se calcula sola', s: 'Mensual, trimestral, semestral, anual o cada N días' },
  { id: '4-comprobante', t: 'Comprobante de pago por WhatsApp', s: 'Tu cliente queda tranquilo y tú te ves profesional' },
  { id: '5-excel', t: 'Sube tu Excel tal como lo tienes', s: 'La app reconoce tus columnas; tú solo confirmas' },
  { id: '6-pin', t: 'Protegida con PIN y huella', s: 'Nadie ve tu cartera si toma tu teléfono' },
];

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- Edge por DevTools
rmSync(PERFIL, { recursive: true, force: true });
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
async function foto(archivo) {
  await espera(500); // animaciones
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(archivo, Buffer.from(data, 'base64'));
}
// 432×768 a 2.5x = 1080×1920 (9:16), del ancho de un teléfono moderno.
const telefono = () => cdp('Emulation.setDeviceMetricsOverride', { width: 432, height: 768, deviceScaleFactor: 2.5, mobile: true });
const lienzo = () => cdp('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });

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
const idDe = (nombre) => `(await import('/demo/js/store.js')).db.clientes.find((c) => c.nombre === ${JSON.stringify(nombre)}).id`;

// ---------------------------------------------------------------- recorrido
try {
  await conectar();
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' });
  await telefono();
  mkdirSync(CRUDAS, { recursive: true });

  await ir(`${BASE}/sitio/`);
  await js(preparar);
  await ir(`${BASE}/demo/?origen=play`);
  console.log('clientes inventados:', await js(cargarClientes));
  await espera(800);

  // 1. Inicio
  await js(cerrarVentanas);
  await foto(join(CRUDAS, '1-inicio.png'));

  // 2. Detalle de un cliente atrasado
  await js(`(await import('/demo/js/ui.js')).abrirDetalle(${idDe('José Luis Hernández Ruiz')}); return 1;`);
  await foto(join(CRUDAS, '2-cliente.png'));

  // 3. Registrar pago (con monto) de un cliente por vencer
  await js(cerrarVentanas);
  await js(`const U = await import('/demo/js/ui.js'); U.abrirPago(${idDe('Juan Carlos Ramírez Peña')});
    await new Promise((r) => setTimeout(r, 200));
    const f = document.querySelector('#f-pago'); f.monto.value = '1250'; f.metodo.value = 'Transferencia';
    f.dispatchEvent(new Event('input', { bubbles: true })); document.activeElement?.blur(); return 1;`);
  await foto(join(CRUDAS, '3-pago.png'));

  // 4. Comprobante (al guardar ese pago)
  await js(`document.querySelector('[form="f-pago"]').click(); await new Promise((r) => setTimeout(r, 700)); document.activeElement?.blur(); return 1;`);
  await foto(join(CRUDAS, '4-comprobante.png'));

  // 5. Importar Excel: paso de columnas, con un archivo inventado
  await js(cerrarVentanas);
  await js(`if (!window.XLSX) await new Promise((ok, mal) => { const s = document.createElement('script'); s.src = '/demo/vendor/xlsx.full.min.js'; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
    const X = window.XLSX;
    const filas = [['Nombre', 'Apellidos', 'Cel', 'CURP', 'NSS', 'Frecuencia', 'Próximo pago'],
      ['Ernesto', 'Lara Pineda', '55 0000 2101', 'LAPE700512HDFRNR01', '12345678901', 'Mensual', '15/10/2026'],
      ['Sofía', 'Bravo Cortés', '55 0000 2102', 'BACS820920MDFRRF02', '23456789012', 'Trimestral', '02/11/2026'],
      ['Raúl', 'Medina Paz', '55 0000 2103', 'MEPR650101HDFDZL03', '34567890123', 'Mensual', '28/10/2026']];
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(filas), 'Clientes');
    window.__archivo = new File([X.write(wb, { type: 'array', bookType: 'xlsx' })], 'Mis clientes.xlsx');
    const orig = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () { if (this.type === 'file') { const dt = new DataTransfer(); dt.items.add(window.__archivo); this.files = dt.files; this.dispatchEvent(new Event('change')); } else orig.call(this); };
    (await import('/demo/js/ui.js')).abrirImportar();
    document.querySelector('[data-pant=aqui]').click(); await new Promise((r) => setTimeout(r, 150));
    document.querySelector('[data-elegir]').click(); await new Promise((r) => setTimeout(r, 600));
    document.querySelector('.modal-cuerpo').scrollTop = 0; return 1;`);
  await foto(join(CRUDAS, '5-excel.png'));

  // 6. Bloqueo con PIN (dos dígitos ya escritos)
  await js(cerrarVentanas);
  await js(`const B = await import('/demo/js/bloqueo.js'); B.iniciar('u_capturas'); await B.guardarPin('2580', 5); B.iniciar('u_capturas');
    await new Promise((r) => setTimeout(r, 200));
    document.querySelector('#bloqueo [data-t="2"]').click(); document.querySelector('#bloqueo [data-t="5"]').click(); document.activeElement?.blur(); return 1;`);
  await foto(join(CRUDAS, '6-pin.png'));

  // Limpieza: el navegador de pruebas se borra completo al final.
  await js(`localStorage.clear(); return 1;`);

  // ---------------------------------------------------------------- marcos 1080×1920
  await lienzo();
  for (const p of PANTALLAS) {
    const q = new URLSearchParams({ img: `/tienda/capturas/crudas/${p.id}.png`, t: p.t, s: p.s });
    await ir(`${BASE}/tienda/marco.html?${q}`);
    await js(`for (let i = 0; i < 40 && !document.body.dataset.listo; i++) await new Promise((r) => setTimeout(r, 100)); return 1;`);
    await foto(join(SALIDA, `${p.id}.png`));
    console.log('listo', p.id);
  }
} finally {
  try { await cdp('Browser.close'); } catch { /* ya cerrado */ }
  edge.kill();
  await espera(500);
  rmSync(PERFIL, { recursive: true, force: true });
}
