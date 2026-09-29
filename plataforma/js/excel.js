// Lectura de Excel (importación) y exportación a un archivo NUEVO. Nunca modifica el archivo original.
import { calcularEstado, ultimoPago, esISO, fmtFecha, hoyISO, periodicidadDias, MAX_DIAS_PERIODO } from './logic.js';
import { huellaDeFila } from './store.js';

const XLSX = () => {
  if (!globalThis.XLSX) throw new Error('No se cargó la librería de Excel');
  return globalThis.XLSX;
};

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Encabezados que usa la exportación (mismos nombres que el Excel original de ALTAS).
const ENCABEZADOS_ORIGINALES = {
  nombre: 'CLIENTE', curp: 'CURP', nss: 'NSS', celular: 'CELULAR', fecha_inicio: 'FECHA DE inicio',
  opcion: 'OPCION', proveedor: 'PROVEEDOR', comision: 'COMISION',
};

// ---------- Importación ----------
// Cada asesor tiene su Excel armado a su manera: se buscan los títulos (aunque no estén en la
// primera fila), se sugiere qué dato es cada columna y el asesor lo confirma antes de importar.

/** Datos que se pueden importar, en el orden en que se ofrecen al elegir qué es cada columna. */
export const CAMPOS_IMPORTAR = [
  { campo: 'nombre', etiqueta: 'Nombre del cliente' },
  { campo: 'curp', etiqueta: 'CURP' },
  { campo: 'nss', etiqueta: 'NSS' },
  { campo: 'celular', etiqueta: 'Celular / teléfono' },
  { campo: 'fecha_inicio', etiqueta: 'Fecha de inicio (día de cobro)' },
  { campo: 'periodicidad', etiqueta: 'Periodicidad (cada cuánto paga)' },
  { campo: 'proximo_pago', etiqueta: 'Próximo pago' },
  { campo: 'opcion', etiqueta: 'Opción' },
  { campo: 'proveedor', etiqueta: 'Proveedor' },
  { campo: 'comision', etiqueta: 'Comisión' },
  { campo: 'notas', etiqueta: 'Notas' },
];
/** La columna se guarda como campo personalizado con su propio título. */
export const EXTRA = 'extra';
/** La columna no se importa (su valor queda solo en el registro del origen). */
export const IGNORAR = 'ignorar';

// Títulos que se reconocen solos. Se prueban en orden y gana el primero que coincide.
const TITULOS = [
  [EXTRA, /ultim|anterior|\bmonto\b|importe/],
  ['comision', /comision/],
  ['proximo_pago', /(proximo|siguiente|prox)\.?\s*(pago|cobro|vencimiento)|^vence|vencimiento/],
  ['fecha_inicio', /^fecha$|fecha\s*(de\s*)?(inicio|alta|ingreso|pago|cobro)|^(inicio|alta|ingreso)$/],
  ['periodicidad', /periodicidad|frecuencia|^periodo( de pago)?$|^plazo$/],
  ['curp', /curp/],
  ['nss', /\bnss\b|seguro social|seguridad social|(numero|num|no)\.?\s*(de\s*)?imss|^imss$/],
  ['celular', /celular|telefono|\btel\b|\bcel\b|whats|movil|contacto/],
  ['nombre', /nombre|cliente|apellido|asegurad|afiliad|titular|trabajador|derechohabiente/],
  ['opcion', /opcion|modalidad/],
  ['proveedor', /proveedor|aseguradora|compania/],
  ['notas', /nota|observaci|comentario/],
];

/** Campo que corresponde a un título de columna, EXTRA si es un dato conocido que no se importa como campo, o null. */
export function campoPorTitulo(titulo) {
  const t = norm(titulo);
  if (!t) return null;
  for (const [campo, re] of TITULOS) if (re.test(t)) return campo;
  return null;
}

const RE_CURP = /^[A-Z]{4}\d{6}[HMX][A-Z]{5}[A-Z0-9]\d$/i;
const soloDigitos = (v) => String(v ?? '').replace(/[\s\-().+]/g, '');

// Si el título no dice nada, se mira el contenido: CURP, NSS, celular o nombre de persona.
const PRUEBAS_CONTENIDO = [
  ['curp', (v) => RE_CURP.test(String(v).trim())],
  ['nss', (v) => /^\d{11}$/.test(soloDigitos(v))],
  ['celular', (v) => /^(52|57|58)?\d{10}$/.test(soloDigitos(v))],
  ['periodicidad', (v) => typeof v === 'string' && !!aPeriodicidad(v)],
  ['nombre', (v) => typeof v === 'string' && /^[\p{L}.'-]+(\s+[\p{L}.'-]+)+$/u.test(v.trim())],
];

function campoPorContenido(muestras) {
  if (muestras.length < 2) return null;
  for (const [campo, prueba] of PRUEBAS_CONTENIDO) {
    if (muestras.filter(prueba).length >= muestras.length * 0.6) return campo;
  }
  return null;
}

function esRojo(rgb) {
  if (!rgb || typeof rgb !== 'string') return false;
  const h = rgb.length === 8 ? rgb.slice(2) : rgb;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return r >= 0xb0 && g <= 0x50 && b <= 0x50;
}

export function aFechaISO(v) {
  const X = XLSX();
  if (v == null || v === '') return null;
  if (v instanceof Date) return hoyISO(v);
  if (typeof v === 'number') {
    // Un número chico (ej. 24 = "día de pago") no es una fecha de Excel.
    if (v < 3000) return null;
    const p = X.SSF.parse_date_code(v);
    return p ? `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}` : null;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m && esISO(`${m[1]}-${m[2]}-${m[3]}`)) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})$/);
  if (m) {
    let y = m[3];
    if (y.length === 2) y = (Number(y) <= (new Date().getFullYear() % 100) + 1 ? '20' : '19') + y;
    const iso = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    if (esISO(iso)) return iso;
  }
  return null;
}

/** Traduce lo que el asesor escribió («mensual», «cada 15 días», «quincenal»…) a una periodicidad de la app, o null. */
export function aPeriodicidad(v) {
  const s = norm(v).replace(/\.$/, '');
  if (!s) return null;
  if (/^(mensual|mensualmente|mes|1 mes|cada mes)$/.test(s)) return 'Mensual';
  if (/^(trimestral|trimestre|3 meses|cada 3 meses)$/.test(s)) return 'Trimestral';
  if (/^(semestral|semestre|6 meses|cada 6 meses)$/.test(s)) return 'Semestral';
  if (/^(anual|anualmente|ano|1 ano|12 meses|cada ano|cada 12 meses)$/.test(s)) return 'Anual';
  if (/^quincenal$/.test(s)) return periodicidadDias(15);
  if (/^semanal$/.test(s)) return periodicidadDias(7);
  const m = s.match(/^(?:cada\s+)?(\d{1,3})\s*dias?$/);
  const n = m ? Number(m[1]) : 0;
  return n >= 1 && n <= MAX_DIAS_PERIODO ? periodicidadDias(n) : null;
}

const aTexto = (v) => (v == null ? '' : typeof v === 'number' ? String(v) : String(v).trim());
const esVacia = (cel) => !cel || cel.v == null || String(cel.v).trim() === '';

/** Abre el libro. No guarda nada ni modifica el archivo. */
export function leerLibro(buffer, nombreArchivo) {
  const X = XLSX();
  const wb = X.read(buffer, { type: 'array', cellStyles: true });
  const hojas = [];
  for (const nombre of wb.SheetNames) {
    const ws = wb.Sheets[nombre];
    if (nombre === HOJA_RESPALDO || !ws || !ws['!ref']) continue;
    const rango = X.utils.decode_range(ws['!ref']);
    hojas.push({ nombre, ws, rango, filas: rango.e.r - rango.s.r + 1 });
  }
  // Por defecto, la primera hoja que tenga datos además de una fila de títulos.
  const conDatos = hojas.filter((h) => h.filas >= 2);
  if (!conDatos.length) throw new Error('El archivo no tiene una hoja con datos');
  return { archivo: nombreArchivo || 'archivo.xlsx', hojas: conDatos, nombresHojas: wb.SheetNames };
}

const celda = (h, r, c) => h.ws[XLSX().utils.encode_cell({ r, c })];

/** Lo que se ve en la celda (las fechas, como 24/03/2024). */
export function textoCelda(cel) {
  if (esVacia(cel)) return '';
  const X = XLSX();
  if (cel.v instanceof Date) return fmtFecha(hoyISO(cel.v));
  if (cel.t === 'n' && cel.z && X.SSF.is_date(cel.z)) return fmtFecha(aFechaISO(cel.v)) || String(cel.v);
  return String(cel.w ?? cel.v).trim();
}

/** Busca en las primeras 20 filas la que tiene los títulos. Devuelve el número de fila de la hoja, o -1 si no hay títulos. */
export function detectarFilaTitulos(h) {
  const hasta = Math.min(h.rango.e.r, h.rango.s.r + 19);
  let mejor = -1, mejorPuntaje = 0, primeraConTextos = -1;
  for (let r = h.rango.s.r; r <= hasta; r++) {
    let textos = 0, reconocidos = 0;
    for (let c = h.rango.s.c; c <= h.rango.e.c; c++) {
      const cel = celda(h, r, c);
      if (esVacia(cel) || typeof cel.v !== 'string') continue;
      textos++;
      if (campoPorTitulo(cel.v)) reconocidos++;
    }
    if (textos < 2) continue;
    if (primeraConTextos < 0) primeraConTextos = r;
    const puntaje = reconocidos * 100 + textos;
    if (reconocidos && puntaje > mejorPuntaje) { mejor = r; mejorPuntaje = puntaje; }
  }
  if (mejor >= 0) return mejor;
  if (primeraConTextos < 0) return -1;
  // Sin títulos reconocibles: si esa fila ya trae números, CURP, NSS o celulares, es un cliente (el archivo no tiene títulos).
  for (let c = h.rango.s.c; c <= h.rango.e.c; c++) {
    const cel = celda(h, primeraConTextos, c);
    if (esVacia(cel)) continue;
    if (typeof cel.v !== 'string' || PRUEBAS_CONTENIDO.slice(0, 3).some(([, prueba]) => prueba(cel.v))) return -1;
  }
  return primeraConTextos;
}

/** Columnas de la hoja con su título, cuántos datos tienen y unos ejemplos. */
export function columnasDeHoja(h, filaTitulos) {
  const X = XLSX();
  const desde = filaTitulos < 0 ? h.rango.s.r : filaTitulos + 1;
  const cols = [];
  for (let c = h.rango.s.c; c <= h.rango.e.c; c++) {
    const letra = X.utils.encode_col(c);
    const titulo = filaTitulos < 0 ? '' : textoCelda(celda(h, filaTitulos, c));
    const muestras = [], ejemplos = [];
    let conDato = 0;
    for (let r = desde; r <= h.rango.e.r; r++) {
      const cel = celda(h, r, c);
      if (esVacia(cel)) continue;
      conDato++;
      if (muestras.length < 30) muestras.push(cel.v);
      if (ejemplos.length < 3) ejemplos.push(textoCelda(cel));
    }
    cols.push({ col: c, letra, titulo, nombre: titulo || `Columna ${letra}`, conDato, muestras, ejemplos });
  }
  return cols;
}

/**
 * Sugiere qué dato es cada columna: primero por el título y, si no dice nada, por el contenido.
 * Devuelve [{ campo, por: 'titulo' | 'contenido' | null }] en el mismo orden que `cols`.
 * El nombre puede venir en varias columnas (nombre y apellidos); los demás datos, en una sola.
 */
export function sugerirMapeo(cols) {
  const res = cols.map((k) => ({ campo: k.conDato ? EXTRA : IGNORAR, por: null }));
  const usados = new Set();
  cols.forEach((k, i) => {
    if (!k.conDato) return;
    const campo = campoPorTitulo(k.titulo);
    if (!campo || campo === EXTRA) return;
    if (campo !== 'nombre' && usados.has(campo)) return;
    usados.add(campo);
    res[i] = { campo, por: 'titulo' };
  });
  cols.forEach((k, i) => {
    if (!k.conDato || res[i].por || campoPorTitulo(k.titulo) === EXTRA) return;
    const campo = campoPorContenido(k.muestras);
    if (!campo || usados.has(campo)) return;
    usados.add(campo);
    res[i] = { campo, por: 'contenido' };
  });
  return res;
}

/**
 * Arma lo que se va a importar con la hoja, la fila de títulos y el dato elegido para cada columna.
 * No guarda nada. Cada valor original queda tal cual en `crudo`.
 */
export function construirImportacion(libro, h, filaTitulos, mapeo) {
  const X = XLSX();
  const sinTitulos = filaTitulos < 0;
  const cols = columnasDeHoja(h, filaTitulos);
  const enc = cols.map((k, i) => ({ ...k, campo: mapeo[i]?.campo ?? mapeo[i] ?? IGNORAR }));
  // La huella identifica la fila para no importarla dos veces (misma regla que antes: valores en el orden de los títulos).
  const orden = enc.map((e) => (sinTitulos ? e.nombre : e.titulo));
  const desde = sinTitulos ? h.rango.s.r : filaTitulos + 1;
  const tituloNorm = enc.map((e) => norm(e.titulo));

  const filas = [];
  const avisos = { fechas: 0, periodicidades: 0, ejemplo: 0, titulosRepetidos: 0 };
  for (let r = desde; r <= h.rango.e.r; r++) {
    const crudo = {}, datos = {}, extra = {}, rojas = [], partesNombre = [];
    let hayDato = false, esTitulo = true, conTexto = 0;
    let fechaMala = false, perMala = false;
    for (const [i, e] of enc.entries()) {
      const cel = celda(h, r, e.col);
      if (cel && cel.s && cel.s.fgColor && esRojo(cel.s.fgColor.rgb)) rojas.push(e.nombre);
      if (esVacia(cel)) continue;
      const v = cel.v;
      hayDato = true;
      conTexto++;
      if (norm(v) !== tituloNorm[i]) esTitulo = false;
      crudo[e.nombre] = v instanceof Date ? hoyISO(v) : v;
      if (e.campo === 'fecha_inicio' || e.campo === 'proximo_pago') {
        datos[e.campo] = aFechaISO(v);
        if (!datos[e.campo]) fechaMala = true;
      } else if (e.campo === 'comision') {
        const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
        datos.comision = Number.isFinite(n) ? n : null;
      } else if (e.campo === 'periodicidad') {
        datos.periodicidad = aPeriodicidad(v);
        if (!datos.periodicidad) perMala = true;
      } else if (e.campo === 'nombre') {
        partesNombre.push(aTexto(v));
      } else if (e.campo === EXTRA) {
        extra[e.nombre] = aTexto(v);
      } else if (e.campo !== IGNORAR) {
        datos[e.campo] = aTexto(v);
      }
    }
    if (!hayDato) continue;
    // Una fila que repite los títulos (tablas pegadas una debajo de otra) no es un cliente.
    if (!sinTitulos && esTitulo && conTexto >= 2) { avisos.titulosRepetidos++; continue; }
    datos.nombre = partesNombre.length > 1 ? partesNombre.join(' ').replace(/\s+/g, ' ').trim() : (partesNombre[0] || '');
    // La fila de ejemplo de la plantilla no se importa.
    if (/^ejemplo\b/.test(norm(datos.nombre))) { avisos.ejemplo++; continue; }
    if (fechaMala) avisos.fechas++;
    if (perMala) avisos.periodicidades++;
    filas.push({ fila: r + 1, crudo, datos, extraCrudo: extra, rojas, fechaMala, perMala });
  }

  // Columnas marcadas como «otro dato»: si tienen datos se guardan como campos personalizados.
  const camposNuevos = [];
  const clavePorNombre = {};
  for (const e of enc) {
    if (e.campo !== EXTRA || !e.conDato) continue;
    const clave = 'x_' + norm(e.nombre).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    clavePorNombre[e.nombre] = clave;
    camposNuevos.push({ clave, etiqueta: e.nombre, tipo: 'texto' });
  }
  const columnasVacias = enc.filter((e) => !e.conDato && e.titulo).map((e) => e.titulo);
  const columnasIgnoradas = enc.filter((e) => e.conDato && e.campo === IGNORAR).map((e) => e.nombre);

  for (const f of filas) {
    f.datos.extra = {};
    for (const [k, v] of Object.entries(f.extraCrudo)) if (clavePorNombre[k]) f.datos.extra[clavePorNombre[k]] = v;
    // Por indicación del usuario: una fila con celdas en rojo = cliente DADO DE BAJA (cotiza a veces y vuelve).
    f.etiquetas = [];
    f.celdasRojas = f.rojas;
    f.huella = huellaDeFila(orden.map((t) => f.crudo[t]));
  }

  return {
    archivo: libro.archivo,
    hoja: h.nombre,
    filaTitulos: sinTitulos ? null : filaTitulos + 1,
    hojasVacias: libro.nombresHojas.filter((n) => n !== HOJA_RESPALDO && !libro.hojas.some((o) => o.nombre === n)),
    otrasHojas: libro.hojas.filter((o) => o !== h).map((o) => o.nombre),
    encabezados: enc.map((e) => e.nombre),
    columnasVacias,
    columnasIgnoradas,
    camposNuevos,
    avisos,
    filas,
  };
}

/** Lectura automática (sin preguntar): primera hoja con datos, títulos detectados y columnas sugeridas. */
export function leerExcel(buffer, nombreArchivo) {
  const libro = leerLibro(buffer, nombreArchivo);
  const h = libro.hojas[0];
  const fila = detectarFilaTitulos(h);
  const mapeo = sugerirMapeo(columnasDeHoja(h, fila));
  if (!mapeo.some((m) => m.campo === 'nombre')) throw new Error('No encontré la columna con el nombre del cliente');
  return construirImportacion(libro, h, fila, mapeo);
}

/** Plantilla vacía para quien no tiene su lista en Excel o la tiene muy desordenada. */
export function plantillaBytes() {
  const X = XLSX();
  const cab = ['NOMBRE', 'CURP', 'NSS', 'CELULAR', 'FECHA DE INICIO', 'PERIODICIDAD', 'PRÓXIMO PAGO', 'OPCIÓN', 'PROVEEDOR', 'COMISIÓN', 'NOTAS'];
  const ejemplo = [
    { t: 's', v: 'EJEMPLO Nombre Apellido (borra esta fila)' }, '', '', { t: 's', v: '5512345678' },
    celFecha(hoyISO()), { t: 's', v: 'Mensual' }, '', '', '', '', { t: 's', v: 'Solo el nombre es obligatorio' },
  ];
  const ws = X.utils.aoa_to_sheet([cab, ejemplo]);
  ws['!cols'] = cab.map((t, i) => ({ wch: i === 0 ? 40 : i === 10 ? 32 : 18 }));
  const ayuda = X.utils.aoa_to_sheet([
    ['Cómo llenar la plantilla'],
    ['1. Escribe un cliente por fila, debajo de los títulos. Solo el NOMBRE es obligatorio.'],
    ['2. FECHA DE INICIO: el día de esa fecha es el día en que le cobras (ej. 24/03/2024 = cobras cada día 24).'],
    ['3. PERIODICIDAD: Mensual, Trimestral, Semestral, Anual o «Cada 15 días».'],
    ['4. PRÓXIMO PAGO (opcional): la fecha del siguiente cobro. Si la dejas vacía, la app te ayuda a ponerla.'],
    ['5. Puedes agregar más columnas con otros datos: se guardan como campos extra.'],
    ['6. Borra la fila de EJEMPLO (si se te olvida, la app no la importa).'],
    ['7. Guarda el archivo y en la app ve a ☰ → Importar y exportar → Importar Excel.'],
  ]);
  ayuda['!cols'] = [{ wch: 100 }];
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'Clientes');
  X.utils.book_append_sheet(wb, ayuda, 'Cómo llenarla');
  return X.write(wb, { bookType: 'xlsx', type: 'array' });
}

// ---------- Exportación ----------
const serial = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
};
const celFecha = (iso) => (iso && esISO(iso) ? { t: 'n', v: serial(iso), z: 'dd/mm/yyyy' } : '');
const celTexto = (s) => (s == null || s === '' ? '' : { t: 's', v: String(s) });
const celNum = (n) => (n == null || n === '' ? '' : { t: 'n', v: Number(n) });

export function construirLibro(db, hoy = hoyISO(), respaldo = null) {
  const X = XLSX();
  const extras = db.config.camposPersonalizados;

  // Hoja 1: las columnas originales (mismos nombres y orden) + columnas nuevas de la app.
  const cab = [
    ...Object.values(ENCABEZADOS_ORIGINALES),
    'PERIODICIDAD', 'PRÓXIMO PAGO', 'ESTADO', 'DÍAS PARA VENCER', 'DÍAS DE ATRASO', 'ÚLTIMO PAGO', 'NOTAS',
    ...extras.map((x) => x.etiqueta.toUpperCase()),
  ];
  const filas = db.clientes.map((c) => {
    const e = calcularEstado(c, hoy, db.config.diasAviso);
    const up = ultimoPago(c);
    return [
      celTexto(c.nombre), celTexto(c.curp), celTexto(c.nss), celTexto(c.celular),
      celFecha(c.fecha_inicio), celTexto(c.opcion), celTexto(c.proveedor), celNum(c.comision),
      celTexto(c.periodicidad), celFecha(c.proximo_pago), celTexto(`${e.icono} ${e.etiqueta}`),
      e.diasRestantes != null && e.diasRestantes >= 0 && e.codigo !== 'BAJA' ? celNum(e.diasRestantes) : '',
      e.diasAtraso && e.codigo !== 'BAJA' ? celNum(e.diasAtraso) : '',
      celFecha(up?.fecha_pago), celTexto(c.notas),
      ...extras.map((x) => celTexto(c.extra?.[x.clave])),
    ];
  });
  const ws1 = X.utils.aoa_to_sheet([cab, ...filas]);
  ws1['!cols'] = cab.map((h, i) => ({ wch: i === 0 ? 38 : i === 1 || i === 2 ? 22 : 16 }));
  ws1['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filas.length, c: cab.length - 1 } }) };

  // Hoja 2: pagos.
  const cabP = ['CLIENTE', 'CURP', 'FECHA DE PAGO', 'MONTO', 'FORMA DE PAGO', 'PERIODO CUBIERTO DESDE', 'PRÓXIMO VENCIMIENTO', 'NOTA'];
  const filasP = [];
  for (const c of db.clientes) {
    for (const p of c.pagos) {
      filasP.push([celTexto(c.nombre), celTexto(c.curp), celFecha(p.fecha_pago), celNum(p.monto), celTexto(p.metodo),
        celFecha(p.periodo_desde), celFecha(p.periodo_hasta), celTexto(p.nota)]);
    }
  }
  const ws2 = X.utils.aoa_to_sheet([cabP, ...filasP]);
  ws2['!cols'] = cabP.map((h, i) => ({ wch: i === 0 ? 38 : 20 }));

  // Hoja 3: historial de cambios.
  const cabH = ['FECHA Y HORA', 'CLIENTE', 'TIPO', 'DETALLE'];
  const filasH = db.historial.map((h) => {
    const f = new Date(h.ts);
    const t = `${fmtFecha(hoyISO(f))} ${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`;
    return [celTexto(t), celTexto(h.cliente), celTexto(h.tipo), celTexto(h.detalle)];
  });
  const ws3 = X.utils.aoa_to_sheet([cabH, ...filasH]);
  ws3['!cols'] = [{ wch: 18 }, { wch: 38 }, { wch: 12 }, { wch: 80 }];

  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws1, 'Clientes');
  X.utils.book_append_sheet(wb, ws2, 'Pagos');
  X.utils.book_append_sheet(wb, ws3, 'Historial');
  if (respaldo) {
    // Hoja oculta con el respaldo completo, para que este mismo Excel sirva para "Restaurar respaldo".
    // Excel admite hasta 32767 caracteres por celda: el texto se reparte en filas de la columna A.
    const filas = [[HOJA_RESPALDO]];
    for (let i = 0; i < respaldo.length; i += 30000) filas.push([respaldo.slice(i, i + 30000)]);
    X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(filas), HOJA_RESPALDO);
    wb.Workbook = { Sheets: wb.SheetNames.map((n) => ({ Hidden: n === HOJA_RESPALDO ? 1 : 0 })) };
  }
  return wb;
}

const HOJA_RESPALDO = 'Respaldo';

export function exportarExcelBytes(db, hoy, respaldo) {
  return XLSX().write(construirLibro(db, hoy, respaldo), { bookType: 'xlsx', type: 'array' });
}

/** Devuelve el texto del respaldo guardado en un Excel exportado por la app, o null si no lo tiene. */
export function leerRespaldoExcel(buffer) {
  const X = XLSX();
  const wb = X.read(buffer, { type: 'array' });
  const ws = wb.Sheets[HOJA_RESPALDO];
  if (!ws) return null;
  const filas = X.utils.sheet_to_json(ws, { header: 1, raw: true });
  if (!filas.length || filas[0][0] !== HOJA_RESPALDO) return null;
  return filas.slice(1).map((f) => String(f[0] ?? '')).join('');
}

// ---------- Descarga ----------
const esIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function descargar(bytesOTexto, nombre, tipo) {
  const blob = new Blob([bytesOTexto], { type: tipo });
  // En iPhone, la hoja de compartir permite "Guardar en Archivos" con un toque.
  // En Android la hoja de compartir no ofrece guardar (solo WhatsApp, correo…): se descarga directo a Descargas.
  if (esIOS() && navigator.canShare && globalThis.File) {
    const archivo = new File([blob], nombre, { type: tipo });
    if (navigator.canShare({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: nombre });
        return true;
      } catch (e) {
        if (e && e.name === 'AbortError') return false;
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
}
