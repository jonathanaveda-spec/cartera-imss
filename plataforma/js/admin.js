// Panel de administración (solo cuentas cuyo UID está en la lista de administradores de firestore.rules).
import { firebaseConfig } from './nube-config.js';
import { PAISES, LIMITE_GRATIS_DEFECTO, DIAS_PRUEBA_DEFECTO, planEfectivo, NOMBRE_TIPO, mensajesDeConversacion } from './plan.js';
import { calcularEstado, hoyISO, fmtFecha, fmtFechaHora } from './logic.js';
import './pantalla.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ms = (t) => (t?.toMillis ? t.toMillis() : typeof t === 'number' ? t : null);
const fechaDe = (t) => (ms(t) ? fmtFecha(hoyISO(new Date(ms(t)))) : '—');
const DIA = 86400000;

let F, auth, fs;
const datos = { usuarios: [], planes: new Map(), tickets: [], sistema: {}, conteos: new Map(), pagos: [] };
let tab = 'resumen';
let mensajeLogin = ''; // se muestra la próxima vez que aparezca el formulario de acceso

// El mismo service worker de la app: permite instalar el panel como app ("Cartera Admin").
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ---------- Utilidades de interfaz ----------
function aviso(msg, mal = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (mal ? ' mal' : '');
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), mal ? 6000 : 3000);
}

function ventana(titulo, cuerpo, pie = '', { dialogo = false } = {}) {
  const f = document.createElement('div');
  f.className = 'fondo-modal' + (dialogo ? ' dialogo' : '');
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

/**
 * Confirmación centrada para acciones peligrosas. `escribir`: palabra que hay que teclear para habilitar el botón.
 * Devuelve null si se cancela, o un objeto { nombre: marcada } con las casillas [data-opcion] del mensaje.
 */
function confirmar({ titulo, mensaje, ok = 'Aceptar', escribir = '' }) {
  return new Promise((res) => {
    let hecho = false;
    const fin = (r) => { if (!hecho) { hecho = true; res(r); } };
    const v = ventana(titulo, `${mensaje}${escribir ? `<label style="margin-top:12px">Escribe <b>${esc(escribir)}</b> para confirmar<input data-escribir-conf autocomplete="off" autocapitalize="characters"></label>` : ''}`,
      `<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn peligro solido" data-ok type="button" ${escribir ? 'disabled' : ''}>${esc(ok)}</button>`,
      { dialogo: true });
    const bOk = v.q('[data-ok]');
    v.q('[data-escribir-conf]')?.addEventListener('input', (e) => { bOk.disabled = e.target.value.trim().toUpperCase() !== escribir; });
    v.el.addEventListener('click', (e) => { if (e.target === v.el || e.target.closest('[data-cerrar]')) fin(null); });
    bOk.addEventListener('click', () => {
      const opciones = Object.fromEntries([...v.el.querySelectorAll('[data-opcion]')].map((c) => [c.dataset.opcion, c.checked]));
      v.cerrar();
      fin(opciones);
    });
  });
}

/** Borra documentos por tandas (Firestore acepta hasta 500 operaciones por tanda). */
async function borrarDocs(refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const b = F.writeBatch(fs);
    refs.slice(i, i + 400).forEach((r) => b.delete(r));
    await b.commit();
  }
}

// ---------- Acceso ----------
function mostrarLogin(msg = '') {
  const el = $('#acceso');
  el.hidden = false;
  el.innerHTML = `<div class="acceso-caja"><img src="icons/logo.png" alt="Cartera Asesor" class="logo-acceso" width="120" height="120"><h1>Administración</h1>
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
  const [us, pl, si, pg] = await Promise.all([
    F.getDocs(F.collection(fs, 'usuarios')),
    F.getDocs(F.collection(fs, 'planes')),
    F.getDoc(F.doc(fs, 'sistema', 'config')),
    F.getDocs(F.collection(fs, 'pagos_plan')),
  ]);
  datos.pagos = pg.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (ms(b.registrado) || 0) - (ms(a.registrado) || 0));
  datos.usuarios = us.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => (ms(b.creado) || 0) - (ms(a.creado) || 0));
  datos.planes = new Map(pl.docs.map((d) => [d.id, d.data()]));
  datos.sistema = si.exists() ? si.data() : {};
}

async function contarClientes(uid) {
  if (datos.conteos.has(uid)) return datos.conteos.get(uid);
  const n = (await F.getCountFromServer(F.collection(fs, 'usuarios', uid, 'clientes'))).data().count;
  datos.conteos.set(uid, n);
  return n;
}

const planDe = (uid) => {
  const u = datos.usuarios.find((x) => x.uid === uid);
  const p = datos.planes.get(uid);
  return planEfectivo({ plan: p ? { ...p, vence: ms(p.vence) } : null, sistema: datos.sistema, creado: ms(u?.creado) });
};

/** Asesores que requieren una decisión: prueba o Pro que termina en ≤ 3 días, o ya vencidos (últimos 30 días). */
function vencimientos() {
  const ahora = Date.now();
  return datos.usuarios.map((u) => ({ u, p: planDe(u.uid) })).filter(({ p }) =>
    ((p.tipo === 'prueba' || p.tipo === 'pro') && p.diasRestantes != null && p.diasRestantes <= 3)
    || (p.vencido && p.vence && ahora - p.vence < 30 * DIA))
    .sort((a, b) => (a.p.vence || 0) - (b.p.vence || 0));
}

function textoVence(p) {
  if (p.vencido) {
    const dias = Math.floor((Date.now() - p.vence) / DIA);
    return `<span style="color:#b91c1c">${p.termino === 'pro' ? 'Pro' : 'Prueba'} venció ${dias <= 0 ? 'hoy' : `hace ${dias} día(s)`}</span>`;
  }
  return `${p.nombre} termina ${p.diasRestantes <= 0 ? 'hoy' : `en ${p.diasRestantes} día(s)`}`;
}

// ---------- Vistas ----------
function pintar() {
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  ({ resumen, asesores, tickets, pagos, sistema })[tab]();
}

function resumen() {
  const ahora = Date.now();
  const nuevos7 = datos.usuarios.filter((u) => ms(u.creado) > ahora - 7 * DIA).length;
  const pro = datos.usuarios.filter((u) => planDe(u.uid).tipo === 'pro').length;
  const pendientes = datos.tickets.filter(porResponder).length;
  const pagos = datos.tickets.filter((t) => t.tipo === 'pago' && t.estado !== 'cerrado').length;
  const vs = vencimientos();
  const porPais = Object.entries(datos.usuarios.reduce((m, u) => { m[u.pais || '—'] = (m[u.pais || '—'] || 0) + 1; return m; }, {}));
  $('#vista').innerHTML = `<div class="kpis">
      <div class="kpi"><div class="num">${datos.usuarios.length}</div><div class="rot">Asesores registrados</div></div>
      <div class="kpi"><div class="num">${nuevos7}</div><div class="rot">Nuevos en 7 días</div></div>
      <div class="kpi"><div class="num">${pro}</div><div class="rot">Con Plan Pro vigente</div></div>
      <div class="kpi"><div class="num">${pendientes}</div><div class="rot">Mensajes por responder</div></div>
      <div class="kpi"><div class="num">${pagos}</div><div class="rot">Comprobantes por revisar</div></div>
    </div>
    <div class="seccion"><h3>Vencimientos · ${vs.length ? `<span style="color:#b91c1c">${vs.length} por decidir</span>` : 'nada pendiente'}</h3>
      ${vs.length ? `<ul class="lista-simple">${vs.map(({ u, p }) => `<li>
        <div class="destacado"><div><b>${esc(u.nombre || '(sin nombre)')}</b> <span class="mini">${esc(u.correo)} · ${esc(PAISES[u.pais] || '')}</span>
          <div class="mini">${textoVence(p)}</div></div>
          <div class="acc-fila">
            <button class="btn chico" data-mas-prueba="${u.uid}">+7 días de prueba</button>
            <button class="btn chico primario" data-plan="${u.uid}">Registrar pago</button>
            <button class="btn chico" data-escribir="${u.uid}">Escribir</button></div></div></li>`).join('')}</ul>`
      : '<p class="mini">Aquí aparecerán los asesores cuya prueba o plan termine en los próximos 3 días o ya haya vencido.</p>'}</div>
    <div class="seccion"><h3>Asesores por país</h3>${porPais.map(([p, n]) => `${esc(PAISES[p] || p)}: <b>${n}</b>`).join(' · ') || 'Sin datos'}</div>
    <div class="seccion"><h3>Modo actual</h3>${datos.sistema.betaAbierta ? 'Acceso libre: todos sin límite (las pruebas y los pagos no aplican).' : `Prueba gratis de ${datos.sistema.diasPrueba ?? DIAS_PRUEBA_DEFECTO} días; después Plan Pro o plan gratis hasta ${datos.sistema.limiteGratis ?? LIMITE_GRATIS_DEFECTO} clientes.`}</div>`;
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
      <td>${p.vencido ? `<span style="color:#b91c1c">${p.termino === 'pro' ? 'Pro vencido' : 'Prueba vencida'}</span>` : esc(p.nombre)}${p.vence ? `<div class="sub">${p.vencido ? 'desde' : 'hasta'} ${fechaDe(p.vence)}</div>` : ''}</td>
      <td data-conteo="${u.uid}">…</td>
      <td><div class="acciones"><button class="btn chico" data-plan="${u.uid}">Plan</button><button class="btn chico" data-cartera="${u.uid}">Cartera</button><button class="btn chico" data-escribir="${u.uid}">Escribir</button>${u.uid === auth.currentUser?.uid ? '' : `<button class="btn chico peligro" data-borrar-asesor="${u.uid}">🗑️ Borrar</button>`}</div></td></tr>`;
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

function editarPlan(uid, ticketId = null) {
  const u = datos.usuarios.find((x) => x.uid === uid) || { correo: uid, nombre: '(cuenta eliminada)' };
  const actual = datos.planes.get(uid) || {};
  const efectivo = planDe(uid);
  const s = datos.sistema;
  const venceISO = efectivo.vence && !efectivo.vencido ? hoyISO(new Date(efectivo.vence)) : '';
  const medios = (s.medios || []).map((m) => m.nombre).filter(Boolean);
  const v = ventana(`Plan · ${u.nombre || u.correo}`, `
    <p class="mini" style="margin-bottom:10px">Ahora: <b>${esc(efectivo.nombre)}</b>${efectivo.vence ? ` · ${efectivo.vencido ? 'venció' : 'hasta'} ${fechaDe(efectivo.vence)}` : ''}</p>
    <div class="acc-fila" style="margin-bottom:12px">
      <button type="button" class="btn chico" data-rapido="prueba:7">+7 días de prueba</button>
      <button type="button" class="btn chico" data-rapido="pro:30">Pro +1 mes</button>
      <button type="button" class="btn chico" data-rapido="pro:365">Pro +1 año</button></div>
    <form id="fp" class="rejilla dos">
      <label>Tipo<select name="tipo">
        <option value="prueba" ${(actual.tipo || efectivo.tipo) === 'prueba' ? 'selected' : ''}>Prueba gratis</option>
        <option value="pro" ${actual.tipo === 'pro' ? 'selected' : ''}>Plan Pro</option>
        <option value="gratis" ${actual.tipo === 'gratis' ? 'selected' : ''}>Gratis (con límite)</option></select></label>
      <label>Vence<input type="date" name="vence" value="${venceISO}"><div class="ayuda">Vacío = sin vencimiento.</div></label>
      <fieldset class="completo" id="pago-fs" style="border:1px solid var(--linea);border-radius:10px;padding:10px">
        <legend class="mini">Pago recibido (opcional, queda registrado)</legend>
        <div class="rejilla dos">
          <label>Monto<input type="number" name="monto" min="0" step="0.01" value="${esc(s.precioMensual ?? '')}"></label>
          <label>Moneda<select name="moneda">${['USD', 'COP', 'MXN', 'USDT'].map((m) => `<option ${(s.moneda || 'USD') === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
          <label>Medio<input name="medio" list="lista-medios" placeholder="Nequi, Binance…"><datalist id="lista-medios">${medios.map((m) => `<option value="${esc(m)}">`).join('')}</datalist></label>
          <label>Referencia<input name="referencia" maxlength="120"></label></div></fieldset>
    </form>`,
  '<button class="btn" data-cerrar>Cancelar</button><button class="btn primario" type="submit" form="fp">Guardar</button>');
  const f = v.q('#fp');
  const mostrarPago = () => { v.q('#pago-fs').hidden = f.tipo.value !== 'pro'; };
  f.tipo.addEventListener('change', mostrarPago);
  v.el.querySelectorAll('[data-rapido]').forEach((b) => b.addEventListener('click', () => {
    const [tipo, dias] = b.dataset.rapido.split(':');
    // Se suma desde hoy o desde el vencimiento vigente, lo que sea más tarde.
    const base = Math.max(Date.now(), efectivo.vencido ? 0 : (efectivo.vence || 0));
    f.tipo.value = tipo;
    f.vence.value = hoyISO(new Date(base + Number(dias) * DIA));
    if (tipo === 'pro') f.monto.value = dias === '365' ? (s.precioAnual ?? '') : (s.precioMensual ?? '');
    mostrarPago();
  }));
  mostrarPago();
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    seguro(async () => {
      const vence = f.vence.value ? new Date(f.vence.value + 'T23:59:59').getTime() : null;
      const plan = { tipo: f.tipo.value, vence, actualizado: F.serverTimestamp(), por: auth.currentUser.email };
      await F.setDoc(F.doc(fs, 'planes', uid), plan);
      let detalle = `${u.correo}: ${plan.tipo}${vence ? ' hasta ' + f.vence.value : ''}`;
      if (plan.tipo === 'pro' && Number(f.monto.value) > 0) {
        const pago = {
          uid, correo: u.correo || '', nombre: u.nombre || '', monto: Number(f.monto.value), moneda: f.moneda.value,
          medio: f.medio.value.trim(), referencia: f.referencia.value.trim(), desde: Date.now(), hasta: vence,
          registrado: F.serverTimestamp(), por: auth.currentUser.email,
        };
        const ref = await F.addDoc(F.collection(fs, 'pagos_plan'), pago);
        datos.pagos.unshift({ id: ref.id, ...pago, registrado: Date.now() });
        detalle += ` · pago ${pago.monto} ${pago.moneda} ${pago.medio} ${pago.referencia}`;
      }
      await registrar('plan', detalle);
      datos.planes.set(uid, { ...plan, actualizado: Date.now() });
      const fechaTxt = vence ? ` hasta el ${fmtFecha(f.vence.value)}` : '';
      if (ticketId && plan.tipo === 'pro') {
        await enviarSoporte(ticketId, `✅ Activamos tu Plan Pro${fechaTxt}. ¡Gracias por tu pago!`, { resolver: true });
      }
      v.cerrar();
      aviso(ticketId ? 'Plan activado y asesor avisado' : 'Plan guardado');
      pintar();
    });
  });
}

/** Extiende 7 días la prueba sin abrir el formulario. */
async function masPrueba(uid) {
  const p = planDe(uid);
  const base = Math.max(Date.now(), p.vencido ? 0 : (p.vence || 0));
  const vence = base + 7 * DIA;
  await F.setDoc(F.doc(fs, 'planes', uid), { tipo: 'prueba', vence, actualizado: F.serverTimestamp(), por: auth.currentUser.email });
  datos.planes.set(uid, { tipo: 'prueba', vence });
  const u = datos.usuarios.find((x) => x.uid === uid);
  await registrar('plan', `${u?.correo || uid}: prueba +7 días hasta ${fmtFecha(hoyISO(new Date(vence)))}`);
  aviso(`Prueba extendida hasta el ${fmtFecha(hoyISO(new Date(vence)))}`);
  pintar();
}

/** Soporte inicia una conversación con un asesor (le aparece como respuesta nueva). */
function escribirA(uid) {
  const u = datos.usuarios.find((x) => x.uid === uid);
  if (!u) return;
  const p = planDe(uid);
  const sugerido = p.tipo === 'prueba' || p.vencido
    ? `Hola ${(u.nombre || '').split(' ')[0]} 👋 ${p.vencido ? 'Tu prueba gratis de Cartera Asesor terminó' : `Tu prueba gratis de Cartera Asesor termina el ${fechaDe(p.vence)}`}. ¿Cómo te ha ido? Si quieres seguir, en ☰ Datos → Mi plan están los medios de pago. Cualquier duda, respóndeme por aquí.`
    : '';
  const v = ventana(`Escribir a ${u.nombre || u.correo}`, `<form id="fe"><label>Mensaje<textarea name="texto" rows="5" maxlength="2000">${esc(sugerido)}</textarea></label></form>`,
    '<button class="btn" data-cerrar>Cancelar</button><button class="btn primario" type="submit" form="fe">Enviar</button>');
  v.q('#fe').addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = e.target.texto.value.trim();
    if (!texto) return;
    seguro(async () => {
      const resumenTxt = texto.replace(/\s+/g, ' ').slice(0, 200);
      const ref = await F.addDoc(F.collection(fs, 'tickets'), {
        uid, correo: u.correo || '', nombre: u.nombre || '', tipo: 'aviso', asunto: resumenTxt, contexto: {},
        estado: 'abierto', creado: F.serverTimestamp(), actualizado: F.serverTimestamp(),
        ultimoDe: 'soporte', ultimoMensaje: resumenTxt, noLeidoAdmin: false, noLeidoAsesor: true,
      });
      await F.addDoc(F.collection(fs, 'tickets', ref.id, 'mensajes'), { de: 'soporte', texto, autor: auth.currentUser.email, creado: F.serverTimestamp() });
      await registrar('soporte', `${u.correo}: conversación iniciada por soporte`);
      v.cerrar();
      aviso('Mensaje enviado. Le aparecerá como respuesta nueva.');
    });
  });
}

// ---------- Pagos del plan ----------
function pagos() {
  const porMes = {};
  for (const p of datos.pagos) {
    const f = ms(p.registrado);
    const mes = f ? hoyISO(new Date(f)).slice(0, 7) : '—';
    porMes[mes] ||= {};
    porMes[mes][p.moneda] = (porMes[mes][p.moneda] || 0) + Number(p.monto || 0);
  }
  $('#vista').innerHTML = `<div class="seccion"><h3>Ingresos por mes</h3>${Object.keys(porMes).length
      ? `<ul class="lista-simple">${Object.entries(porMes).sort((a, b) => b[0].localeCompare(a[0])).map(([mes, tot]) => `<li><b>${esc(mes)}</b> · ${Object.entries(tot).map(([m, v]) => `${Math.round(v * 100) / 100} ${esc(m)}`).join(' + ')}</li>`).join('')}</ul>`
      : '<p class="mini">Aún no hay pagos registrados. Se registran al activar un Plan Pro con monto.</p>'}</div>
    <table class="tabla-admin"><thead><tr><th>Fecha</th><th>Asesor</th><th>Monto</th><th>Medio · referencia</th><th>Plan hasta</th><th></th></tr></thead><tbody>
    ${datos.pagos.map((p) => `<tr><td>${fechaDe(p.registrado)}</td><td><b>${esc(p.nombre || '')}</b><div class="sub">${esc(p.correo)}</div></td>
      <td>${esc(p.monto)} ${esc(p.moneda)}</td><td>${esc(p.medio || '—')}<div class="sub">${esc(p.referencia || '')}</div></td><td>${p.hasta ? fechaDe(p.hasta) : '—'}</td>
      <td><button class="btn chico peligro" data-borrar-pago="${esc(p.id)}">🗑️ Borrar</button></td></tr>`).join('') || '<tr><td colspan="6">Sin pagos.</td></tr>'}
    </tbody></table>`;
}

async function borrarPago(id) {
  const p = datos.pagos.find((x) => x.id === id);
  if (!p) return;
  const r = await confirmar({
    titulo: 'Borrar pago',
    mensaje: `<p>¿Borrar el pago de <b>${esc(p.monto)} ${esc(p.moneda)}</b> de <b>${esc(p.nombre || p.correo)}</b> (${fechaDe(p.registrado)})?</p>
      <p class="mini" style="margin-top:8px">Solo se borra el registro del pago y deja de sumar en los ingresos. El plan del asesor no cambia: si también quieres quitarle el Pro, usa el botón <b>Plan</b> en Asesores.</p>`,
    ok: 'Sí, borrar pago',
  });
  if (!r) return;
  await seguro(async () => {
    await borrarDocs([F.doc(fs, 'pagos_plan', id)]);
    await registrar('borrar_pago', `${p.correo}: ${p.monto} ${p.moneda} ${p.medio || ''} ${p.referencia || ''} (${fechaDe(p.registrado)})`);
    datos.pagos = datos.pagos.filter((x) => x.id !== id);
    aviso('Pago borrado');
    pintar();
  });
}

/** Borra a un asesor y todos sus datos en la nube (perfil, cartera, plan, conversaciones y, si se elige, sus pagos). */
async function borrarAsesor(uid) {
  const u = datos.usuarios.find((x) => x.uid === uid);
  if (!u) return;
  if (uid === auth.currentUser.uid) return aviso('No puedes borrar tu propia cuenta de administrador desde aquí', true);
  let nClientes = '?';
  try { nClientes = await contarClientes(uid); } catch { /* se muestra «?» */ }
  const susPagos = datos.pagos.filter((p) => p.uid === uid);
  const susTickets = datos.tickets.filter((t) => t.uid === uid);
  const r = await confirmar({
    titulo: 'Borrar asesor',
    mensaje: `<p>Vas a borrar a <b>${esc(u.nombre || '(sin nombre)')}</b> <span class="mini">(${esc(u.correo)})</span> con todos sus datos:</p>
      <ul class="lista-simple" style="margin:8px 0">
        <li>Su perfil y su plan</li>
        <li>Su cartera: <b>${nClientes}</b> cliente(s), papelera e historial</li>
        <li>Sus conversaciones de soporte: <b>${susTickets.length}</b></li></ul>
      ${susPagos.length ? `<label class="radio-tarjeta"><input type="checkbox" data-opcion="pagos" checked><span>Borrar también sus <b>${susPagos.length}</b> pago(s) registrados</span></label>` : ''}
      <p class="mini" style="margin-top:8px">⚠️ No se puede deshacer. Su correo y contraseña siguen existiendo en Firebase (Authentication → Users): si entra de nuevo, empezará como cuenta nueva.</p>`,
    ok: 'Borrar asesor',
    escribir: 'BORRAR',
  });
  if (!r) return;
  await seguro(async () => {
    aviso('Borrando…');
    try {
      // Primero la cartera: si las reglas de Firebase aún no permiten borrar, se detiene aquí sin tocar nada más.
      for (const col of ['clientes', 'papelera', 'historial', 'config']) {
        const s = await F.getDocs(F.collection(fs, 'usuarios', uid, col));
        await borrarDocs(s.docs.map((d) => d.ref));
      }
      for (const t of susTickets) {
        const m = await F.getDocs(F.collection(fs, 'tickets', t.id, 'mensajes'));
        await borrarDocs([...m.docs.map((d) => d.ref), F.doc(fs, 'tickets', t.id)]);
      }
      if (r.pagos) await borrarDocs(susPagos.map((p) => F.doc(fs, 'pagos_plan', p.id)));
      await borrarDocs([F.doc(fs, 'planes', uid), F.doc(fs, 'usuarios', uid)]);
    } catch (e) {
      if (e.code === 'permission-denied') throw new Error('Firebase no dejó borrar: falta publicar las reglas nuevas (firestore.rules) en Firebase → Firestore → Reglas.');
      throw e;
    }
    await registrar('borrar_asesor', `${u.correo} (${u.nombre || ''}): ${nClientes} clientes, ${susTickets.length} conversaciones${r.pagos ? `, ${susPagos.length} pagos` : ''}`);
    datos.usuarios = datos.usuarios.filter((x) => x.uid !== uid);
    datos.planes.delete(uid);
    datos.conteos.delete(uid);
    if (r.pagos) datos.pagos = datos.pagos.filter((p) => p.uid !== uid);
    aviso('Asesor borrado');
    pintar();
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

// ---------- Soporte: conversaciones en vivo ----------
const porActualizado = (a, b) => (ms(b.actualizado) || ms(b.creado) || 0) - (ms(a.actualizado) || ms(a.creado) || 0);
const porResponder = (t) => t.noLeidoAdmin === true || (t.estado !== 'cerrado' && !t.ultimoDe && !t.respuesta);
let chatAbierto = null; // { id, repintar }

function escucharTickets() {
  let primera = true;
  F.onSnapshot(F.collection(fs, 'tickets'), (snap) => {
    const antes = new Map(datos.tickets.map((t) => [t.id, t]));
    datos.tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(porActualizado);
    if (!primera) {
      const nuevos = datos.tickets.filter((t) => t.noLeidoAdmin && !antes.get(t.id)?.noLeidoAdmin);
      if (nuevos.length) aviso(`💬 Nuevo mensaje de ${nuevos[0].nombre || nuevos[0].correo}${nuevos.length > 1 ? ` y ${nuevos.length - 1} más` : ''}`);
    }
    primera = false;
    const n = datos.tickets.filter(porResponder).length;
    const b = document.querySelector('[data-tab="tickets"]');
    if (b) b.innerHTML = `Soporte${n ? ` <span class="pastilla" style="background:#dc2626">${n}</span>` : ''}`;
    document.title = n ? `(${n}) Panel de administración` : 'Panel de administración';
    if (tab === 'tickets' || tab === 'resumen') pintar();
    if (chatAbierto) chatAbierto.repintar();
  }, (e) => aviso(e.message, true));
}

function tickets() {
  let filtro = window.__filtroSoporte || 'responder';
  const lista = () => datos.tickets.filter((t) => filtro === 'todos'
    || (filtro === 'responder' ? porResponder(t) : filtro === 'pagos' ? t.tipo === 'pago' && t.estado !== 'cerrado' : t.estado !== 'cerrado'));
  $('#vista').innerHTML = `<div id="tk"><div class="acc-fila" style="margin-bottom:10px">
      ${[['responder', 'Por responder'], ['abiertas', 'Abiertas'], ['pagos', 'Comprobantes'], ['todos', 'Todas']]
        .map(([k, t]) => `<button class="btn chico ${filtro === k ? 'primario' : ''}" data-f="${k}">${t}</button>`).join('')}</div>
    <div id="lista-t">${lista().map((t) => `<button class="seccion conv-admin" data-abrir="${esc(t.id)}">
        <div class="destacado"><div>
          ${porResponder(t) ? '<span class="punto"></span>' : ''}
          <b>${esc(t.nombre || '(sin nombre)')}</b> <span class="mini">${esc(t.correo)}</span>
          <div style="margin-top:4px"><span class="etq ${t.estado === 'cerrado' ? 'gris' : 'ambar'}">${t.estado === 'cerrado' ? 'Resuelta' : 'Abierta'}</span>
            <b>${esc(NOMBRE_TIPO[t.tipo] || t.tipo)}</b></div></div>
          <div class="mini">${ms(t.actualizado || t.creado) ? fmtFechaHora(ms(t.actualizado || t.creado)) : ''}</div></div>
        <div class="mini" style="margin-top:6px">${t.ultimoDe === 'soporte' ? 'Tú: ' : 'Asesor: '}${esc(t.ultimoMensaje || t.asunto || t.mensaje || '')}</div>
      </button>`).join('') || '<div class="vacio"><h2>Nada pendiente</h2><p>Cuando un asesor escriba, aparecerá aquí.</p></div>'}</div></div>`;
  $('#tk').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (b) { window.__filtroSoporte = b.dataset.f; tickets(); return; }
    const a = e.target.closest('[data-abrir]');
    if (a) abrirChat(a.dataset.abrir);
  });
}

function abrirChat(id) {
  let mensajes = [];
  const t0 = datos.tickets.find((x) => x.id === id) || {};
  const v = ventana(`${NOMBRE_TIPO[t0.tipo] || 'Conversación'} · ${t0.nombre || t0.correo || ''}`,
    `<div class="mini" style="margin-bottom:8px">${esc(t0.correo)}${t0.uid ? ` · <a href="#" data-plan="${esc(t0.uid)}">Ver / cambiar plan</a>` : ''}</div>
     <details style="margin-bottom:10px"><summary class="mini">Datos técnicos del teléfono</summary><pre class="ctx">${esc(JSON.stringify(t0.contexto || {}, null, 1))}</pre></details>
     <div class="chat" id="chat"><p class="mini">Cargando…</p></div>`,
    `<form id="f-sop" class="chat-form"><textarea name="texto" rows="2" maxlength="2000" placeholder="Escribe tu respuesta…"></textarea>
       <button class="btn primario" type="submit">Enviar</button></form>
     <div class="acc-fila" style="width:100%;margin-top:8px">
       ${t0.tipo === 'pago' ? '<button class="btn chico primario" data-activar>Activar plan y avisar</button>' : ''}
       <button class="btn chico" data-resuelta>Marcar resuelta</button></div>`);
  v.el.addEventListener('click', (e) => { const p = e.target.closest('[data-plan]'); if (p) { e.preventDefault(); editarPlan(p.dataset.plan, id); } });
  const chat = v.q('#chat');
  const repintar = () => {
    const t = datos.tickets.find((x) => x.id === id) || t0;
    chat.innerHTML = mensajesDeConversacion(t, mensajes).map((m) => `<div class="burbuja ${m.de === 'soporte' ? 'mia' : 'de-soporte'}">
        <div class="quien">${m.de === 'soporte' ? `Soporte${m.autor ? ' · ' + esc(m.autor) : ''}` : esc(t.nombre || 'Asesor')}</div>
        <div class="txt">${esc(m.texto)}</div>
        <div class="hora">${ms(m.creado) ? fmtFechaHora(ms(m.creado)) : 'Enviando…'}</div></div>`).join('')
      + (t.estado === 'cerrado' ? '<p class="mini" style="text-align:center">Conversación resuelta. Si el asesor escribe, se reabre.</p>' : '');
    const cuerpo = v.q('.modal-cuerpo');
    cuerpo.scrollTop = cuerpo.scrollHeight;
  };
  const parar = F.onSnapshot(F.query(F.collection(fs, 'tickets', id, 'mensajes'), F.orderBy('creado')), (s) => {
    mensajes = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    repintar();
  }, (e) => { chat.innerHTML = `<p class="mini">${esc(e.message)}</p>`; });
  chatAbierto = { id, repintar };
  const cerrarOriginal = v.cerrar;
  v.cerrar = () => { parar(); chatAbierto = null; cerrarOriginal(); };
  v.el.addEventListener('click', (e) => { if (e.target === v.el || e.target.closest('[data-cerrar]')) { parar(); chatAbierto = null; } }, true);
  if (t0.noLeidoAdmin) F.updateDoc(F.doc(fs, 'tickets', id), { noLeidoAdmin: false }).catch(() => {});

  v.q('#f-sop').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const texto = f.texto.value.trim();
    if (!texto) return;
    f.texto.value = '';
    seguro(() => enviarSoporte(id, texto));
  });
  v.q('[data-resuelta]').addEventListener('click', () => seguro(async () => {
    await F.updateDoc(F.doc(fs, 'tickets', id), { estado: 'cerrado', actualizado: F.serverTimestamp(), noLeidoAdmin: false });
    await registrar('ticket', `${t0.correo}: resuelta`);
    aviso('Marcada como resuelta');
  }));
  v.q('[data-activar]')?.addEventListener('click', () => editarPlan(t0.uid, id));
}

/** Soporte escribe en una conversación: queda como no leída para el asesor (le aparece el aviso). */
async function enviarSoporte(id, texto, { resolver = false } = {}) {
  await F.addDoc(F.collection(fs, 'tickets', id, 'mensajes'), { de: 'soporte', texto, autor: auth.currentUser.email, creado: F.serverTimestamp() });
  await F.updateDoc(F.doc(fs, 'tickets', id), {
    estado: resolver ? 'cerrado' : 'abierto', actualizado: F.serverTimestamp(), ultimoDe: 'soporte',
    ultimoMensaje: texto.replace(/\s+/g, ' ').slice(0, 200), noLeidoAsesor: true, noLeidoAdmin: false,
  });
  const t = datos.tickets.find((x) => x.id === id);
  await registrar('soporte', `${t?.correo || id}: respuesta enviada`);
}

// ---------- Sistema: modo beta, límites, precios y medios de pago ----------
function sistema() {
  const s = datos.sistema;
  let medios = (s.medios || []).map((m) => ({ ...m }));
  const filaMedio = (m, i) => `<div class="medio" data-i="${i}">
      <select name="pais">${[['', 'Cualquier país'], ...Object.entries(PAISES)].map(([k, n]) => `<option value="${k}" ${m.pais === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <input name="nombre" placeholder="Medio (ej. Nequi)" value="${esc(m.nombre || '')}" maxlength="40">
      <input name="dato" placeholder="Número, llave o ID" value="${esc(m.dato || '')}" maxlength="120">
      <input name="titular" placeholder="Titular (opcional)" value="${esc(m.titular || '')}" maxlength="80">
      <button type="button" class="btn chico peligro" data-quitar="${i}" aria-label="Quitar">✕</button></div>`;
  $('#vista').innerHTML = `<form id="fs">
      <div class="seccion"><h3>Modo</h3>
        <label class="radio-tarjeta"><input type="checkbox" name="beta" ${s.betaAbierta ? 'checked' : ''}><span><b>Acceso libre para todos</b><br>
          <span class="mini">Si está marcado, nadie tiene límite ni vencimiento (ignora la prueba y los pagos). Desmárcalo para activar la prueba de 7 días y el cobro.</span></span></label>
        <label style="margin-top:12px">Días de prueba gratis para cada asesor nuevo<input type="number" name="diasPrueba" min="0" max="90" value="${s.diasPrueba ?? DIAS_PRUEBA_DEFECTO}"></label>
        <label style="margin-top:12px">Clientes permitidos en el plan gratis<input type="number" name="limite" min="1" max="1000" value="${s.limiteGratis ?? LIMITE_GRATIS_DEFECTO}"></label></div>
      <div class="seccion"><h3>Precio del Plan Pro</h3><div class="rejilla dos">
        <label>Mensual<input type="number" name="mensual" min="0" step="0.01" value="${esc(s.precioMensual ?? '')}"></label>
        <label>Anual<input type="number" name="anual" min="0" step="0.01" value="${esc(s.precioAnual ?? '')}"></label>
        <label>Moneda<select name="moneda">${['USD', 'COP', 'MXN'].map((m) => `<option ${(s.moneda || 'USD') === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label></div>
        <p class="mini" style="margin:12px 0 6px">Tasa de cambio (cuántos pesos vale 1 USD). Sirve para mostrar a cada asesor el valor aproximado en su moneda. Actualízala cuando cambie.</p>
        <div class="rejilla dos">
          <label>1 USD en pesos colombianos (COP)<input type="number" name="tasaCOP" min="0" step="any" value="${esc(s.tasas?.COP ?? '')}"></label>
          <label>1 USD en pesos mexicanos (MXN)<input type="number" name="tasaMXN" min="0" step="any" value="${esc(s.tasas?.MXN ?? '')}"></label></div></div>
      <div class="seccion"><h3>Medios de pago</h3>
        <p class="mini" style="margin-bottom:8px">Cada asesor ve primero los de su país.</p>
        <div id="medios"></div>
        <button type="button" class="btn chico" id="mas-medio" style="margin-top:8px">＋ Agregar medio de pago</button></div>
      <button class="btn primario">Guardar</button></form>`;
  const pintarMedios = () => { $('#medios').innerHTML = medios.map(filaMedio).join('') || '<p class="mini">Aún no hay medios de pago.</p>'; };
  const leerMedios = () => [...document.querySelectorAll('#medios .medio')].map((d) => ({
    pais: d.querySelector('[name=pais]').value, nombre: d.querySelector('[name=nombre]').value.trim(),
    dato: d.querySelector('[name=dato]').value.trim(), titular: d.querySelector('[name=titular]').value.trim(),
  }));
  pintarMedios();
  $('#mas-medio').addEventListener('click', () => { medios = [...leerMedios(), { pais: 'CO', nombre: '', dato: '', titular: '' }]; pintarMedios(); });
  $('#medios').addEventListener('click', (e) => {
    const q = e.target.closest('[data-quitar]');
    if (q) { medios = leerMedios().filter((_, i) => i !== Number(q.dataset.quitar)); pintarMedios(); }
  });
  $('#fs').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    seguro(async () => {
      const num = (v) => (v === '' ? null : Math.max(0, Number(v)));
      const nuevo = {
        betaAbierta: f.beta.checked,
        limiteGratis: Math.max(1, parseInt(f.limite.value, 10) || LIMITE_GRATIS_DEFECTO),
        diasPrueba: Math.max(0, parseInt(f.diasPrueba.value, 10) || 0),
        precioMensual: num(f.mensual.value), precioAnual: num(f.anual.value), moneda: f.moneda.value,
        tasas: { COP: num(f.tasaCOP.value), MXN: num(f.tasaMXN.value) },
        medios: leerMedios().filter((m) => m.nombre && m.dato),
      };
      await F.setDoc(F.doc(fs, 'sistema', 'config'), nuevo);
      await registrar('sistema', JSON.stringify({ betaAbierta: nuevo.betaAbierta, limiteGratis: nuevo.limiteGratis, precios: [nuevo.precioMensual, nuevo.precioAnual, nuevo.moneda], medios: nuevo.medios.length }));
      datos.sistema = nuevo;
      aviso('Guardado. Los asesores lo verán al abrir «Mi plan».');
      sistema();
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
    const mp = e.target.closest('[data-mas-prueba]');
    if (mp) seguro(() => masPrueba(mp.dataset.masPrueba));
    const es = e.target.closest('[data-escribir]');
    if (es) escribirA(es.dataset.escribir);
    const bp = e.target.closest('[data-borrar-pago]');
    if (bp) borrarPago(bp.dataset.borrarPago);
    const ba = e.target.closest('[data-borrar-asesor]');
    if (ba) borrarAsesor(ba.dataset.borrarAsesor);
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
    if (!window.__escuchandoTickets) { window.__escuchandoTickets = true; escucharTickets(); }
    const nv = vencimientos().length;
    if (nv) aviso(`⏳ ${nv} asesor(es) con prueba o plan por vencer o vencido. Míralos en Resumen → Vencimientos.`);
    const bR = document.querySelector('[data-tab="resumen"]');
    if (bR) bR.innerHTML = `Resumen${nv ? ` <span class="pastilla" style="background:#f59e0b;color:#111827">${nv}</span>` : ''}`;
    $('#quien').textContent = u.email;
    $('#pestanas').hidden = false;
    $('#salir').hidden = false;
    pintar();
  });
}

arrancar();
