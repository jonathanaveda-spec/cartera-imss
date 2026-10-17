// Restaurar un respaldo: uno normal vuelve igual; uno editado a mano no puede meter datos con forma extraña (revisión de Fernanda).
import test from 'node:test';
import assert from 'node:assert/strict';
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const S = await import('../plataforma/js/store.js');
await S.iniciar();

test('un respaldo normal se restaura sin perder nada', async () => {
  await S.agregarCampoPersonalizado('Zona', 'texto');
  const c = await S.agregarCliente({ nombre: 'Ana Prueba', curp: 'AAAA000000HDFRRR01', periodicidad: 'Mensual', proximo_pago: '2026-09-05', comision: 120, extra: { x_zona: 'Norte' } });
  await S.registrarPago(c.id, { fecha_pago: '2026-09-05', monto: 450 });
  await S.anotarRecordatorio(c.id);
  const b = await S.agregarCliente({ nombre: 'Luis Prueba' });
  await S.eliminarCliente(b.id);
  const antes = JSON.parse(S.exportarJSON()).datos;
  await S.restaurarJSON(S.exportarJSON());
  const despues = JSON.parse(S.exportarJSON()).datos;
  assert.deepEqual(despues.clientes, antes.clientes);
  assert.deepEqual(despues.papelera, antes.papelera);
  assert.deepEqual(despues.config.camposPersonalizados, antes.config.camposPersonalizados);
  assert.equal(despues.historial.length, antes.historial.length + 1); // + «Respaldo restaurado»
});

test('un respaldo editado a mano queda limpio', async () => {
  const malo = '"><img src=x onerror=alert(1)>';
  const datos = {
    config: { diasAviso: malo, camposPersonalizados: [{ clave: malo, etiqueta: 'X' }, { clave: 'x_ok', etiqueta: 'Ok', tipo: malo }] },
    clientes: [{
      id: malo, nombre: 'Eva', dia_pago: malo, pagos: [{ id: malo, fecha_pago: 'mañana', monto: '45' }], etiquetas: 'no',
      extra: { [malo]: 'a', x_ok: { raro: 1 }, x_bien: 'sí' }, origen: { archivo: 'a.xlsx', fila: malo }, raro: { a: 1 },
    }, 'no soy cliente'],
    papelera: [{ id: malo, cliente: { id: 'abc', nombre: 'Borrada' } }],
  };
  await S.restaurarJSON(JSON.stringify({ app: 'cartera-imss', datos }));
  const c = S.db.clientes[0];
  assert.equal(S.db.clientes.length, 1);
  assert.match(c.id, /^[\w-]{1,64}$/);
  assert.equal(c.dia_pago, null);
  assert.equal(c.pagos[0].fecha_pago, null);
  assert.equal(c.pagos[0].monto, 45);
  assert.match(c.pagos[0].id, /^[\w-]{1,64}$/);
  assert.deepEqual(c.etiquetas, []);
  assert.deepEqual(c.extra, { x_bien: 'sí' });
  assert.equal(c.origen.fila, null);
  assert.equal('raro' in c, false);
  assert.equal(S.db.config.diasAviso, 7);
  assert.deepEqual(S.db.config.camposPersonalizados.map((x) => [x.clave, x.tipo]), [['x_ok', 'texto']]);
  assert.match(S.db.papelera[0].id, /^[\w-]{1,64}$/);
});

test('lo que no es un respaldo se rechaza sin tocar los datos', async () => {
  const n = S.db.clientes.length;
  await assert.rejects(S.restaurarJSON('{"app":"cartera-imss","datos":[]}'));
  await assert.rejects(S.restaurarJSON('hola'));
  assert.equal(S.db.clientes.length, n);
});
