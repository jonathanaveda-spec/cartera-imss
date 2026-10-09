// Corregir la comisión de un pago ya registrado: queda en el historial de cambios y cuenta en «Mis comisiones».
import test from 'node:test';
import assert from 'node:assert/strict';
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const S = await import('../plataforma/js/store.js');
const L = await import('../plataforma/js/logic.js');
await S.iniciar();

const nuevoConPago = async (nombre, comision) => {
  const c = await S.agregarCliente({ nombre, periodicidad: 'Mensual', proximo_pago: '2026-09-01', comision });
  const pago = await S.registrarPago(c.id, { fecha_pago: '2026-09-01' });
  return { c, pago };
};

test('corregir la comisión de un pago la cambia, deja registro y no toca al cliente ni a otros pagos', async () => {
  const { c, pago } = await nuevoConPago('Ana Prueba', 100);
  await S.registrarPago(c.id, { fecha_pago: '2026-10-01' });
  assert.equal(c.pagos[0].comision, 100);

  const antesHist = S.historialDe(c.id).length;
  await S.corregirComisionPago(c.id, pago.id, 250);
  assert.equal(c.pagos[0].comision, 250);
  assert.equal(c.pagos[1].comision, 100); // el otro pago no cambia
  assert.equal(c.comision, 100);          // la del cliente tampoco
  assert.equal(L.comisionDePago(c, c.pagos[0]), 250);

  const hist = S.historialDe(c.id);
  assert.equal(hist.length, antesHist + 1);
  assert.match(hist[0].detalle, /Comisión del pago del 2026-09-01 corregida/);
  assert.deepEqual(hist[0].cambios[0], { campo: 'Comisión del pago (2026-09-01)', antes: 100, despues: 250 });
});

test('0 es «sin comisión» en ese pago; vacío vuelve a usar la del cliente', async () => {
  const { c, pago } = await nuevoConPago('Beto Prueba', 80);
  await S.corregirComisionPago(c.id, pago.id, 0);
  assert.equal(c.pagos[0].comision, 0);
  assert.equal(L.comisionDePago(c, c.pagos[0]), 0);

  await S.corregirComisionPago(c.id, pago.id, '');
  assert.equal(c.pagos[0].comision, null);
  assert.equal(L.comisionDePago(c, c.pagos[0]), 80);
});

test('si el monto no cambia no se anota nada; los montos inválidos y los pagos que no existen se rechazan', async () => {
  const { c, pago } = await nuevoConPago('Carla Prueba', 60);
  const n = S.historialDe(c.id).length;
  await S.corregirComisionPago(c.id, pago.id, 60);
  assert.equal(S.historialDe(c.id).length, n);

  await assert.rejects(S.corregirComisionPago(c.id, pago.id, -5), /0 o más/);
  await assert.rejects(S.corregirComisionPago(c.id, pago.id, 'abc'), /0 o más/);
  await assert.rejects(S.corregirComisionPago(c.id, 'no-existe', 10), /No se encontró el pago/);
  assert.equal(c.pagos[0].comision, 60);
});

test('Mis comisiones suma la comisión corregida en el mes del pago', async () => {
  const { c, pago } = await nuevoConPago('Diana Prueba', 100);
  const antes = L.resumenComisiones([c], '2026-09-15').ganado;
  assert.equal(antes, 100);
  await S.corregirComisionPago(c.id, pago.id, 175);
  assert.equal(L.resumenComisiones([c], '2026-09-15').ganado, 175);
});
