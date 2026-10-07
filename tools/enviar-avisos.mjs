// Aviso diario al celular de cada asesor: «Hoy pagan 3 clientes · 2 morosos».
// Corre cada hora en GitHub Actions (.github/workflows/avisos.yml), sin servidor pagado (no necesita el plan Blaze).
//
// Para cada asesor con el aviso activo (usuarios/{uid}/config/avisos, lo guarda la app al activarlo):
//   1. Mira si ya es su hora en su zona horaria y si hoy todavía no se le avisó.
//   2. Lee su cartera, calcula el resumen con la misma lógica de la app (plataforma/js/logic.js).
//   3. Si hay algo que cobrar, manda el aviso por Firebase Cloud Messaging a sus teléfonos.
//   4. Borra los teléfonos que ya no existen (app desinstalada, permiso quitado).
//
// Necesita el secreto FIREBASE_LLAVE (cuenta de servicio de Firebase, en GitHub → Settings → Secrets → Actions).
// Nunca imprime datos de asesores ni de clientes: solo totales.
// Prueba manual: en GitHub → Actions → «Aviso diario» → Run workflow → marcar «prueba» (avisa ya, sin mirar la hora).
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { resumenAviso } from '../plataforma/js/logic.js';
import { ahoraEn, leToca } from './avisos-horario.mjs';

const llave = process.env.FIREBASE_LLAVE;
if (!llave) {
  console.log('Falta el secreto FIREBASE_LLAVE: no se envía nada (ver BITACORA.md, «Aviso diario»).');
  process.exit(0);
}
initializeApp({ credential: cert(JSON.parse(llave)) });
const db = getFirestore();
const fcm = getMessaging();
const PRUEBA = process.env.AVISOS_PRUEBA === '1';
const TOKEN_MUERTO = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

const ahora = new Date();
let activos = 0, revisados = 0, enviados = 0, fallidos = 0, quitados = 0;

const usuarios = await db.collection('usuarios').select().get();
for (const u of usuarios.docs) {
  const ref = u.ref.collection('config').doc('avisos');
  const doc = await ref.get();
  if (!doc.exists) continue;
  const aviso = doc.data();
  const tokens = Object.entries(aviso.tokens || {}).filter(([, t]) => t && t.token);
  if (!aviso.activo || !tokens.length) continue;
  activos++;

  const { fecha, hora } = ahoraEn(aviso.zona, ahora);
  if (!PRUEBA && !leToca(aviso, fecha, hora)) continue;
  revisados++;

  const [clientes, config] = await Promise.all([u.ref.collection('clientes').get(), u.ref.collection('config').doc('main').get()]);
  const dias = config.exists && Number.isFinite(config.data().diasAviso) ? config.data().diasAviso : 7;
  const r = resumenAviso(clientes.docs.map((c) => c.data()), fecha, dias);
  await ref.update({ ultimoEnvio: fecha }); // ya se revisó hoy, aunque no haya nada que avisar
  if (!r.texto) continue;

  const res = await fcm.sendEachForMulticast({
    tokens: tokens.map(([, t]) => t.token),
    webpush: {
      headers: { Urgency: 'high', TTL: String(6 * 3600) },
      data: { titulo: 'Cartera Asesor · Tu día', cuerpo: r.texto, url: './' },
    },
  });
  enviados += res.successCount;
  fallidos += res.failureCount;
  const quitar = {};
  res.responses.forEach((x, i) => {
    if (x.error && TOKEN_MUERTO.has(x.error.code)) quitar[`tokens.${tokens[i][0]}`] = FieldValue.delete();
  });
  if (Object.keys(quitar).length) {
    quitados += Object.keys(quitar).length;
    if (Object.keys(quitar).length === tokens.length) quitar.activo = false;
    await ref.update(quitar);
  }
}

console.log(`Asesores con aviso activo: ${activos} · les tocaba ahora: ${revisados} · avisos enviados: ${enviados}` +
  ` · fallidos: ${fallidos} · teléfonos dados de baja: ${quitados}${PRUEBA ? ' (modo prueba)' : ''}`);
