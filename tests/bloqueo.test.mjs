// Textos del bloqueo con PIN: esperas que crecen y aviso de intentos antes de cerrar la sesión.
import test from 'node:test';
import assert from 'node:assert/strict';
import { textoEspera, textoQuedan, FALLOS_PARA_CERRAR } from '../plataforma/js/bloqueo.js';

test('textoEspera: segundos, minutos y minutos con segundos', () => {
  assert.equal(textoEspera(30000), '30 segundos');
  assert.equal(textoEspera(1000), '1 segundo');
  assert.equal(textoEspera(100), '1 segundo');
  assert.equal(textoEspera(60000), '1 minuto');
  assert.equal(textoEspera(300000), '5 minutos');
  assert.equal(textoEspera(252000), '4 min 12 s');
  assert.equal(textoEspera(900000), '15 minutos');
});

test('textoQuedan: avisa solo cuando ya faltan pocos intentos para cerrar la sesión', () => {
  assert.equal(FALLOS_PARA_CERRAR, 25);
  assert.equal(textoQuedan(0), '');
  assert.equal(textoQuedan(14), '');
  assert.equal(textoQuedan(15), 'Te quedan 10 intentos antes de cerrar la sesión.');
  assert.equal(textoQuedan(20), 'Te quedan 5 intentos antes de cerrar la sesión.');
  assert.equal(textoQuedan(24), 'Te queda 1 intento antes de cerrar la sesión.');
  assert.equal(textoQuedan(25), '');
});
