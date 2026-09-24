// Genera los íconos PNG de la app (sin dependencias). Uso: node tools/crear-iconos.mjs
import zlib from 'node:zlib';
import fs from 'node:fs';

const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const png = (w, h, rgba) => {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
};

// Fondo verde-azulado con degradado suave + cruz blanca de bordes redondeados.
function icono(S) {
  const buf = Buffer.alloc(S * S * 4), SS = 3;
  const rr = (px, py, cx, cy, hw, hh, r) => { // rectángulo redondeado (distancia con signo)
    const dx = Math.abs(px - cx) - (hw - r), dy = Math.abs(py - cy) - (hh - r);
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let cov = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const px = (x + (sx + .5) / SS) / S, py = (y + (sy + .5) / SS) / S;
      const a = rr(px, py, .5, .5, .30, .085, .085), b = rr(px, py, .5, .5, .085, .30, .085);
      if (Math.min(a, b) < 0) cov++;
    }
    const t = (x + y) / (2 * S), c = cov / (SS * SS);
    const bg = [15 + 6 * t, 118 - 30 * t, 110 - 20 * t];
    const i = (y * S + x) * 4;
    for (let k = 0; k < 3; k++) buf[i + k] = Math.round(bg[k] * (1 - c) + 255 * c);
    buf[i + 3] = 255;
  }
  return png(S, S, buf);
}
fs.mkdirSync('app/icons', { recursive: true });
for (const [n, s] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) fs.writeFileSync('app/icons/' + n, icono(s));
console.log('Íconos creados');
