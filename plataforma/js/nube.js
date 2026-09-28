// Nube multiusuario (Firebase Auth + Firestore). Cada asesor tiene su cartera en usuarios/{uid}/...
// Local primero: la app trabaja sobre S.db (funciona sin internet) y este módulo sincroniza con la nube.
import { firebaseConfig } from './nube-config.js';
import * as S from './store.js';
import { calcularCambios, actualizarBase, separarConfig, limpio, estable } from './sincro.js';
import { planEfectivo, cupo, puedeEditar } from './plan.js';

export const nubeActiva = !!firebaseConfig;
export const estado = { usuario: null, uid: null, error: null, perfil: null, plan: null, sistema: {}, planEf: planEfectivo() };

let F = null;
let auth = null;
let fs = null;
let raiz = '';          // 'usuarios/{uid}/'
let listo = false;
const base = new Map(); // clave relativa 'coleccion/id' → firma de lo último conocido en la nube
let desuscribir = [];
let alEstado = () => {};
const LOTE = 400;

export async function preparar() {
  F = await import('../vendor/firebase.js');
  const app = F.initializeApp(firebaseConfig);
  auth = F.getAuth(app);
  try { F.useDeviceLanguage(auth); } catch { /* opcional: correos de Firebase en el idioma del teléfono */ }
  try {
    fs = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
  } catch {
    fs = F.getFirestore(app);
  }
  return { F, auth, fs };
}

export const usuarioActual = () => auth.currentUser;
export const alCambiarUsuario = (cb) => F.onAuthStateChanged(auth, cb);
export const entrar = (correo, clave) => F.signInWithEmailAndPassword(auth, correo.trim(), clave);
export const recuperar = (correo) => F.sendPasswordResetEmail(auth, correo.trim());
export const reenviarVerificacion = () => F.sendEmailVerification(auth.currentUser);

/** Recarga el usuario desde el servidor y devuelve si ya verificó su correo. */
export async function correoVerificado() {
  await F.reload(auth.currentUser);
  // El token debe renovarse para que las reglas de Firestore vean email_verified = true.
  await auth.currentUser.getIdToken(true);
  return auth.currentUser.emailVerified;
}

export async function registrar({ nombre, correo, clave, pais, telefono }) {
  const cred = await F.createUserWithEmailAndPassword(auth, correo.trim(), clave);
  const u = cred.user;
  await F.setDoc(F.doc(fs, 'usuarios', u.uid), {
    nombre: nombre.trim(), correo: u.email, pais, telefono: telefono.trim(),
    creado: F.serverTimestamp(), aceptoTerminos: F.serverTimestamp(),
  });
  await F.sendEmailVerification(u);
  return u;
}

export function mensajeError(e) {
  const c = String((e && e.code) || '') + ' ' + String((e && e.message) || '');
  if (/email-already-in-use/.test(c)) return 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.';
  if (/weak-password/.test(c)) return 'La contraseña debe tener al menos 6 caracteres (mejor 8 o más).';
  if (/invalid-credential|wrong-password|user-not-found/.test(c)) return 'Correo o contraseña incorrectos.';
  if (/invalid-email/.test(c)) return 'El correo no es válido.';
  if (/too-many-requests/.test(c)) return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
  if (/network-request-failed|unavailable/.test(c)) return 'No hay conexión a internet.';
  if (/requires-recent-login/.test(c)) return 'Por seguridad, cierra sesión, vuelve a entrar e inténtalo de nuevo.';
  if (/permission-denied/.test(c)) return 'No tienes permiso para esta acción.';
  if (/api-key-not-valid|invalid-api-key/.test(c)) return 'La configuración de Firebase no es válida (revisa nube-config.js).';
  return (e && e.message) || 'Error desconocido';
}

function fallo(e) {
  console.error('Nube:', e);
  estado.error = mensajeError(e);
  alEstado();
}

// ---------- Cuenta, plan y sistema ----------
export async function cargarCuenta() {
  const u = auth.currentUser;
  estado.usuario = u.email;
  estado.uid = u.uid;
  raiz = `usuarios/${u.uid}/`;
  const leer = async (ref) => { try { const d = await F.getDoc(ref); return d.exists() ? d.data() : null; } catch (e) { if (e.code === 'permission-denied') throw e; return null; } };
  const [perfil, plan, sistema] = await Promise.all([
    leer(F.doc(fs, 'usuarios', u.uid)), leer(F.doc(fs, 'planes', u.uid)), leer(F.doc(fs, 'sistema', 'config')),
  ]);
  if (!perfil) {
    // Por si el perfil no se creó al registrarse (p. ej. se cortó la conexión).
    await F.setDoc(F.doc(fs, 'usuarios', u.uid), { nombre: '', correo: u.email, pais: '', telefono: '', creado: F.serverTimestamp() });
  }
  // Fecha de registro: la prueba gratis corre desde ahí (si el perfil recién se creó, desde ahora).
  estado.perfil = perfil || { correo: u.email };
  estado.creado = perfil?.creado?.toMillis ? perfil.creado.toMillis() : Date.now();
  estado.plan = plan ? { ...plan, vence: plan.vence?.toMillis ? plan.vence.toMillis() : plan.vence ?? null } : null;
  estado.sistema = sistema || {};
  recalcularPlan();
  // Cambios de plan hechos por el administrador llegan en vivo.
  desuscribir.push(F.onSnapshot(F.doc(fs, 'planes', u.uid), (d) => {
    const p = d.exists() ? d.data() : null;
    estado.plan = p ? { ...p, vence: p.vence?.toMillis ? p.vence.toMillis() : p.vence ?? null } : null;
    recalcularPlan();
    alEstado();
  }, () => { /* sin permiso o sin conexión: se queda el último plan conocido */ }));
  iniciarSoporte();
  return estado;
}

/** Recalcula el plan vigente (se llama al cargar, al cambiar el plan y al volver a abrir la app: la prueba vence con el tiempo). */
export function recalcularPlan() {
  estado.planEf = planEfectivo({ plan: estado.plan, sistema: estado.sistema, creado: estado.creado });
  return estado.planEf;
}

export const cupoPara = (actuales, nuevos = 1) => cupo(estado.planEf, actuales, nuevos);
export const puedeEditarCartera = () => puedeEditar(estado.planEf, S.db.clientes.length);

/** Pagos del plan registrados por el administrador para este asesor (para "Mi plan"). */
export async function misPagosPlan() {
  const s = await F.getDocs(F.query(F.collection(fs, 'pagos_plan'), F.where('uid', '==', estado.uid)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.registrado?.toMillis?.() || 0) - (a.registrado?.toMillis?.() || 0));
}

// ---------- Envío de cambios ----------
const ref = (clave) => F.doc(fs, raiz + clave);

async function enviarLotes(escribir, borrar) {
  for (let i = 0; i < escribir.length; i += LOTE) {
    const b = F.writeBatch(fs);
    for (const e of escribir.slice(i, i + LOTE)) b.set(ref(e.key), e.doc);
    await b.commit();
  }
  for (let i = 0; i < borrar.length; i += LOTE) {
    const b = F.writeBatch(fs);
    for (const k of borrar.slice(i, i + LOTE)) b.delete(ref(k));
    await b.commit();
  }
}

function empujar() {
  if (!listo) return;
  const { escribir, borrar } = calcularCambios(S.db, base);
  if (!escribir.length && !borrar.length) return;
  for (const e of escribir) base.set(e.key, e.firma);
  for (const k of borrar) base.delete(k);
  enviarLotes(escribir, borrar)
    .then(() => { if (estado.error) { estado.error = null; alEstado(); } })
    .catch(fallo);
}

// ---------- Sincronización ----------
export async function iniciarSincronizacion({ preguntarSubida, alRemoto, alCambiarEstado }) {
  alEstado = alCambiarEstado || (() => {});
  S.hooks.push = empujar;
  S.hooks.remoto = alRemoto || null;

  let vacia = null;
  try {
    vacia = (await F.getDocsFromServer(F.query(F.collection(fs, raiz + 'clientes'), F.limit(1)))).empty;
  } catch (e) {
    if (e && e.code === 'permission-denied') throw e;
  }
  if (vacia === true && S.db.clientes.length) {
    if (!(await preguntarSubida(S.db.clientes.length))) return 'cancelado';
    await S.copiaPrevia('antes de subir a la nube');
    await enviarLotes(calcularCambios(S.db, new Map()).escribir, []);
  }

  await new Promise((resolve) => {
    const pendientes = new Set(['clientes', 'papelera', 'historial', 'config']);
    let terminado = false;
    const fin = (nombre) => {
      pendientes.delete(nombre);
      if (pendientes.size || terminado) return;
      terminado = true;
      listo = true;
      empujar();
      resolve();
    };
    const parteDe = (nombre, datos) => {
      if (nombre !== 'config') return { [nombre]: datos };
      const d = datos.find((x) => x.id === 'main');
      if (!d) return {};
      const { id, ...resto } = d;
      const c = separarConfig(resto);
      return { config: { ...S.db.config, ...c.config }, importaciones: c.importaciones };
    };
    const escuchar = (nombre, consulta, aplicar) => {
      desuscribir.push(F.onSnapshot(consulta, async (snap) => {
        if (snap.metadata.fromCache && snap.empty && S.db.clientes.length) { fin(nombre); return; }
        const datos = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        aplicar(datos);
        await S.aplicarRemoto(parteDe(nombre, datos));
        fin(nombre);
      }, (e) => { fallo(e); fin(nombre); }));
    };
    const col = (n) => F.collection(fs, raiz + n);
    escuchar('clientes', col('clientes'), (d) => actualizarBase(base, 'clientes', d));
    escuchar('papelera', col('papelera'), (d) => actualizarBase(base, 'papelera', d));
    escuchar('historial', F.query(col('historial'), F.orderBy('ts', 'desc'), F.limit(300)), (d) => actualizarBase(base, 'historial', d));
    escuchar('config', col('config'), (d) => {
      base.delete('config/main');
      const x = d.find((y) => y.id === 'main');
      if (x) { const { id, ...resto } = x; base.set('config/main', estable(limpio(resto))); }
    });
    setTimeout(() => { if (!terminado) { terminado = true; listo = true; resolve(); } }, 8000);
  });
  return 'ok';
}

// ---------- Soporte: conversaciones con el equipo ----------
// tickets/{id}: resumen de la conversación (estado, último mensaje, no leídos).
// tickets/{id}/mensajes/{id}: cada mensaje del hilo ({ de: 'asesor' | 'soporte', texto, autor, creado }).
export const soporte = { tickets: [], noLeidos: 0, listo: false };
let alSoporte = () => {};
export const escucharSoporte = (cb) => { alSoporte = cb; };
const porActualizado = (a, b) => (b.actualizado?.toMillis?.() || b.creado?.toMillis?.() || 0) - (a.actualizado?.toMillis?.() || a.creado?.toMillis?.() || 0);

function iniciarSoporte() {
  soporte.listo = false;
  desuscribir.push(F.onSnapshot(F.query(F.collection(fs, 'tickets'), F.where('uid', '==', estado.uid)), (snap) => {
    const antes = new Map(soporte.tickets.map((x) => [x.id, x]));
    soporte.tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(porActualizado);
    // Respuestas nuevas llegadas mientras la app está abierta (no se avisan las que ya estaban al entrar).
    const nuevas = soporte.listo ? soporte.tickets.filter((x) => x.noLeidoAsesor && !antes.get(x.id)?.noLeidoAsesor) : [];
    soporte.noLeidos = soporte.tickets.filter((x) => x.noLeidoAsesor).length;
    soporte.listo = true;
    try {
      if (soporte.noLeidos) navigator.setAppBadge?.(soporte.noLeidos);
      else navigator.clearAppBadge?.();
    } catch { /* el número en el ícono es opcional */ }
    alSoporte(nuevas);
  }, () => { /* sin conexión: se queda la última lista */ }));
}

const recorte = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 200);

export async function crearConversacion({ tipo, texto, contexto }) {
  const t = String(texto || '').trim().slice(0, 2000);
  if (!t) throw new Error('Escribe tu mensaje');
  const ref = await F.addDoc(F.collection(fs, 'tickets'), {
    uid: estado.uid, correo: estado.usuario, nombre: (estado.perfil?.nombre || '').slice(0, 100),
    tipo, asunto: recorte(t), contexto: limpio(contexto || {}),
    estado: 'abierto', creado: F.serverTimestamp(), actualizado: F.serverTimestamp(),
    ultimoDe: 'asesor', ultimoMensaje: recorte(t), noLeidoAdmin: true, noLeidoAsesor: false,
  });
  await F.addDoc(F.collection(fs, 'tickets', ref.id, 'mensajes'), { de: 'asesor', texto: t, autor: estado.usuario, creado: F.serverTimestamp() });
  return ref.id;
}

/** El asesor escribe en una conversación existente (si estaba resuelta, se vuelve a abrir). */
export async function responderConversacion(id, texto) {
  const t = String(texto || '').trim().slice(0, 2000);
  if (!t) return;
  await F.addDoc(F.collection(fs, 'tickets', id, 'mensajes'), { de: 'asesor', texto: t, autor: estado.usuario, creado: F.serverTimestamp() });
  await F.updateDoc(F.doc(fs, 'tickets', id), {
    estado: 'abierto', actualizado: F.serverTimestamp(), ultimoDe: 'asesor', ultimoMensaje: recorte(t),
    noLeidoAdmin: true, noLeidoAsesor: false,
  });
}

export async function marcarLeida(id) {
  const x = soporte.tickets.find((y) => y.id === id);
  if (x && x.noLeidoAsesor) await F.updateDoc(F.doc(fs, 'tickets', id), { noLeidoAsesor: false });
}

/** Escucha en vivo los mensajes de una conversación. Devuelve la función para dejar de escuchar. */
export function escucharMensajes(id, cb, alError) {
  return F.onSnapshot(F.query(F.collection(fs, 'tickets', id, 'mensajes'), F.orderBy('creado')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), alError);
}

// ---------- Cierre de sesión y eliminación de cuenta ----------
function detener() {
  desuscribir.forEach((f) => { try { f(); } catch { /* ignorar */ } });
  desuscribir = [];
  listo = false;
  S.hooks.push = null;
}

export async function salir() {
  detener();
  try { await F.signOut(auth); } catch { /* ignorar */ }
  try { await F.terminate(fs); await F.clearIndexedDbPersistence(fs); } catch { /* ignorar */ }
  await S.borrarLocal();
}

/** Borra la cartera en la nube, el perfil y la cuenta de acceso (requisito de Apple y Google). */
export async function eliminarCuenta(clave) {
  const u = auth.currentUser;
  // Primero se confirma la contraseña: si es incorrecta no se borra nada.
  await F.reauthenticateWithCredential(u, F.EmailAuthProvider.credential(u.email, clave));
  detener();
  const claves = new Set([...base.keys(), ...calcularCambios(S.db, new Map()).escribir.map((e) => e.key)]);
  const todas = [...claves];
  for (let i = 0; i < todas.length; i += LOTE) {
    const b = F.writeBatch(fs);
    for (const k of todas.slice(i, i + LOTE)) b.delete(ref(k));
    await b.commit();
  }
  await F.writeBatch(fs).delete(F.doc(fs, 'usuarios', u.uid)).commit();
  await F.deleteUser(u);
  try { await F.terminate(fs); await F.clearIndexedDbPersistence(fs); } catch { /* ignorar */ }
  await S.borrarLocal();
}
