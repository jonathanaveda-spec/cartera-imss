// Foto de perfil para redes (TikTok, Instagram, Facebook): solo la cartera del logo, grande y centrada,
// para que se lea en el círculo pequeño. Fuente: el logo original en alta (imagenes/, no se sube a GitHub).
// Uso: node tools/avatar-redes.mjs [logo-original.png] → tienda/marca/avatar-redes.png (1080×1080) + vista previa circular
import sharp from 'sharp';

const ORIGEN = process.argv[2] || 'imagenes/c65ea44d-f569-4876-89ee-174ced93b80e.png';
const LADO = 1080;

// 1) Recorte de la cartera dentro del logo original (1254×1254), sin tocar el texto de abajo.
const { data, info } = await sharp(ORIGEN).extract({ left: 270, top: 90, width: 720, height: 640 })
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const brillo = (i) => Math.max(data[i], data[i + 1], data[i + 2]);

// 2) Se quita el fondo azul oscuro «desde los bordes hacia adentro» (relleno por inundación): así las barras oscuras
//    del dibujo, que están rodeadas de blanco, se conservan.
const OSCURO = 0x70;
const fondo = new Uint8Array(w * h);
const pila = [];
for (let x = 0; x < w; x++) pila.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) pila.push(y * w, y * w + w - 1);
while (pila.length) {
  const p = pila.pop();
  if (fondo[p] || brillo(p * 4) >= OSCURO) continue;
  fondo[p] = 1;
  const x = p % w, y = (p - x) / w;
  if (x > 0) pila.push(p - 1); if (x < w - 1) pila.push(p + 1);
  if (y > 0) pila.push(p - w); if (y < h - 1) pila.push(p + w);
}
// Borde suave: los píxeles del dibujo que tocan el fondo se vuelven semitransparentes según su brillo.
for (let p = 0; p < w * h; p++) {
  if (fondo[p]) { data[p * 4 + 3] = 0; continue; }
  const x = p % w;
  const vecino = (x > 0 && fondo[p - 1]) || (x < w - 1 && fondo[p + 1]) || fondo[p - w] || fondo[p + w];
  if (vecino) data[p * 4 + 3] = Math.max(0, Math.min(255, Math.round(((brillo(p * 4) - 0x40) / (0xb0 - 0x40)) * 255)));
}
const ANCHO = 820;
const cartera = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).resize({ width: ANCHO }).png().toBuffer();
const altoCartera = Math.round((h * ANCHO) / w);

// 3) Fondo de marca: azul noche con brillo celeste detrás de la cartera, y una sombra suave debajo.
const fondoSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}">
  <defs>
    <radialGradient id="f" cx="50%" cy="42%" r="72%"><stop offset="0" stop-color="#123c9c"/><stop offset=".55" stop-color="#0b2a6f"/><stop offset="1" stop-color="#04163f"/></radialGradient>
    <radialGradient id="g" cx="50%" cy="46%" r="40%"><stop offset="0" stop-color="#1aa3f5" stop-opacity=".45"/><stop offset="1" stop-color="#1aa3f5" stop-opacity="0"/></radialGradient>
    <filter id="s"><feGaussianBlur stdDeviation="28"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#f)"/><rect width="100%" height="100%" fill="url(#g)"/>
  <ellipse cx="540" cy="${540 + altoCartera / 2 - 30}" rx="300" ry="40" fill="#000" opacity=".35" filter="url(#s)"/></svg>`);

const salida = 'tienda/marca/avatar-redes.png';
await sharp(fondoSvg).composite([{ input: cartera, left: Math.round((LADO - ANCHO) / 2) + 6, top: Math.round((LADO - altoCartera) / 2) - 6 }]).png().toFile(salida);

// 4) Vista previa: cómo se ve recortada en círculo y en tamaño pequeño (como en TikTok).
const circulo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}"><circle cx="${LADO / 2}" cy="${LADO / 2}" r="${LADO / 2}" fill="#fff"/></svg>`);
const redonda = await sharp(salida).composite([{ input: circulo, blend: 'dest-in' }]).png().toBuffer();
const chica = await sharp(redonda).resize(160).toBuffer();
await sharp({ create: { width: 1400, height: 1100, channels: 4, background: '#ffffff' } })
  .composite([{ input: redonda, left: 30, top: 10 }, { input: chica, left: 1170, top: 470 }])
  .png().toFile('tienda/marca/avatar-vista-previa.png');
console.log('listo', salida);
