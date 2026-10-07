import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../plataforma/js/logic.js';

const hoy = '2026-10-07';
const cli = (o = {}) => ({ id: Math.random().toString(36), nombre: 'A', pagos: [], baja: false, ...o });

test('filtro rápido «Pagan hoy»: solo los que vencen hoy y no están de baja', () => {
  const cs = [
    cli({ nombre: 'Hoy', proximo_pago: hoy }),
    cli({ nombre: 'Mañana', proximo_pago: '2026-10-08' }),
    cli({ nombre: 'Ayer', proximo_pago: '2026-10-06' }),
    cli({ nombre: 'Baja hoy', proximo_pago: hoy, baja: true }),
    cli({ nombre: 'Sin fecha' }),
  ];
  const r = L.filtrarClientes(cs, { rapido: 'pagan_hoy' }, hoy, 7);
  assert.deepEqual(r.map((x) => x.c.nombre), ['Hoy']);
  assert.equal(L.contarRapidos(cs, hoy, 7).pagan_hoy, 1);
});

test('filtro rápido «Pagaron hoy»: los que tienen un pago con fecha de hoy', () => {
  const cs = [
    cli({ nombre: 'Pagó hoy', proximo_pago: '2026-11-07', pagos: [{ fecha_pago: '2026-09-07' }, { fecha_pago: hoy }] }),
    cli({ nombre: 'Pagó ayer', proximo_pago: '2026-11-06', pagos: [{ fecha_pago: '2026-10-06' }] }),
    cli({ nombre: 'Nunca' }),
  ];
  const r = L.filtrarClientes(cs, { rapido: 'pagaron_hoy' }, hoy, 7);
  assert.deepEqual(r.map((x) => x.c.nombre), ['Pagó hoy']);
  assert.deepEqual(L.contarRapidos(cs, hoy, 7), { pagan_hoy: 0, pagaron_hoy: 1 });
});

test('sin filtro rápido no se excluye a nadie', () => {
  const cs = [cli({ proximo_pago: hoy }), cli()];
  assert.equal(L.filtrarClientes(cs, { rapido: '' }, hoy, 7).length, 2);
});
