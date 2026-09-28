// Genera los íconos de la plataforma a partir del logo (imagenes/). Uso: node tools/crear-iconos-logo.mjs
//  - icon-192/512 y apple-touch-icon: esquinas rellenas con el azul del fondo (el sistema aplica su propia forma).
//  - logo.png: esquinas transparentes, para mostrar dentro de la app.
import sharp from 'sharp';
import fs from 'node:fs';

const origen = 'imagenes/' + fs.readdirSync('imagenes').find((f) => /\.png$/i.test(f));
const { data, info } = await sharp(origen).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// Relleno por inundación desde las 4 esquinas: todo pixel claro conectado a una esquina es "fuera del logo".
const fuera = new Uint8Array(W * H);
const claro = (p) => Math.min(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) > 40;
const pila = [0, W - 1, (H - 1) * W, H * W - 1];
while (pila.length) {
  const p = pila.pop();
  if (fuera[p] || !claro(p)) continue;
  fuera[p] = 1;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) pila.push(p - 1);
  if (x < W - 1) pila.push(p + 1);
  if (y > 0) pila.push(p - W);
  if (y < H - 1) pila.push(p + W);
}

// Azul del fondo según la altura (degradado de arriba a abajo, tomado del propio logo).
const arriba = [8, 44, 112], abajo = [2, 19, 59];
const conFondo = Buffer.from(data), transparente = Buffer.from(data);
for (let p = 0; p < W * H; p++) {
  if (!fuera[p]) continue;
  const t = ((p / W) | 0) / (H - 1);
  for (let k = 0; k < 3; k++) conFondo[p * 4 + k] = Math.round(arriba[k] + (abajo[k] - arriba[k]) * t);
  transparente[p * 4 + 3] = 0;
}

const raw = (buf) => sharp(buf, { raw: { width: W, height: H, channels: 4 } });
fs.mkdirSync('plataforma/icons', { recursive: true });
for (const [nombre, lado] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await raw(conFondo).resize(lado, lado).flatten({ background: '#08204f' }).png().toFile('plataforma/icons/' + nombre);
}
await raw(transparente).resize(256, 256).png().toFile('plataforma/icons/logo.png');
console.log('Íconos creados desde', origen);
