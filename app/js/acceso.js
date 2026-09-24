// Pantallas de acceso: "Conectando…", inicio de sesión y avisos de acceso denegado.
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pantalla(html) {
  const el = $('#acceso');
  el.innerHTML = `<div class="acceso-caja">${html}</div>`;
  el.hidden = false;
  document.body.classList.add('bloqueado');
  return el;
}

export function ocultarAcceso() {
  $('#acceso').hidden = true;
  document.body.classList.remove('bloqueado');
}

export function mostrarCargando(texto = 'Conectando…') {
  pantalla(`<h1>Cartera IMSS</h1><p class="acceso-texto">${esc(texto)}</p><div class="girar" aria-hidden="true"></div>`);
}

export function mostrarError(titulo, detalle, botones = []) {
  const el = pantalla(`<h1>Cartera IMSS</h1><h2>${esc(titulo)}</h2><p class="acceso-texto">${esc(detalle)}</p>
    ${botones.map((b, i) => `<button class="btn ${b.primario ? 'primario' : ''}" data-b="${i}" style="width:100%;margin-top:8px">${esc(b.texto)}</button>`).join('')}`);
  el.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => botones[+b.dataset.b].alTocar()));
}

/** Muestra el formulario de inicio de sesión. `entrar(correo, clave)` y `recuperar(correo)` devuelven promesas. */
export function mostrarLogin({ entrar, recuperar, mensajeError }) {
  const el = pantalla(`<h1>Cartera IMSS</h1><p class="acceso-texto">Inicia sesión para ver tus clientes.</p>
    <form id="f-login" novalidate>
      <label>Correo<input name="correo" type="email" autocomplete="username" inputmode="email" autocapitalize="none" required></label>
      <label style="margin-top:12px">Contraseña<input name="clave" type="password" autocomplete="current-password" required></label>
      <div id="login-msg" class="aviso-campo" role="alert" style="min-height:1.4em;margin-top:10px"></div>
      <button class="btn primario" type="submit" style="width:100%;margin-top:6px">Entrar</button>
      <button class="btn" type="button" id="olvide" style="width:100%;margin-top:8px">Olvidé mi contraseña</button>
    </form>`);
  const f = el.querySelector('#f-login'), msg = el.querySelector('#login-msg');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!f.correo.value.trim() || !f.clave.value) { msg.textContent = 'Escribe tu correo y contraseña.'; return; }
    msg.style.color = ''; msg.textContent = 'Entrando…';
    try { await entrar(f.correo.value, f.clave.value); } catch (err) { msg.textContent = mensajeError(err); }
  });
  el.querySelector('#olvide').addEventListener('click', async () => {
    if (!f.correo.value.trim()) { msg.textContent = 'Escribe tu correo arriba y vuelve a tocar este botón.'; return; }
    try {
      await recuperar(f.correo.value);
      msg.style.color = '#166534';
      msg.textContent = 'Si el correo está registrado, te enviamos un enlace para cambiar la contraseña.';
    } catch (err) { msg.style.color = ''; msg.textContent = mensajeError(err); }
  });
}
