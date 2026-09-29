import * as S from './store.js';
import * as N from './nube.js';
import * as A from './acceso.js';
import * as I from './instalar.js';
import './pantalla.js';
import { render, enlazarEventos, refrescarTodo, alCambiarSoporte } from './ui.js';

function registrarSW() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* funciona igual, solo sin modo sin conexión */ });
  }
}

const accionesAcceso = {
  entrar: N.entrar,
  recuperar: N.recuperar,
  registrar: N.registrar,
  mensajeError: N.mensajeError,
};

async function arrancar() {
  await S.iniciar();
  enlazarEventos();
  window.__cartera_ok = true; // señal para el botón de reparación de index.html
  registrarSW();

  if (!N.nubeActiva) {
    A.mostrarError('En preparación', 'La plataforma todavía no está conectada a su servidor. Vuelve pronto.');
    return;
  }

  A.mostrarCargando();
  await N.preparar();
  N.escucharSoporte(alCambiarSoporte);
  let iniciada = false;

  N.alCambiarUsuario(async (usuario) => {
    if (!usuario) {
      iniciada = false;
      A.mostrarLogin(accionesAcceso);
      return;
    }
    if (iniciada) return;

    if (!usuario.emailVerified) {
      A.mostrarVerificacion({
        correo: usuario.email,
        reenviar: N.reenviarVerificacion,
        comprobar: async () => { const ok = await N.correoVerificado(); if (ok) entrarALaApp(); return ok; },
        salir: async () => { await N.salir(); location.reload(); },
        mensajeError: N.mensajeError,
      });
      return;
    }
    entrarALaApp();
  });

  async function entrarALaApp() {
    if (iniciada) return;
    iniciada = true;
    A.mostrarCargando('Cargando tus clientes…');
    try {
      const u = N.usuarioActual();
      await S.asegurarDueno(u.uid);
      await N.cargarCuenta();
      const r = await N.iniciarSincronizacion({
        preguntarSubida: (n) => new Promise((res) => A.mostrarError(
          'Subir datos a la nube',
          `Este dispositivo tiene ${n} clientes que aún no están en tu cuenta. ¿Subirlos?`,
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
      A.mostrarError('No se pudo cargar', N.mensajeError(e), [
        { texto: 'Reintentar', primario: true, alTocar: () => location.reload() },
        { texto: 'Cerrar sesión', alTocar: async () => { await N.salir(); location.reload(); } },
      ]);
    }
  }

  I.alCambiar(() => { if (iniciada) render(); });
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && iniciada) { N.recalcularPlan(); render(); } });
}

arrancar().catch((e) => {
  console.error(e);
  document.getElementById('lista').innerHTML = `<div class="vacio"><h2>No se pudo iniciar</h2><p>${String(e && e.message || e)}</p></div>`;
});
