// Nube multiusuario (Firebase Auth + Firestore). Cada asesor tiene su cartera en usuarios/{uid}/...
// Local primero: la app trabaja sobre S.db (funciona sin internet) y este módulo sincroniza con la nube.
import { firebaseConfig } from './nube-config.js';
import * as S from './store.js';
import { calcularCambios, actualizarBase, separarConfig, limpio, estable } from './sincro.js';
import { planEfectivo, cupo } from './plan.js';

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
  estado.perfil = perfil || { correo: u.email };
  estado.plan = plan ? { ...plan, vence: plan.vence?.toMillis ? plan.vence.toMillis() : plan.vence ?? null } : null;
  estado.sistema = sistema || {};
  estado.planEf = planEfectivo({ plan: estado.plan, sistema: estado.sistema });
  // Cambios de plan hechos por el administrador llegan en vivo.
  desuscribir.push(F.onSnapshot(F.doc(fs, 'planes', u.uid), (d) => {
    const p = d.exists() ? d.data() : null;
    estado.plan = p ? { ...p, vence: p.vence?.toMillis ? p.vence.toMillis() : p.vence ?? null } : null;
    estado.planEf = planEfectivo({ plan: estado.plan, sistema: estado.sistema });
    alEstado();
  }, () => { /* sin permiso o sin conexión: se queda el último plan conocido */ }));
  return estado;
}

export const cupoPara = (actuales, nuevos = 1) => cupo(estado.planEf, actuales, nuevos);

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

// ---------- Soporte ----------
export async function crearTicket({ tipo, mensaje, contexto }) {
  await F.addDoc(F.collection(fs, 'tickets'), {
    uid: estado.uid, correo: estado.usuario, nombre: estado.perfil?.nombre || '',
    tipo, mensaje: mensaje.trim().slice(0, 4000), contexto: limpio(contexto || {}),
    estado: 'abierto', respuesta: '', creado: F.serverTimestamp(),
  });
}

export async function misTickets() {
  const s = await F.getDocs(F.query(F.collection(fs, 'tickets'), F.where('uid', '==', estado.uid)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.creado?.toMillis?.() || 0) - (a.creado?.toMillis?.() || 0));
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
