// Arma hojas de contacto con los fotogramas ya sacados por fotos.mjs.
// Uso: node hojas.mjs <Composición> <cada-N> [por-hoja=12] [escala=0.33] [columnas=6]
//   → out/fotogramas-<Composición>/hoja-1.png, hoja-2.png…  (usa los cuadros múltiplos de N y el último)
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
const require = createRequire('D:/Archivos/App de gestion de clientes/package.json');
const sharp = require('sharp');
const [, , comp, cada, porHoja = '12', escala = '0.33', columnas = '6'] = process.argv;
const dir = `out/fotogramas-${comp}`;
const todos = readdirSync(dir).filter((f) => /^element-\d+\.png$/.test(f)).map((f) => Number(f.slice(8, 11))).sort((a, b) => a - b);
const ultimo = todos.at(-1);
const cuadros = todos.filter((f) => f % Number(cada) === 0 || f === ultimo);
const w = Math.round(1080 * Number(escala)), h = Math.round(1920 * Number(escala)), cols = Number(columnas), gap = 10;
for (let k = 0; k * Number(porHoja) < cuadros.length; k++) {
  const lote = cuadros.slice(k * Number(porHoja), (k + 1) * Number(porHoja));
  const filas = Math.ceil(lote.length / cols);
  const comp2 = await Promise.all(lote.map(async (c, i) => ({
    input: await sharp(`${dir}/element-${String(c).padStart(3, '0')}.png`).resize(w, h).toBuffer(),
    left: gap + (i % cols) * (w + gap), top: gap + Math.floor(i / cols) * (h + gap) })));
  await sharp({ create: { width: cols * (w + gap) + gap, height: filas * (h + gap) + gap, channels: 3, background: '#111111' } })
    .composite(comp2).png().toFile(`${dir}/hoja-${k + 1}.png`);
  console.log(`hoja-${k + 1}: cuadros ${lote.join(',')}`);
}
