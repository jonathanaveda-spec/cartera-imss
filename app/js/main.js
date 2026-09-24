import * as S from './store.js';
import { render, enlazarEventos } from './ui.js';

async function arrancar() {
  await S.iniciar();
  enlazarEventos();
  render();

  // La fecha de "hoy" cambia con los días: se vuelve a calcular al volver a abrir la app.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* la app funciona igual, solo sin modo sin conexión */ });
  }
}

arrancar().catch((e) => {
  console.error(e);
  document.getElementById('lista').innerHTML = `<div class="vacio"><h2>No se pudo iniciar</h2><p>${String(e && e.message || e)}</p></div>`;
});
