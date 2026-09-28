import test from 'node:test';
import assert from 'node:assert/strict';
import { planEfectivo, cupo, LIMITE_GRATIS_DEFECTO } from '../plataforma/js/plan.js';

const ahora = Date.UTC(2026, 8, 28);
const DIA = 86400000;

test('beta abierta: ilimitado para todos', () => {
  const p = planEfectivo({ sistema: { betaAbierta: true } }, ahora);
  assert.equal(p.tipo, 'beta'); assert.equal(cupo(p, 5000, 100).permitido, true);
});

test('sin beta y sin plan: gratis con límite por defecto', () => {
  const p = planEfectivo({ sistema: {} }, ahora);
  assert.equal(p.tipo, 'gratis'); assert.equal(p.limite, LIMITE_GRATIS_DEFECTO);
  assert.equal(p.vencido, false);
});

test('límite configurable y cupo parcial', () => {
  const p = planEfectivo({ sistema: { limiteGratis: 10 } }, ahora);
  assert.deepEqual(cupo(p, 8, 1), { permitido: true, caben: 1 });
  assert.deepEqual(cupo(p, 8, 5), { permitido: false, caben: 2 });
  assert.deepEqual(cupo(p, 12, 1), { permitido: false, caben: 0 });
});

test('plan pro vigente, sin vencimiento y vencido', () => {
  const vig = planEfectivo({ plan: { tipo: 'pro', vence: ahora + 3 * DIA }, sistema: {} }, ahora);
  assert.equal(vig.tipo, 'pro'); assert.equal(vig.diasRestantes, 3);
  assert.equal(planEfectivo({ plan: { tipo: 'pro', vence: null } }, ahora).tipo, 'pro');
  const ven = planEfectivo({ plan: { tipo: 'pro', vence: ahora - 1 }, sistema: {} }, ahora);
  assert.equal(ven.tipo, 'gratis'); assert.equal(ven.vencido, true);
});

test('pro gana sobre beta (muestra su vencimiento)', () => {
  const p = planEfectivo({ plan: { tipo: 'pro', vence: ahora + DIA }, sistema: { betaAbierta: true } }, ahora);
  assert.equal(p.tipo, 'pro');
});

import { mediosOrdenados, textoPrecios, mensajesDeConversacion } from '../plataforma/js/plan.js';

test('medios de pago: los del país del asesor primero y sin incompletos', () => {
  const m = [{ pais: 'MX', nombre: 'SPEI', dato: '1' }, { pais: 'CO', nombre: 'Nequi', dato: '2' }, { pais: 'VE', nombre: 'Binance', dato: '' }, { pais: 'CO', nombre: 'Bre-B', dato: '3' }];
  assert.deepEqual(mediosOrdenados(m, 'CO').map((x) => x.nombre), ['Nequi', 'Bre-B', 'SPEI']);
  assert.deepEqual(mediosOrdenados(undefined, 'CO'), []);
});

test('texto de precios', () => {
  assert.equal(textoPrecios({ precioMensual: 5, precioAnual: 50 }), '5 USD al mes · 50 USD al año');
  assert.equal(textoPrecios({ precioMensual: 20000, moneda: 'COP' }), '20000 COP al mes');
  assert.equal(textoPrecios({}), '');
});

test('conversación: tickets antiguos se muestran como primeros mensajes', () => {
  const r = mensajesDeConversacion({ mensaje: 'hola', respuesta: 'listo' }, [{ id: 'a', de: 'asesor', texto: 'gracias' }]);
  assert.deepEqual(r.map((x) => `${x.de}:${x.texto}`), ['asesor:hola', 'soporte:listo', 'asesor:gracias']);
  assert.equal(mensajesDeConversacion({}, []).length, 0);
});
