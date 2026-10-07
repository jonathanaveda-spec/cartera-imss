// Cambiar la comisión de un cliente no reescribe lo ganado en pagos viejos; «misma comisión para todos».
import test from 'node:test';
import assert from 'node:assert/strict';
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const S = await import('../plataforma/js/store.js');
const L = await import('../plataforma/js/logic.js');
await S.iniciar();

test('una comisión nueva no cambia los pagos de antes; «misma para todos» solo toca a los elegidos', async () => {
  const a = await S.agregarCliente({ nombre: 'Ana Prueba', periodicidad: 'Mensual', proximo_pago: '2026-09-01', comision: 100 });
  await S.registrarPago(a.id, { fecha_pago: '2026-09-01' });
  delete a.pagos[0].comision; // pago viejo, de antes de que existiera pago.comision
  assert.equal(L.comisionDePago(a, a.pagos[0]), 100);
  await S.editarCliente(a.id, { comision: 150 });
  assert.equal(L.comisionDePago(a, a.pagos[0]), 100); // se quedó con la de su momento
  assert.equal(a.comision, 150);

  const b = await S.agregarCliente({ nombre: 'Beto Prueba' });
  const c = await S.agregarCliente({ nombre: 'Carla Prueba' });
  const n = await S.ponerComision([b.id, c.id], 80);
  assert.equal(n, 2);
  assert.equal(S.buscar(b.id).comision, 80);
  assert.equal(S.buscar(c.id).comision, 80);
  assert.equal(S.buscar(a.id).comision, 150);
});
