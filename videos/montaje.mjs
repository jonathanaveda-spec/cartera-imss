// Hace hojas de contacto de fotogramas. Uso: node montaje.mjs <carpeta> <salida-prefijo> <cuadros separados por coma> <escala> <columnas>
import { createRequire } from "node:module";
const require = createRequire("D:/Archivos/App de gestion de clientes/package.json");
const sharp = require("sharp");
const [, , dir, salida, lista, escala = "0.5", columnas = "4"] = process.argv;
const cuadros = lista.split(",");
const w = Math.round(1080 * Number(escala));
const h = Math.round(1920 * Number(escala));
const cols = Number(columnas);
const filas = Math.ceil(cuadros.length / cols);
const gap = 12;
const imgs = await Promise.all(
  cuadros.map(async (c) => ({
    input: await sharp(`${dir}/element-${String(c).padStart(3, "0")}.png`).resize(w, h).toBuffer(),
  })),
);
const comp = imgs.map((im, i) => ({
  ...im,
  left: gap + (i % cols) * (w + gap),
  top: gap + Math.floor(i / cols) * (h + gap),
}));
await sharp({
  create: {
    width: cols * (w + gap) + gap,
    height: filas * (h + gap) + gap,
    channels: 3,
    background: "#111111",
  },
})
  .composite(comp)
  .png()
  .toFile(salida);
console.log("ok", salida);
