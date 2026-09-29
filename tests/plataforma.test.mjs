import test from 'node:test';
import assert from 'node:assert/strict';
import { planEfectivo, cupo, puedeEditar, LIMITE_GRATIS_DEFECTO, LIMITE_BETA_DEFECTO } from '../plataforma/js/plan.js';

const ahora = Date.UTC(2026, 8, 28);
const DIA = 86400000;

test('beta abierta: gratis y sin vencimiento, hasta 100 clientes', () => {
  const p = planEfectivo({ sistema: { betaAbierta: true } }, ahora);
  assert.equal(p.tipo, 'beta'); assert.equal(p.limite, LIMITE_BETA_DEFECTO); assert.equal(LIMITE_BETA_DEFECTO, 100);
  assert.equal(p.vencido, false); assert.equal(p.vence, null);
  assert.deepEqual(cupo(p, 90, 30), { permitido: false, caben: 10 });
  assert.deepEqual(cupo(p, 100, 1), { permitido: false, caben: 0 });
  // Quien ya tenía más de 100 sigue editando los suyos (no queda en solo lectura), pero no agrega más.
  assert.equal(puedeEditar(p, 250), true);
  assert.equal(planEfectivo({ sistema: { betaAbierta: true, limiteBeta: 300 } }, ahora).limite, 300);
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

import { equivalenteLocal } from '../plataforma/js/plan.js';
test('equivalente en moneda local redondeado hacia arriba', () => {
  const s = { precioMensual: 5, precioAnual: 50, moneda: 'USD', tasas: { COP: 3950, MXN: 18.3 } };
  assert.equal(equivalenteLocal(s, 'CO'), '≈ 20.000 COP al mes · ≈ 198.000 COP al año');
  assert.equal(equivalenteLocal(s, 'MX'), '≈ 95 MXN al mes · ≈ 915 MXN al año');
  assert.equal(equivalenteLocal(s, 'VE'), '');
  assert.equal(equivalenteLocal({ ...s, tasas: {} }, 'CO'), '');
  assert.equal(equivalenteLocal({ ...s, moneda: 'COP' }, 'CO'), '');
});

test('prueba automática de 7 días desde el registro', () => {
  const creado = ahora - 2 * DIA;
  const p = planEfectivo({ sistema: {}, creado }, ahora);
  assert.equal(p.tipo, 'prueba'); assert.equal(p.ilimitado, true); assert.equal(p.diasRestantes, 5);
  const v = planEfectivo({ sistema: {}, creado: ahora - 8 * DIA }, ahora);
  assert.equal(v.tipo, 'gratis'); assert.equal(v.vencido, true); assert.equal(v.termino, 'prueba');
});
test('días de prueba configurables y beta abierta gana sobre la prueba', () => {
  assert.equal(planEfectivo({ sistema: { diasPrueba: 14 }, creado: ahora - 10 * DIA }, ahora).tipo, 'prueba');
  assert.equal(planEfectivo({ sistema: { betaAbierta: true }, creado: ahora - 30 * DIA }, ahora).tipo, 'beta');
});
test('el administrador extiende la prueba o activa Pro', () => {
  const creado = ahora - 30 * DIA;
  assert.equal(planEfectivo({ plan: { tipo: 'prueba', vence: ahora + 7 * DIA }, sistema: {}, creado }, ahora).tipo, 'prueba');
  const vp = planEfectivo({ plan: { tipo: 'prueba', vence: ahora - DIA }, sistema: {}, creado }, ahora);
  assert.equal(vp.tipo, 'gratis'); assert.equal(vp.termino, 'prueba');
  assert.equal(planEfectivo({ plan: { tipo: 'pro', vence: ahora + DIA }, sistema: {}, creado }, ahora).tipo, 'pro');
  const g = planEfectivo({ plan: { tipo: 'gratis' }, sistema: {}, creado }, ahora);
  assert.equal(g.tipo, 'gratis'); assert.equal(g.vencido, false);
});
test('solo lectura con plan vencido y más clientes que el límite', () => {
  const v = planEfectivo({ sistema: { limiteGratis: 15 }, creado: ahora - 8 * DIA }, ahora);
  assert.equal(puedeEditar(v, 15), true);
  assert.equal(puedeEditar(v, 116), false);
  assert.equal(puedeEditar(planEfectivo({ sistema: {}, creado: ahora }, ahora), 500), true);
});

import * as LP from '../plataforma/js/logic.js';
test('recordatorio de cobro por WhatsApp', () => {
  const c = { nombre: 'CASTAÑEDA MENCHACA CINTHIA', proximo_pago: '2026-10-24', celular: '866 281 2325' };
  assert.equal(LP.nombreBonito(c.nombre), 'Castañeda Menchaca Cinthia');
  const pv = LP.mensajeCobro(c, { codigo: 'POR_VENCER', diasRestantes: 3 });
  assert.match(pv, /^Hola Castañeda Menchaca Cinthia 👋 Te recuerdo que tu pago vence el 24\/10\/2026 \(faltan 3 días\)/);
  assert.match(LP.mensajeCobro(c, { codigo: 'POR_VENCER', diasRestantes: 0 }), /\(hoy\)/);
  assert.match(LP.mensajeCobro(c, { codigo: 'MOROSO', diasAtraso: 1 }), /venció el 24\/10\/2026 \(1 día de atraso\)/);
  assert.equal(LP.mensajeCobro(c, { codigo: 'MOROSO', diasAtraso: 2 }, { moroso: 'Oye {nombre}, debes {dias}' }), 'Oye Castañeda Menchaca Cinthia, debes 2 días');
  assert.equal(LP.enlaceWhatsApp(c.celular, 'Hola 👋'), 'https://wa.me/528662812325?text=Hola%20%F0%9F%91%8B');
  assert.equal(LP.enlaceWhatsApp('Asesor Oscar', 'x'), null);
  // Con «+» y código de país se respeta el país (asesor o cliente fuera de México).
  assert.equal(LP.enlaceWhatsApp('+57 300 123 4567', ''), 'https://wa.me/573001234567');
  assert.equal(LP.telefonoInternacional('55 1234 5678'), '525512345678');
  assert.equal(LP.telefonoInternacional('+52 55 1234 5678'), '525512345678');
  assert.equal(LP.telefonoInternacional('+57 12'), null);
});

test('periodicidad personalizada: cada N días', () => {
  assert.equal(LP.diasDePeriodicidad('Cada 15 días'), 15);
  assert.equal(LP.diasDePeriodicidad('Cada 1 día'), 1);
  assert.equal(LP.diasDePeriodicidad('Cada 0 días'), null);
  assert.equal(LP.diasDePeriodicidad('Cada 400 días'), null);
  assert.equal(LP.diasDePeriodicidad('Mensual'), null);
  assert.equal(LP.periodicidadDias(15), 'Cada 15 días');
  assert.equal(LP.periodicidadDias(1), 'Cada 1 día');
  assert.ok(LP.esPeriodicidad('Cada 15 días') && LP.esPeriodicidad('Trimestral') && !LP.esPeriodicidad('Quincenal'));
  assert.equal(LP.siguienteVencimiento('2026-09-20', 'Cada 15 días'), '2026-10-05');
  assert.equal(LP.siguienteVencimiento('2026-01-31', 'Mensual'), '2026-02-28');
  assert.equal(LP.textoDiaPago({ periodicidad: 'Cada 15 días', dia_pago: 5 }), '');
});
test('comprobante de pago por WhatsApp', () => {
  const c = { nombre: 'CASTAÑEDA MENCHACA CINTHIA', periodicidad: 'Mensual' };
  const pago = { fecha_pago: '2026-10-03', monto: 1500, metodo: 'Transferencia', periodo_hasta: '2026-11-15' };
  const m = LP.mensajeComprobante(c, pago, '', 'Jonathan Aveda');
  assert.match(m, /^Hola Castañeda Menchaca Cinthia 👋 Recibí tu pago de \$1,500\.00 del 3 de octubre de 2026\. ✅/);
  assert.match(m, /Tu próximo pago es el 15 de noviembre de 2026\./);
  assert.match(m, /— Jonathan Aveda$/);
  // Sin monto ni firma: no quedan huecos raros.
  const s = LP.mensajeComprobante(c, { ...pago, monto: null }, '', '');
  assert.match(s, /Recibí tu pago del 3 de octubre/);
  assert.match(s, /¡Gracias por tu confianza!$/);
  assert.equal(LP.mensajeComprobante(c, pago, 'Pagaste {monto} por {metodo} ({periodicidad})'), 'Pagaste  de $1,500.00 por Transferencia (Mensual)');
  assert.equal(LP.fmtFechaLarga('2026-01-31'), '31 de enero de 2026');
});
