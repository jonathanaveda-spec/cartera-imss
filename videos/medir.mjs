// Mide margenes izquierdo/derecho de lo claro (texto blanco/oro) en una franja vertical de un fotograma.
import { createRequire } from "node:module";
const require = createRequire("D:/Archivos/App de gestion de clientes/package.json");
const sharp = require("sharp");
const [, , archivo, y0, y1] = process.argv;
const { data, info } = await sharp(archivo).raw().toBuffer({ resolveWithObject: true });
let minX = 1e9, maxX = -1;
for (let y = Number(y0); y < Number(y1); y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if ((r > 225 && g > 195) ) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
  }
}
console.log(archivo.split("/").pop(), `y ${y0}-${y1}`, `izq=${minX} der=${1079 - maxX} centro=${(minX + maxX) / 2}`);
