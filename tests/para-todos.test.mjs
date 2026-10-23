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
  L.fijarPaisTelefono('VE');
  const a = L.avisosDeCliente(cs[0], dup, hoy);
  assert.ok(!a.includes('curp_vacia') && !a.includes('nss_vacio'));
  // México: la CURP vacía se avisa siempre (decisión de Jonathan, 16/10).
  L.fijarPaisTelefono('MX');
  assert.ok(L.avisosDeCliente(cs[0], dup, hoy).includes('curp_vacia'));
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
  assert.equal(t('300 123 4567', 'CO'), '573001234567'); // Colombia confirmada (sin confirmar, la app pasa 'MX')
  assert.equal(t('52 55 1234 5678', 'CO'), '525512345678');
  assert.equal(t('+57 300 123 4567', 'MX'), '573001234567');
  assert.equal(t('55 1234 5678', 'OTRO'), null); // «Otro»: no se supone +52
  assert.equal(t('+1 305 555 1234', 'OTRO'), '13055551234');
  assert.equal(t('Asesor', 'VE'), null);
  assert.equal(t('0414 123 4567', 'CO'), '584141234567'); // 0414… es Venezuela aunque el perfil diga otro país
  assert.equal(t('0412-765.43.21'), '584127654321');
  L.fijarPaisTelefono('VE');
  assert.equal(t('04141234567'), '584141234567');
  L.fijarPaisTelefono('MX');
});

test('buscar celular con o sin espacios, guiones o paréntesis', () => {
  const cs = [{ id: '1', nombre: 'Ana', celular: '55 1234 5678' }, { id: '2', nombre: 'Luis', celular: '(0414) 765-43-21' }];
  const n = (q) => L.filtrarClientes(cs, { busqueda: q }, hoy, 7).map((x) => x.c.id).join();
  assert.equal(n('5512345678'), '1');
  assert.equal(n('55-1234-5678'), '1');
  assert.equal(n('55 1234'), '1');
  assert.equal(n('04147654321'), '2');
  assert.equal(n('7654321'), '2');
});

test('avisos antes de registrar un pago', () => {
  const c = { pagos: [{ fecha_pago: '2026-10-01', monto: 450 }] };
  const a = (x) => L.avisosDePago(c, x, hoy);
  assert.equal(a({ fecha_pago: '2026-10-15', monto: '450' }).revisar.length, 0);
  assert.equal(a({ fecha_pago: '2026-10-15', monto: '-450' }).error.length, 1);
  assert.equal(a({ fecha_pago: '2026-10-15', comision: '-10' }).error.length, 1);
  assert.match(a({ fecha_pago: '2026-10-20' }).revisar[0], /futura/);
  assert.match(a({ fecha_pago: '2025-09-01' }).revisar[0], /más de un año/);
  assert.match(a({ fecha_pago: '2026-10-01' }).revisar[0], /Ya hay un pago/);
  assert.match(a({ fecha_pago: '2026-10-15', monto: '45000' }).revisar[0], /ceros/);
  assert.equal(L.avisosDePago({}, { fecha_pago: hoy, monto: '5000000' }, hoy).revisar.length, 1);
});

test('dinero según el país del asesor', () => {
  assert.equal(L.fmtDinero(1500), '$1,500.00');
  L.fijarPaisTelefono('CO');
  assert.equal(L.fmtDinero(24900).replace(/\s/g, ' '), '$ 24.900');
  L.fijarPaisTelefono('MX');
});

test('«Clientes activos»: los dados de baja no se cuentan ni se listan, salvo al buscarlos', () => {
  const cs = [
    { id: '1', nombre: 'Ana', periodicidad: 'Mensual', proximo_pago: '2026-10-20' },
    { id: '2', nombre: 'Luis', baja: true, periodicidad: 'Mensual', proximo_pago: '2026-10-20' },
  ];
  const cnt = L.contarPorEstado(cs, hoy, 7);
  assert.equal(cnt.total - cnt.BAJA, 1);
  const ids = (f) => L.filtrarClientes(cs, { ocultarBajas: true, estado: 'todos', ...f }, hoy, 7).map((x) => x.c.id).join();
  assert.equal(ids({}), '1');
  assert.equal(ids({ busqueda: 'luis' }), '2');
  assert.equal(ids({ estado: 'BAJA' }), '2');
});

test('recomendar a un colega: código fijo de 8 caracteres y se guarda solo si es válido', async () => {
  const P = await import('../plataforma/js/plan.js');
  const a = await P.codigoRecomendacion('uid-de-prueba');
  assert.match(a, /^[a-f0-9]{8}$/);
  assert.equal(a, await P.codigoRecomendacion('uid-de-prueba'));
  assert.notEqual(a, await P.codigoRecomendacion('otro-uid'));
  assert.equal(P.enlaceRecomendacion(a), `https://carteraasesor.com/?ref=${a}`);
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  P.guardarRefDeLaUrl('?ref=<script>');
  assert.equal(mem.get(P.CLAVE_REF), undefined);
  P.guardarRefDeLaUrl(`?x=1&ref=${a}`);
  assert.equal(mem.get(P.CLAVE_REF), a);
});
