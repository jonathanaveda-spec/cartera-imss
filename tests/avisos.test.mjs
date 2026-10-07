// Aviso diario: el resumen («Hoy pagan 3 · 2 morosos») y a quién le toca según su hora y zona.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../plataforma/js/logic.js';
import { ahoraEn, leToca } from '../tools/avisos-horario.mjs';

const cli = (proximo_pago, extra = {}) => ({ nombre: 'X', periodicidad: 'Mensual', proximo_pago, baja: false, pagos: [], ...extra });

test('resumen del aviso: pagan hoy, morosos y por vencer; vacío si no hay nada', () => {
  const hoy = '2026-10-07';
  const r = L.resumenAviso([cli('2026-10-07'), cli('2026-10-07'), cli('2026-10-01'), cli('2026-10-10'), cli('2026-12-01'), cli('2026-10-07', { baja: true })], hoy, 7);
  assert.equal(r.paganHoy, 2);
  assert.equal(r.morosos, 1);
  assert.equal(r.porVencer, 1);
  assert.equal(r.texto, '2 clientes pagan hoy · 1 moroso · 1 por vencer');
  assert.equal(L.resumenAviso([cli('2026-12-01')], hoy, 7).texto, '');
  assert.equal(L.resumenAviso([cli('2026-10-07')], hoy, 7).texto, '1 cliente paga hoy');
});

test('hora local del asesor y ventana de envío', () => {
  // 13:30 UTC = 7:30 en Ciudad de México y 8:30 en Bogotá.
  const t = new Date('2026-10-07T13:30:00Z');
  assert.deepEqual(ahoraEn('America/Mexico_City', t), { fecha: '2026-10-07', hora: 7 });
  assert.deepEqual(ahoraEn('America/Bogota', t), { fecha: '2026-10-07', hora: 8 });
  assert.deepEqual(ahoraEn('Zona/Inventada', t), { fecha: '2026-10-07', hora: 7 }); // cae en México
  const a = { activo: true, hora: 8 };
  assert.equal(leToca(a, '2026-10-07', 7), false);  // todavía no
  assert.equal(leToca(a, '2026-10-07', 8), true);
  assert.equal(leToca(a, '2026-10-07', 10), true);  // GitHub se atrasó: aún sirve
  assert.equal(leToca(a, '2026-10-07', 11), false); // ya pasó la mañana
  assert.equal(leToca({ ...a, ultimoEnvio: '2026-10-07' }, '2026-10-07', 8), false); // una vez al día
  assert.equal(leToca({ ...a, activo: false }, '2026-10-07', 8), false);
});
