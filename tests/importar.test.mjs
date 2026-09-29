// Importar cualquier Excel: títulos en otra fila, nombres de columna distintos, sin títulos, plantilla.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.XLSX = require('../plataforma/vendor/xlsx.full.min.js');
const E = await import('../plataforma/js/excel.js');

const libroDe = (filas, nombre = 'prueba.xlsx') => {
  const X = globalThis.XLSX;
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(filas), 'Clientes');
  return new Uint8Array(X.write(wb, { bookType: 'xlsx', type: 'array' }));
};
const leer = (filas) => {
  const libro = E.leerLibro(libroDe(filas), 'prueba.xlsx');
  const h = libro.hojas[0];
  const fila = E.detectarFilaTitulos(h);
  const cols = E.columnasDeHoja(h, fila);
  const mapeo = E.sugerirMapeo(cols);
  return { libro, h, fila, cols, mapeo, campos: mapeo.map((m) => m.campo) };
};

test('títulos en la fila 3, nombre en varias columnas y títulos con otras palabras', () => {
  const r = leer([
    ['Mi cartera 2025'],
    [],
    ['Nombre(s)', 'Apellido paterno', 'Apellido materno', 'Tel. cel.', 'Fecha alta', 'Frecuencia', 'Observaciones', 'Zona'],
    ['Ana', 'Ruiz', 'Soto', '55 1234 5678', '24/03/2024', 'quincenal', 'paga en efectivo', 'Norte'],
    ['Luis', 'Gómez', '', '5587654321', '05/11/24', 'Mensual', '', 'Sur'],
  ]);
  assert.equal(r.fila, 2);
  assert.deepEqual(r.campos, ['nombre', 'nombre', 'nombre', 'celular', 'fecha_inicio', 'periodicidad', 'notas', E.EXTRA]);
  const p = E.construirImportacion(r.libro, r.h, r.fila, r.mapeo);
  assert.equal(p.filaTitulos, 3);
  assert.equal(p.filas.length, 2);
  const [a, b] = p.filas;
  assert.equal(a.fila, 4);
  assert.equal(a.datos.nombre, 'Ana Ruiz Soto');
  assert.equal(a.datos.celular, '55 1234 5678'); // se guarda tal cual
  assert.equal(a.datos.fecha_inicio, '2024-03-24');
  assert.equal(a.datos.periodicidad, 'Cada 15 días');
  assert.equal(a.datos.notas, 'paga en efectivo');
  assert.deepEqual(a.datos.extra, { x_zona: 'Norte' });
  assert.equal(b.datos.nombre, 'Luis Gómez');
  assert.equal(b.datos.fecha_inicio, '2024-11-05');
  assert.equal(b.datos.periodicidad, 'Mensual');
  assert.deepEqual(p.camposNuevos, [{ clave: 'x_zona', etiqueta: 'Zona', tipo: 'texto' }]);
  assert.deepEqual(p.avisos, { fechas: 0, periodicidades: 0, ejemplo: 0, titulosRepetidos: 0 });
});

test('un dato en dos columnas: la segunda queda como dato extra', () => {
  const r = leer([['Cliente', 'Celular', 'Teléfono casa'], ['Ana Ruiz', '5512345678', '5550001111']]);
  assert.deepEqual(r.campos, ['nombre', 'celular', E.EXTRA]);
});

test('sin títulos: se reconoce por el contenido', () => {
  const r = leer([
    ['ANA RUIZ SOTO', 'RUSA800101MDFZTN09', '12345678901', '5512345678'],
    ['LUIS GOMEZ PEREZ', 'GOPL790202HDFMRS08', '98765432109', '5587654321'],
    ['MARIA LOPEZ DIAZ', 'LODM850303MDFPZR07', '11122233344', '5511122233'],
  ]);
  assert.equal(r.fila, -1);
  assert.deepEqual(r.campos, ['nombre', 'curp', 'nss', 'celular']);
  const p = E.construirImportacion(r.libro, r.h, r.fila, r.mapeo);
  assert.equal(p.filas.length, 3);
  assert.equal(p.filas[0].fila, 1);
  assert.equal(p.filas[0].datos.curp, 'RUSA800101MDFZTN09');
  assert.notEqual(p.filas[0].huella, p.filas[1].huella);
});

test('fechas y periodicidades que no se entienden se avisan y no se inventan', () => {
  const r = leer([['Nombre', 'Fecha de inicio', 'Periodicidad'], ['Ana Ruiz', 'marzo', 'bimestral'], ['Luis Gómez', 24, 'Anual']]);
  const p = E.construirImportacion(r.libro, r.h, r.fila, r.mapeo);
  assert.equal(p.filas[0].datos.fecha_inicio, null);
  assert.equal(p.filas[0].datos.periodicidad, null);
  assert.equal(p.filas[0].crudo['Fecha de inicio'], 'marzo');
  assert.equal(p.filas[1].datos.fecha_inicio, null); // 24 es un día, no una fecha
  assert.equal(p.filas[1].datos.periodicidad, 'Anual');
  assert.deepEqual(p.avisos, { fechas: 2, periodicidades: 1, ejemplo: 0, titulosRepetidos: 0 });
});

test('columna marcada «no importar» y filas que repiten los títulos', () => {
  const r = leer([['Cliente', 'Celular', 'Zona'], ['Ana Ruiz', '5512345678', 'Norte'], ['Cliente', 'Celular', 'Zona'], ['Luis Gómez', '5587654321', 'Sur']]);
  const mapeo = r.mapeo.map((m, i) => (i === 2 ? { campo: E.IGNORAR } : m));
  const p = E.construirImportacion(r.libro, r.h, r.fila, mapeo);
  assert.equal(p.filas.length, 2);
  assert.equal(p.avisos.titulosRepetidos, 1);
  assert.deepEqual(p.filas[0].datos.extra, {});
  assert.deepEqual(p.camposNuevos, []);
  assert.deepEqual(p.columnasIgnoradas, ['Zona']);
  assert.equal(p.filas[0].crudo.Zona, 'Norte'); // el valor original se conserva
});

test('la plantilla se reconoce completa y su fila de ejemplo no se importa', () => {
  const p = E.leerExcel(new Uint8Array(E.plantillaBytes()), 'Plantilla.xlsx');
  assert.equal(p.filas.length, 0);
  assert.equal(p.avisos.ejemplo, 1);
  const libro = E.leerLibro(new Uint8Array(E.plantillaBytes()), 'Plantilla.xlsx');
  const h = libro.hojas[0];
  const campos = E.sugerirMapeo(E.columnasDeHoja(h, E.detectarFilaTitulos(h))).map((m) => m.campo);
  assert.deepEqual(campos.filter((c) => c !== E.IGNORAR), ['nombre', 'celular', 'fecha_inicio', 'periodicidad', 'notas']);
});

test('aPeriodicidad y aFechaISO', () => {
  assert.equal(E.aPeriodicidad('MENSUAL'), 'Mensual');
  assert.equal(E.aPeriodicidad('Cada 3 meses'), 'Trimestral');
  assert.equal(E.aPeriodicidad('cada 20 dias'), 'Cada 20 días');
  assert.equal(E.aPeriodicidad('Año'), 'Anual');
  assert.equal(E.aPeriodicidad('bimestral'), null);
  assert.equal(E.aFechaISO('31/12/2023'), '2023-12-31');
  assert.equal(E.aFechaISO('2024-02-29'), '2024-02-29');
  assert.equal(E.aFechaISO('31/02/2024'), null);
  assert.equal(E.aFechaISO(45375), '2024-03-24');
  assert.equal(E.aFechaISO(15), null);
});

test('títulos reconocidos', () => {
  const t = (s) => E.campoPorTitulo(s);
  assert.equal(t('CLIENTE'), 'nombre');
  assert.equal(t('FECHA DE inicio'), 'fecha_inicio');
  assert.equal(t('Próximo pago'), 'proximo_pago');
  assert.equal(t('Fecha de último pago'), E.EXTRA);
  assert.equal(t('No. IMSS'), 'nss');
  assert.equal(t('WhatsApp'), 'celular');
  assert.equal(t('Color favorito'), null);
});

test('una columna con «Mensual», «Trimestral»… se reconoce como periodicidad aunque el título no lo diga', () => {
  const r = leer([
    ['Nombre', 'Mensualidad', 'Comentario'],
    ['Ana Ruiz', 'Mensual', 'ok'],
    ['Luis Gómez', 'Trimestral', 'llamar'],
    ['Eva Soto', 'Anual', 'pendiente'],
  ]);
  assert.deepEqual(r.campos, ['nombre', 'periodicidad', 'notas']);
  assert.equal(r.mapeo[1].por, 'contenido');
});
