import * as S from './store.js';
import * as N from './nube.js';
import * as A from './acceso.js';
import { render, enlazarEventos, refrescarTodo } from './ui.js';

function registrarSW() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* la app funciona igual, solo sin modo sin conexión */ });
  }
}

// ---------- Modo local (sin nube configurada) ----------
function arrancarLocal() {
  render();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
}

// ---------- Modo nube ----------
async function arrancarNube() {
  A.mostrarCargando();
  await N.preparar();
  let iniciada = false;

  N.alCambiarUsuario(async (usuario) => {
    if (!usuario) {
      iniciada = false;
      A.mostrarLogin({ entrar: N.entrar, recuperar: N.recuperar, mensajeError: N.mensajeError });
      return;
    }
    if (iniciada) return;
    iniciada = true;
    A.mostrarCargando('Cargando tus clientes…');
    try {
      const r = await N.iniciarSincronizacion({
        preguntarSubida: (n) => new Promise((res) => A.mostrarError(
          'Subir datos a la nube',
          `Este dispositivo tiene ${n} clientes y la nube está vacía. ¿Subirlos a la nube para compartirlos entre dispositivos?`,
          [{ texto: 'Sí, subirlos', primario: true, alTocar: () => res(true) }, { texto: 'No, cerrar sesión', alTocar: () => res(false) }],
        )),
        alRemoto: refrescarTodo,
        alCambiarEstado: render,
      });
      if (r === 'cancelado') { await N.salir(); location.reload(); return; }
      A.ocultarAcceso();
      render();
    } catch (e) {
      console.error(e);
      iniciada = false;
      const denegado = e && e.code === 'permission-denied';
      A.mostrarError(
        denegado ? 'Sin permiso' : 'No se pudo cargar',
        denegado ? 'Esta cuenta no tiene permiso para ver los datos. Inicia sesión con la cuenta correcta.' : N.mensajeError(e),
        [{ texto: denegado ? 'Cerrar sesión' : 'Reintentar', primario: true, alTocar: async () => { if (denegado) { await N.salir(); } location.reload(); } }],
      );
    }
  });

  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && iniciada) render(); });
}

async function arrancar() {
  await S.iniciar();
  enlazarEventos();
  window.__cartera_ok = true; // señal para el botón de reparación de index.html
  registrarSW();
  if (N.nubeActiva) await arrancarNube();
  else arrancarLocal();
}

arrancar().catch((e) => {
  console.error(e);
  document.getElementById('lista').innerHTML = `<div class="vacio"><h2>No se pudo iniciar</h2><p>${String(e && e.message || e)}</p></div>`;
});
