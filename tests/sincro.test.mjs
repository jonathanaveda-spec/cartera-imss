import test from 'node:test';
import assert from 'node:assert/strict';
import * as N from '../app/js/sincro.js';

const mk = () => ({
  config: { diasAviso: 7 }, importaciones: [],
  clientes: [{ id: 'a', nombre: 'A', pagos: [], x: undefined }, { id: 'b', nombre: 'B', pagos: [] }],
  papelera: [], historial: [{ id: 'h1', ts: 1, detalle: 'x', cambios: [{ campo: 'c', antes: undefined, despues: 1 }] }],
});

test('estable ignora el orden de claves; limpio quita undefined', () => {
  assert.equal(N.estable({ b: 1, a: { d: 2, c: 3 } }), N.estable({ a: { c: 3, d: 2 }, b: 1 }));
  assert.equal('x' in N.limpio({ x: undefined, y: 1 }), false);
});

test('primera subida: escribe todo, no borra nada', () => {
  const r = N.calcularCambios(mk(), new Map());
  assert.deepEqual(r.escribir.map((e) => e.key).sort(), ['clientes/a', 'clientes/b', 'config/main', 'historial/h1']);
  assert.equal(r.borrar.length, 0);
});

test('sin cambios no envía nada, y solo envía lo modificado', () => {
  const db = mk();
  const base = new Map(N.calcularCambios(db, new Map()).escribir.map((e) => [e.key, e.firma]));
  assert.equal(N.calcularCambios(db, base).escribir.length, 0);
  db.clientes[1].nombre = 'B2';
  const r = N.calcularCambios(db, base);
  assert.deepEqual(r.escribir.map((e) => e.key), ['clientes/b']);
});

test('eliminar un cliente pide borrar su documento', () => {
  const db = mk();
  const base = new Map(N.calcularCambios(db, new Map()).escribir.map((e) => [e.key, e.firma]));
  db.papelera.push({ id: 'p1', cliente: db.clientes[0] });
  db.clientes = db.clientes.filter((c) => c.id !== 'a');
  const r = N.calcularCambios(db, base);
  assert.deepEqual(r.borrar, ['clientes/a']);
  assert.ok(r.escribir.some((e) => e.key === 'papelera/p1'));
});

test('el historial nunca se borra ni se reescribe', () => {
  const db = mk();
  const base = new Map(N.calcularCambios(db, new Map()).escribir.map((e) => [e.key, e.firma]));
  db.historial = []; // p. ej. recorte local
  assert.equal(N.calcularCambios(db, base).borrar.length, 0);
  db.historial = [{ id: 'h2', ts: 2, detalle: 'y' }];
  assert.deepEqual(N.calcularCambios(db, base).escribir.map((e) => e.key), ['historial/h2']);
});

test('con la base vacía nunca se borra nada (arranque sin conexión)', () => {
  assert.equal(N.calcularCambios(mk(), new Map()).borrar.length, 0);
});

test('actualizarBase reemplaza solo su colección', () => {
  const base = new Map([['clientes/x', '1'], ['papelera/p', '2']]);
  N.actualizarBase(base, 'clientes', [{ id: 'a', n: 1 }]);
  assert.deepEqual([...base.keys()].sort(), ['clientes/a', 'papelera/p']);
});

test('separarConfig', () => {
  const r = N.separarConfig({ diasAviso: 9, importaciones: [{ a: 1 }] });
  assert.equal(r.config.diasAviso, 9); assert.equal(r.importaciones.length, 1); assert.equal(N.separarConfig(undefined), null);
});
