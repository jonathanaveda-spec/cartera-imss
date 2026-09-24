// Lectura de Excel (importación) y exportación a un archivo NUEVO. Nunca modifica el archivo original.
import { calcularEstado, ultimoPago, esISO, fmtFecha, hoyISO } from './logic.js';
import { huellaDeFila } from './store.js';

const XLSX = () => {
  if (!globalThis.XLSX) throw new Error('No se cargó la librería de Excel');
  return globalThis.XLSX;
};

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Encabezados del Excel de origen → campo interno.
const MAPA = {
  cliente: 'nombre', nombre: 'nombre',
  curp: 'curp', nss: 'nss',
  celular: 'celular', telefono: 'celular', tel: 'celular',
  'fecha de inicio': 'fecha_inicio', 'fecha inicio': 'fecha_inicio', 'fecha de alta': 'fecha_inicio',
  opcion: 'opcion', proveedor: 'proveedor', comision: 'comision',
};

const ENCABEZADOS_ORIGINALES = {
  nombre: 'CLIENTE', curp: 'CURP', nss: 'NSS', celular: 'CELULAR', fecha_inicio: 'FECHA DE inicio',
  opcion: 'OPCION', proveedor: 'PROVEEDOR', comision: 'COMISION',
};

function esRojo(rgb) {
  if (!rgb || typeof rgb !== 'string') return false;
  const h = rgb.length === 8 ? rgb.slice(2) : rgb;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return r >= 0xb0 && g <= 0x50 && b <= 0x50;
}

function aFechaISO(v) {
  const X = XLSX();
  if (v == null || v === '') return null;
  if (v instanceof Date) return hoyISO(v);
  if (typeof v === 'number') {
    const p = X.SSF.parse_date_code(v);
    return p ? `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}` : null;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m && esISO(`${m[1]}-${m[2]}-${m[3]}`)) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    if (esISO(iso)) return iso;
  }
  return null;
}

const aTexto = (v) => (v == null ? '' : typeof v === 'number' ? String(v) : String(v).trim());

/** Lee el libro y devuelve las filas ya mapeadas + avisos. No guarda nada. */
export function leerExcel(buffer, nombreArchivo) {
  const X = XLSX();
  const wb = X.read(buffer, { type: 'array', cellStyles: true });
  // Primera hoja que tenga datos (además del encabezado).
  let hoja = null;
  for (const n of wb.SheetNames) {
    const ws = wb.Sheets[n];
    if (ws && ws['!ref'] && X.utils.decode_range(ws['!ref']).e.r >= 1) { hoja = n; break; }
  }
  if (!hoja) throw new Error('El archivo no tiene una hoja con datos');
  const ws = wb.Sheets[hoja];
  const rango = X.utils.decode_range(ws['!ref']);

  const enc = [];
  for (let c = rango.s.c; c <= rango.e.c; c++) {
    const cel = ws[X.utils.encode_cell({ r: rango.s.r, c })];
    enc.push({ col: c, texto: cel ? String(cel.v ?? '').trim() : '' });
  }
  if (!enc.some((e) => norm(e.texto) === 'cliente' || norm(e.texto) === 'nombre')) {
    throw new Error('No encontré la columna CLIENTE en la primera fila del archivo');
  }

  const filas = [];
  const usadas = new Set();
  const conDatoPorColumna = new Map();
  for (let r = rango.s.r + 1; r <= rango.e.r; r++) {
    const crudo = {}, datos = {}, extra = {}, rojas = [];
    let hayDato = false;
    for (const e of enc) {
      const cel = ws[X.utils.encode_cell({ r, c: e.col })];
      const v = cel ? cel.v : null;
      const vacio = v == null || String(v).trim() === '';
      if (cel && cel.s && cel.s.fgColor && esRojo(cel.s.fgColor.rgb)) rojas.push(e.texto || `Columna ${e.col + 1}`);
      if (vacio) continue;
      hayDato = true;
      conDatoPorColumna.set(e.col, (conDatoPorColumna.get(e.col) || 0) + 1);
      crudo[e.texto || `Columna ${e.col + 1}`] = v instanceof Date ? hoyISO(v) : v;
      const campo = MAPA[norm(e.texto)];
      if (campo === 'fecha_inicio') {
        datos.fecha_inicio = aFechaISO(v);
        usadas.add(e.col);
      } else if (campo === 'comision') {
        const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
        datos.comision = Number.isFinite(n) ? n : null;
        usadas.add(e.col);
      } else if (campo) {
        datos[campo] = aTexto(v);
        usadas.add(e.col);
      } else {
        extra[e.texto || `Columna ${e.col + 1}`] = aTexto(v);
      }
    }
    if (!hayDato) continue;
    filas.push({ fila: r + 1, crudo, datos, extraCrudo: extra, rojas });
  }

  // Columnas sin encabezado reconocido: si tienen datos se conservan como campos personalizados; si están vacías se ignoran.
  const camposNuevos = [];
  const columnasVacias = [];
  const clavePorTexto = {};
  for (const e of enc) {
    if (MAPA[norm(e.texto)]) continue;
    if (!conDatoPorColumna.get(e.col)) { columnasVacias.push(e.texto || `Columna ${e.col + 1}`); continue; }
    const etiqueta = e.texto || `Columna ${e.col + 1}`;
    const clave = 'x_' + norm(etiqueta).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    clavePorTexto[etiqueta] = clave;
    camposNuevos.push({ clave, etiqueta, tipo: 'texto' });
  }

  const orden = enc.map((e) => e.texto);
  for (const f of filas) {
    f.datos.extra = {};
    for (const [k, v] of Object.entries(f.extraCrudo)) if (clavePorTexto[k]) f.datos.extra[clavePorTexto[k]] = v;
    // Por indicación del usuario: una fila con celdas en rojo = cliente DADO DE BAJA (cotiza a veces y vuelve).
    f.etiquetas = [];
    f.baja = f.rojas.length > 0;
    f.celdasRojas = f.rojas;
    f.huella = huellaDeFila(orden.map((t) => f.crudo[t]));
    if (!f.datos.nombre) f.datos.nombre = '';
  }

  return {
    archivo: nombreArchivo || 'archivo.xlsx',
    hoja,
    hojasVacias: wb.SheetNames.filter((n) => n !== hoja),
    encabezados: orden,
    columnasVacias,
    camposNuevos,
    filas,
  };
}

// ---------- Exportación ----------
const serial = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
};
const celFecha = (iso) => (iso && esISO(iso) ? { t: 'n', v: serial(iso), z: 'dd/mm/yyyy' } : '');
const celTexto = (s) => (s == null || s === '' ? '' : { t: 's', v: String(s) });
const celNum = (n) => (n == null || n === '' ? '' : { t: 'n', v: Number(n) });

export function construirLibro(db, hoy = hoyISO()) {
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
  return wb;
}

export function exportarExcelBytes(db, hoy) {
  return XLSX().write(construirLibro(db, hoy), { bookType: 'xlsx', type: 'array' });
}

// ---------- Descarga ----------
const esMovil = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function descargar(bytesOTexto, nombre, tipo) {
  const blob = new Blob([bytesOTexto], { type: tipo });
  // En iPhone, la hoja de compartir permite "Guardar en Archivos" con un toque.
  if (esMovil() && navigator.canShare && globalThis.File) {
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
