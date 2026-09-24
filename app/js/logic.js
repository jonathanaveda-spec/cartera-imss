// Lógica pura (sin DOM ni almacenamiento): fechas, estados, periodos, filtros y validaciones.
// Todas las fechas son cadenas 'AAAA-MM-DD' para evitar problemas de zona horaria.

const pad = (n) => String(n).padStart(2, '0');

export const PERIODICIDADES = { Mensual: 1, Trimestral: 3, Semestral: 6, Anual: 12 };

export const ESTADOS = {
  MOROSO: { codigo: 'MOROSO', etiqueta: 'MOROSO / DEUDOR', icono: '🔴', orden: 0, clase: 'moroso' },
  POR_VENCER: { codigo: 'POR_VENCER', etiqueta: 'PRÓXIMO A VENCER', icono: '🟡', orden: 1, clase: 'porvencer' },
  AL_DIA: { codigo: 'AL_DIA', etiqueta: 'AL DÍA', icono: '🟢', orden: 2, clase: 'aldia' },
  SIN_CONFIG: { codigo: 'SIN_CONFIG', etiqueta: 'SIN CONFIGURAR', icono: '⚪', orden: 3, clase: 'sinconfig' },
  BAJA: { codigo: 'BAJA', etiqueta: 'DADO DE BAJA', icono: '⚫', orden: 4, clase: 'baja' },
};

export function uid() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// ---------- Fechas ----------
export function hoyISO(f = new Date()) {
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
}

export function esISO(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

const aUTC = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Días de `desde` a `hasta` (positivo si hasta es posterior). */
export function diasEntre(desde, hasta) {
  return Math.round((aUTC(hasta) - aUTC(desde)) / 86400000);
}

export function sumarDias(iso, n) {
  const f = new Date(aUTC(iso) + n * 86400000);
  return `${f.getUTCFullYear()}-${pad(f.getUTCMonth() + 1)}-${pad(f.getUTCDate())}`;
}

export function diaDe(iso) {
  return Number(iso.slice(8, 10));
}

/** Suma meses conservando el día "ancla" (p. ej. día 31 → 28 en febrero → 31 en marzo). */
export function sumarMeses(iso, n, diaAncla) {
  const [y, m, d] = iso.split('-').map(Number);
  const dia = diaAncla || d;
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${pad(nm)}-${pad(Math.min(dia, ultimo))}`;
}

export function siguienteVencimiento(actualISO, periodicidad, diaAncla) {
  const meses = PERIODICIDADES[periodicidad];
  if (!meses) throw new Error('Periodicidad no válida: ' + periodicidad);
  return sumarMeses(actualISO, meses, diaAncla || diaDe(actualISO));
}

/** "Día 24 de cada mes" / "Día 24, cada 3 meses": el día de pago sale del día de la fecha de próximo pago. */
export function textoDiaPago(c) {
  const dia = c.dia_pago || (c.proximo_pago && esISO(c.proximo_pago) ? diaDe(c.proximo_pago) : null);
  if (!dia) return '';
  const p = c.periodicidad;
  if (!p || p === 'Mensual') return `Día ${dia} de cada mes`;
  return `Día ${dia}, ${{ Trimestral: 'cada 3 meses', Semestral: 'cada 6 meses', Anual: 'cada año' }[p]}`;
}

export function fmtFecha(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function fmtFechaHora(ts) {
  if (!ts) return '';
  const f = new Date(ts);
  return `${pad(f.getDate())}/${pad(f.getMonth() + 1)}/${f.getFullYear()} ${pad(f.getHours())}:${pad(f.getMinutes())}`;
}

// ---------- Estado ----------
export function ultimoPago(c) {
  let u = null;
  for (const p of c.pagos || []) if (!u || p.fecha_pago > u.fecha_pago) u = p;
  return u;
}

/**
 * Reglas:
 *  - BAJA: marcado manualmente; siempre tiene prioridad.
 *  - SIN_CONFIG: aún no hay fecha de próximo pago (el Excel original no la traía).
 *  - MOROSO: la fecha de próximo pago ya pasó (no hay pago registrado que la cubra).
 *  - PRÓXIMO A VENCER: faltan de 0 a `diasAviso` días (0 = vence hoy).
 *  - AL DÍA: el resto (la fecha aún no llega y falta más de `diasAviso`).
 */
export function calcularEstado(c, hoy, diasAviso = 7) {
  const tiene = c.proximo_pago && esISO(c.proximo_pago);
  const restantes = tiene ? diasEntre(hoy, c.proximo_pago) : null;
  const base = { diasRestantes: restantes, diasAtraso: restantes !== null && restantes < 0 ? -restantes : 0 };
  if (c.baja) return { ...ESTADOS.BAJA, ...base };
  if (!tiene) return { ...ESTADOS.SIN_CONFIG, ...base };
  if (restantes < 0) return { ...ESTADOS.MOROSO, ...base };
  if (restantes <= diasAviso) return { ...ESTADOS.POR_VENCER, ...base };
  return { ...ESTADOS.AL_DIA, ...base };
}

const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

export function textoDias(e) {
  if (e.codigo === 'BAJA') return 'Dado de baja';
  if (e.codigo === 'SIN_CONFIG') return 'Sin fecha de pago';
  if (e.diasRestantes < 0) return plural(e.diasAtraso, 'día de atraso', 'días de atraso');
  if (e.diasRestantes === 0) return 'Vence hoy';
  return `Faltan ${plural(e.diasRestantes, 'día', 'días')}`;
}

// ---------- Texto / búsqueda ----------
export function normalizar(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Devuelve 10 dígitos si el texto contiene un celular utilizable; si no, null. */
export function telefonoDe(celular) {
  const d = String(celular ?? '').replace(/\D/g, '');
  if (d.length === 10) return d;
  if (d.length === 12 && d.startsWith('52')) return d.slice(2);
  return null;
}

function textoBusqueda(c) {
  const extra = Object.values(c.extra || {}).join(' ');
  return normalizar(
    [c.nombre, c.curp, c.nss, c.celular, c.opcion, c.proveedor, c.notas, (c.etiquetas || []).join(' '), extra].join(' ')
  );
}

// ---------- Filtros y orden ----------
export function filtrarClientes(clientes, f, hoy, diasAviso) {
  const q = normalizar(f.busqueda || '').split(/\s+/).filter(Boolean);
  const out = [];
  for (const c of clientes) {
    const e = calcularEstado(c, hoy, diasAviso);
    if (f.estado && f.estado !== 'todos' && e.codigo !== f.estado) continue;
    if (f.etiqueta && !(c.etiquetas || []).includes(f.etiqueta)) continue;
    if (f.pDesde && (!c.proximo_pago || c.proximo_pago < f.pDesde)) continue;
    if (f.pHasta && (!c.proximo_pago || c.proximo_pago > f.pHasta)) continue;
    if (f.iDesde && (!c.fecha_inicio || c.fecha_inicio < f.iDesde)) continue;
    if (f.iHasta && (!c.fecha_inicio || c.fecha_inicio > f.iHasta)) continue;
    if (q.length) {
      const h = textoBusqueda(c);
      if (!q.every((t) => h.includes(t))) continue;
    }
    out.push({ c, e });
  }
  return out;
}

export function ordenar(items, orden, dir) {
  const m = dir === 'desc' ? -1 : 1;
  const porNombre = (a, b) => a.c.nombre.localeCompare(b.c.nombre, 'es', { sensitivity: 'base' });
  // Los vacíos siempre quedan al final, sin importar la dirección.
  const conVacios = (clave) => (a, b) => {
    const x = clave(a), y = clave(b);
    if (x == null && y == null) return porNombre(a, b);
    if (x == null) return 1;
    if (y == null) return -1;
    if (x === y) return porNombre(a, b);
    return (x < y ? -1 : 1) * m;
  };
  const cmp = {
    nombre: (a, b) => porNombre(a, b) * m,
    estado: (a, b) => {
      const d = a.e.orden - b.e.orden;
      if (d) return d * m;
      // Dentro de cada estado: los más urgentes primero.
      const ra = a.e.diasRestantes ?? 1e9, rb = b.e.diasRestantes ?? 1e9;
      return ra - rb || porNombre(a, b);
    },
    vencimiento: conVacios((x) => x.c.proximo_pago || null),
    pago: conVacios((x) => ultimoPago(x.c)?.fecha_pago || null),
    inicio: conVacios((x) => x.c.fecha_inicio || null),
  }[orden] || porNombre;
  return [...items].sort(cmp);
}

export function contarPorEstado(clientes, hoy, diasAviso) {
  const r = { total: clientes.length, AL_DIA: 0, POR_VENCER: 0, MOROSO: 0, BAJA: 0, SIN_CONFIG: 0 };
  for (const c of clientes) r[calcularEstado(c, hoy, diasAviso).codigo]++;
  return r;
}

// ---------- Revisión de datos (solo señala, nunca corrige) ----------
export function indexarDuplicados(clientes) {
  const porCurp = new Map(), porNss = new Map();
  for (const c of clientes) {
    const k = (c.curp || '').trim().toUpperCase();
    if (k) (porCurp.get(k) || porCurp.set(k, []).get(k)).push(c.id);
    const n = (c.nss || '').trim();
    if (n) (porNss.get(n) || porNss.set(n, []).get(n)).push(c.id);
  }
  return { porCurp, porNss };
}

export const TIPOS_AVISO = {
  curp_vacia: 'CURP vacía',
  curp_largo: 'CURP con longitud distinta de 18',
  nss_vacio: 'NSS vacío',
  nss_largo: 'NSS con longitud distinta de 11 dígitos',
  celular: 'Celular sin 10 dígitos utilizables',
  fecha_inicio: 'Fecha de inicio vacía o inválida',
  fecha_futura: 'Fecha de inicio posterior a hoy',
  duplicado: 'Posible duplicado (misma CURP o NSS)',
};

export function avisosDeCliente(c, dup, hoy) {
  const a = [];
  const curp = (c.curp || '').trim();
  if (!curp) a.push('curp_vacia');
  else if (curp.length !== 18) a.push('curp_largo');
  const nss = (c.nss || '').trim();
  if (!nss) a.push('nss_vacio');
  else if (!/^\d{11}$/.test(nss)) a.push('nss_largo');
  if (!telefonoDe(c.celular)) a.push('celular');
  if (!c.fecha_inicio || !esISO(c.fecha_inicio)) a.push('fecha_inicio');
  else if (c.fecha_inicio > hoy) a.push('fecha_futura');
  const k = curp.toUpperCase();
  if ((k && dup.porCurp.get(k)?.length > 1) || (nss && dup.porNss.get(nss)?.length > 1)) a.push('duplicado');
  return a;
}

export function otrosDuplicados(c, dup) {
  const ids = new Set();
  const k = (c.curp || '').trim().toUpperCase();
  for (const id of (k && dup.porCurp.get(k)) || []) ids.add(id);
  for (const id of (c.nss && dup.porNss.get(c.nss.trim())) || []) ids.add(id);
  ids.delete(c.id);
  return [...ids];
}
