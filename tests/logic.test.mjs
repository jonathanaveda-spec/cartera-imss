import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../app/js/logic.js';

const hoy = '2026-09-24';
const cli = (o = {}) => ({ id: 'x', nombre: 'A', pagos: [], baja: false, ...o });

test('estado: BAJA siempre tiene prioridad', () => {
  assert.equal(L.calcularEstado(cli({ baja: true, proximo_pago: '2020-01-01' }), hoy).codigo, 'BAJA');
});
test('estado: sin fecha => SIN_CONFIG', () => {
  assert.equal(L.calcularEstado(cli(), hoy).codigo, 'SIN_CONFIG');
});
test('estado: fecha pasada => MOROSO con días de atraso', () => {
  const e = L.calcularEstado(cli({ proximo_pago: '2026-09-20' }), hoy);
  assert.equal(e.codigo, 'MOROSO'); assert.equal(e.diasAtraso, 4);
});
test('estado: límites de PRÓXIMO A VENCER (0..7) y AL DÍA (8+)', () => {
  const de = (n) => L.calcularEstado(cli({ proximo_pago: L.sumarDias(hoy, n) }), hoy, 7).codigo;
  assert.equal(de(0), 'POR_VENCER'); assert.equal(de(1), 'POR_VENCER'); assert.equal(de(7), 'POR_VENCER');
  assert.equal(de(8), 'AL_DIA'); assert.equal(de(-1), 'MOROSO');
});
test('el límite de días es configurable', () => {
  const c = cli({ proximo_pago: L.sumarDias(hoy, 10) });
  assert.equal(L.calcularEstado(c, hoy, 7).codigo, 'AL_DIA');
  assert.equal(L.calcularEstado(c, hoy, 15).codigo, 'POR_VENCER');
});
test('falta de pago NO convierte en BAJA', () => {
  assert.equal(L.calcularEstado(cli({ proximo_pago: '2019-01-01' }), hoy).codigo, 'MOROSO');
});
test('periodicidades', () => {
  assert.equal(L.siguienteVencimiento('2026-01-15', 'Mensual'), '2026-02-15');
  assert.equal(L.siguienteVencimiento('2026-01-15', 'Trimestral'), '2026-04-15');
  assert.equal(L.siguienteVencimiento('2026-01-15', 'Semestral'), '2026-07-15');
  assert.equal(L.siguienteVencimiento('2026-01-15', 'Anual'), '2027-01-15');
});
test('fin de mes: conserva día ancla sin desviarse', () => {
  assert.equal(L.siguienteVencimiento('2026-01-31', 'Mensual'), '2026-02-28');
  assert.equal(L.siguienteVencimiento('2026-02-28', 'Mensual', 31), '2026-03-31');
  assert.equal(L.siguienteVencimiento('2024-01-31', 'Mensual'), '2024-02-29');
  assert.equal(L.siguienteVencimiento('2026-12-15', 'Mensual'), '2027-01-15');
  assert.equal(L.siguienteVencimiento('2026-11-30', 'Trimestral'), '2027-02-28');
});
test('diasEntre y sumarDias (cruce de año y bisiesto)', () => {
  assert.equal(L.diasEntre('2025-12-31', '2026-01-01'), 1);
  assert.equal(L.diasEntre('2024-02-28', '2024-03-01'), 2);
  assert.equal(L.sumarDias('2026-12-31', 1), '2027-01-01');
});
test('teléfono', () => {
  assert.equal(L.telefonoDe('55 7358 6168 MORENO asesor'), '5573586168');
  assert.equal(L.telefonoDe('(618) 666-9266'), '6186669266');
  assert.equal(L.telefonoDe('Asesor Oscar'), null);
  assert.equal(L.telefonoDe(8322357621), '8322357621');
});
test('búsqueda sin acentos ni mayúsculas', () => {
  const cs = [cli({ id: '1', nombre: 'KARLA NUÑEZ DÍAZ' }), cli({ id: '2', nombre: 'Otro' })];
  assert.equal(L.filtrarClientes(cs, { busqueda: 'nunez diaz' }, hoy, 7).length, 1);
});
test('filtro por fechas y orden con vacíos al final', () => {
  const cs = [
    cli({ id: '1', nombre: 'B', proximo_pago: '2026-10-01' }),
    cli({ id: '2', nombre: 'A', proximo_pago: '2026-09-01' }),
    cli({ id: '3', nombre: 'C' }),
  ];
  const it = L.filtrarClientes(cs, {}, hoy, 7);
  assert.deepEqual(L.ordenar(it, 'vencimiento', 'asc').map((x) => x.c.id), ['2', '1', '3']);
  assert.deepEqual(L.ordenar(it, 'vencimiento', 'desc').map((x) => x.c.id), ['1', '2', '3']);
  assert.equal(L.filtrarClientes(cs, { pDesde: '2026-09-15' }, hoy, 7).length, 1);
});
test('avisos de datos', () => {
  const cs = [
    cli({ id: '1', curp: 'ABC', nss: '123', celular: 'Asesor', fecha_inicio: '2056-02-16' }),
    cli({ id: '2', curp: 'ABC', nss: '123' }),
  ];
  const dup = L.indexarDuplicados(cs);
  const a = L.avisosDeCliente(cs[0], dup, hoy);
  for (const k of ['curp_largo', 'nss_largo', 'celular', 'fecha_futura', 'duplicado']) assert.ok(a.includes(k), k);
});

import { calcularMasivo } from '../app/js/store.js';
test('asistente: el día de la fecha de inicio es el día de pago (ciclo mensual)', () => {
  const r = (fi, hoy = '2026-09-24') => calcularMasivo([{ id: 'a', fecha_inicio: fi, proximo_pago: null }], { periodicidad: 'Mensual', metodo: 'ciclo', hoy })[0];
  assert.equal(r('2025-07-08').proximo, '2026-10-08');   // ya pasó este mes → siguiente mes
  assert.equal(r('2025-07-24').proximo, '2026-09-24');   // hoy es su día de pago → vence hoy
  assert.equal(r('2025-07-30').proximo, '2026-09-30');   // aún no llega este mes
  assert.equal(r('2026-05-31').proximo, '2026-09-30');   // día 31 se ajusta a fin de mes
  assert.equal(r('2026-10-05').proximo, '2026-10-05');   // fecha futura cercana: primer pago
  assert.equal(r('2056-02-16').omitido, true);           // fecha absurda: no se calcula
  assert.equal(calcularMasivo([{ id: 'a', fecha_inicio: '2025-07-08' }], { periodicidad: 'Mensual', metodo: 'inicio', hoy: '2026-09-24' })[0].proximo, '2025-08-08');
});
test('texto del día de pago', () => {
  assert.equal(L.textoDiaPago({ proximo_pago: '2026-10-24', periodicidad: 'Mensual' }), 'Día 24 de cada mes');
  assert.equal(L.textoDiaPago({ dia_pago: 31, periodicidad: 'Trimestral' }), 'Día 31, cada 3 meses');
  assert.equal(L.textoDiaPago({}), '');
});
