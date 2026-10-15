import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../plataforma/js/logic.js';

const hoy = '2026-10-15';

test('CURP y NSS opcionales: sin avisos de vacío si la cartera no los usa', () => {
  const cs = [
    { id: '1', nombre: 'Ana', celular: '0414 123 4567', fecha_inicio: '2026-01-05' },
    { id: '2', nombre: 'Luis', celular: '0412 765 4321', fecha_inicio: '2026-02-05' },
  ];
  const dup = L.indexarDuplicados(cs);
  assert.equal(dup.usaCurp, false);
  const a = L.avisosDeCliente(cs[0], dup, hoy);
  assert.ok(!a.includes('curp_vacia') && !a.includes('nss_vacio'));
});

test('cartera IMSS: sigue avisando la CURP y el NSS vacíos', () => {
  const cs = [
    { id: '1', curp: 'AAAA000000HDFRRR01', nss: '12345678901' },
    { id: '3', curp: 'BBBB000000HDFRRR02', nss: '22345678901' },
    { id: '2', curp: '', nss: '' },
  ];
  const a = L.avisosDeCliente(cs[2], L.indexarDuplicados(cs), hoy);
  assert.ok(a.includes('curp_vacia') && a.includes('nss_vacio'));
});

test('celular según el país del asesor', () => {
  const t = L.telefonoInternacional;
  assert.equal(t('55 1234 5678'), '525512345678');
  assert.equal(t('0414-123.45.67', 'VE'), '584141234567');
  assert.equal(t('414 1234567', 'VE'), '584141234567');
  assert.equal(t('55 1234 5678', 'CO'), '525512345678'); // CO por defecto del registro: se sigue tratando como México
  assert.equal(t('+57 300 123 4567', 'MX'), '573001234567');
  assert.equal(t('Asesor', 'VE'), null);
  assert.equal(t('0414 123 4567', 'CO'), '584141234567'); // 0414… es Venezuela aunque el perfil diga otro país
  assert.equal(t('0412-765.43.21'), '584127654321');
  L.fijarPaisTelefono('VE');
  assert.equal(t('04141234567'), '584141234567');
  L.fijarPaisTelefono('MX');
});
