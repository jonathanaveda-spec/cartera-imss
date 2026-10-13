// Voz en off para los videos. Dos motores: Azure Speech (voces neuronales de México, plan gratis) y ElevenLabs
// (voces más humanas, plan pago para uso comercial). Uso desde la carpeta videos/:
//   node voz.mjs voz/tiktok-04-mensajes.json
// Las claves van en variables de entorno de Windows (se configuran una vez en la PC; nunca en el repo ni en el chat):
//   Azure:      AZURE_SPEECH_KEY y AZURE_SPEECH_REGION
//   ElevenLabs: ELEVENLABS_API_KEY
// Escribe un MP3 por frase en public/voz/<id>/NN.mp3 y public/voz/<id>/tiempos.json con la duración de cada frase,
// para colocarlas en la composición de Remotion.
//
// Formato del guion (voz/<video>.json):
// { "id": "tiktok-04-mensajes", "voz": "es-MX-DaliaNeural", "velocidad": "+5%",
//   "frases": [ { "texto": "Tres mensajes para cobrar sin que se ofendan." }, { "texto": "...", "pausa": 300 } ] }
// Opcional en cada frase: "voz" (otra voz, para diálogos), "estilo" (cheerful, excited, whispering…) y "velocidad".
//
// ElevenLabs: agregar "motor": "elevenlabs" y en "voz" el ID de la voz (se copia en elevenlabs.io → Voices → ⋯ → Copy
// voice ID). Opcionales: "modelo" (por defecto eleven_multilingual_v2), "estabilidad" (0–1, por defecto 0.5) y
// "parecido" (0–1, por defecto 0.75). "estilo" y "velocidad" son solo de Azure. Una frase puede usar el otro motor
// con su propio "motor".
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const archivo = process.argv[2];
if (!archivo) { console.error('Falta el guion: node voz.mjs voz/<video>.json'); process.exit(1); }

const g = JSON.parse(readFileSync(join(AQUI, archivo), 'utf8'));
const motorGuion = g.motor || 'azure';
const voz = g.voz || (motorGuion === 'azure' ? 'es-MX-DaliaNeural' : null);
const velocidad = g.velocidad || '+5%';
const salida = join(AQUI, 'public', 'voz', g.id);
mkdirSync(salida, { recursive: true });

const usados = new Set([motorGuion, ...g.frases.map((f) => f.motor).filter(Boolean)]);
for (const m of usados) if (!['azure', 'elevenlabs'].includes(m)) { console.error(`Motor desconocido: «${m}» (usa azure o elevenlabs).`); process.exit(1); }
if (usados.has('azure') && (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION)) {
  console.error('Faltan AZURE_SPEECH_KEY y/o AZURE_SPEECH_REGION en las variables de entorno de Windows (ver la skill voz-cartera-asesor).');
  process.exit(1);
}
if (usados.has('elevenlabs') && !process.env.ELEVENLABS_API_KEY) {
  console.error('Falta ELEVENLABS_API_KEY en las variables de entorno de Windows (ver la skill voz-cartera-asesor).');
  process.exit(1);
}

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
const xml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Pide la frase y reintenta si el servicio pide esperar (429): el plan gratis de Azure acepta ~20 frases por minuto.
async function pedir(nombre, hacer) {
  for (let intento = 1; ; intento++) {
    const r = await hacer();
    if (r.status !== 429 || intento === 8) return r;
    console.log(`  (${nombre} pide esperar; reintento en 15 s…)`);
    await esperar(15000);
  }
}

// Azure: MP3 de 192 kbps constantes; la pausa va dentro del audio (SSML).
async function azure(f, vozFrase) {
  const estilo = f.estilo || g.estilo;
  let cuerpo = `<prosody rate="${f.velocidad || velocidad}">${xml(f.texto)}</prosody>`;
  if (estilo) cuerpo = `<mstts:express-as style="${estilo}">${cuerpo}</mstts:express-as>`;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="es-MX"><voice name="${vozFrase}">${cuerpo}${f.pausa ? `<break time="${f.pausa}ms"/>` : ''}</voice></speak>`;
  const r = await pedir('Azure', () => fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3',
      'User-Agent': 'cartera-asesor-videos',
    },
    body: ssml,
  }));
  if (!r.ok) throw new Error(`Azure respondió ${r.status}: ${await r.text()}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return { buf, segundos: (buf.length * 8) / 192000 };
}

// ElevenLabs: MP3 de 128 kbps constantes; la pausa no va en el audio, se suma a la duración para dejar el hueco.
async function elevenlabs(f, vozFrase) {
  if (!vozFrase) throw new Error('Falta el ID de la voz de ElevenLabs en "voz".');
  const r = await pedir('ElevenLabs', () => fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vozFrase)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: f.texto,
      model_id: f.modelo || g.modelo || 'eleven_multilingual_v2',
      voice_settings: { stability: f.estabilidad ?? g.estabilidad ?? 0.5, similarity_boost: f.parecido ?? g.parecido ?? 0.75 },
    }),
  }));
  if (!r.ok) throw new Error(`ElevenLabs respondió ${r.status}: ${await r.text()}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return { buf, segundos: (buf.length * 8) / 128000 + (f.pausa || 0) / 1000 };
}

const tiempos = [];
for (const [i, f] of g.frases.entries()) {
  const motor = f.motor || motorGuion;
  // Una frase de otro motor necesita su propia voz (las de Azure no existen en ElevenLabs y al revés).
  const vozFrase = f.voz || (motor === motorGuion ? voz : null) || (motor === 'azure' ? 'es-MX-DaliaNeural' : null);
  let res;
  try { res = motor === 'elevenlabs' ? await elevenlabs(f, vozFrase) : await azure(f, vozFrase); }
  catch (e) { console.error(`Frase ${i + 1}: ${e.message}`); process.exit(1); }
  const nombre = `${String(i + 1).padStart(2, '0')}.mp3`;
  writeFileSync(join(salida, nombre), res.buf);
  tiempos.push({ archivo: `voz/${g.id}/${nombre}`, motor, voz: vozFrase, texto: f.texto, segundos: Number(res.segundos.toFixed(2)) });
  console.log(`✓ ${nombre} · ${motor} · ${tiempos.at(-1).segundos} s · ${f.texto}`);
}
writeFileSync(join(salida, 'tiempos.json'), JSON.stringify({ motor: motorGuion, voz, velocidad, frases: tiempos }, null, 2));
console.log(`Listo: ${tiempos.length} frases, ${tiempos.reduce((s, t) => s + t.segundos, 0).toFixed(1)} s en total → public/voz/${g.id}/`);
