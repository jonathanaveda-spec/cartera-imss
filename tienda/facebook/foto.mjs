// Fotografía cada <section> de imagenes.html como PNG de 1080×1080 (necesita Playwright).
// Uso desde la raíz del repo: node tienda/facebook/foto.mjs
// Las letras de Google Fonts se bajan con curl (respeta el proxy de la nube) y se le entregan al navegador.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1080, height: 1080 } });
await pag.route(/fonts\.(googleapis|gstatic)\.com/, (r) => {
  const url = r.request().url();
  const body = execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36', url], { maxBuffer: 1 << 26 });
  r.fulfill({ body, contentType: url.includes('/css') ? 'text/css' : 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' } });
});
await pag.goto(pathToFileURL(join(AQUI, 'imagenes.html')).href, { waitUntil: 'networkidle' });
await pag.evaluate(() => document.fonts.ready);
for (const id of await pag.$$eval('section', (s) => s.map((x) => x.id))) {
  await pag.locator(`#${id}`).screenshot({ path: join(AQUI, `${id}.png`) });
  console.log(`✓ ${id}.png`);
}
await nav.close();
