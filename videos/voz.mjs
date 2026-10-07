// Voz en off con Azure Speech (voces neuronales de México). Uso desde la carpeta videos/:
//   node voz.mjs voz/tiktok-04-mensajes.json
// Lee la clave de las variables de entorno AZURE_SPEECH_KEY y AZURE_SPEECH_REGION (se configuran una vez en la PC;
// nunca se escriben en el repo ni en el chat). Escribe un MP3 por frase en public/voz/<id>/NN.mp3 y un
// public/voz/<id>/tiempos.json con la duración de cada frase, para colocarlas en la composición de Remotion.
//
// Formato del guion (voz/<video>.json):
// { "id": "tiktok-04-mensajes", "voz": "es-MX-DaliaNeural", "velocidad": "+5%",
//   "frases": [ { "texto": "Tres mensajes para cobrar sin que se ofendan." }, { "texto": "...", "pausa": 300 } ] }
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const archivo = process.argv[2];
if (!archivo) { console.error('Falta el guion: node voz.mjs voz/<video>.json'); process.exit(1); }
const clave = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
if (!clave || !region) {
  console.error('Faltan AZURE_SPEECH_KEY y/o AZURE_SPEECH_REGION en las variables de entorno de Windows (ver la skill voz-cartera-asesor).');
  process.exit(1);
}

const g = JSON.parse(readFileSync(join(AQUI, archivo), 'utf8'));
const voz = g.voz || 'es-MX-DaliaNeural';
const velocidad = g.velocidad || '+5%';
const salida = join(AQUI, 'public', 'voz', g.id);
mkdirSync(salida, { recursive: true });
const xml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Duración de un MP3 de bitrate constante (192 kbps, que es lo que pedimos a Azure).
const duracionMp3 = (buf) => (buf.length * 8) / 192000;

const tiempos = [];
for (const [i, f] of g.frases.entries()) {
  const ssml = `<speak version="1.0" xml:lang="es-MX"><voice name="${voz}"><prosody rate="${velocidad}">${xml(f.texto)}</prosody>${f.pausa ? `<break time="${f.pausa}ms"/>` : ''}</voice></speak>`;
  const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': clave,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3',
      'User-Agent': 'cartera-asesor-videos',
    },
    body: ssml,
  });
  if (!r.ok) { console.error(`Azure respondió ${r.status} en la frase ${i + 1}: ${await r.text()}`); process.exit(1); }
  const buf = Buffer.from(await r.arrayBuffer());
  const nombre = `${String(i + 1).padStart(2, '0')}.mp3`;
  writeFileSync(join(salida, nombre), buf);
  tiempos.push({ archivo: `voz/${g.id}/${nombre}`, texto: f.texto, segundos: Number(duracionMp3(buf).toFixed(2)) });
  console.log(`✓ ${nombre} · ${tiempos.at(-1).segundos} s · ${f.texto}`);
}
writeFileSync(join(salida, 'tiempos.json'), JSON.stringify({ voz, velocidad, frases: tiempos }, null, 2));
console.log(`Listo: ${tiempos.length} frases, ${tiempos.reduce((s, t) => s + t.segundos, 0).toFixed(1)} s en total → public/voz/${g.id}/`);
