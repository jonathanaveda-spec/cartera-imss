// SIMULADOR de Firebase SOLO PARA PRUEBAS LOCALES (serve.js lo sirve en /demo/). Nunca se publica.
// Imita la parte del SDK que usa la plataforma, guardando todo en localStorage.
// Reglas simplificadas: cada usuario solo accede a lo suyo; es administrador quien tenga un correo que empiece con "admin@".
const LS = 'fakefb';
const cargar = () => { try { return JSON.parse(localStorage.getItem(LS)) || { users: {}, docs: {}, current: null }; } catch { return { users: {}, docs: {}, current: null }; } };
let st = cargar();
const guardar = () => localStorage.setItem(LS, JSON.stringify(st));
const copia = (o) => JSON.parse(JSON.stringify(o));
const err = (code) => Object.assign(new Error(code), { code });
const nuevoId = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36);

// ---------- Timestamps ----------
const ts = (ms) => ({ toMillis: () => ms, toDate: () => new Date(ms) });
function hidratar(v) {
  if (Array.isArray(v)) return v.map(hidratar);
  if (v && typeof v === 'object') {
    if ('__ts' in v) return ts(v.__ts);
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, hidratar(x)]));
  }
  return v;
}
function deshidratar(v) {
  if (Array.isArray(v)) return v.map(deshidratar);
  if (v && typeof v === 'object') {
    if (v.__servidor) return { __ts: Date.now() };
    if (typeof v.toMillis === 'function') return { __ts: v.toMillis() };
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, deshidratar(x)]));
  }
  return v;
}

// ---------- App / Auth ----------
export const initializeApp = () => ({});
const auth = { currentUser: null };
const oyentesAuth = [];
function usuarioDe(email) {
  const u = st.users[email];
  if (!u) return null;
  return {
    uid: u.uid, email: u.email, get emailVerified() { return st.users[email]?.emailVerified || false; },
    getIdToken: async () => 'token',
  };
}
function refrescarActual() { auth.currentUser = st.current ? usuarioDe(st.current) : null; }
refrescarActual();
const avisarAuth = () => { refrescarActual(); oyentesAuth.forEach((cb) => setTimeout(() => cb(auth.currentUser), 0)); };

export const getAuth = () => auth;
export const useDeviceLanguage = () => {};
export function onAuthStateChanged(_a, cb) { oyentesAuth.push(cb); setTimeout(() => cb(auth.currentUser), 0); return () => {}; }
export async function signInWithEmailAndPassword(_a, email, pw) {
  const u = st.users[email.toLowerCase()];
  if (!u || u.password !== pw) throw err('auth/invalid-credential');
  st.current = u.email; guardar(); avisarAuth();
  return { user: auth.currentUser };
}
export async function createUserWithEmailAndPassword(_a, email, pw) {
  email = email.toLowerCase();
  if (st.users[email]) throw err('auth/email-already-in-use');
  if (pw.length < 6) throw err('auth/weak-password');
  st.users[email] = { uid: 'u_' + nuevoId(), email, password: pw, emailVerified: false, enviado: false };
  st.current = email; guardar(); refrescarActual();
  setTimeout(avisarAuth, 0);
  return { user: auth.currentUser };
}
export async function sendEmailVerification(u) { st.users[u.email].enviado = true; guardar(); console.info('[simulador] correo de verificación enviado a', u.email); }
// Simula que el usuario abrió el enlace del correo: al recargar, queda verificado.
export async function reload(u) { const x = st.users[u.email]; if (x?.enviado) { x.emailVerified = true; guardar(); } refrescarActual(); }
export async function sendPasswordResetEmail() {}
export async function signOut() { st.current = null; guardar(); avisarAuth(); }
export const EmailAuthProvider = { credential: (email, password) => ({ email, password }) };
export async function reauthenticateWithCredential(u, c) { if (st.users[u.email]?.password !== c.password) throw err('auth/invalid-credential'); }
export async function deleteUser(u) { delete st.users[u.email]; st.current = null; guardar(); avisarAuth(); }

// ---------- Firestore ----------
export const initializeFirestore = () => ({});
export const getFirestore = () => ({});
export const persistentLocalCache = () => ({});
export const persistentMultipleTabManager = () => ({});
export const terminate = async () => {};
export const clearIndexedDbPersistence = async () => {};
export const serverTimestamp = () => ({ __servidor: true });

const unir = (partes) => partes.flat().filter((p) => p && typeof p === 'string').join('/').replace(/\/+/g, '/').replace(/\/$/, '');
export const doc = (_fs, ...p) => ({ tipo: 'doc', path: unir(p), get id() { return this.path.split('/').pop(); } });
export const collection = (_fs, ...p) => ({ tipo: 'col', path: unir(p) });
export const query = (c, ...cons) => ({ tipo: 'query', path: c.path, cons });
export const where = (campo, op, valor) => ({ t: 'where', campo, op, valor });
export const orderBy = (campo, dir = 'asc') => ({ t: 'orderBy', campo, dir });
export const limit = (n) => ({ t: 'limit', n });

// --- permisos simplificados ---
const yo = () => (st.current ? st.users[st.current] : null);
const esAdmin = () => !!yo() && yo().email.startsWith('admin@') && yo().emailVerified;
function permitido(path, accion, dato) {
  const u = yo();
  if (!u) return false;
  const s = path.split('/');
  if (s[0] === 'sistema') return accion === 'leer' || esAdmin();
  if (s[0] === 'usuarios') {
    if (s.length === 1) return esAdmin();                        // listar todos los asesores
    const dueno = s[1] === u.uid;
    if (s.length === 2) return dueno || (accion === 'leer' && esAdmin());
    return (dueno && u.emailVerified) || (accion === 'leer' && esAdmin());
  }
  if (s[0] === 'planes') return accion === 'leer' ? (s[1] === u.uid || esAdmin() || s.length === 1 && esAdmin()) : esAdmin();
  if (s[0] === 'tickets') {
    if (accion === 'crear') return u.emailVerified && dato?.uid === u.uid;
    if (accion === 'leer') return true;                            // se filtra por uid en ejecutar()
    return esAdmin();
  }
  if (s[0] === 'admin_log') return esAdmin();
  return false;
}
const exigir = (path, accion, dato) => { if (!permitido(path, accion, dato)) throw err('permission-denied'); };

const hijosDirectos = (colPath) => Object.keys(st.docs).filter((p) => p.startsWith(colPath + '/') && p.slice(colPath.length + 1).split('/').length === 1);
function ejecutar(q) {
  let ids = hijosDirectos(q.path);
  let filas = ids.map((p) => ({ id: p.split('/').pop(), dato: st.docs[p] }));
  const cons = q.cons || [];
  if (q.path === 'tickets' && !esAdmin()) {
    const w = cons.find((c) => c.t === 'where' && c.campo === 'uid' && c.valor === yo()?.uid);
    if (!w) throw err('permission-denied');
  }
  for (const c of cons) {
    if (c.t === 'where' && c.op === '==') filas = filas.filter((f) => f.dato[c.campo] === c.valor);
    if (c.t === 'orderBy') {
      const val = (f) => { const x = f.dato[c.campo]; return x && x.__ts ? x.__ts : x; };
      filas.sort((a, b) => ((val(a) > val(b)) - (val(a) < val(b))) * (c.dir === 'desc' ? -1 : 1));
    }
    if (c.t === 'limit') filas = filas.slice(0, c.n);
  }
  return filas;
}
const instantaneaDoc = (ref) => ({ id: ref.id, exists: () => ref.path in st.docs, data: () => (ref.path in st.docs ? hidratar(copia(st.docs[ref.path])) : undefined) });
const instantaneaQuery = (filas) => ({
  empty: !filas.length, size: filas.length, metadata: { fromCache: false },
  docs: filas.map((f) => ({ id: f.id, data: () => hidratar(copia(f.dato)), exists: () => true })),
});

export async function getDoc(ref) { exigir(ref.path, 'leer'); return instantaneaDoc(ref); }
export async function getDocs(q) { exigir(q.path, 'leer'); return instantaneaQuery(ejecutar(q.tipo === 'col' ? { path: q.path } : q)); }
export const getDocsFromServer = getDocs;
export async function getCountFromServer(q) { exigir(q.path, 'leer'); const n = ejecutar(q.tipo === 'col' ? { path: q.path } : q).length; return { data: () => ({ count: n }) }; }

const oyentes = new Set();
function notificar() { for (const o of oyentes) o(); }
export function onSnapshot(ref, siguiente, error) {
  const emitir = () => {
    try {
      if (ref.tipo === 'doc') { exigir(ref.path, 'leer'); siguiente(instantaneaDoc(ref)); }
      else { exigir(ref.path, 'leer'); siguiente(instantaneaQuery(ejecutar(ref.tipo === 'col' ? { path: ref.path } : ref))); }
    } catch (e) { error && error(e); }
  };
  const o = () => setTimeout(emitir, 0);
  oyentes.add(o);
  o();
  return () => oyentes.delete(o);
}

export async function setDoc(ref, dato) { exigir(ref.path, 'escribir', dato); st.docs[ref.path] = deshidratar(dato); guardar(); notificar(); }
export async function updateDoc(ref, cambios) {
  exigir(ref.path, 'escribir', cambios);
  if (!(ref.path in st.docs)) throw err('not-found');
  st.docs[ref.path] = { ...st.docs[ref.path], ...deshidratar(cambios) }; guardar(); notificar();
}
export async function addDoc(col, dato) {
  const path = col.path + '/' + nuevoId();
  exigir(col.path, 'crear', dato);
  st.docs[path] = deshidratar(dato); guardar(); notificar();
  return doc(null, path);
}
export function writeBatch() {
  const ops = [];
  const b = {
    set: (ref, dato) => { ops.push(['set', ref, dato]); return b; },
    delete: (ref) => { ops.push(['del', ref]); return b; },
    commit: async () => {
      for (const [t, ref, dato] of ops) exigir(ref.path, t === 'set' ? 'escribir' : 'borrar', dato);
      for (const [t, ref, dato] of ops) { if (t === 'set') st.docs[ref.path] = deshidratar(dato); else delete st.docs[ref.path]; }
      guardar(); notificar();
    },
  };
  return b;
}
