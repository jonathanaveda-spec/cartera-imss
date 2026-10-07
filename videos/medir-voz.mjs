// Mide dónde empieza y dónde termina de verdad cada voz (sin el silencio que añade Azure) y lo anota en
// public/voz/<id>/tiempos.json como "inicio" y "fin" (segundos). Uso: node medir-voz.mjs <id> [<id>…]
// También sirve para revisar un video ya renderizado: node medir-voz.mjs --video out/archivo.mp4  (imprime los tramos con voz).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FFMPEG = join(AQUI, 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'); // el que trae Remotion
const VENTANA = 0.02; // 20 ms
const SR = 16000;

// Energía (RMS) cada 20 ms del audio de un MP3 o MP4.
async function energia(ruta) {
  const pcm = execFileSync(FFMPEG, ['-v', 'error', '-i', ruta, '-vn', '-ac', '1', '-ar', String(SR), '-f', 'wav', '-'], { maxBuffer: 1 << 30 });
  const datos = pcm.subarray(44); const f = new Int16Array(datos.buffer.slice(datos.byteOffset, datos.byteOffset + datos.byteLength - (datos.byteLength % 2))); const norm = 1 / 32768;
  const por = Math.round(SR * VENTANA), bloques = [];
  for (let i = 0; i + por <= f.length; i += por) {
    let acc = 0; for (let j = 0; j < por; j++) acc += (f[i + j] * norm) ** 2;
    bloques.push({ t: i / SR, rms: Math.sqrt(acc / por) });
  }
  return bloques;
}

function tramos(bloques, umbral, huecoMin = 0.35) {
  const res = []; let ini = null, ultimo = null;
  for (const b of bloques) {
    if (b.rms > umbral) { if (ini === null) ini = b.t; ultimo = b.t + VENTANA; }
    else if (ini !== null && b.t - ultimo > huecoMin) { res.push([ini, ultimo]); ini = null; }
  }
  if (ini !== null) res.push([ini, ultimo]);
  return res;
}

if (process.argv[2] === '--video') {
  const b = await energia(process.argv[3]);
  const max = Math.max(...b.map((x) => x.rms));
  const tr = tramos(b, max * 0.02, 0.4);
  console.log(`Audio de ${process.argv[3]}: ${(b.at(-1).t + VENTANA).toFixed(2)} s, ${tr.length} tramos con voz`);
  tr.forEach(([a, z], i) => {
    const pico = Math.max(...b.filter((x) => x.t >= a && x.t < z).map((x) => x.rms));
    console.log(`  ${String(i + 1).padStart(2)}  ${a.toFixed(2)} → ${z.toFixed(2)} s  (${(z - a).toFixed(2)} s)  volumen ${(20 * Math.log10(pico)).toFixed(1)} dB`);
  });
} else {
  for (const id of process.argv.slice(2)) {
    const ruta = join(AQUI, 'public', 'voz', id, 'tiempos.json');
    const t = JSON.parse(readFileSync(ruta, 'utf8'));
    for (const f of t.frases) {
      const b = await energia(join(AQUI, 'public', f.archivo));
      const max = Math.max(...b.map((x) => x.rms));
      const tr = tramos(b, max * 0.03, 0.6);
      f.inicio = Number(tr[0][0].toFixed(2));
      f.fin = Number(tr.at(-1)[1].toFixed(2));
      console.log(`${f.archivo}: total ${f.segundos} s · voz ${f.inicio} → ${f.fin} s`);
    }
    writeFileSync(ruta, JSON.stringify(t, null, 2));
  }
}
