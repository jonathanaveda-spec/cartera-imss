// Convierte una página local en imagen PNG con Edge en modo automático (sirve para tableros de marca, marcos, etc.).
// Requisitos: node serve.js corriendo y Microsoft Edge instalado.
// Uso: node tools/foto-html.mjs <ruta en el servidor> <archivo.png> [ancho=1080] [alto=auto]
//   ej.: node tools/foto-html.mjs /tienda/marca/tablero.html tienda/marca/tablero.png
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [ruta, salida, ancho = '1080', alto = ''] = process.argv.slice(2);
if (!ruta || !salida) { console.error('Uso: node tools/foto-html.mjs <ruta> <salida.png> [ancho] [alto]'); process.exit(1); }
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PUERTO = 9334;
const PERFIL = join(tmpdir(), 'cartera-foto-html-edge');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

try { rmSync(PERFIL, { recursive: true, force: true }); } catch { /* de una corrida anterior */ }
const edge = spawn(EDGE, [`--remote-debugging-port=${PUERTO}`, '--headless=new', `--user-data-dir=${PERFIL}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let ws, sig = 0;
const pendientes = new Map();
const cdp = (method, params = {}) => new Promise((ok, mal) => { const id = ++sig; pendientes.set(id, { ok, mal }); ws.send(JSON.stringify({ id, method, params })); });

try {
  for (let i = 0; i < 40 && !ws; i++) {
    try {
      const pag = (await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json()).find((x) => x.type === 'page');
      if (pag) { ws = new WebSocket(pag.webSocketDebuggerUrl); await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; }); }
    } catch { ws = null; }
    if (!ws) await espera(250);
  }
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); const p = pendientes.get(m.id); if (p) { pendientes.delete(m.id); m.error ? p.mal(new Error(m.error.message)) : p.ok(m.result); } };
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: Number(ancho), height: Number(alto) || 800, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `http://localhost:8080${ruta}` });
  await espera(1500);
  await cdp('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });
  await espera(300);
  const { result } = await cdp('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
  const h = Number(alto) || result.value;
  await cdp('Emulation.setDeviceMetricsOverride', { width: Number(ancho), height: h, deviceScaleFactor: 1, mobile: false });
  await espera(300);
  const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync(salida, Buffer.from(data, 'base64'));
  console.log(`listo ${salida} (${ancho}×${h})`);
} finally {
  try { await cdp('Browser.close'); } catch { /* ya cerrado */ }
  edge.kill();
  // Edge tarda en soltar su carpeta temporal: se intenta borrar unas veces y, si no, se deja (es temporal).
  for (let i = 0; i < 10; i++) {
    await espera(400);
    try { rmSync(PERFIL, { recursive: true, force: true }); break; } catch { /* sigue ocupada */ }
  }
}
