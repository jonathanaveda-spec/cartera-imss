// Sincronización con la nube (Firebase Auth + Firestore). Local primero: la app siempre trabaja sobre `S.db`
// (funciona sin internet) y este módulo envía los cambios y recibe los de otros dispositivos.
import { firebaseConfig } from './nube-config.js';
import * as S from './store.js';
import { calcularCambios, actualizarBase, separarConfig, limpio, estable } from './sincro.js';

export const nubeActiva = !!firebaseConfig;
export const estado = { usuario: null, error: null, sincronizando: false };

let F = null; // SDK de Firebase (se carga solo si la nube está configurada)
let auth = null;
let fs = null;
let listo = false;
const base = new Map(); // clave 'coleccion/id' → firma de lo último conocido en la nube
let desuscribir = [];
let alEstado = () => {};

const LOTE = 400;

export async function preparar() {
  F = await import('../vendor/firebase.js');
  const app = F.initializeApp(firebaseConfig);
  auth = F.getAuth(app);
  try {
    fs = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
  } catch {
    fs = F.getFirestore(app); // sin caché persistente (raro): funciona, pero sin modo sin conexión propio
  }
}

export const alCambiarUsuario = (cb) => F.onAuthStateChanged(auth, cb);
export const entrar = (correo, clave) => F.signInWithEmailAndPassword(auth, correo.trim(), clave);
export const recuperar = (correo) => F.sendPasswordResetEmail(auth, correo.trim());

export function mensajeError(e) {
  const c = e && e.code ? String(e.code) : '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(c)) return 'Correo o contraseña incorrectos.';
  if (/too-many-requests/.test(c)) return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
  if (/network-request-failed/.test(c)) return 'No hay conexión a internet.';
  if (/api-key-not-valid|invalid-api-key/.test(c + (e && e.message || ''))) return 'La configuración de Firebase no es válida (revisa nube-config.js).';
  if (/permission-denied/.test(c)) return 'Esta cuenta no tiene permiso para ver los datos.';
  return (e && e.message) || 'Error desconocido';
}

function fallo(e) {
  console.error('Nube:', e);
  estado.error = mensajeError(e);
  alEstado();
}

// ---------- Envío de cambios ----------
async function enviarLotes(escribir, borrar) {
  for (let i = 0; i < escribir.length; i += LOTE) {
    const b = F.writeBatch(fs);
    for (const e of escribir.slice(i, i + LOTE)) b.set(F.doc(fs, e.key), e.doc);
    await b.commit();
  }
  for (let i = 0; i < borrar.length; i += LOTE) {
    const b = F.writeBatch(fs);
    for (const k of borrar.slice(i, i + LOTE)) b.delete(F.doc(fs, k));
    await b.commit();
  }
}

/** Envía a la nube lo que cambió. No espera respuesta: sin internet queda en cola y se sube al volver. */
function empujar() {
  if (!listo) return;
  const { escribir, borrar } = calcularCambios(S.db, base);
  if (!escribir.length && !borrar.length) return;
  for (const e of escribir) base.set(e.key, e.firma);
  for (const k of borrar) base.delete(k);
  estado.sincronizando = true;
  enviarLotes(escribir, borrar)
    .then(() => { estado.sincronizando = false; if (estado.error) { estado.error = null; alEstado(); } })
    .catch((e) => { estado.sincronizando = false; fallo(e); });
}

// ---------- Inicio de la sincronización ----------
/**
 * Devuelve 'ok' | 'cancelado'.
 * `preguntarSubida(n)` se llama solo si la nube está vacía y este dispositivo ya tiene clientes.
 */
export async function iniciarSincronizacion({ preguntarSubida, alRemoto, alCambiarEstado }) {
  alEstado = alCambiarEstado || (() => {});
  S.hooks.push = empujar;
  S.hooks.remoto = alRemoto || null;
  estado.usuario = auth.currentUser ? auth.currentUser.email : null;

  // ¿La nube está realmente vacía? Solo se puede saber con conexión.
  let vacia = null;
  try {
    vacia = (await F.getDocsFromServer(F.query(F.collection(fs, 'clientes'), F.limit(1)))).empty;
  } catch (e) {
    if (e && e.code === 'permission-denied') throw e;
  }
  const locales = S.db.clientes.length;

  if (vacia === true && locales) {
    if (!(await preguntarSubida(locales))) return 'cancelado';
    await S.copiaPrevia('antes de subir a la nube');
    const { escribir } = calcularCambios(S.db, new Map());
    await enviarLotes(escribir, []);
  } else if (vacia === false && locales) {
    await S.copiaPrevia('antes de sincronizar con la nube');
  }

  await new Promise((resolve) => {
    const pendientes = new Set(['clientes', 'papelera', 'historial', 'config']);
    let terminado = false;
    const fin = (nombre) => {
      pendientes.delete(nombre);
      if (pendientes.size || terminado) return;
      terminado = true;
      listo = true;
      empujar(); // por si algo cambió mientras se conectaba
      resolve();
    };
    const escuchar = (nombre, consulta, aplicar) => {
      desuscribir.push(F.onSnapshot(consulta, async (snap) => {
        // Sin conexión y sin nada en caché: no se debe vaciar lo que ya hay en el dispositivo.
        if (snap.metadata.fromCache && snap.empty && S.db.clientes.length) { fin(nombre); return; }
        const datos = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        aplicar(datos);
        await S.aplicarRemoto(parteDe(nombre, datos));
        fin(nombre);
      }, (e) => { fallo(e); fin(nombre); }));
    };
    const parteDe = (nombre, datos) => {
      if (nombre === 'config') {
        const d = datos.find((x) => x.id === 'main');
        if (!d) return {};
        const { id, ...resto } = d;
        const c = separarConfig(resto);
        return { config: { ...S.db.config, ...c.config }, importaciones: c.importaciones };
      }
      return { [nombre]: datos };
    };
    escuchar('clientes', F.collection(fs, 'clientes'), (d) => actualizarBase(base, 'clientes', d));
    escuchar('papelera', F.collection(fs, 'papelera'), (d) => actualizarBase(base, 'papelera', d));
    escuchar('historial', F.query(F.collection(fs, 'historial'), F.orderBy('ts', 'desc'), F.limit(3000)), (d) => actualizarBase(base, 'historial', d));
    escuchar('config', F.collection(fs, 'config'), (d) => {
      base.delete('config/main');
      const x = d.find((y) => y.id === 'main');
      if (x) { const { id, ...resto } = x; base.set('config/main', estable(limpio(resto))); }
    });
    setTimeout(() => { if (!terminado) { terminado = true; listo = true; resolve(); } }, 8000); // si tarda, se abre con lo local
  });
  return 'ok';
}

// ---------- Cierre de sesión ----------
export async function salir() {
  desuscribir.forEach((f) => { try { f(); } catch { /* ignorar */ } });
  desuscribir = [];
  listo = false;
  S.hooks.push = null;
  try { await F.signOut(auth); } catch { /* ignorar */ }
  // Se borra la copia local: al cerrar sesión no debe quedar información de clientes en este dispositivo.
  try { await F.terminate(fs); await F.clearIndexedDbPersistence(fs); } catch { /* ignorar */ }
  await S.borrarLocal();
}
