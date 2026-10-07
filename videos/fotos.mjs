// Fotogramas para la revisión de CUALQUIER composición, sin pelear con el audio (usa renderStill, un cuadro a la vez).
// Uso: node fotos.mjs <Composición> <cada-N | lista de cuadros separados por coma> [guias]
//   node fotos.mjs T-t01-5-senales 15          → uno cada 15 cuadros (0.5 s) + el último
//   node fotos.mjs H-h01-11pm 0,30,200 guias   → solo esos cuadros, con la zona segura dibujada
// Deja out/fotogramas-<Composición>[-guias]/element-NNN.png (el mismo nombre que usa montaje.mjs).
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
// Navegador: Edge 154 ya no acepta el modo «headless viejo» de Remotion, así que se usa el chrome-headless-shell de la caché de puppeteer (si existe).
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
const cacheHS = join(homedir(), '.cache/puppeteer/chrome-headless-shell');
const hs = existsSync(cacheHS) ? readdirSync(cacheHS).map((v) => join(cacheHS, v, 'chrome-headless-shell-win64/chrome-headless-shell.exe')).find(existsSync) : null;
const EDGE = hs || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const [, , comp, que = '15', guias] = process.argv;
if (!comp) { console.error('Uso: node fotos.mjs <Composición> <cada-N | cuadros> [guias]'); process.exit(1); }

const serveUrl = await bundle({ entryPoint: join(AQUI, 'src/index.ts') });
const inputProps = { guias: guias === 'guias' };
const c = await selectComposition({ serveUrl, id: comp, inputProps, browserExecutable: EDGE });
const total = c.durationInFrames;
let cuadros;
if (que.includes(',') || Number(que) >= total) cuadros = que.split(',').map(Number);
else { cuadros = []; for (let i = 0; i < total - 1; i += Number(que)) cuadros.push(i); cuadros.push(total - 1); }
const salida = join(AQUI, 'out', `fotogramas-${comp}${guias === 'guias' ? '-guias' : ''}`);
rmSync(salida, { recursive: true, force: true });
mkdirSync(salida, { recursive: true });
for (const f of cuadros) {
  await renderStill({ composition: c, serveUrl, frame: f, inputProps, output: join(salida, `element-${String(f).padStart(3, '0')}.png`), browserExecutable: EDGE, imageFormat: 'png' });
}
console.log(`${comp}: ${total} cuadros (${(total / c.fps).toFixed(2)} s). Fotogramas: ${cuadros.join(',')}`);
console.log(`→ ${salida}`);
