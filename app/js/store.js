// Almacenamiento local persistente (IndexedDB, con respaldo en localStorage) y operaciones sobre los datos.
// Todo cambio queda en el historial. Nada se borra sin pasar por la papelera.
import { uid, hoyISO, esISO, diaDe, siguienteVencimiento, sumarMeses, diasEntre, ultimoPago } from './logic.js';

const DB_NAME = 'cartera-imss';
const STORE = 'kv';
const LS_KEY = 'cartera-imss:db';

export let db = null;
export const estadoAlmacen = { motor: 'ninguno', persistente: false, error: null };

export const CAMPOS_BASE = [
  { clave: 'nombre', etiqueta: 'Nombre' },
  { clave: 'curp', etiqueta: 'CURP' },
  { clave: 'nss', etiqueta: 'NSS' },
  { clave: 'celular', etiqueta: 'Celular' },
  { clave: 'fecha_inicio', etiqueta: 'Fecha de inicio' },
  { clave: 'opcion', etiqueta: 'Opción' },
  { clave: 'proveedor', etiqueta: 'Proveedor' },
  { clave: 'comision', etiqueta: 'Comisión' },
  { clave: 'periodicidad', etiqueta: 'Periodicidad' },
  { clave: 'proximo_pago', etiqueta: 'Próximo pago' },
  { clave: 'notas', etiqueta: 'Notas' },
];

// ---------- IndexedDB ----------
function abrirIDB() {
  return new Promise((res, rej) => {
    if (!('indexedDB' in globalThis)) return rej(new Error('IndexedDB no disponible'));
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const idb = { conn: null };
async function idbGet(clave) {
  const c = idb.conn || (idb.conn = await abrirIDB());
  return new Promise((res, rej) => {
    const q = c.transaction(STORE).objectStore(STORE).get(clave);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
async function idbDel(clave) {
  const c = idb.conn || (idb.conn = await abrirIDB());
  return new Promise((res, rej) => {
    const t = c.transaction(STORE, 'readwrite');
    t.objectStore(STORE).delete(clave);
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}
async function idbPut(clave, valor) {
  const c = idb.conn || (idb.conn = await abrirIDB());
  return new Promise((res, rej) => {
    const t = c.transaction(STORE, 'readwrite');
    t.objectStore(STORE).put(valor, clave);
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}

// ---------- Estructura ----------
function nuevaDB() {
  return {
    version: 1,
    config: { diasAviso: 7, periodicidadDefecto: 'Mensual', camposPersonalizados: [], ultimoRespaldo: null },
    clientes: [],
    historial: [],
    papelera: [],
    importaciones: [],
  };
}

function migrar(d) {
  const base = nuevaDB();
  d.config = { ...base.config, ...(d.config || {}) };
  d.clientes ||= [];
  d.historial ||= [];
  d.papelera ||= [];
  d.importaciones ||= [];
  for (const c of d.clientes) {
    c.pagos ||= [];
    c.etiquetas ||= [];
    c.extra ||= {};
    c.notas ??= '';
    c.baja ??= false;
  }
  return d;
}

export async function iniciar() {
  let leido = null;
  try {
    leido = await idbGet('db');
    estadoAlmacen.motor = 'indexeddb';
  } catch (e) {
    estadoAlmacen.error = String(e);
  }
  if (!leido) {
    try {
      const t = localStorage.getItem(LS_KEY);
      if (t) {
        leido = JSON.parse(t);
        if (estadoAlmacen.motor === 'ninguno') estadoAlmacen.motor = 'localstorage';
      }
    } catch (e) {
      estadoAlmacen.error ||= String(e);
    }
  }
  db = migrar(leido || nuevaDB());
  if (estadoAlmacen.motor === 'ninguno') {
    try {
      localStorage.setItem(LS_KEY + ':test', '1');
      localStorage.removeItem(LS_KEY + ':test');
      estadoAlmacen.motor = 'localstorage';
    } catch { /* sin almacenamiento */ }
  }
  try {
    if (navigator.storage?.persist) estadoAlmacen.persistente = await navigator.storage.persist();
  } catch { /* opcional */ }
  return db;
}

// Ganchos que conecta la sincronización con la nube (si está activada): push = enviar cambios, remoto = refrescar pantalla.
export const hooks = { push: null, remoto: null };

let cola = Promise.resolve();
/** Guarda en el dispositivo y, si hay nube, envía los cambios (la parte de la nube se dispara de inmediato). */
export function guardar() {
  try { hooks.push && hooks.push(); } catch (e) { console.error('Sincronización:', e); }
  return guardarLocal();
}

/** Guarda solo en el dispositivo (IndexedDB + espejo en localStorage). */
export function guardarLocal() {
  cola = cola.then(async () => {
    const copia = JSON.stringify(db);
    let ok = false;
    try {
      await idbPut('db', JSON.parse(copia));
      ok = true;
      estadoAlmacen.motor = 'indexeddb';
      estadoAlmacen.error = null;
    } catch (e) {
      estadoAlmacen.error = String(e);
    }
    // Respaldo espejo en localStorage (por si IndexedDB fallara).
    try {
      localStorage.setItem(LS_KEY, copia);
      if (!ok) estadoAlmacen.motor = 'localstorage';
      ok = true;
    } catch {
      /* cuota excedida: IndexedDB sigue siendo la fuente principal */
    }
    if (!ok) estadoAlmacen.motor = 'ninguno';
    globalThis.dispatchEvent?.(new CustomEvent('cartera:guardado'));
  });
  return cola;
}

export async function copiaPrevia(motivo) {
  try {
    await idbPut('db_prev', { motivo, ts: Date.now(), datos: JSON.parse(JSON.stringify(db)) });
  } catch { /* opcional */ }
}
export async function leerCopiaPrevia() {
  try { return await idbGet('db_prev'); } catch { return null; }
}

// ---------- Historial ----------
const ahora = () => Date.now();
function log(cliente, tipo, detalle, cambios) {
  db.historial.unshift({
    id: uid(),
    ts: ahora(),
    clienteId: cliente ? cliente.id : null,
    cliente: cliente ? cliente.nombre : null,
    tipo,
    detalle,
    cambios: cambios || [],
  });
  if (db.historial.length > 8000) db.historial.length = 8000;
}

export const buscar = (id) => db.clientes.find((c) => c.id === id);
export const historialDe = (id) => db.historial.filter((h) => h.clienteId === id);

// ---------- Clientes ----------
const CAMPOS_TEXTO = ['nombre', 'curp', 'nss', 'celular', 'opcion', 'proveedor', 'notas'];

function limpiar(datos) {
  const o = { ...datos };
  for (const k of CAMPOS_TEXTO) if (k in o) o[k] = String(o[k] ?? '').trim();
  if ('comision' in o) {
    const n = o.comision === '' || o.comision == null ? null : Number(o.comision);
    o.comision = Number.isFinite(n) ? n : null;
  }
  for (const k of ['fecha_inicio', 'proximo_pago']) if (k in o) o[k] = o[k] && esISO(o[k]) ? o[k] : null;
  if ('periodicidad' in o) o.periodicidad = o.periodicidad || null;
  return o;
}

export function crearCliente(datos, extraOrigen = {}) {
  const d = limpiar(datos);
  const c = {
    id: uid(),
    nombre: d.nombre || '',
    curp: d.curp || '',
    nss: d.nss || '',
    celular: d.celular || '',
    fecha_inicio: d.fecha_inicio || null,
    opcion: d.opcion || '',
    proveedor: d.proveedor || '',
    comision: d.comision ?? null,
    periodicidad: d.periodicidad || null,
    proximo_pago: d.proximo_pago || null,
    dia_pago: d.proximo_pago ? diaDe(d.proximo_pago) : null,
    baja: false,
    baja_fecha: null,
    baja_motivo: '',
    notas: d.notas || '',
    etiquetas: d.etiquetas || [],
    extra: d.extra || {},
    pagos: [],
    creado: ahora(),
    actualizado: ahora(),
    ...extraOrigen,
  };
  db.clientes.push(c);
  log(c, 'crear', 'Cliente agregado');
  return c;
}

export async function agregarCliente(datos) {
  const c = crearCliente(datos);
  await guardar();
  return c;
}

export async function editarCliente(id, datos) {
  const c = buscar(id);
  const d = limpiar(datos);
  const etiqueta = (k) => CAMPOS_BASE.find((x) => x.clave === k)?.etiqueta || k;
  const cambios = [];
  for (const k of Object.keys(d)) {
    if (k === 'extra') continue;
    const antes = c[k] ?? null, despues = d[k] ?? null;
    if ((antes ?? '') !== (despues ?? '')) {
      cambios.push({ campo: etiqueta(k), antes, despues });
      c[k] = despues;
    }
  }
  if (d.extra) {
    for (const [k, v] of Object.entries(d.extra)) {
      const def = db.config.camposPersonalizados.find((x) => x.clave === k);
      const antes = c.extra[k] ?? '', despues = v ?? '';
      if (String(antes) !== String(despues)) {
        cambios.push({ campo: def?.etiqueta || k, antes, despues });
        c.extra[k] = despues;
      }
    }
  }
  if ('proximo_pago' in d && d.proximo_pago) c.dia_pago = diaDe(d.proximo_pago);
  if (cambios.length) {
    c.actualizado = ahora();
    log(c, 'editar', `Se modificó: ${cambios.map((x) => x.campo).join(', ')}`, cambios);
    await guardar();
  }
  return c;
}

export async function eliminarCliente(id) {
  const c = buscar(id);
  db.papelera.unshift({ id: uid(), ts: ahora(), cliente: JSON.parse(JSON.stringify(c)) });
  db.clientes = db.clientes.filter((x) => x.id !== id);
  log(c, 'eliminar', 'Cliente eliminado (queda en la papelera)');
  await guardar();
}

export async function restaurarDePapelera(idPapelera) {
  const p = db.papelera.find((x) => x.id === idPapelera);
  if (!p) return null;
  db.clientes.push(p.cliente);
  db.papelera = db.papelera.filter((x) => x !== p);
  log(p.cliente, 'restaurar', 'Cliente restaurado desde la papelera');
  await guardar();
  return p.cliente;
}

export async function vaciarPapelera() {
  await copiaPrevia('vaciar papelera');
  db.papelera = [];
  await guardar();
}

export async function darDeBaja(id, motivo = '') {
  const c = buscar(id);
  c.baja = true;
  c.baja_fecha = hoyISO();
  c.baja_motivo = motivo.trim();
  c.actualizado = ahora();
  log(c, 'estado', 'Dado de baja' + (motivo.trim() ? `: ${motivo.trim()}` : ''));
  await guardar();
}

export async function reactivar(id) {
  const c = buscar(id);
  const previo = [c.baja_fecha && `baja del ${c.baja_fecha}`, c.baja_motivo].filter(Boolean).join(' · ');
  c.baja = false;
  c.baja_fecha = null;
  c.baja_motivo = '';
  c.actualizado = ahora();
  log(c, 'estado', 'Reactivado (quitada la baja)' + (previo ? ` — antes: ${previo}` : ''));
  await guardar();
}

// ---------- Pagos ----------
/** Calcula la vista previa de un pago sin guardarlo. */
export function calcularPago(c, { fecha_pago, periodicidad, cubre_desde }) {
  const per = periodicidad || c.periodicidad;
  const desde = c.proximo_pago || cubre_desde || fecha_pago;
  if (!per || !desde) return { periodo_desde: desde || null, siguiente: null };
  return { periodo_desde: desde, siguiente: siguienteVencimiento(desde, per, c.proximo_pago ? c.dia_pago : null) };
}

export async function registrarPago(id, p) {
  const c = buscar(id);
  const per = p.periodicidad || c.periodicidad;
  if (!per) throw new Error('Falta la periodicidad');
  const calc = calcularPago(c, { fecha_pago: p.fecha_pago, periodicidad: per, cubre_desde: p.cubre_desde });
  const siguiente = p.nuevo_proximo && esISO(p.nuevo_proximo) ? p.nuevo_proximo : calc.siguiente;
  const monto = p.monto === '' || p.monto == null ? null : Number(p.monto);
  const pago = {
    id: uid(),
    fecha_pago: p.fecha_pago,
    monto: Number.isFinite(monto) ? monto : null,
    metodo: (p.metodo || '').trim(),
    nota: (p.nota || '').trim(),
    periodo_desde: calc.periodo_desde,
    periodo_hasta: siguiente,
    prev_proximo: c.proximo_pago,
    prev_periodicidad: c.periodicidad,
    prev_dia_pago: c.dia_pago,
    registrado: ahora(),
  };
  c.pagos.push(pago);
  c.periodicidad = per;
  c.proximo_pago = siguiente;
  // Si la fecha se ajustó a mano, el nuevo día pasa a ser la referencia; si no, se conserva el original.
  c.dia_pago = siguiente !== calc.siguiente || !c.dia_pago ? diaDe(siguiente) : c.dia_pago;
  c.actualizado = ahora();
  log(c, 'pago', `Pago registrado (${p.fecha_pago}). Próximo pago: ${siguiente}`, [
    { campo: 'Próximo pago', antes: pago.prev_proximo, despues: siguiente },
  ]);
  await guardar();
  return pago;
}

export function ultimoPagoRegistrado(c) {
  return c.pagos.length ? c.pagos[c.pagos.length - 1] : null;
}

/** Solo se puede anular el último pago registrado: devuelve la fecha de próximo pago a como estaba. */
export async function anularUltimoPago(id) {
  const c = buscar(id);
  const p = ultimoPagoRegistrado(c);
  if (!p) return;
  c.pagos.pop();
  c.proximo_pago = p.prev_proximo ?? null;
  c.periodicidad = p.prev_periodicidad ?? c.periodicidad;
  c.dia_pago = p.prev_dia_pago ?? c.dia_pago;
  c.actualizado = ahora();
  log(c, 'pago', `Pago del ${p.fecha_pago} anulado. Próximo pago vuelve a: ${p.prev_proximo || 'sin fecha'}`, [
    { campo: 'Próximo pago', antes: p.periodo_hasta, despues: p.prev_proximo },
  ]);
  await guardar();
}

// ---------- Configuración ----------
export async function guardarConfig(cambios) {
  Object.assign(db.config, cambios);
  log(null, 'config', 'Configuración actualizada: ' + Object.keys(cambios).join(', '));
  await guardar();
}

export async function agregarCampoPersonalizado(etiqueta, tipo) {
  const clave = 'x_' + etiqueta.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!clave || clave === 'x_') throw new Error('Nombre no válido');
  if (db.config.camposPersonalizados.some((c) => c.clave === clave)) throw new Error('Ya existe un campo con ese nombre');
  db.config.camposPersonalizados.push({ clave, etiqueta: etiqueta.trim(), tipo, archivado: false });
  log(null, 'config', `Campo nuevo: ${etiqueta.trim()}`);
  await guardar();
}

export async function archivarCampo(clave, archivado) {
  const c = db.config.camposPersonalizados.find((x) => x.clave === clave);
  if (c) c.archivado = archivado;
  await guardar();
}

export async function marcarRespaldo() {
  db.config.ultimoRespaldo = ahora();
  await guardar();
}

// ---------- Configuración inicial de pagos (asistente masivo, con vista previa) ----------
/**
 * metodo 'ciclo':  próximo pago = siguiente fecha del ciclo contado desde la fecha de inicio (supone que están al corriente).
 * metodo 'inicio': próximo pago = fecha de inicio + un periodo (no supone pagos; probablemente muchos quedarán morosos).
 */
export function calcularMasivo(clientes, { periodicidad, metodo, hoy }) {
  const salida = [];
  for (const c of clientes) {
    if (c.proximo_pago) continue;
    if (!c.fecha_inicio || !esISO(c.fecha_inicio)) { salida.push({ c, omitido: true, razon: 'sin fecha de inicio' }); continue; }
    // Una fecha de inicio a más de un año en el futuro casi seguro es un error de captura: no se calcula nada.
    if (diasEntre(hoy, c.fecha_inicio) > 366) { salida.push({ c, omitido: true, razon: 'fecha de inicio lejana en el futuro' }); continue; }
    const per = periodicidad;
    const dia = diaDe(c.fecha_inicio);
    let f;
    if (metodo === 'ciclo') {
      // El día de la fecha de inicio es el día de pago. Si esa fecha aún no llega, es el primer pago;
      // si ya pasó, se avanza al siguiente día de pago según la periodicidad.
      const meses = { Mensual: 1, Trimestral: 3, Semestral: 6, Anual: 12 }[per];
      let k = 0;
      f = c.fecha_inicio;
      while (diasEntre(hoy, f) < 0 && k < 2000) { k++; f = sumarMeses(c.fecha_inicio, meses * k, dia); }
    } else {
      f = siguienteVencimiento(c.fecha_inicio, per, dia);
    }
    salida.push({ c, proximo: f });
  }
  return salida;
}

export async function aplicarMasivo(calculo, periodicidad, metodo) {
  await copiaPrevia('configurar pagos masivo');
  let n = 0;
  for (const it of calculo) {
    if (it.omitido) continue;
    it.c.periodicidad = periodicidad;
    it.c.proximo_pago = it.proximo;
    it.c.dia_pago = diaDe(it.c.fecha_inicio);
    it.c.actualizado = ahora();
    log(it.c, 'editar', `Configuración inicial de pagos (${periodicidad}, ${metodo === 'ciclo' ? 'ciclo desde fecha de inicio' : 'inicio + un periodo'})`, [
      { campo: 'Periodicidad', antes: null, despues: periodicidad },
      { campo: 'Próximo pago', antes: null, despues: it.proximo },
    ]);
    n++;
  }
  await guardar();
  return n;
}

// ---------- Importación de Excel ----------
export function huellaDeFila(valores) {
  return valores.map((v) => String(v ?? '').trim().toLowerCase()).join('|');
}

/** Separa filas nuevas de las que ya se importaron antes (misma huella), sin modificar nada. */
export function prepararImportacion(parsed) {
  const existentes = new Set(db.clientes.map((c) => c.origen?.huella).filter(Boolean));
  const nuevas = [], repetidas = [];
  for (const f of parsed.filas) (existentes.has(f.huella) ? repetidas : nuevas).push(f);
  return { nuevas, repetidas };
}

export async function aplicarImportacion(parsed, prep) {
  await copiaPrevia('importar Excel');
  for (const def of parsed.camposNuevos) {
    if (!db.config.camposPersonalizados.some((x) => x.clave === def.clave)) db.config.camposPersonalizados.push({ ...def, archivado: false });
  }
  for (const f of prep.nuevas) {
    const c = crearCliente(f.datos, {
      etiquetas: f.etiquetas,
      ...(f.baja ? { baja: true, baja_fecha: null, baja_motivo: 'Marcado en rojo en el Excel (cliente que cotiza de forma intermitente)' } : {}),
      origen: { archivo: parsed.archivo, hoja: parsed.hoja, fila: f.fila, huella: f.huella, valores: f.crudo, celdasRojas: f.celdasRojas },
    });
    // crearCliente ya registró "Cliente agregado"; se reemplaza por un solo resumen de importación.
    db.historial.shift();
    c.creado = ahora();
  }
  db.importaciones.unshift({
    ts: ahora(), archivo: parsed.archivo, hoja: parsed.hoja, importados: prep.nuevas.length, omitidos: prep.repetidas.length,
    columnasVacias: parsed.columnasVacias,
  });
  log(null, 'importar', `Importados ${prep.nuevas.length} clientes desde "${parsed.archivo}" (${parsed.hoja}); ${prep.repetidas.length} ya existían.`);
  await guardar();
  return prep.nuevas.length;
}

// ---------- Respaldo completo ----------
export function exportarJSON() {
  return JSON.stringify({ app: 'cartera-imss', exportado: new Date().toISOString(), datos: db }, null, 1);
}

export async function restaurarJSON(texto) {
  const o = JSON.parse(texto);
  const datos = o && o.app === 'cartera-imss' ? o.datos : null;
  if (!datos || !Array.isArray(datos.clientes)) throw new Error('El archivo no es un respaldo válido de esta aplicación');
  await copiaPrevia('restaurar respaldo');
  db = migrar(datos);
  log(null, 'importar', `Respaldo restaurado (${db.clientes.length} clientes)`);
  await guardar();
  return db.clientes.length;
}

export async function restaurarCopiaPrevia() {
  const p = await leerCopiaPrevia();
  if (!p) throw new Error('No hay copia previa');
  db = migrar(p.datos);
  await guardar();
}

export { ultimoPago };

// ---------- Nube ----------
/** Aplica datos llegados de la nube (no se vuelven a enviar). `parte` puede traer clientes, papelera, historial, config, importaciones. */
export async function aplicarRemoto(parte) {
  Object.assign(db, parte);
  migrar(db);
  await guardarLocal();
  hooks.remoto && hooks.remoto();
}

/** Borra la copia local (al cerrar sesión, para no dejar datos de clientes en un teléfono ajeno). */
export async function borrarLocal() {
  for (const k of ['db', 'db_prev']) { try { await idbDel(k); } catch { /* ignorar */ } }
  try { localStorage.removeItem(LS_KEY); } catch { /* ignorar */ }
}
