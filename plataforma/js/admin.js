// Panel de administración (solo cuentas cuyo UID está en la lista de administradores de firestore.rules).
import { firebaseConfig } from './nube-config.js';
import { PAISES, TIPOS_TICKET, LIMITE_GRATIS_DEFECTO, planEfectivo } from './plan.js';
import { calcularEstado, hoyISO, fmtFecha, fmtFechaHora } from './logic.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ms = (t) => (t?.toMillis ? t.toMillis() : typeof t === 'number' ? t : null);
const fechaDe = (t) => (ms(t) ? fmtFecha(hoyISO(new Date(ms(t)))) : '—');
const DIA = 86400000;

let F, auth, fs;
const datos = { usuarios: [], planes: new Map(), tickets: [], sistema: {}, conteos: new Map() };
let tab = 'resumen';
let mensajeLogin = ''; // se muestra la próxima vez que aparezca el formulario de acceso

// ---------- Utilidades de interfaz ----------
function aviso(msg, mal = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (mal ? ' mal' : '');
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), mal ? 6000 : 3000);
}

function ventana(titulo, cuerpo, pie = '') {
  const f = document.createElement('div');
  f.className = 'fondo-modal';
  f.innerHTML = `<div class="modal ancho" role="dialog" aria-modal="true"><div class="modal-cab"><h2>${esc(titulo)}</h2>
    <button class="btn cerrar" data-cerrar aria-label="Cerrar">✕</button></div><div class="modal-cuerpo">${cuerpo}</div>
    ${pie ? `<div class="modal-pie">${pie}</div>` : ''}</div>`;
  const cerrar = () => { f.remove(); document.body.classList.remove('bloqueado'); };
  f.addEventListener('click', (e) => { if (e.target === f || e.target.closest('[data-cerrar]')) cerrar(); });
  $('#modales').appendChild(f);
  document.body.classList.add('bloqueado');
  return { el: f, q: (s) => $(s, f), cerrar };
}

async function seguro(fn) {
  try { return await fn(); } catch (e) { console.error(e); aviso(e.code === 'permission-denied' ? 'Sin permiso' : (e.message || String(e)), true); }
}

async function registrar(accion, detalle) {
  await F.addDoc(F.collection(fs, 'admin_log'), { accion, detalle, admin: auth.currentUser.email, ts: F.serverTimestamp() });
}

// ---------- Acceso ----------
function mostrarLogin(msg = '') {
  const el = $('#acceso');
  el.hidden = false;
  el.innerHTML = `<div class="acceso-caja"><h1>Administración</h1>
    <form id="f"><label>Correo<input name="c" type="email" autocomplete="username" required></label>
    <label style="margin-top:12px">Contraseña<input name="p" type="password" autocomplete="current-password" required></label>
    <div class="aviso-campo" id="m" style="min-height:1.4em;margin-top:10px">${esc(msg)}</div>
    <button class="btn primario" style="width:100%">Entrar</button></form></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#m').textContent = 'Entrando…';
    try { await F.signInWithEmailAndPassword(auth, e.target.c.value.trim(), e.target.p.value); }
    catch { $('#m').textContent = 'Correo o contraseña incorrectos.'; }
  });
}

// ---------- Carga de datos ----------
async function cargar() {
  const [us, pl, tk, si] = await Promise.all([
    F.getDocs(F.collection(fs, 'usuarios')),
    F.getDocs(F.collection(fs, 'planes')),
    F.getDocs(F.collection(fs, 'tickets')),
    F.getDoc(F.doc(fs, 'sistema', 'config')),
  ]);
  datos.usuarios = us.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => (ms(b.creado) || 0) - (ms(a.creado) || 0));
  datos.planes = new Map(pl.docs.map((d) => [d.id, d.data()]));
  datos.tickets = tk.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (ms(b.creado) || 0) - (ms(a.creado) || 0));
  datos.sistema = si.exists() ? si.data() : {};
}

async function contarClientes(uid) {
  if (datos.conteos.has(uid)) return datos.conteos.get(uid);
  const n = (await F.getCountFromServer(F.collection(fs, 'usuarios', uid, 'clientes'))).data().count;
  datos.conteos.set(uid, n);
  return n;
}

const planDe = (uid) => planEfectivo({ plan: datos.planes.get(uid), sistema: datos.sistema });

// ---------- Vistas ----------
function pintar() {
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  ({ resumen, asesores, tickets, sistema })[tab]();
}

function resumen() {
  const ahora = Date.now();
  const nuevos7 = datos.usuarios.filter((u) => ms(u.creado) > ahora - 7 * DIA).length;
  const pro = datos.usuarios.filter((u) => planDe(u.uid).tipo === 'pro').length;
  const abiertos = datos.tickets.filter((t) => t.estado !== 'cerrado');
  const pagos = abiertos.filter((t) => t.tipo === 'pago').length;
  const porPais = Object.entries(datos.usuarios.reduce((m, u) => { m[u.pais || '—'] = (m[u.pais || '—'] || 0) + 1; return m; }, {}));
  $('#vista').innerHTML = `<div class="kpis">
      <div class="kpi"><div class="num">${datos.usuarios.length}</div><div class="rot">Asesores registrados</div></div>
      <div class="kpi"><div class="num">${nuevos7}</div><div class="rot">Nuevos en 7 días</div></div>
      <div class="kpi"><div class="num">${pro}</div><div class="rot">Con Plan Pro vigente</div></div>
      <div class="kpi"><div class="num">${abiertos.length - pagos}</div><div class="rot">Tickets abiertos</div></div>
      <div class="kpi"><div class="num">${pagos}</div><div class="rot">Comprobantes por revisar</div></div>
    </div>
    <div class="seccion"><h3>Asesores por país</h3>${porPais.map(([p, n]) => `${esc(PAISES[p] || p)}: <b>${n}</b>`).join(' · ') || 'Sin datos'}</div>
    <div class="seccion"><h3>Modo actual</h3>${datos.sistema.betaAbierta ? 'Beta abierta: todos sin límite.' : `Planes activos. Plan gratis hasta ${datos.sistema.limiteGratis ?? LIMITE_GRATIS_DEFECTO} clientes.`}</div>`;
}

function asesores() {
  $('#vista').innerHTML = `<input id="buscar" type="search" placeholder="Buscar por nombre, correo o celular" style="margin-bottom:10px">
    <table class="tabla-admin"><thead><tr><th>Asesor</th><th>País · celular</th><th>Registro</th><th>Plan</th><th>Clientes</th><th></th></tr></thead>
    <tbody id="filas"></tbody></table>`;
  const filas = (q) => datos.usuarios.filter((u) => !q || `${u.nombre} ${u.correo} ${u.telefono}`.toLowerCase().includes(q)).map((u) => {
    const p = planDe(u.uid);
    return `<tr><td><b>${esc(u.nombre) || '(sin nombre)'}</b><div class="sub">${esc(u.correo)}</div></td>
      <td>${esc(PAISES[u.pais] || u.pais || '—')}<div class="sub">${esc(u.telefono)}</div></td>
      <td>${fechaDe(u.creado)}</td>
      <td>${esc(p.nombre)}${p.vence ? `<div class="sub">vence ${fechaDe(p.vence)}</div>` : ''}${p.vencido ? '<div class="sub" style="color:#b91c1c">Pro vencido</div>' : ''}</td>
      <td data-conteo="${u.uid}">…</td>
      <td><div class="acciones"><button class="btn chico" data-plan="${u.uid}">Plan</button><button class="btn chico" data-cartera="${u.uid}">Cartera</button></div></td></tr>`;
  }).join('') || '<tr><td colspan="6">Sin asesores.</td></tr>';
  const render = () => {
    $('#filas').innerHTML = filas($('#buscar').value.trim().toLowerCase());
    document.querySelectorAll('[data-conteo]').forEach(async (td) => {
      try { td.textContent = await contarClientes(td.dataset.conteo); } catch { td.textContent = '?'; }
    });
  };
  $('#buscar').addEventListener('input', render);
  render();
}

function editarPlan(uid) {
  const u = datos.usuarios.find((x) => x.uid === uid) || { correo: uid, nombre: '(cuenta eliminada)' };
  const actual = datos.planes.get(uid) || {};
  const venceISO = actual.vence ? hoyISO(new Date(ms(actual.vence))) : '';
  const v = ventana(`Plan · ${u.nombre || u.correo}`, `<form id="fp" class="rejilla dos">
      <label>Tipo<select name="tipo"><option value="gratis">Gratis</option><option value="pro" ${actual.tipo === 'pro' ? 'selected' : ''}>Pro</option></select></label>
      <label>Vence<input type="date" name="vence" value="${venceISO}"><div class="ayuda">Vacío = sin vencimiento.</div></label>
      <div class="completo acc-fila"><button type="button" class="btn chico" data-mas="30">+1 mes</button><button type="button" class="btn chico" data-mas="365">+1 año</button></div>
      <label class="completo">Nota (medio y referencia del pago)<input name="nota" value="${esc(actual.nota || '')}"></label></form>`,
  '<button class="btn" data-cerrar>Cancelar</button><button class="btn primario" type="submit" form="fp">Guardar</button>');
  const f = v.q('#fp');
  v.el.querySelectorAll('[data-mas]').forEach((b) => b.addEventListener('click', () => {
    const baseMs = Math.max(Date.now(), ms(actual.vence) || 0);
    f.tipo.value = 'pro';
    f.vence.value = hoyISO(new Date(baseMs + Number(b.dataset.mas) * DIA));
  }));
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    seguro(async () => {
      const vence = f.vence.value ? new Date(f.vence.value + 'T23:59:59').getTime() : null;
      const plan = { tipo: f.tipo.value, vence, nota: f.nota.value.trim(), actualizado: F.serverTimestamp(), por: auth.currentUser.email };
      await F.setDoc(F.doc(fs, 'planes', uid), plan);
      await registrar('plan', `${u.correo}: ${plan.tipo}${vence ? ' hasta ' + f.vence.value : ''} ${plan.nota}`);
      datos.planes.set(uid, { ...plan, actualizado: Date.now() });
      v.cerrar(); aviso('Plan guardado'); pintar();
    });
  });
}

async function verCartera(uid) {
  const u = datos.usuarios.find((x) => x.uid === uid);
  await seguro(async () => {
    await registrar('ver_cartera', u.correo);
    const s = await F.getDocs(F.collection(fs, 'usuarios', uid, 'clientes'));
    const hoy = hoyISO();
    const cs = s.docs.map((d) => d.data()).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
    ventana(`Cartera · ${u.nombre || u.correo} (${cs.length})`,
      `<p class="mini" style="margin-bottom:10px">Solo lectura. Este acceso quedó registrado.</p>
      <table class="tabla-admin"><thead><tr><th>Cliente</th><th>Estado</th><th>Próximo pago</th><th>Pagos</th></tr></thead><tbody>
      ${cs.map((c) => { const e = calcularEstado(c, hoy, 7); return `<tr><td>${esc(c.nombre)}<div class="sub">${esc(c.proveedor)} · ${esc(c.opcion)}</div></td>
        <td><span class="insignia ${e.clase}">${e.icono} ${e.etiqueta}</span></td><td>${fmtFecha(c.proximo_pago)}</td><td>${(c.pagos || []).length}</td></tr>`; }).join('')}
      </tbody></table>`);
  });
}

function tickets() {
  let filtro = 'abiertos';
  const pintarLista = () => {
    const ts = datos.tickets.filter((t) => filtro === 'todos' || (filtro === 'pagos' ? t.tipo === 'pago' && t.estado !== 'cerrado' : t.estado !== 'cerrado'));
    $('#lista-t').innerHTML = ts.map((t) => `<div class="seccion">
        <div class="destacado"><div><span class="etq ${t.estado === 'cerrado' ? 'gris' : 'ambar'}">${t.estado === 'cerrado' ? 'Cerrado' : 'Abierto'}</span>
          <b>${esc(TIPOS_TICKET[t.tipo] || (t.tipo === 'pago' ? 'Comprobante de pago' : t.tipo))}</b>
          <div class="mini">${esc(t.nombre)} · ${esc(t.correo)} · ${ms(t.creado) ? fmtFechaHora(ms(t.creado)) : ''}</div></div>
          ${t.tipo === 'pago' ? `<button class="btn chico primario" data-activar="${esc(t.uid)}">Activar plan</button>` : ''}</div>
        <p style="white-space:pre-wrap;margin-top:8px">${esc(t.mensaje)}</p>
        <details><summary class="mini">Datos técnicos</summary><pre class="ctx">${esc(JSON.stringify(t.contexto || {}, null, 1))}</pre></details>
        ${t.respuesta ? `<div class="banner info" style="margin-top:8px"><p><b>Respuesta:</b> ${esc(t.respuesta)}</p></div>` : ''}
        ${t.estado !== 'cerrado' ? `<form data-resp="${t.id}" style="margin-top:8px"><textarea name="r" placeholder="Respuesta para el asesor (opcional)"></textarea>
          <button class="btn chico primario" style="margin-top:6px">Responder y cerrar</button></form>` : ''}</div>`).join('') || '<div class="vacio"><h2>Nada pendiente</h2></div>';
  };
  $('#vista').innerHTML = `<div id="tk"><div class="acc-fila" style="margin-bottom:10px">
      <button class="btn chico" data-f="abiertos">Abiertos</button><button class="btn chico" data-f="pagos">Comprobantes</button><button class="btn chico" data-f="todos">Todos</button></div>
    <div id="lista-t"></div></div>`;
  $('#tk').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (b) { filtro = b.dataset.f; pintarLista(); }
    const a = e.target.closest('[data-activar]');
    if (a) editarPlan(a.dataset.activar);
  });
  $('#tk').addEventListener('submit', (e) => {
    const f = e.target.closest('[data-resp]');
    if (!f) return;
    e.preventDefault();
    seguro(async () => {
      const id = f.dataset.resp, respuesta = f.r.value.trim();
      await F.updateDoc(F.doc(fs, 'tickets', id), { estado: 'cerrado', respuesta, cerrado: F.serverTimestamp() });
      const t = datos.tickets.find((x) => x.id === id);
      Object.assign(t, { estado: 'cerrado', respuesta });
      await registrar('ticket', `${t.correo}: cerrado`);
      aviso('Ticket cerrado'); pintarLista();
    });
  });
  pintarLista();
}

function sistema() {
  const s = datos.sistema;
  $('#vista').innerHTML = `<form id="fs" class="seccion">
      <label class="radio-tarjeta"><input type="checkbox" name="beta" ${s.betaAbierta ? 'checked' : ''}><span><b>Beta abierta</b><br>
        <span class="mini">Todos los asesores usan la app sin límite y sin costo.</span></span></label>
      <label style="margin-top:12px">Clientes permitidos en el plan gratis<input type="number" name="limite" min="1" max="1000" value="${s.limiteGratis ?? LIMITE_GRATIS_DEFECTO}"></label>
      <label style="margin-top:12px">Medios de pago (lo ven los asesores en «Mi plan»)
        <textarea name="pago" rows="6" placeholder="Ej.&#10;Plan Pro: 5 USD al mes o 50 USD al año&#10;Colombia: Nequi 300… / llave Bre-B …&#10;Venezuela: Binance Pay ID …&#10;México: transferencia …">${esc(s.datosPago || '')}</textarea></label>
      <button class="btn primario" style="margin-top:12px">Guardar</button></form>`;
  $('#fs').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    seguro(async () => {
      const nuevo = { betaAbierta: f.beta.checked, limiteGratis: Math.max(1, parseInt(f.limite.value, 10) || LIMITE_GRATIS_DEFECTO), datosPago: f.pago.value.trim() };
      await F.setDoc(F.doc(fs, 'sistema', 'config'), nuevo);
      await registrar('sistema', JSON.stringify({ betaAbierta: nuevo.betaAbierta, limiteGratis: nuevo.limiteGratis }));
      datos.sistema = nuevo;
      aviso('Guardado');
    });
  });
}

// ---------- Arranque ----------
async function arrancar() {
  if (!firebaseConfig) {
    $('#vista').innerHTML = '<div class="vacio"><h2>Falta configurar Firebase</h2><p>Pega el bloque firebaseConfig en js/nube-config.js.</p></div>';
    return;
  }
  F = await import('../vendor/firebase.js');
  const app = F.initializeApp(firebaseConfig);
  auth = F.getAuth(app);
  fs = F.getFirestore(app);
  $('#salir').addEventListener('click', () => F.signOut(auth));
  $('#pestanas').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; pintar(); } });
  $('#vista').addEventListener('click', (e) => {
    const p = e.target.closest('[data-plan]');
    if (p) editarPlan(p.dataset.plan);
    const c = e.target.closest('[data-cartera]');
    if (c) verCartera(c.dataset.cartera);
  });

  F.onAuthStateChanged(auth, async (u) => {
    if (!u) { $('#pestanas').hidden = true; $('#salir').hidden = true; $('#vista').innerHTML = ''; mostrarLogin(mensajeLogin); mensajeLogin = ''; return; }
    $('#acceso').hidden = true;
    $('#vista').innerHTML = '<p class="mini">Cargando…</p>';
    try {
      await cargar();
    } catch (e) {
      if (e.code === 'permission-denied') { mensajeLogin = 'Esta cuenta no es administradora.'; await F.signOut(auth); return; }
      $('#vista').innerHTML = `<div class="banner mal"><p>${esc(e.message)}</p></div>`;
      return;
    }
    $('#quien').textContent = u.email;
    $('#pestanas').hidden = false;
    $('#salir').hidden = false;
    pintar();
  });
}

arrancar();
