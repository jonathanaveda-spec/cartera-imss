// Pantallas de acceso: cargando, iniciar sesión, crear cuenta, verificar correo y errores.
import { MARCA } from './marca.js';
import { PAISES } from './plan.js';

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const titulo = () => `<img src="icons/logo.png" alt="${esc(MARCA.nombre)}" class="logo-acceso" width="120" height="120">`;

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
  pantalla(`${titulo()}<p class="acceso-texto">${esc(texto)}</p><div class="girar" aria-hidden="true"></div>`);
}

export function mostrarError(tit, detalle, botones = []) {
  const el = pantalla(`${titulo()}<h2>${esc(tit)}</h2><p class="acceso-texto">${esc(detalle)}</p>
    ${botones.map((b, i) => `<button class="btn ${b.primario ? 'primario' : ''}" data-b="${i}" style="width:100%;margin-top:8px">${esc(b.texto)}</button>`).join('')}`);
  el.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => botones[+b.dataset.b].alTocar()));
}

const msgEn = (el) => {
  const m = el.querySelector('.msg');
  return (texto, ok = false) => { m.style.color = ok ? '#166534' : ''; m.textContent = texto; };
};

/** acc = { entrar, recuperar, registrar, mensajeError } */
export function mostrarLogin(acc) {
  const el = pantalla(`${titulo()}<p class="acceso-texto">${esc(MARCA.lema)}</p>
    <form id="f-login" novalidate>
      <label>Correo<input name="correo" type="email" autocomplete="username" inputmode="email" autocapitalize="none" required></label>
      <label style="margin-top:12px">Contraseña<input name="clave" type="password" autocomplete="current-password" required></label>
      <div class="msg aviso-campo" role="alert" style="min-height:1.4em;margin-top:10px"></div>
      <button class="btn primario" type="submit" style="width:100%;margin-top:6px">Entrar</button>
      <button class="btn" type="button" id="olvide" style="width:100%;margin-top:8px">Olvidé mi contraseña</button>
    </form>
    <p class="acceso-texto" style="margin:18px 0 8px">¿Eres asesor y aún no tienes cuenta?</p>
    <button class="btn" type="button" id="ir-registro" style="width:100%">Crear cuenta gratis</button>`);
  const f = el.querySelector('#f-login'), msg = msgEn(el);
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!f.correo.value.trim() || !f.clave.value) return msg('Escribe tu correo y contraseña.');
    msg('Entrando…', true);
    try { await acc.entrar(f.correo.value, f.clave.value); } catch (err) { msg(acc.mensajeError(err)); }
  });
  el.querySelector('#olvide').addEventListener('click', async () => {
    if (!f.correo.value.trim()) return msg('Escribe tu correo arriba y vuelve a tocar este botón.');
    try { await acc.recuperar(f.correo.value); msg('Si el correo está registrado, te enviamos un enlace para cambiar la contraseña.', true); }
    catch (err) { msg(acc.mensajeError(err)); }
  });
  el.querySelector('#ir-registro').addEventListener('click', () => mostrarRegistro(acc));
}

export function mostrarRegistro(acc) {
  const el = pantalla(`${titulo()}<p class="acceso-texto">Crea tu cuenta de asesor.</p>
    <form id="f-reg" novalidate>
      <label>Nombre completo<input name="nombre" autocomplete="name" maxlength="100" required></label>
      <label style="margin-top:12px">País donde vives
        <select name="pais">${Object.entries(PAISES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
      <label style="margin-top:12px">Celular (WhatsApp)<input name="telefono" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="Con código de país, ej. +57 300…" required></label>
      <label style="margin-top:12px">Correo<input name="correo" type="email" autocomplete="username" inputmode="email" autocapitalize="none" required></label>
      <label style="margin-top:12px">Contraseña<input name="clave" type="password" autocomplete="new-password" minlength="8" required>
        <div class="ayuda">Mínimo 8 caracteres.</div></label>
      <label class="radio-tarjeta" style="margin-top:12px"><input type="checkbox" name="acepto">
        <span class="mini">Acepto los <a href="terminos.html" target="_blank" rel="noopener">términos de uso</a> y el <a href="privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a>.</span></label>
      <div class="msg aviso-campo" role="alert" style="min-height:1.4em;margin-top:6px"></div>
      <button class="btn primario" type="submit" style="width:100%;margin-top:6px">Crear cuenta</button>
      <button class="btn" type="button" id="ir-login" style="width:100%;margin-top:8px">Ya tengo cuenta</button>
    </form>`);
  const f = el.querySelector('#f-reg'), msg = msgEn(el);
  el.querySelector('#ir-login').addEventListener('click', () => mostrarLogin(acc));
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f).entries());
    if (!d.nombre.trim()) return msg('Escribe tu nombre.');
    if (d.telefono.replace(/\D/g, '').length < 10) return msg('Escribe tu celular completo, con código de país.');
    if (!d.correo.trim()) return msg('Escribe tu correo.');
    if ((d.clave || '').length < 8) return msg('La contraseña debe tener al menos 8 caracteres.');
    if (!f.acepto.checked) return msg('Debes aceptar los términos y el aviso de privacidad.');
    msg('Creando tu cuenta…', true);
    try { await acc.registrar(d); } catch (err) { msg(acc.mensajeError(err)); }
  });
}

/** acc = { correo, reenviar, comprobar, salir, mensajeError } */
export function mostrarVerificacion(acc) {
  const el = pantalla(`${titulo()}<h2>Confirma tu correo</h2>
    <p class="acceso-texto">Te enviamos un enlace a <b>${esc(acc.correo)}</b>. Ábrelo para activar tu cuenta y luego toca el botón de abajo.
    Si no lo ves, revisa la carpeta de spam.</p>
    <div class="msg aviso-campo" role="alert" style="min-height:1.4em"></div>
    <button class="btn primario" id="ya" style="width:100%;margin-top:6px">Ya confirmé mi correo</button>
    <button class="btn" id="reenviar" style="width:100%;margin-top:8px">Reenviar correo</button>
    <button class="btn" id="salir" style="width:100%;margin-top:8px">Usar otra cuenta</button>`);
  const msg = msgEn(el);
  el.querySelector('#ya').addEventListener('click', async () => {
    msg('Comprobando…', true);
    try { if (!(await acc.comprobar())) msg('Todavía no aparece confirmado. Abre el enlace del correo e inténtalo de nuevo.'); }
    catch (err) { msg(acc.mensajeError(err)); }
  });
  el.querySelector('#reenviar').addEventListener('click', async () => {
    try { await acc.reenviar(); msg('Correo reenviado.', true); } catch (err) { msg(acc.mensajeError(err)); }
  });
  el.querySelector('#salir').addEventListener('click', acc.salir);
}
