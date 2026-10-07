import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../plataforma/js/logic.js';

const hoy = '2026-10-07';
const cli = (o = {}) => ({ id: o.nombre || 'x', nombre: 'A', pagos: [], baja: false, ...o });

test('moverMes cruza el año', () => {
  assert.equal(L.moverMes('2026-10', -10), '2025-12');
  assert.equal(L.moverMes('2026-12', 1), '2027-01');
});

test('ganado del mes: usa la comisión guardada en el pago y, si no hay, la del cliente', () => {
  const cs = [
    cli({ nombre: 'Ana', comision: 300, proximo_pago: '2026-11-05', pagos: [{ fecha_pago: '2026-10-05', comision: 250 }, { fecha_pago: '2026-09-05' }] }),
    cli({ nombre: 'Beto', comision: 200, proximo_pago: '2026-11-01', pagos: [{ fecha_pago: '2026-10-01' }] }),
    cli({ nombre: 'Caro', pagos: [{ fecha_pago: '2026-10-02' }] }), // sin comisión: suma 0
  ];
  const r = L.resumenComisiones(cs, hoy);
  assert.equal(r.ganado, 450);
  assert.equal(r.pagos, 3);
  assert.deepEqual(r.porCliente.map((x) => [x.nombre, x.total]), [['Ana', 250], ['Beto', 200]]);
  assert.equal(r.meses.length, 6);
  assert.equal(r.meses[5].mes, '2026-10');
  assert.equal(r.meses[4].total, 300); // septiembre: Ana sin comisión en el pago → la del cliente
  assert.equal(r.conComision, 2);
});

test('por cobrar: activos con comisión que vencen este mes o están atrasados', () => {
  const cs = [
    cli({ nombre: 'Vence', comision: 100, proximo_pago: '2026-10-20' }),
    cli({ nombre: 'Atrasado', comision: 50, proximo_pago: '2026-09-15' }),
    cli({ nombre: 'Noviembre', comision: 70, proximo_pago: '2026-11-02' }),
    cli({ nombre: 'Baja', comision: 90, proximo_pago: '2026-10-10', baja: true }),
    cli({ nombre: 'Sin comision', proximo_pago: '2026-10-10' }),
  ];
  const r = L.resumenComisiones(cs, hoy);
  assert.equal(r.porCobrar, 150);
  assert.equal(r.nPorCobrar, 2);
});
