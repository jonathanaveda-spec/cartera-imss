// Efectos de sonido propios para los videos (pop, whoosh, ding, clic, caja, error, tic).
// Se sintetizan con código: gratis, sin licencias de terceros (decisión 19/10: cero herramientas pagas).
// Uso: node tools/generar-sfx.mjs  → crea public/sfx/propios/*.wav (44,1 kHz, mono, 16 bits).
// En Remotion: <Audio src={staticFile('sfx/propios/pop.wav')} volume={0.5} /> dentro de una <Sequence from={cuadro}>.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 44100;
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx', 'propios');
fs.mkdirSync(dir, { recursive: true });

// Ruido reproducible (mismo archivo cada vez que se genera).
let semilla = 12345;
const ruido = () => ((semilla = (semilla * 1103515245 + 12345) & 0x7fffffff) / 0x3fffffff) - 1;

function wav(nombre, segundos, muestra) {
  const n = Math.round(segundos * SR);
  const datos = new Float32Array(n);
  for (let i = 0; i < n; i++) datos[i] = muestra(i / SR, i);
  // Normaliza al 90 % y evita chasquidos al final.
  const pico = datos.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-9);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const cola = Math.min(1, (n - i) / (SR * 0.005));
    buf.writeInt16LE(Math.round((datos[i] / pico) * 0.9 * cola * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(dir, nombre + '.wav'), buf);
  console.log(`sfx/${nombre}.wav  ${segundos.toFixed(2)} s`);
}

const env = (t, ataque, caida) => (t < ataque ? t / ataque : Math.exp(-(t - ataque) / caida));
const seno = (f, t) => Math.sin(2 * Math.PI * f * t);

// pop: burbuja que aparece (texto o tarjeta que entra).
wav('pop', 0.12, (t) => {
  const f = 900 - 3500 * t;                      // barrido rápido hacia abajo
  return seno(Math.max(f, 300), t) * env(t, 0.002, 0.03);
});
// pop2: variante más aguda para no repetir el mismo sonido seguido.
wav('pop2', 0.1, (t) => seno(Math.max(1400 - 6000 * t, 500), t) * env(t, 0.001, 0.025));
// whoosh: cambio de escena o deslizamiento.
let filtro = 0;
wav('whoosh', 0.45, (t) => {
  const corte = 0.02 + 0.25 * Math.sin(Math.PI * Math.min(t / 0.45, 1)); // abre y cierra
  filtro += corte * (ruido() - filtro);
  return filtro * Math.sin(Math.PI * Math.min(t / 0.45, 1)) ** 2;
});
// ding: algo bueno (pago registrado, «ya está ✅»).
wav('ding', 0.9, (t) => (seno(1318.5, t) + 0.5 * seno(2637, t) + 0.25 * seno(3955.5, t)) * env(t, 0.003, 0.25));
// caja: «cha-ching» de dinero (dos golpes metálicos + campanita).
wav('caja', 0.7, (t) => {
  const golpe = (t0) => (t >= t0 ? ruido() * env(t - t0, 0.001, 0.02) : 0);
  const campana = t >= 0.12 ? (seno(2093, t) + 0.6 * seno(2637, t)) * env(t - 0.12, 0.002, 0.18) : 0;
  return 0.6 * golpe(0) + 0.6 * golpe(0.06) + campana;
});
// clic: toque en la pantalla del celular.
wav('clic', 0.05, (t) => (ruido() * 0.5 + seno(2500, t)) * env(t, 0.0005, 0.006));
// error: algo mal (moroso, «ya te deposité» falso).
wav('error', 0.4, (t) => (Math.sign(seno(t < 0.18 ? 220 : 165, t)) * 0.5) * (t < 0.17 || t > 0.2 ? 1 : 0) * env(t, 0.005, 0.2));
// tic: número que cuenta o reloj.
wav('tic', 0.04, (t) => seno(3200, t) * env(t, 0.0005, 0.005));
// subida: tensión antes de revelar algo (1 s).
wav('subida', 1.0, (t) => (seno(300 + 900 * t * t, t) * 0.6 + ruido() * 0.15 * t) * Math.min(1, t * 4) * (t > 0.95 ? (1 - t) / 0.05 : 1));
