// Interfaz: render de resumen/lista, ventanas (detalle, formularios, pagos, importación, etc.).
import * as L from './logic.js';
import * as S from './store.js';
import * as E from './excel.js';
import * as N from './nube.js';
import { MARCA } from './marca.js';
import * as I from './instalar.js';
import * as B from './bloqueo.js';
import { enPlay } from './origen.js';
import { TIPOS_TICKET, PAISES, NOMBRE_TIPO, mediosOrdenados, textoPrecios, mensajesDeConversacion, equivalenteLocal } from './plan.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dinero = (n) => (n == null ? '—' : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n));
const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Filtros de la lista (solo en memoria).
const F = { busqueda: '', estado: 'todos', etiqueta: '', pDesde: '', pHasta: '', iDesde: '', iHasta: '', orden: 'vencimiento', dir: 'asc' };
const ctx = () => ({ hoy: L.hoyISO(), aviso: S.db.config.diasAviso });

// =====================================================================
// Ventanas
// =====================================================================
const pila = [];

function ventana({ titulo, cuerpo, pie = '', ancho = false, fondoCierra = true, onCerrar, dialogo = false }) {
  const fondo = document.createElement('div');
  fondo.className = 'fondo-modal' + (dialogo ? ' dialogo' : '');
  fondo.innerHTML = `<div class="modal ${ancho ? 'ancho' : ''}" role="dialog" aria-modal="true">
      <div class="modal-cab"><h2></h2><button class="btn cerrar" data-cerrar aria-label="Cerrar" type="button">✕</button></div>
      <div class="modal-cuerpo"></div><div class="modal-pie"></div></div>`;
  const v = {
    el: fondo,
    poner({ titulo: t, cuerpo: c, pie: p }) {
      if (t != null) $('h2', fondo).textContent = t;
      if (c != null) $('.modal-cuerpo', fondo).innerHTML = c;
      if (p != null) {
        $('.modal-pie', fondo).innerHTML = p;
        $('.modal-pie', fondo).hidden = !p;
      }
    },
    cerrar(resultado) {
      const i = pila.indexOf(v);
      if (i < 0) return;
      pila.splice(i, 1);
      fondo.remove();
      if (!pila.length) document.body.classList.remove('bloqueado');
      onCerrar && onCerrar(resultado);
    },
    q: (s) => $(s, fondo),
  };
  v.poner({ titulo, cuerpo, pie });
  fondo.addEventListener('mousedown', (e) => { if (fondoCierra && e.target === fondo) v.cerrar(); });
  fondo.addEventListener('click', (e) => { if (e.target.closest('[data-cerrar]')) v.cerrar(); });
  $('#modales').appendChild(fondo);
  document.body.classList.add('bloqueado');
  pila.push(v);
  return v;
}

export function cerrarSuperior() {
  const v = pila[pila.length - 1];
  if (v) { v.cerrar(); return true; }
  return false;
}

function confirmar({ titulo, mensaje, ok = 'Aceptar', peligro = false, cancelar = 'Cancelar' }) {
  return new Promise((res) => {
    let hecho = false;
    const v = ventana({
      titulo, dialogo: true,
      cuerpo: `<p>${mensaje}</p>`,
      pie: `<button class="btn" data-cerrar type="button">${esc(cancelar)}</button>
            <button class="btn ${peligro ? 'peligro solido' : 'primario'}" data-ok type="button">${esc(ok)}</button>`,
      onCerrar: () => { if (!hecho) res(false); },
    });
    v.q('[data-ok]').addEventListener('click', () => { hecho = true; v.cerrar(); res(true); });
  });
}

export function aviso(msg, mal = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (mal ? ' mal' : '');
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), mal ? 6000 : 3500);
}

async function seguro(fn) {
  try {
    return await fn();
  } catch (e) {
    console.error(e);
    aviso('No se pudo completar: ' + (e && e.message ? e.message : e), true);
  }
}

// =====================================================================
// Render principal
// =====================================================================
const TARJETAS = [
  { cod: 'todos', rot: 'Total de clientes', clase: 'total', n: (c) => c.total },
  { cod: 'AL_DIA', rot: '🟢 Al día', clase: 'aldia', n: (c) => c.AL_DIA },
  { cod: 'POR_VENCER', rot: '🟡 Próximos a vencer', clase: 'porvencer', n: (c) => c.POR_VENCER },
  { cod: 'MOROSO', rot: '🔴 Morosos', clase: 'moroso', n: (c) => c.MOROSO },
  { cod: 'BAJA', rot: '⚫ Dados de baja', clase: 'baja', n: (c) => c.BAJA },
];

function renderResumen(cnt) {
  const tarjetas = [...TARJETAS];
  if (cnt.SIN_CONFIG) tarjetas.push({ cod: 'SIN_CONFIG', rot: '⚪ Sin configurar', clase: 'sinconfig', n: (c) => c.SIN_CONFIG });
  $('#resumen').innerHTML = tarjetas
    .map((t) => `<button class="tarjeta-stat ${t.clase} ${F.estado === t.cod ? 'activa' : ''}" data-accion="estado" data-cod="${t.cod}" aria-pressed="${F.estado === t.cod}">
        <div class="num">${t.n(cnt)}</div><div class="rot">${t.rot}</div></button>`)
    .join('');
}

function esIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function enModoApp() {
  return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
}
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch { /* opcional */ } }

function renderAvisos(cnt) {
  const a = [];
  if (N.nubeActiva && N.estado.error) {
    a.push(`<div class="banner mal"><p><b>No se pudo sincronizar con la nube:</b> ${esc(N.estado.error)}. Tus cambios siguen guardados en este dispositivo.</p></div>`);
  } else if (N.nubeActiva && !navigator.onLine) {
    a.push(`<div class="banner info"><p><b>Sin conexión.</b> Puedes seguir trabajando: los cambios se enviarán a la nube cuando vuelva internet.</p></div>`);
  }
  if (N.soporte.noLeidos) {
    a.push(`<div class="banner info"><p>💬 <b>Soporte te respondió.</b> Tienes ${N.soporte.noLeidos} ${N.soporte.noLeidos === 1 ? 'conversación' : 'conversaciones'} con respuesta nueva.</p><button class="btn chico primario" data-accion="ayuda">Ver respuesta</button></div>`);
  }
  const pe = N.estado.planEf;
  const nCli = S.db.clientes.length;
  const termino = pe.termino === 'pro' ? 'Tu Plan Pro venció' : 'Tu prueba gratis terminó';
  if (pe.tipo === 'prueba' && pe.diasRestantes != null && pe.diasRestantes <= 3) {
    a.push(`<div class="banner"><p>⏳ <b>Tu prueba gratis termina ${pe.diasRestantes <= 0 ? 'hoy' : `en ${pe.diasRestantes} día(s)`}.</b>${enPlay() ? '' : ' Activa el Plan Pro para seguir sin interrupciones.'}</p><button class="btn chico primario" data-accion="plan">${enPlay() ? 'Mi plan' : 'Ver planes'}</button></div>`);
  } else if (pe.tipo === 'pro' && pe.diasRestantes != null && pe.diasRestantes <= 5) {
    a.push(`<div class="banner"><p>Tu Plan Pro vence en <b>${pe.diasRestantes} día(s)</b>.</p><button class="btn chico" data-accion="plan">${enPlay() ? 'Mi plan' : 'Renovar'}</button></div>`);
  } else if (!N.puedeEditarCartera()) {
    a.push(`<div class="banner mal"><p><b>${termino}.</b> Puedes ver y exportar tus ${nCli} clientes, pero para registrar pagos, editar o agregar necesitas el Plan Pro.</p><button class="btn chico primario" data-accion="plan">${enPlay() ? 'Mi plan' : 'Activar plan'}</button></div>`);
  } else if (pe.tipo === 'beta' && nCli >= pe.limite - 5) {
    a.push(`<div class="banner"><p>Usas <b>${nCli} de ${pe.limite}</b> clientes de la beta gratuita.${nCli >= pe.limite ? ' Tus clientes siguen igual; ¿necesitas agregar más? Escríbenos.' : ''}</p><button class="btn chico" data-accion="ayuda" data-texto="En la beta necesito más de ${pe.limite} clientes: ">Escríbenos</button></div>`);
  } else if (!pe.ilimitado && nCli >= pe.limite - 2) {
    a.push(`<div class="banner"><p>${pe.vencido ? termino + '. ' : ''}Usas <b>${nCli} de ${pe.limite}</b> clientes del plan gratis.</p><button class="btn chico" data-accion="plan">${enPlay() ? 'Mi plan' : 'Ver planes'}</button></div>`);
  }
  if (nCli && !B.activo() && !lsGet('cartera:ocultar-aviso-bloqueo')) {
    a.push(`<div class="banner info"><p>🔒 <b>Nuevo: protege tu cartera con un PIN</b>. Si alguien más toma tu teléfono, no podrá ver a tus clientes.</p><button class="btn chico primario" data-accion="bloqueo">Activar</button><button class="btn chico" data-accion="ocultar-bloqueo">Ahora no</button></div>`);
  }
  if (S.estadoAlmacen.motor === 'ninguno') {
    a.push(`<div class="banner mal"><p><b>Atención:</b> este navegador no permite guardar datos. Lo que captures se perderá al cerrar. Abre la app desde Safari y agrégala a la pantalla de inicio.</p></div>`);
  }
  if (I.puedeInstalar() && !lsGet('cartera:ocultar-instalar')) {
    a.push(`<div class="banner info"><p><b>Instala la app</b> en tu pantalla de inicio para abrirla con un toque.</p><button class="btn chico primario" data-accion="instalar">Instalar</button><button class="btn chico" data-accion="ocultar-instalar">Ahora no</button></div>`);
  } else if (esIOS() && !enModoApp() && !lsGet('cartera:ocultar-instalar')) {
    a.push(`<div class="banner info"><p><b>📲 Instala la app en tu iPhone</b> para abrirla con un toque desde tu pantalla de inicio.</p>
      <button class="btn chico primario" data-accion="guia-instalar">Ver cómo (4 pasos)</button>
      <button class="btn chico" data-accion="ocultar-instalar">Ahora no</button></div>`);
  }
  if (cnt.total && cnt.SIN_CONFIG) {
    a.push(`<div class="banner"><p><b>${cnt.SIN_CONFIG}</b> ${cnt.SIN_CONFIG === 1 ? 'cliente aún no tiene' : 'clientes aún no tienen'} fecha de cobro. Pónsela a todos de una vez en 3 pasos.</p>
      <button class="btn chico" data-accion="asistente">Poner fechas de cobro</button></div>`);
  }
  const ult = S.db.config.ultimoRespaldo;
  if (cnt.total && (!ult || Date.now() - ult > 30 * 86400000)) {
    a.push(`<div class="banner"><p><b>Haz un respaldo.</b> ${ult ? 'Tu último respaldo fue el ' + L.fmtFecha(L.hoyISO(new Date(ult))) + '.' : 'Aún no has exportado tus datos.'} ${N.nubeActiva ? 'Tus datos están en la nube, pero un respaldo propio nunca sobra.' : 'Tus datos viven solo en este teléfono.'}</p>
      <button class="btn chico" data-accion="exportar">Exportar a Excel</button></div>`);
  }
  $('#avisos').innerHTML = a.join('');
}

function etiquetaOrden() {
  const dir = F.dir === 'asc';
  return {
    nombre: dir ? 'A → Z' : 'Z → A',
    estado: dir ? 'Urgentes primero' : 'Urgentes al final',
    vencimiento: dir ? 'Más próximo primero' : 'Más lejano primero',
    pago: dir ? 'Más antiguo primero' : 'Más reciente primero',
    inicio: dir ? 'Más antiguo primero' : 'Más reciente primero',
  }[F.orden];
}

export function render() {
  const btnRev = document.querySelector('.barra [data-accion="revision"]');
  if (btnRev) {
    const dupR = L.indexarDuplicados(S.db.clientes);
    const hoyR = L.hoyISO();
    const nRev = S.db.clientes.filter((c) => L.avisosDeCliente(c, dupR, hoyR).length).length;
    let b = btnRev.querySelector('.pastilla');
    if (nRev && !b) { b = document.createElement('span'); b.className = 'pastilla'; btnRev.appendChild(b); }
    if (b) { if (nRev) b.textContent = nRev; else b.remove(); }
    btnRev.title = nRev ? `Revisión de datos: ${nRev} cliente(s) por revisar` : 'Revisión de datos';
  }
  const btnMenu = document.querySelector('.barra [data-accion="menu"]');
  if (btnMenu) {
    let p = btnMenu.querySelector('.punto');
    if (N.soporte.noLeidos && !p) { p = document.createElement('span'); p.className = 'punto'; p.setAttribute('aria-label', 'Respuesta de soporte'); btnMenu.appendChild(p); }
    if (!N.soporte.noLeidos && p) p.remove();
  }
  const { hoy, aviso: dias } = ctx();
  const cnt = L.contarPorEstado(S.db.clientes, hoy, dias);
  renderResumen(cnt);
  renderAvisos(cnt);

  // Etiquetas disponibles para filtrar.
  const etqs = [...new Set(S.db.clientes.flatMap((c) => c.etiquetas || []))];
  $('#lblEtiqueta').hidden = !etqs.length;
  $('#fEtiqueta').innerHTML = `<option value="">Todas</option>` + etqs.map((e) => `<option ${F.etiqueta === e ? 'selected' : ''}>${esc(e)}</option>`).join('');

  const activos = [F.estado !== 'todos', F.etiqueta, F.pDesde, F.pHasta, F.iDesde, F.iHasta].filter(Boolean).length;
  $('#nFiltros').hidden = !activos;
  $('#nFiltros').textContent = activos;
  $('#dir').textContent = (F.dir === 'asc' ? '↑ ' : '↓ ') + etiquetaOrden();
  $('#fEstado').value = F.estado;

  const items = L.ordenar(L.filtrarClientes(S.db.clientes, F, hoy, dias), F.orden, F.dir);
  $('#conteo').textContent = S.db.clientes.length ? `${items.length} de ${S.db.clientes.length}` : '';
  renderLista(items);
}

function renderLista(items) {
  const cont = $('#lista');
  if (!S.db.clientes.length) {
    cont.innerHTML = `<div class="vacio"><h2>Empecemos con tus clientes</h2>
      <p>¿Ya los tienes en Excel? Tráelos en 3 pasos: eliges el archivo, revisas las columnas y confirmas. Toma unos 2 minutos y te guiamos en cada paso.</p>
      <button class="btn primario" data-accion="importar">📥 Traer mis clientes de Excel</button>
      <button class="btn" data-accion="nuevo">Agregar uno por uno</button>
      <p class="mini" style="margin:14px 0 0">¿Dudas? <a href="#" data-accion="ayuda" data-texto="Necesito ayuda para importar mi Excel: ">Escríbenos</a> y te ayudamos.</p></div>`;
    return;
  }
  if (!items.length) {
    cont.innerHTML = `<div class="vacio"><h2>Sin resultados</h2><p>Ningún cliente coincide con la búsqueda o los filtros.</p>
      <button class="btn" data-accion="limpiar">Quitar filtros</button></div>`;
    return;
  }
  cont.innerHTML = `<table><thead><tr>
      <th>Estado</th><th>Cliente</th><th>Celular</th><th class="solo-escritorio">Opción · Proveedor</th>
      <th class="solo-escritorio">Periodicidad</th><th>Próximo pago</th><th class="solo-escritorio">Último pago</th><th></th></tr></thead>
    <tbody>${items.map(filaHTML).join('')}</tbody></table>`;
}

function filaHTML({ c, e }) {
  const up = L.ultimoPago(c);
  const conFecha = c.proximo_pago && e.codigo !== 'SIN_CONFIG';
  const boton = e.codigo === 'BAJA'
    ? ''
    : e.codigo === 'SIN_CONFIG'
      ? `<button class="btn chico" data-accion="editar" data-id="${c.id}">Fijar fecha</button>`
      : `<button class="btn chico primario" data-accion="pago" data-id="${c.id}">Registrar pago</button>`;
  const wa = (e.codigo === 'MOROSO' || e.codigo === 'POR_VENCER') && L.telefonoInternacional(c.celular)
    ? `<button class="btn chico btn-wa" data-accion="recordar" data-id="${c.id}" aria-label="Recordar el pago por WhatsApp">💬 Recordar</button>` : '';
  return `<tr class="fila est-${e.clase}" data-id="${c.id}" tabindex="0" role="button" aria-label="Abrir ${esc(c.nombre)}">
    <td class="c-estado"><span class="insignia ${e.clase}">${e.icono} ${e.etiqueta}</span></td>
    <td class="c-nombre"><div class="nombre">${esc(c.nombre) || '<i>(sin nombre)</i>'}</div><div class="sub">${esc(c.curp)}</div></td>
    <td class="c-cel">${esc(c.celular) || '—'}</td>
    <td class="solo-escritorio">${esc(c.opcion) || '—'}<div class="sub">${esc(c.proveedor)}</div></td>
    <td class="solo-escritorio">${esc(c.periodicidad) || '—'}${L.textoDiaPago(c) ? `<div class="sub">${L.textoDiaPago(c)}</div>` : ''}</td>
    <td class="c-vence"><span class="lin-fecha">${conFecha ? L.fmtFecha(c.proximo_pago) : ''}</span> <span class="dias ${e.clase}">${L.textoDias(e)}</span></td>
    <td class="solo-escritorio">${up ? L.fmtFecha(up.fecha_pago) : '—'}</td>
    <td class="c-acc"><div class="acciones">${wa}${boton}</div></td></tr>`;
}

// =====================================================================
// Detalle de cliente
// =====================================================================
export function abrirDetalle(id, ventanaExistente) {
  const c = S.buscar(id);
  if (!c) return;
  const { hoy, aviso: dias } = ctx();
  const e = L.calcularEstado(c, hoy, dias);
  const dup = L.indexarDuplicados(S.db.clientes);
  const avisos = L.avisosDeCliente(c, dup, hoy);
  const tel = L.telefonoInternacional(c.celular);
  const otros = L.otrosDuplicados(c, dup).map(S.buscar).filter(Boolean);
  const hist = S.historialDe(id).slice(0, 40);
  const ult = S.ultimoPagoRegistrado(c);
  const extras = S.db.config.camposPersonalizados.filter((x) => c.extra?.[x.clave] || !x.archivado);

  const cuerpo = `
    <div class="seccion destacado">
      <div><span class="insignia ${e.clase}">${e.icono} ${e.etiqueta}</span>
        <div class="dias ${e.clase}" style="margin-top:6px">${L.textoDias(e)}</div></div>
      <div style="text-align:right"><div class="mini">Próximo pago</div><div class="grande">${c.proximo_pago ? L.fmtFecha(c.proximo_pago) : '—'}</div>
        ${c.ultimo_recordatorio ? `<div class="mini">Último recordatorio: ${L.fmtFecha(c.ultimo_recordatorio)}</div>` : ''}
        <div class="mini">${esc(c.periodicidad) || 'Sin periodicidad'}${L.textoDiaPago(c) ? ' · <b>' + L.textoDiaPago(c) + '</b>' : ''}</div></div>
    </div>
    ${e.codigo === 'BAJA' ? `<div class="banner mal"><p>Dado de baja${c.baja_fecha ? ' el ' + L.fmtFecha(c.baja_fecha) : ''}${c.baja_motivo ? ': ' + esc(c.baja_motivo) : ''}. Si vuelve a cotizar, usa «Reactivar». Este estado tiene prioridad sobre las fechas de pago.</p></div>` : ''}
    <div class="seccion acc-fila">
      ${e.codigo === 'BAJA' ? '' : `<button class="btn primario" data-accion="pago" data-id="${id}">Registrar pago</button>`}
      <button class="btn" data-accion="editar" data-id="${id}">Editar</button>
      ${tel ? `<a class="btn" href="tel:+${tel}">Llamar</a>${e.codigo === 'MOROSO' || e.codigo === 'POR_VENCER'
        ? `<button class="btn btn-wa" data-accion="recordar" data-id="${id}">💬 Recordar pago</button>`
        : `<a class="btn" href="${L.enlaceWhatsApp(c.celular, '')}" target="_blank" rel="noopener">WhatsApp</a>`}` : ''}
      ${c.baja ? `<button class="btn" data-accion="reactivar" data-id="${id}">Reactivar</button>` : `<button class="btn" data-accion="baja" data-id="${id}">Dar de baja</button>`}
      <button class="btn peligro" data-accion="eliminar" data-id="${id}">Eliminar</button>
    </div>
    ${avisos.length ? `<div class="seccion"><h3>Revisar</h3>
      ${avisos.map((a) => `<span class="etq ambar">${esc(L.TIPOS_AVISO[a])}</span>`).join('')}
      ${otros.length ? `<div class="mini" style="margin-top:8px">Coincide con: ${otros.map((o) => `<a href="#" data-accion="abrir" data-id="${o.id}">${esc(o.nombre)}</a> (${esc(o.proveedor)} · ${esc(o.opcion)})`).join('; ')}</div>` : ''}
      <div class="mini" style="margin-top:8px">Solo son avisos: la app no modifica estos datos por su cuenta.</div></div>` : ''}
    <div class="seccion"><h3>Datos</h3><dl class="datos">
      <div><dt>CURP</dt><dd>${esc(c.curp) || '—'}</dd></div>
      <div><dt>NSS</dt><dd>${esc(c.nss) || '—'}</dd></div>
      <div><dt>Celular</dt><dd>${esc(c.celular) || '—'}</dd></div>
      <div><dt>Fecha de inicio</dt><dd>${L.fmtFecha(c.fecha_inicio)}</dd></div>
      <div><dt>Opción</dt><dd>${esc(c.opcion) || '—'}</dd></div>
      <div><dt>Proveedor</dt><dd>${esc(c.proveedor) || '—'}</dd></div>
      <div><dt>Comisión</dt><dd>${c.comision ?? '—'}</dd></div>
      ${extras.map((x) => `<div><dt>${esc(x.etiqueta)}</dt><dd>${esc(c.extra?.[x.clave]) || '—'}</dd></div>`).join('')}
      ${c.notas ? `<div style="grid-column:1/-1"><dt>Notas</dt><dd style="white-space:pre-wrap">${esc(c.notas)}</dd></div>` : ''}
    </dl>${c.origen ? `<div class="mini" style="margin-top:10px">Origen: ${esc(c.origen.archivo)} · ${esc(c.origen.hoja)} · fila ${c.origen.fila}</div>` : ''}</div>
    <div class="seccion"><h3>Historial de pagos (${c.pagos.length})</h3>
      ${c.pagos.length ? `<ul class="lista-simple">${[...c.pagos].reverse().map((p) => `<li>
        <b>${L.fmtFecha(p.fecha_pago)}</b> · ${dinero(p.monto)}${p.metodo ? ' · ' + esc(p.metodo) : ''}
        <div class="mini">Cubre desde ${L.fmtFecha(p.periodo_desde)} · siguiente vencimiento ${L.fmtFecha(p.periodo_hasta)}${p.nota ? ' · ' + esc(p.nota) : ''}</div>
        <button class="btn chico" data-accion="comprobante" data-id="${id}" data-pago="${esc(p.id)}" style="margin-top:6px">📲 ${p.comprobante_enviado ? 'Reenviar comprobante <span class="mini">(✓ enviado)</span>' : 'Enviar comprobante'}</button></li>`).join('')}</ul>
        <button class="btn chico peligro" data-accion="anular" data-id="${id}" style="margin-top:8px">Anular último pago (${L.fmtFecha(ult.fecha_pago)})</button>`
      : '<p class="mini">Aún no hay pagos registrados.</p>'}</div>
    <div class="seccion"><h3>Historial de cambios</h3>
      ${hist.length ? `<ul class="lista-simple">${hist.map((h) => `<li><div class="mini">${L.fmtFechaHora(h.ts)}</div>${esc(h.detalle)}
        ${(h.cambios || []).map((x) => `<div class="cambio">${esc(x.campo)}: <del>${esc(x.antes ?? '—')}</del> → <ins>${esc(x.despues ?? '—')}</ins></div>`).join('')}</li>`).join('')}</ul>`
      : '<p class="mini">Sin cambios registrados.</p>'}</div>`;

  const datos = { titulo: c.nombre || 'Cliente', cuerpo: cuerpo, pie: '' };
  if (ventanaExistente && pila.includes(ventanaExistente)) {
    const sc = ventanaExistente.q('.modal-cuerpo').scrollTop;
    ventanaExistente.poner(datos);
    ventanaExistente.q('.modal-cuerpo').scrollTop = sc;
    return ventanaExistente;
  }
  const v = ventana({ ...datos, ancho: true });
  v.detalleId = id;
  return v;
}

function refrescarDetalleAbierto(id) {
  for (const v of pila) if (v.detalleId === id) abrirDetalle(id, v);
}

// =====================================================================
// Formulario de cliente
// =====================================================================
function campoExtraHTML(x, valor) {
  const n = `x:${x.clave}`;
  const v = esc(valor ?? '');
  if (x.tipo === 'nota') return `<label class="completo">${esc(x.etiqueta)}<textarea name="${n}">${v}</textarea></label>`;
  const tipo = x.tipo === 'numero' ? 'number" step="any' : x.tipo === 'fecha' ? 'date' : 'text';
  return `<label>${esc(x.etiqueta)}<input type="${tipo}" name="${n}" value="${v}"></label>`;
}

// ---------- Selector de periodicidad (con «Personalizado»: cada N días) ----------
function campoPeriodicidad(valor, { nombre = 'periodicidad', vacio = '', requerido = false } = {}) {
  const n = L.diasDePeriodicidad(valor);
  return `<select name="${nombre}" ${requerido ? 'required' : ''}>
      ${vacio ? `<option value="">${vacio}</option>` : ''}
      ${Object.keys(L.PERIODICIDADES).map((p) => `<option ${valor === p ? 'selected' : ''}>${p}</option>`).join('')}
      <option value="personalizado" ${n ? 'selected' : ''}>Personalizado (cada cierto número de días)</option></select>
    <span class="per-dias" data-per="${nombre}" ${n ? '' : 'hidden'}>Cada
      <input type="number" name="${nombre}_dias" min="1" max="${L.MAX_DIAS_PERIODO}" inputmode="numeric" value="${n || ''}" placeholder="15"> días</span>`;
}

/** Devuelve la periodicidad elegida ('' si falta o si los días personalizados no son válidos). */
function leerPeriodicidad(form, nombre = 'periodicidad') {
  const v = form.elements[nombre].value;
  if (v !== 'personalizado') return v;
  const n = parseInt(form.elements[`${nombre}_dias`].value, 10);
  return n >= 1 && n <= L.MAX_DIAS_PERIODO ? L.periodicidadDias(n) : '';
}

function enlazarPeriodicidad(form, nombre = 'periodicidad') {
  const sel = form.elements[nombre];
  const caja = form.querySelector(`[data-per="${nombre}"]`);
  sel.addEventListener('change', () => {
    caja.hidden = sel.value !== 'personalizado';
    if (!caja.hidden) form.elements[`${nombre}_dias`].focus();
  });
}

const AVISO_DIAS = `Escribe cada cuántos días paga (de 1 a ${L.MAX_DIAS_PERIODO})`;

export function abrirFormulario(id) {
  const c = id ? S.buscar(id) : null;
  const v = c || { nombre: '', curp: '', nss: '', celular: '', fecha_inicio: '', opcion: '', proveedor: '', comision: '', periodicidad: '', proximo_pago: '', notas: '', extra: {} };
  const extras = S.db.config.camposPersonalizados.filter((x) => !x.archivado);
  const cuerpo = `<form id="f-cliente" novalidate autocomplete="off">
    <div class="rejilla dos">
      <label class="completo">Nombre completo *<input name="nombre" value="${esc(v.nombre)}" required autocapitalize="characters"></label>
      <label>CURP<input name="curp" value="${esc(v.curp)}" autocapitalize="characters" autocomplete="off" spellcheck="false"><div class="aviso-campo" data-aviso="curp"></div></label>
      <label>NSS<input name="nss" value="${esc(v.nss)}" inputmode="numeric" autocomplete="off"><div class="aviso-campo" data-aviso="nss"></div></label>
      <label class="completo">Celular <input name="celular" value="${esc(v.celular)}" inputmode="tel"><div class="ayuda">Puedes anotar también el nombre del asesor, como en tu Excel.</div></label>
      <label>Fecha de inicio<input type="date" name="fecha_inicio" value="${esc(v.fecha_inicio || '')}"><div class="ayuda">El día de esta fecha es el día de pago (ej. 24 = paga cada 24).</div></label>
      <label>Comisión<input type="number" step="any" name="comision" value="${esc(v.comision ?? '')}" inputmode="decimal"></label>
      <label>Opción<input name="opcion" value="${esc(v.opcion)}" list="lista-opciones"></label>
      <label>Proveedor<input name="proveedor" value="${esc(v.proveedor)}" list="lista-proveedores"></label>
      <label>Periodicidad de pago
        ${campoPeriodicidad(v.periodicidad, { vacio: 'Sin definir' })}</label>
      <label>Próximo pago<input type="date" name="proximo_pago" value="${esc(v.proximo_pago || '')}">
        <div class="ayuda">Se actualiza solo al registrar un pago.</div></label>
      ${extras.map((x) => campoExtraHTML(x, v.extra?.[x.clave])).join('')}
      <label class="completo">Notas<textarea name="notas">${esc(v.notas)}</textarea></label>
    </div>
    <datalist id="lista-opciones">${[...new Set(S.db.clientes.map((k) => k.opcion).filter(Boolean))].map((o) => `<option value="${esc(o)}">`).join('')}</datalist>
    <datalist id="lista-proveedores">${[...new Set(S.db.clientes.map((k) => k.proveedor).filter(Boolean))].map((o) => `<option value="${esc(o)}">`).join('')}</datalist>
  </form>`;
  const ven = ventana({
    titulo: c ? 'Editar cliente' : 'Nuevo cliente', cuerpo, fondoCierra: false,
    pie: `<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn primario" type="submit" form="f-cliente">Guardar</button>`,
  });
  const form = ven.q('#f-cliente');

  const revisar = () => {
    const curp = form.curp.value.trim();
    ven.q('[data-aviso="curp"]').textContent = curp && curp.length !== 18 ? `Tiene ${curp.length} caracteres (una CURP tiene 18). Puedes guardar igual.` : '';
    const nss = form.nss.value.trim();
    ven.q('[data-aviso="nss"]').textContent = nss && !/^\d{11}$/.test(nss) ? 'El NSS normalmente tiene 11 dígitos. Puedes guardar igual.' : '';
  };
  form.addEventListener('input', revisar);
  revisar();
  enlazarPeriodicidad(form);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const datos = Object.fromEntries([...fd.entries()].filter(([k]) => !k.startsWith('x:')));
    if (!String(datos.nombre || '').trim()) { form.nombre.focus(); return aviso('El nombre es obligatorio', true); }
    datos.periodicidad = leerPeriodicidad(form);
    delete datos.periodicidad_dias;
    if (form.periodicidad.value === 'personalizado' && !datos.periodicidad) return aviso(AVISO_DIAS, true);
    datos.extra = {};
    for (const [k, val] of fd.entries()) if (k.startsWith('x:')) datos.extra[k.slice(2)] = val;
    if (datos.proximo_pago && !datos.periodicidad && !c?.periodicidad) {
      return aviso('Elige la periodicidad para poder calcular los siguientes pagos', true);
    }
    seguro(async () => {
      if (c) {
        await S.editarCliente(c.id, datos);
        aviso('Cambios guardados');
        ven.cerrar();
        render();
        refrescarDetalleAbierto(c.id);
      } else {
        const nuevo = await S.agregarCliente(datos);
        aviso('Cliente agregado');
        ven.cerrar();
        render();
        abrirDetalle(nuevo.id);
      }
    });
  });
  return ven;
}

// =====================================================================
// Registrar pago
// =====================================================================
export function abrirPago(id) {
  const c = S.buscar(id);
  const { hoy, aviso: dias } = ctx();
  const cuerpo = `<form id="f-pago" novalidate>
    <div class="rejilla dos">
      <label>Fecha en que pagó *<input type="date" name="fecha_pago" value="${hoy}" required></label>
      <label>Monto (opcional)<input type="number" step="0.01" name="monto" inputmode="decimal" placeholder="0.00"></label>
      <label>Forma de pago (opcional)<input name="metodo" list="formas" placeholder="Efectivo, transferencia…"></label>
      <label>Periodicidad *${campoPeriodicidad(c.periodicidad, { vacio: c.periodicidad ? '' : 'Elegir…', requerido: true })}</label>
      ${c.proximo_pago ? '' : `<label class="completo">Este pago cubre a partir del<input type="date" name="cubre_desde" value="${hoy}"><div class="ayuda">Este cliente aún no tiene fecha de próximo pago; se calculará a partir de esta fecha.</div></label>`}
      <label class="completo">Nota (opcional)<input name="nota"></label>
      <label class="completo">Nuevo próximo pago<input type="date" name="nuevo_proximo">
        <div class="ayuda">Se calcula solo según la periodicidad. Puedes ajustarlo si hace falta.</div></label>
    </div>
    <div class="seccion" style="margin-top:12px" id="prev-pago"></div>
    <datalist id="formas"><option value="Efectivo"><option value="Transferencia"><option value="Depósito"><option value="Tarjeta"></datalist>
  </form>`;
  const ven = ventana({
    titulo: `Registrar pago · ${c.nombre}`, cuerpo, fondoCierra: false,
    pie: `<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn primario" type="submit" form="f-pago">Registrar pago</button>`,
  });
  const form = ven.q('#f-pago');
  let manual = false;

  const calc = () => {
    const per = leerPeriodicidad(form) || null;
    const r = S.calcularPago(c, { fecha_pago: form.fecha_pago.value, periodicidad: per, cubre_desde: form.cubre_desde?.value });
    if (!manual) form.nuevo_proximo.value = r.siguiente || '';
    const nuevo = form.nuevo_proximo.value;
    const sim = { ...c, proximo_pago: nuevo || null, periodicidad: per };
    const e = L.calcularEstado(sim, L.hoyISO(), dias);
    ven.q('#prev-pago').innerHTML = nuevo
      ? `<div class="mini">Antes: ${c.proximo_pago ? 'vencía el ' + L.fmtFecha(c.proximo_pago) : 'sin fecha de pago'}</div>
         <div>Después: próximo pago el <b>${L.fmtFecha(nuevo)}</b> → <span class="insignia ${e.clase}">${e.icono} ${e.etiqueta}</span> <span class="dias ${e.clase}">${L.textoDias(e)}</span></div>`
      : '<div class="mini">Elige la periodicidad para calcular el próximo pago.</div>';
  };
  form.addEventListener('input', (ev) => { if (ev.target.name === 'nuevo_proximo') manual = !!ev.target.value; else if (['periodicidad', 'periodicidad_dias', 'fecha_pago', 'cubre_desde'].includes(ev.target.name)) manual = false; calc(); });
  enlazarPeriodicidad(form);
  calc();

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!form.fecha_pago.value) return aviso('Indica la fecha del pago', true);
    if (!leerPeriodicidad(form)) return aviso(form.periodicidad.value === 'personalizado' ? AVISO_DIAS : 'Elige la periodicidad', true);
    if (!form.nuevo_proximo.value) return aviso('No se pudo calcular el próximo pago', true);
    seguro(async () => {
      const fd = Object.fromEntries(new FormData(form).entries());
      fd.periodicidad = leerPeriodicidad(form);
      delete fd.periodicidad_dias;
      const pago = await S.registrarPago(id, fd);
      ven.cerrar();
      render();
      refrescarDetalleAbierto(id);
      if (S.db.config.preguntarComprobante === false) aviso('Pago registrado');
      else abrirComprobante(id, pago.id, { recienRegistrado: true });
    });
  });
}

// Comprobante de pago por WhatsApp: se ofrece al registrar un pago y se puede reenviar desde el historial.
export function abrirComprobante(id, pagoId, { recienRegistrado = false } = {}) {
  const c = S.buscar(id);
  const pago = c?.pagos.find((p) => p.id === pagoId);
  if (!pago) return;
  const texto = L.mensajeComprobante(c, pago, S.db.config.plantillaComprobante, N.estado.perfil?.nombre || '');
  const tel = L.telefonoInternacional(c.celular);
  const v = ventana({
    titulo: recienRegistrado ? '✅ Pago registrado' : '📲 Comprobante de pago',
    cuerpo: `<p style="margin-bottom:10px">${tel
        ? `¿Le mandas el comprobante a <b>${esc(L.nombreBonito(c.nombre))}</b> por WhatsApp? Así queda tranquilo de que recibiste su pago.`
        : `<b>${esc(L.nombreBonito(c.nombre))}</b> no tiene un celular válido. Puedes copiar el mensaje, o agregar su celular para enviárselo por WhatsApp.`}</p>
      <label>Mensaje (puedes cambiarlo antes de enviar)<textarea data-texto rows="6">${esc(texto)}</textarea></label>
      ${pago.comprobante_enviado ? `<p class="mini" style="margin-top:6px">✓ Ya se envió el ${L.fmtFechaHora(pago.comprobante_enviado)}.</p>` : ''}
      ${recienRegistrado ? '<label class="radio-tarjeta" style="margin-top:10px"><input type="checkbox" data-preguntar checked><span>Preguntarme siempre al registrar un pago</span></label>' : ''}
      <p class="mini" style="margin-top:8px">Cambia el mensaje de siempre en ☰ → Mensajes de cobro.</p>`,
    pie: `<button class="btn" data-cerrar type="button">Ahora no</button>
      ${tel ? '<button class="btn primario" data-enviar type="button">📲 Enviar por WhatsApp</button>' : '<button class="btn primario" data-copiar type="button">📋 Copiar mensaje</button>'}`,
    onCerrar: () => {
      if (recienRegistrado && v.q('[data-preguntar]') && !v.q('[data-preguntar]').checked) {
        S.guardarConfig({ preguntarComprobante: false })
          .then(() => aviso('Listo: ya no te preguntaremos. Lo puedes enviar desde el historial de pagos del cliente.'))
          .catch(() => {});
      }
    },
  });
  v.q('[data-enviar]')?.addEventListener('click', () => {
    const url = L.enlaceWhatsApp(c.celular, v.q('[data-texto]').value.trim());
    if (!url) return aviso('Este cliente no tiene un celular válido', true);
    window.open(url, '_blank', 'noopener');
    S.anotarComprobante(id, pagoId).then(() => refrescarDetalleAbierto(id)).catch(() => {});
    v.cerrar();
  });
  v.q('[data-copiar]')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(v.q('[data-texto]').value.trim())
      .then(() => aviso('Mensaje copiado'))
      .catch(() => aviso('No se pudo copiar; selecciónalo y cópialo a mano', true));
  });
}

// =====================================================================
// Baja / reactivar / eliminar / anular
// =====================================================================
function abrirBaja(id) {
  const c = S.buscar(id);
  const v = ventana({
    titulo: 'Dar de baja', fondoCierra: false,
    cuerpo: `<p style="margin-bottom:12px"><b>${esc(c.nombre)}</b> pasará a ⚫ DADO DE BAJA. Puedes reactivarlo cuando quieras.</p>
      <form id="f-baja"><label>Motivo (opcional)<input name="motivo" placeholder="Ej. canceló, no contesta…"></label></form>`,
    pie: `<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn primario" type="submit" form="f-baja">Dar de baja</button>`,
  });
  v.q('#f-baja').addEventListener('submit', (ev) => {
    ev.preventDefault();
    seguro(async () => {
      await S.darDeBaja(id, v.q('[name=motivo]').value);
      v.cerrar(); aviso('Cliente dado de baja'); render(); refrescarDetalleAbierto(id);
    });
  });
}

async function accionEliminar(id) {
  const c = S.buscar(id);
  const ok = await confirmar({
    titulo: 'Eliminar cliente',
    mensaje: `¿Eliminar a <b>${esc(c.nombre)}</b> con sus ${c.pagos.length} pago(s) registrados?<br><span class="mini">Quedará en la Papelera, desde donde podrás restaurarlo.</span>`,
    ok: 'Sí, eliminar', peligro: true,
  });
  if (!ok) return;
  await seguro(async () => {
    await S.eliminarCliente(id);
    for (const v of [...pila]) if (v.detalleId === id) v.cerrar();
    aviso('Cliente eliminado (está en la Papelera)');
    render();
  });
}

async function accionAnular(id) {
  const c = S.buscar(id);
  const p = S.ultimoPagoRegistrado(c);
  const ok = await confirmar({
    titulo: 'Anular último pago',
    mensaje: `¿Anular el pago del <b>${L.fmtFecha(p.fecha_pago)}</b>? El próximo pago volverá a <b>${p.prev_proximo ? L.fmtFecha(p.prev_proximo) : 'sin fecha'}</b>.`,
    ok: 'Sí, anular', peligro: true,
  });
  if (!ok) return;
  await seguro(async () => { await S.anularUltimoPago(id); aviso('Pago anulado'); render(); refrescarDetalleAbierto(id); });
}

// =====================================================================
// Menú de datos
// =====================================================================
// Opción de menú. `destacada`: resaltada en ámbar (hay algo pendiente); `sub`: abre otro menú (muestra ›).
const opMenu = (acc, ico, tit, desc, { destacada = false, sub = false } = {}) => `<button class="opcion-menu${destacada ? ' destacada' : ''}" data-accion="${acc}">
  <span class="ico">${ico}</span><span class="txt"><b>${tit}</b><span class="d">${desc}</span></span>${sub ? '<span class="ir" aria-hidden="true">›</span>' : ''}</button>`;
const grupoMenu = (titulo) => `<h3 class="menu-grupo">${titulo}</h3>`;

export function abrirMenu() {
  const sinFecha = S.db.clientes.filter((c) => !c.proximo_pago && !c.baja).length;
  const ult = S.db.config.ultimoRespaldo;
  const v = ventana({
    titulo: 'Menú',
    cuerpo: [
      opMenu('plan', '⭐', 'Mi plan', `${esc(N.estado.planEf.nombre)}${N.estado.planEf.ilimitado ? '' : ` · ${S.db.clientes.length} de ${N.estado.planEf.limite} clientes`}`),
      grupoMenu('Cobranza'),
      opMenu('asistente', '🗓️', 'Fechas de cobro', sinFecha ? `<b class="txt-ambar">${sinFecha} cliente(s) sin fecha de cobro.</b> Pónsela en 3 pasos.` : 'Todos tus clientes tienen fecha de cobro.', { destacada: !!sinFecha }),
      opMenu('vencimientos', '🔔', 'Vencimientos', `🟡 cuando faltan ${S.db.config.diasAviso} días o menos · sugerida: ${esc(S.db.config.periodicidadDefecto)}`),
      opMenu('mensajes', '📲', 'Mensajes de cobro', 'Recordatorios y comprobante de pago por WhatsApp.'),
      grupoMenu('Tus datos'),
      opMenu('archivos', '📂', 'Importar y exportar', `Excel y respaldos · ${ult ? 'último respaldo: ' + L.fmtFecha(L.hoyISO(new Date(ult))) : '<b class="txt-ambar">aún sin respaldo</b>'}`, { sub: true }),
      opMenu('bloqueo', '🔒', 'Bloqueo con PIN', B.activo() ? `Activado${B.conBiometria() ? ' · también con ' + B.nombreBiometria() : ''}.` : 'Que nadie vea tu cartera si toma tu teléfono.'),
      opMenu('papelera', '🗑️', 'Papelera', S.db.papelera.length ? `${S.db.papelera.length} cliente(s) eliminados.` : 'Vacía.'),
      opMenu('config', '⚙️', 'Configuración', 'Campos personalizados, almacenamiento y deshacer cambios.'),
      grupoMenu('Ayuda y cuenta'),
      opMenu('ayuda', '💬', 'Ayuda y soporte', N.soporte.noLeidos ? `🔴 ${N.soporte.noLeidos} respuesta(s) nueva(s) de soporte` : 'Escríbenos: te respondemos en el mismo chat.'),
      opMenu('cuenta', '👤', 'Mi cuenta', `${N.estado.usuario ? esc(N.estado.usuario) + ' · ' : ''}cerrar sesión o eliminar cuenta.`),
    ].join(''),
  });
  v.el.addEventListener('click', (e) => { if (e.target.closest('.opcion-menu')) v.cerrar(); });
}

// Importar, exportar, respaldar y restaurar, juntos en un solo lugar.
export function abrirArchivos() {
  const v = ventana({
    titulo: '📂 Importar y exportar',
    cuerpo: [
      grupoMenu('Guardar una copia'),
      opMenu('respaldo', '💾', 'Descargar respaldo', 'Guarda <b>todos</b> tus datos en el teléfono. Hazlo cada mes: con él recuperas todo si cambias de celular.'),
      opMenu('exportar', '📤', 'Exportar a Excel', 'Tus clientes, pagos e historial en un Excel para verlo o compartirlo.'),
      grupoMenu('Traer datos'),
      opMenu('importar', '📥', 'Importar Excel', 'Agrega clientes desde tu archivo .xlsx. No borra nada de lo que ya tienes.'),
      opMenu('restaurar', '♻️', 'Restaurar respaldo', 'Reemplaza tus datos por los de un respaldo. Antes guardamos una copia de lo actual.'),
    ].join(''),
  });
  v.el.addEventListener('click', (e) => { if (e.target.closest('.opcion-menu')) v.cerrar(); });
}

// ---------- Importar ----------
function pedirArchivo(accept, alElegir) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = accept;
  inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.addEventListener('change', () => { const f = inp.files[0]; inp.remove(); if (f) alElegir(f); });
  inp.addEventListener('cancel', () => inp.remove());
  inp.click();
}

const ACEPTA_EXCEL = '.xlsx,.xls,.xlsm,.csv,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/vnd.oasis.opendocument.spreadsheet';
const URL_APP = 'carteraasesor.com/app';

// Barra de avance del importador: 1 Tu archivo · 2 Columnas · 3 Revisar.
const barraImportar = (n) => `<ol class="barra-pasos" aria-label="Paso ${n} de 3">${['Tu archivo', 'Columnas', 'Revisar'].map((t, i) =>
  `<li class="${i + 1 < n ? 'hecho' : i + 1 === n ? 'actual' : ''}"${i + 1 === n ? ' aria-current="step"' : ''}><span>${i + 1 < n ? '✓' : i + 1}</span>${t}</li>`).join('')}</ol>`;
// En cada pantalla del importador: un atajo al chat de soporte con el mensaje ya empezado.
const ayudaImportar = `<p class="ayuda-importar">¿Te atoraste? <a href="#" data-accion="ayuda" data-texto="Necesito ayuda para importar mi Excel: ">Escríbenos por el chat de ayuda</a> y te acompañamos.</p>`;
const opcionPantalla = (pant, ico, tit, desc) => `<button class="opcion-menu" data-pant="${pant}" type="button">
  <span class="ico">${ico}</span><span class="txt"><b>${tit}</b><span class="d">${desc}</span></span><span class="ir" aria-hidden="true">›</span></button>`;

// Paso 1: ¿dónde está tu lista? Cada respuesta lleva a la forma más fácil de elegir el archivo.
export function abrirImportar() {
  const ios = esIOS();
  const movil = ios || /Android|Mobi/i.test(navigator.userAgent);
  const cuenta = N.estado.usuario ? `<b>${esc(N.estado.usuario)}</b>` : 'tu mismo correo';
  const botonElegir = (texto = '📥 Elegir mi archivo') => `<button class="btn primario" data-elegir type="button">${texto}</button>`;
  const atras = '<button class="btn" data-pant="inicio" type="button">Atrás</button>';

  const pantallas = {
    inicio: () => ({
      cuerpo: `${barraImportar(1)}
        <h3 style="margin-bottom:4px">¿Dónde tienes tu lista de clientes?</h3>
        <p class="mini" style="margin-bottom:12px">Toma unos 2 minutos. <b>No se borra nada</b> de lo que ya tienes y tu archivo no se modifica.</p>
        ${opcionPantalla('aqui', movil ? '📱' : '💻', movil ? 'En este teléfono' : 'En esta computadora', 'Es un Excel que ya tengo aquí (o me lo mandaron por WhatsApp o correo).')}
        ${movil && N.nubeActiva ? opcionPantalla('compu', '🖥️', 'En mi computadora', 'Te decimos la forma más fácil de pasarla.') : ''}
        ${opcionPantalla('otro', '🗂️', 'En Google, en Numbers o en papel', 'O no la tengo en Excel, o está muy desordenada.')}
        ${ayudaImportar}`,
      pie: '',
    }),
    aqui: () => ({
      cuerpo: `${barraImportar(1)}
        <h3 style="margin-bottom:8px">Elige tu archivo</h3>
        <ol class="guia-ios">
          <li class="paso-ios"><span class="num">1</span><div>Toca <b>Elegir mi archivo</b> (abajo).</div></li>
          <li class="paso-ios"><span class="num">2</span><div>${movil
            ? `Se abre la lista de archivos del teléfono. Busca tu Excel en <b>Recientes</b>${ios ? ' o en <b>Explorar → En mi iPhone</b>' : ' o en <b>Descargas</b>'}.`
            : 'Se abre una ventana: busca tu Excel (normalmente está en <b>Descargas</b> o en <b>Documentos</b>) y ábrelo.'}</div></li>
          <li class="paso-ios"><span class="num">3</span><div>La app reconoce tus columnas. <b>Tú solo revisas y confirmas.</b></div></li>
          ${!movil && N.nubeActiva ? '<li class="paso-ios"><span class="num">4</span><div>Listo: abre la app en tu celular con tu misma cuenta y <b>tus clientes ya estarán ahí</b>.</div></li>' : ''}
        </ol>
        ${movil ? `<details class="ayuda-ios"><summary>¿No aparece? Está en un chat de WhatsApp o en un correo</summary>
          <p>Abre ese chat o correo y toca el archivo. ${ios
            ? 'Luego toca <b>Compartir</b> (el cuadro con la flecha ↑) → <b>Guardar en Archivos</b> → <b>Guardar</b>.'
            : 'Luego toca <b>⋮</b> (tres puntos) → <b>Guardar</b> o <b>Descargar</b>.'} Vuelve aquí y ya te aparece en <b>Recientes</b>.</p></details>` : ''}
        <p class="mini" style="margin-top:10px">Sirven archivos de Excel (.xlsx o .xls) y también .csv.</p>
        ${ayudaImportar}`,
      pie: `${atras}${botonElegir()}`,
    }),
    compu: () => ({
      cuerpo: `${barraImportar(1)}
        <h3 style="margin-bottom:8px">Lo más fácil: hazlo desde la computadora</h3>
        <ol class="guia-ios">
          <li class="paso-ios"><span class="num">1</span><div>En tu computadora abre <b>${URL_APP}</b>
            <div class="mini">Puedes mandarte el enlace: <button class="btn chico" data-copiar type="button">📋 Copiar enlace</button></div></div></li>
          <li class="paso-ios"><span class="num">2</span><div>Entra con ${cuenta}.</div></li>
          <li class="paso-ios"><span class="num">3</span><div>Toca <b>☰ Menú → Importar y exportar → Importar Excel</b> y sigue los mismos pasos.</div></li>
        </ol>
        <div class="banner info"><p>☁️ Al terminar, <b>tus clientes aparecen solos en este teléfono</b>. No tienes que hacer nada más aquí.</p></div>
        <details class="ayuda-ios"><summary>¿No tienes la computadora a la mano?</summary>
          <p>Mándate el Excel a ti mismo por WhatsApp o por correo. Ábrelo en este teléfono y ${ios
            ? 'toca <b>Compartir</b> → <b>Guardar en Archivos</b>'
            : 'toca <b>⋮</b> → <b>Descargar</b>'}. Después toca <b>Ya lo tengo en el teléfono</b>.</p></details>
        ${ayudaImportar}`,
      pie: `${atras}<button class="btn" data-pant="aqui" type="button">Ya lo tengo en el teléfono</button>`,
    }),
    otro: () => ({
      cuerpo: `${barraImportar(1)}
        <h3 style="margin-bottom:8px">Sin problema, elige tu caso</h3>
        <details class="caso-importar"><summary>📗 Está en Google (Hojas de cálculo o Drive)</summary>
          <p><b>En la computadora:</b> abre tu hoja → <b>Archivo → Descargar → Microsoft Excel (.xlsx)</b>.</p>
          <p><b>En el celular:</b> abre tu hoja en la app Hojas de cálculo → <b>⋮</b> → <b>Compartir y exportar → Guardar como → Excel</b>.</p>
          <p>Luego toca <b>Elegir mi archivo</b> y elige el que descargaste.</p></details>
        <details class="caso-importar"><summary>🍏 Está en Numbers (iPhone o Mac)</summary>
          <p>Abre el archivo → toca <b>···</b> (o <b>Compartir</b>) → <b>Exportar → Excel</b> → guárdalo en Archivos.</p>
          <p>Luego toca <b>Elegir mi archivo</b> y elige el que exportaste.</p></details>
        <details class="caso-importar"><summary>📝 En papel, en notas o muy desordenada</summary>
          <p>Descarga la <b>plantilla</b>: es un Excel ya preparado. Escribe <b>un cliente por fila</b> (basta con el nombre y el celular) y guárdalo. Luego toca <b>Elegir mi archivo</b>.</p>
          <p><button class="btn" data-plantilla type="button">📄 Descargar plantilla</button></p>
          <p>¿Son pocos? También puedes agregarlos uno por uno con el botón <b>+ Nuevo cliente</b>.</p></details>
        <details class="caso-importar"><summary>📄 Es un archivo .csv</summary>
          <p>También sirve: toca <b>Elegir mi archivo</b> y elígelo directo.</p></details>
        ${ayudaImportar}`,
      pie: `${atras}${botonElegir()}`,
    }),
    error: (motivo) => ({
      cuerpo: `${barraImportar(1)}
        <div class="banner mal"><p><b>No pudimos leer ese archivo.</b> ${motivo ? esc(motivo) + '.' : ''}</p></div>
        <p style="margin:10px 0 6px">Lo más común es que:</p>
        <ul class="lista-simple">
          <li>Sea una <b>foto o un PDF</b> de la lista, no el archivo de Excel.</li>
          <li>Sea de <b>Numbers</b> o de <b>Google</b>: primero hay que guardarlo como Excel (<a href="#" data-pant="otro">ver cómo</a>).</li>
          <li>El Excel tenga <b>contraseña</b>: ábrelo, quítasela y guárdalo otra vez.</li>
          <li>La lista esté vacía o en otra hoja del archivo.</li>
        </ul>
        ${ayudaImportar}`,
      pie: `${atras}${botonElegir('📥 Probar con otro archivo')}`,
    }),
  };

  const v = ventana({ titulo: 'Traer mis clientes de Excel', cuerpo: '' });
  const ir = (pant, ...args) => { v.poner(pantallas[pant](...args)); v.q('.modal-cuerpo').scrollTop = 0; };
  ir('inicio');
  v.el.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pant]');
    if (p) { e.preventDefault(); ir(p.dataset.pant); return; }
    if (e.target.closest('[data-plantilla]')) seguro(async () => {
      if (await E.descargar(E.plantillaBytes(), 'Plantilla_Cartera_Asesor.xlsx', MIME_XLSX)) aviso('Plantilla descargada');
    });
    if (e.target.closest('[data-copiar]')) {
      navigator.clipboard?.writeText('https://' + URL_APP)
        .then(() => aviso('Enlace copiado: pégalo en WhatsApp o en tu correo'))
        .catch(() => aviso(`Escríbelo tal cual: ${URL_APP}`));
    }
    if (e.target.closest('[data-elegir]')) pedirArchivo(ACEPTA_EXCEL, (f) => seguro(async () => {
      let libro;
      try {
        libro = E.leerLibro(new Uint8Array(await f.arrayBuffer()), f.name);
      } catch (err) {
        ir('error', /hoja con datos/.test(err.message) ? 'El archivo no tiene una lista con datos' : '');
        return;
      }
      v.cerrar();
      asistenteImportar(libro);
    }));
  });
}

// Pasos 2 y 3: ¿qué dato tiene cada columna? → revisa y confirma.
function asistenteImportar(libro) {
  const sel = { paso: 1, hoja: 0, fila: 0, cols: [], mapeo: [] };
  const hoja = () => libro.hojas[sel.hoja];
  const analizar = (fila = E.detectarFilaTitulos(hoja())) => {
    sel.fila = fila;
    sel.cols = E.columnasDeHoja(hoja(), fila);
    sel.mapeo = E.sugerirMapeo(sel.cols);
  };
  analizar();
  const hayNombre = () => sel.mapeo.some((m) => m.campo === 'nombre');
  const etiquetaCampo = (c) => E.CAMPOS_IMPORTAR.find((x) => x.campo === c)?.etiqueta || '';
  let parsed = null, prep = null, lim = null;

  const opcionesFila = () => {
    const h = hoja();
    const X = globalThis.XLSX;
    const hasta = Math.min(h.rango.e.r, h.rango.s.r + 19);
    const ops = [`<option value="-1" ${sel.fila < 0 ? 'selected' : ''}>Mi archivo no tiene títulos</option>`];
    for (let r = h.rango.s.r; r <= hasta; r++) {
      const textos = [];
      for (let c = h.rango.s.c; c <= h.rango.e.c && textos.length < 3; c++) {
        const t = E.textoCelda(h.ws[X.utils.encode_cell({ r, c })]);
        if (t) textos.push(t.length > 18 ? t.slice(0, 17) + '…' : t);
      }
      if (textos.length) ops.push(`<option value="${r}" ${r === sel.fila ? 'selected' : ''}>Fila ${r + 1}: ${esc(textos.join(' · '))}</option>`);
    }
    return ops.join('');
  };

  const tarjetaColumna = (k, i) => {
    const m = sel.mapeo[i];
    const reconocida = m.por && m.campo !== E.EXTRA && m.campo !== E.IGNORAR;
    const clase = m.campo === E.IGNORAR ? 'ignorada' : m.campo === E.EXTRA ? '' : 'ok';
    return `<div class="col-imp ${clase}">
      <div class="col-imp-cab"><span class="col-letra">${esc(k.letra)}</span><b>${esc(k.titulo || 'Sin título')}</b>
        ${reconocida ? '<span class="col-imp-chip">✓ reconocida</span>' : ''}</div>
      <div class="col-imp-ej">${k.ejemplos.map((x) => esc(x.length > 28 ? x.slice(0, 27) + '…' : x)).join(' · ')}${k.conDato > k.ejemplos.length ? ' …' : ''}</div>
      <select data-col="${i}" aria-label="Qué dato tiene la columna ${esc(k.nombre)}">
        ${E.CAMPOS_IMPORTAR.map((x) => `<option value="${x.campo}" ${m.campo === x.campo ? 'selected' : ''}>${esc(x.etiqueta)}</option>`).join('')}
        <option value="${E.EXTRA}" ${m.campo === E.EXTRA ? 'selected' : ''}>Otro dato (guardarlo como «${esc(k.nombre)}»)</option>
        <option value="${E.IGNORAR}" ${m.campo === E.IGNORAR ? 'selected' : ''}>No importar esta columna</option>
      </select></div>`;
  };

  const pasos = {
    1: () => {
      const conDato = sel.cols.map((k, i) => [k, i]).filter(([k]) => k.conDato);
      const vacias = sel.cols.filter((k) => !k.conDato && k.titulo);
      const nombres = sel.mapeo.filter((m) => m.campo === 'nombre').length;
      const filas = Math.max(0, ...sel.cols.map((k) => k.conDato));
      const reconocidas = [...new Set(sel.mapeo.filter((m) => m.por && m.campo !== E.EXTRA && m.campo !== E.IGNORAR).map((m) => etiquetaCampo(m.campo)))];
      return {
        cuerpo: `${barraImportar(2)}
          <div class="imp-archivo">
            <div>📄 <b>${esc(libro.archivo)}</b> · unas <b>${filas}</b> fila(s) con datos</div>
            ${reconocidas.length ? `<div>✅ Ya reconocimos: <b>${reconocidas.map(esc).join(', ')}</b></div>` : ''}
            ${libro.hojas.length > 1 ? `<label>Tu archivo tiene varias hojas. ¿En cuál están tus clientes?<select data-hoja>${libro.hojas.map((h, i) => `<option value="${i}" ${i === sel.hoja ? 'selected' : ''}>${esc(h.nombre)} (${h.filas} filas)</option>`).join('')}</select></label>` : ''}
          </div>
          <h3 style="margin-bottom:6px">¿Qué dato tiene cada columna?</h3>
          <p class="mini" style="margin-bottom:10px">Cada tarjeta es una columna de tu Excel, con ejemplos de lo que trae. ${hayNombre() ? '<b>Si todo se ve bien, solo toca Siguiente.</b> ' : ''}Si alguna no corresponde, cámbiala en su lista.</p>
          ${conDato.map(([k, i]) => tarjetaColumna(k, i)).join('')}
          ${nombres > 1 ? `<p class="mini" style="margin-top:4px">El nombre se arma uniendo ${nombres} columnas en orden (ej. nombre + apellidos).</p>` : ''}
          ${vacias.length ? `<p class="mini" style="margin-top:8px">Columnas vacías (no se importan): ${vacias.map((k) => esc(k.titulo)).join(', ')}</p>` : ''}
          ${hayNombre() ? '' : '<div class="banner mal" style="margin-top:10px"><p>Falta decirnos qué columna tiene el <b>nombre del cliente</b>: búscala arriba y en su lista elige «Nombre del cliente». Si el nombre y los apellidos están separados, elígelo en cada una.</p></div>'}
          <details class="ayuda-ios" ${sel.verAvanzado || !hayNombre() ? 'open' : ''}><summary>¿Ves títulos como si fueran clientes, o datos raros?</summary>
            <p>Dinos en qué fila de tu Excel están los títulos de las columnas (Nombre, Celular…):</p>
            <label><select data-fila aria-label="Fila de los títulos">${opcionesFila()}</select></label></details>
          ${ayudaImportar}`,
        pie: `<button class="btn" data-otro type="button">Otro archivo</button><button class="btn primario" data-ir="2" type="button" ${hayNombre() ? '' : 'disabled'}>Siguiente</button>`,
      };
    },
    2: () => {
      parsed = E.construirImportacion(libro, hoja(), sel.fila, sel.mapeo);
      prep = S.prepararImportacion(parsed);
      lim = N.cupoPara(S.db.clientes.length, prep.nuevas.length);
      const rojas = prep.nuevas.filter((f) => f.rojas.length).length;
      const sinNombre = prep.nuevas.filter((f) => !f.datos.nombre).length;
      const av = parsed.avisos;
      const usados = [...new Set(sel.mapeo.map((m) => m.campo).filter((c) => c !== E.EXTRA && c !== E.IGNORAR))];
      const colFecha = usados.includes('proximo_pago') ? 'proximo_pago' : usados.includes('fecha_inicio') ? 'fecha_inicio' : null;
      const muestra = prep.nuevas.slice(0, 5);
      return {
        cuerpo: `${barraImportar(3)}
          <h3 style="margin-bottom:8px">Último paso: revisa y confirma</h3>
          <div class="imp-total"><b>${prep.nuevas.length}</b> cliente(s) nuevos para importar</div>
          ${prep.nuevas.length ? '' : '<div class="banner info"><p>Todos los clientes de este archivo <b>ya estaban en la app</b>: no hay nada nuevo que importar. Si esperabas ver clientes aquí, toca <b>Atrás</b> y revisa las columnas.</p></div>'}
          ${muestra.length ? `<div class="imp-tabla"><table>
            <thead><tr><th>Nombre</th>${usados.includes('celular') ? '<th>Celular</th>' : ''}${colFecha ? `<th>${colFecha === 'proximo_pago' ? 'Próx. pago' : 'Inicio'}</th>` : ''}</tr></thead>
            <tbody>${muestra.map((f) => `<tr><td>${esc(f.datos.nombre) || '<i>(sin nombre)</i>'}</td>${usados.includes('celular') ? `<td>${esc(f.datos.celular)}</td>` : ''}${colFecha ? `<td>${f.datos[colFecha] ? L.fmtFecha(f.datos[colFecha]) : f.fechaMala ? '<span class="txt-ambar">⚠️ no se entendió</span>' : ''}</td>` : ''}</tr>`).join('')}</tbody>
          </table>${prep.nuevas.length > muestra.length ? `<div class="mini" style="padding:6px 10px">…y ${prep.nuevas.length - muestra.length} más</div>` : ''}</div>` : ''}
          <ul class="lista-simple" style="margin-top:10px">
            <li>Datos que se importan: ${usados.map((c) => esc(etiquetaCampo(c))).join(', ')}${parsed.camposNuevos.length ? `, y como datos extra: ${parsed.camposNuevos.map((x) => esc(x.etiqueta)).join(', ')}` : ''}</li>
            ${prep.repetidas.length ? `<li><b>${prep.repetidas.length}</b> fila(s) ya importadas antes: se omiten para no duplicarlas.</li>` : ''}
            ${av.fechas ? `<li class="txt-ambar">⚠️ <b>${av.fechas}</b> cliente(s) con una fecha que no se entendió: quedan sin esa fecha y se la pones después.</li>` : ''}
            ${av.periodicidades ? `<li class="txt-ambar">⚠️ <b>${av.periodicidades}</b> cliente(s) con una periodicidad que no se reconoció (se aceptan Mensual, Trimestral, Semestral, Anual o «Cada 15 días»).</li>` : ''}
            ${sinNombre ? `<li class="txt-ambar">⚠️ <b>${sinNombre}</b> fila(s) sin nombre.</li>` : ''}
            ${av.ejemplo ? `<li>Se omite la fila de ejemplo de la plantilla.</li>` : ''}
            ${av.titulosRepetidos ? `<li>Se omiten ${av.titulosRepetidos} fila(s) que repiten los títulos.</li>` : ''}
            ${rojas ? `<li><b>${rojas}</b> fila(s) con celdas en <span style="color:#dc2626">rojo</span>.<label class="radio-tarjeta" style="margin-top:8px"><input type="checkbox" id="rojo-baja"><span>Importar las filas en rojo como ⚫ <b>DADO DE BAJA</b></span></label></li>` : ''}
            ${parsed.otrasHojas.length ? `<li class="mini">Otras hojas con datos (no se importan ahora): ${parsed.otrasHojas.map(esc).join(', ')}</li>` : ''}
          </ul>
          ${lim.permitido ? '' : N.estado.planEf.tipo === 'beta'
            ? `<div class="banner mal"><p>En la <b>beta gratuita</b> puedes tener hasta <b>${N.estado.planEf.limite}</b> clientes: caben <b>${lim.caben}</b> más, así que se importarán solo los primeros ${lim.caben}. ¿Necesitas más? Escríbenos por el chat de ayuda.</p></div>`
            : `<div class="banner mal"><p>Tu plan permite <b>${lim.caben}</b> cliente(s) más. Se importarán solo los primeros ${lim.caben}. Revisa ☰ → Mi plan.</p></div>`}
          <p class="mini" style="margin-top:10px">Cada valor se guarda tal cual venía en tu Excel. Nada se corrige automáticamente. ¿Te equivocaste? En ☰ → Configuración → «Deshacer último cambio grande».</p>
          ${ayudaImportar}`,
        pie: `<button class="btn" data-ir="1" type="button">Atrás</button>
          <button class="btn primario" data-ok type="button" ${lim.caben ? '' : 'disabled'}>Importar ${lim.caben} cliente(s)</button>`,
      };
    },
  };

  const v = ventana({ titulo: 'Importar Excel', cuerpo: '', fondoCierra: false });
  const pintar = () => {
    const cuerpo = v.q('.modal-cuerpo');
    const arriba = cuerpo.scrollTop;
    v.poner(pasos[sel.paso]());
    return (mantener) => { cuerpo.scrollTop = mantener ? arriba : 0; };
  };
  v.el.addEventListener('change', (e) => {
    if (e.target.matches('[data-hoja]')) { sel.hoja = Number(e.target.value); analizar(); pintar()(false); return; }
    if (e.target.matches('[data-fila]')) { sel.verAvanzado = true; analizar(Number(e.target.value)); pintar()(false); return; }
    if (e.target.matches('[data-col]')) {
      const i = Number(e.target.dataset.col);
      const campo = e.target.value;
      let movida = '';
      // Cada dato va en una sola columna (menos el nombre, que puede venir en varias).
      if (campo !== 'nombre' && campo !== E.EXTRA && campo !== E.IGNORAR) {
        sel.mapeo.forEach((m, j) => {
          if (j !== i && m.campo === campo) { sel.mapeo[j] = { campo: E.EXTRA, por: null }; movida = sel.cols[j].nombre; }
        });
      }
      sel.mapeo[i] = { campo, por: null };
      pintar()(true);
      if (movida) aviso(`«${etiquetaCampo(campo)}» estaba en la columna «${movida}»; esa quedó como otro dato`);
    }
  });
  v.el.addEventListener('click', (e) => {
    const ir = e.target.closest('[data-ir]');
    if (ir) { sel.paso = Number(ir.dataset.ir); pintar()(false); }
    if (e.target.closest('[data-otro]')) { v.cerrar(); abrirImportar(); }
    if (e.target.closest('[data-ok]')) seguro(async () => {
      parsed.rojoEsBaja = !!v.q('#rojo-baja')?.checked;
      const n = await S.aplicarImportacion(parsed, { ...prep, nuevas: prep.nuevas.slice(0, lim.caben) });
      v.cerrar();
      render();
      resultadoImport(n);
    });
  });
  pintar();
}

function resultadoImport(n) {
  const { hoy } = ctx();
  const dup = L.indexarDuplicados(S.db.clientes);
  const conAviso = S.db.clientes.filter((c) => L.avisosDeCliente(c, dup, hoy).length).length;
  const sin = S.db.clientes.filter((c) => !c.proximo_pago && !c.baja).length;
  const pendientes = [
    sin ? `<li><b>Ponles fecha de cobro</b> a ${sin} cliente(s): así la app te avisa quién está por vencer y quién ya se atrasó.</li>` : '',
    conAviso ? `<li><b>Revisa ${conAviso} cliente(s)</b> con datos que conviene corregir (CURP o NSS incompletos, repetidos, fechas raras…).</li>` : '',
  ].filter(Boolean);
  const v = ventana({
    titulo: '¡Listo!',
    cuerpo: `<div class="imp-listo"><div class="imp-listo-ico" aria-hidden="true">🎉</div>
        <h3>Importaste ${n} cliente(s)</h3>
        <p class="mini">Ya tienes <b>${S.db.clientes.length}</b> en la app${N.nubeActiva ? ', guardados también en la nube' : ''}.</p></div>
      ${pendientes.length ? `<p style="margin:14px 0 6px"><b>Lo que sigue</b> (te toma unos minutos):</p><ol class="pasos">${pendientes.join('')}</ol>`
        : '<p style="margin-top:14px">Todo quedó en orden. Ya puedes ver tu cartera y mandar recordatorios de cobro.</p>'}`,
    pie: sin
      ? `${conAviso ? '<button class="btn" data-accion="revision">Revisar datos</button>' : '<button class="btn" data-cerrar type="button">Después</button>'}
          <button class="btn primario" data-accion="asistente">Poner fechas de cobro</button>`
      : conAviso
        ? '<button class="btn" data-cerrar type="button">Después</button><button class="btn primario" data-accion="revision">Revisar datos</button>'
        : '<button class="btn primario" data-cerrar type="button">Ver mis clientes</button>',
  });
  v.el.addEventListener('click', (e) => { if (e.target.closest('[data-accion]')) v.cerrar(); });
}

// ---------- Exportar / respaldo ----------
export async function exportarExcel() {
  await seguro(async () => {
    const bytes = E.exportarExcelBytes(S.db, L.hoyISO(), S.exportarJSON());
    const ok = await E.descargar(bytes, `Cartera_IMSS_${L.hoyISO()}.xlsx`, MIME_XLSX);
    if (ok) {
      await S.marcarRespaldo();
      aviso('Excel exportado. Tu archivo original no se modificó.');
      render();
    }
  });
}

// El respaldo es un Excel normal (se abre en cualquier teléfono) con una hoja oculta que trae todos los datos.
export async function exportarRespaldo() {
  await seguro(async () => {
    const bytes = E.exportarExcelBytes(S.db, L.hoyISO(), S.exportarJSON());
    const ok = await E.descargar(bytes, `Respaldo_Cartera_IMSS_${L.hoyISO()}.xlsx`, MIME_XLSX);
    if (ok) { await S.marcarRespaldo(); aviso('Respaldo guardado en el teléfono (carpeta Descargas o Archivos)'); render(); }
  });
}

// Acepta el respaldo en Excel (.xlsx) o el .json de versiones anteriores.
async function textoDeRespaldo(f) {
  const buf = await f.arrayBuffer();
  const b = new Uint8Array(buf.slice(0, 2));
  if (b[0] === 0x50 && b[1] === 0x4b) { // "PK": es un .xlsx
    const t = E.leerRespaldoExcel(buf);
    if (!t) throw new Error('Este Excel no trae el respaldo completo. Descarga un respaldo nuevo desde la app, o usa "Importar Excel" para cargar solo los clientes.');
    return t;
  }
  return new TextDecoder().decode(buf);
}

export function abrirRestaurar() {
  // Sin filtro de tipo: en Android los archivos recibidos por WhatsApp a veces no se reconocen por su tipo.
  pedirArchivo('', (f) => seguro(async () => {
    const texto = await textoDeRespaldo(f);
    const ok = await confirmar({
      titulo: 'Restaurar respaldo',
      mensaje: `Esto reemplazará los datos actuales (${S.db.clientes.length} clientes) por los del respaldo <b>${esc(f.name)}</b>. Antes se guarda una copia de lo actual por si necesitas volver.`,
      ok: 'Restaurar', peligro: true,
    });
    if (!ok) return;
    const n = await S.restaurarJSON(texto);
    aviso(`Respaldo restaurado: ${n} clientes`);
    render();
  }));
}

// ---------- Revisión de datos ----------
export function abrirRevision() {
  const { hoy } = ctx();
  const dup = L.indexarDuplicados(S.db.clientes);
  const grupos = {};
  for (const c of S.db.clientes) for (const a of L.avisosDeCliente(c, dup, hoy)) (grupos[a] ||= []).push(c);
  const orden = Object.keys(L.TIPOS_AVISO).filter((k) => grupos[k]);
  const cuerpo = orden.length
    ? `<p class="mini" style="margin-bottom:12px">Estos son solo avisos. Nada se ha corregido: tú decides qué hacer con cada caso. Toca un nombre para abrirlo y editarlo.</p>` +
      orden.map((k) => `<div class="seccion"><h3>${esc(L.TIPOS_AVISO[k])} · ${grupos[k].length}</h3><ul class="lista-simple">
        ${grupos[k].map((c) => `<li><a href="#" data-accion="abrir" data-id="${c.id}"><b>${esc(c.nombre)}</b></a>
          <div class="mini">${k.startsWith('curp') ? esc(c.curp) || '(vacía)' : k.startsWith('nss') ? esc(c.nss) || '(vacío)' : k === 'celular' ? esc(c.celular) || '(vacío)' : k.startsWith('fecha') ? L.fmtFecha(c.fecha_inicio) : k === 'duplicado' ? esc(c.curp || c.nss) + ' · ' + esc(c.proveedor) + ' · ' + esc(c.opcion) : ''}${c.origen ? ' · fila Excel ' + c.origen.fila : ''}</div></li>`).join('')}
        </ul></div>`).join('')
    : '<div class="vacio"><h2>Todo en orden</h2><p>No hay avisos de datos.</p></div>';
  const v = ventana({ titulo: 'Revisión de datos', cuerpo, ancho: true });
  v.el.addEventListener('click', (e) => { if (e.target.closest('[data-accion="abrir"]')) v.cerrar(); });
}

// ---------- Asistente de configuración inicial de pagos ----------
// Tres pasos cortos (qué es → cada cuánto pagan → ¿están al corriente?) con un cliente real de ejemplo.
const CADA = { Mensual: 'cada mes', Trimestral: 'cada 3 meses', Semestral: 'cada 6 meses', Anual: 'una vez al año' };

export function abrirAsistente() {
  const pendientes = S.db.clientes.filter((c) => !c.proximo_pago && !c.baja);
  if (!pendientes.length) return aviso('Todos tus clientes ya tienen fecha de cobro');
  const { hoy, aviso: dias } = ctx();
  const perDefecto = S.db.config.periodicidadDefecto;
  const conPer = pendientes.filter((c) => L.esPeriodicidad(c.periodicidad)).length;
  const sel = {
    paso: 1, periodicidad: perDefecto, metodo: 'ciclo',
    // tipo: una de PERIODICIDADES o 'personalizado' (cada `dias` días)
    tipo: L.diasDePeriodicidad(perDefecto) ? 'personalizado' : perDefecto, dias: L.diasDePeriodicidad(perDefecto) || '',
  };
  const elegida = () => (sel.tipo === 'personalizado'
    ? (Number(sel.dias) >= 1 && Number(sel.dias) <= L.MAX_DIAS_PERIODO ? L.periodicidadDias(Number(sel.dias)) : null)
    : sel.tipo);
  const ejemplo = pendientes.find((c) => !S.calcularMasivo([c], { periodicidad: 'Mensual', metodo: 'ciclo', hoy })[0]?.omitido);
  const nombreEj = ejemplo ? esc(String(ejemplo.nombre).split(/\s+/).slice(0, 2).join(' ')) : '';
  const proximoEj = (metodo) => {
    if (!ejemplo) return '';
    const f = S.calcularMasivo([ejemplo], { periodicidad: sel.periodicidad, metodo, hoy })[0].proximo;
    const e = L.calcularEstado({ ...ejemplo, proximo_pago: f, baja: false }, hoy, dias).codigo;
    return `<b>${L.fmtFecha(f)}</b> · ${{ AL_DIA: '🟢 al día', POR_VENCER: '🟡 por vencer', MOROSO: '🔴 atrasado' }[e] || ''}`;
  };
  const pasoDe = (n) => `<p class="mini" style="margin-bottom:10px"><b>Paso ${n} de 3</b></p>`;
  let calculo = [];

  const pasos = {
    1: () => ({
      cuerpo: `${pasoDe(1)}
        <h3 style="margin-bottom:8px">Pongamos la fecha de cobro a tus clientes</h3>
        <p>Tienes <b>${pendientes.length} cliente(s)</b> sin fecha de cobro. La app necesita saber <b>cuándo te toca cobrarle a cada uno</b> para avisarte a tiempo y marcar quién está al día 🟢, por vencer 🟡 o atrasado 🔴.</p>
        ${ejemplo ? `<div class="banner info" style="margin-top:12px"><p>Usamos la <b>fecha de inicio</b> de cada cliente para saber qué día le cobras.<br>
          Ejemplo: <b>${nombreEj}</b> empezó el <b>${L.fmtFecha(ejemplo.fecha_inicio)}</b> → le cobras cada <b>día ${Number(ejemplo.fecha_inicio.slice(8, 10))}</b>.</p></div>` : ''}
        <p style="margin-top:12px">Solo te haremos <b>2 preguntas</b>. Antes de guardar verás cómo queda, y después puedes cambiar la fecha de cualquier cliente.</p>`,
      pie: `<button class="btn" data-cerrar type="button">Ahora no</button><button class="btn primario" data-ir="2" type="button">Empezar</button>`,
    }),
    2: () => ({
      cuerpo: `${pasoDe(2)}
        <h3 style="margin-bottom:8px">¿Cada cuánto te pagan estos clientes?</h3>
        ${Object.keys(L.PERIODICIDADES).map((p) => `<label class="radio-tarjeta"><input type="radio" name="periodicidad" value="${p}" ${sel.tipo === p ? 'checked' : ''}>
          <span><b>${p}</b> <span class="mini">· ${CADA[p] || ''}</span></span></label>`).join('')}
        <label class="radio-tarjeta"><input type="radio" name="periodicidad" value="personalizado" ${sel.tipo === 'personalizado' ? 'checked' : ''}>
          <span><b>Personalizado</b> <span class="mini">· tú eliges cada cuántos días</span>
            <span class="per-dias" ${sel.tipo === 'personalizado' ? '' : 'hidden'}>Cada
              <input type="number" name="dias_per" min="1" max="${L.MAX_DIAS_PERIODO}" inputmode="numeric" value="${sel.dias}" placeholder="15"> días</span></span></label>
        <p class="mini" style="margin-top:8px">Si algunos pagan distinto, elige lo más común. A esos los cambias después uno por uno.</p>
        ${conPer ? `<div class="banner info" style="margin-top:10px"><p><b>${conPer}</b> cliente(s) ya tienen su periodicidad (por ejemplo, la que venía en tu Excel) y se les respeta. ${conPer === pendientes.length ? 'Como todos la tienen, solo toca «Siguiente».' : `Esta respuesta es para ${pendientes.length - conPer === 1 ? 'el otro cliente' : `los otros ${pendientes.length - conPer}`}.`}</p></div>` : ''}`,
      pie: `<button class="btn" data-ir="1" type="button">Atrás</button><button class="btn primario" data-ir="3" type="button">Siguiente</button>`,
    }),
    3: () => {
      calculo = S.calcularMasivo(pendientes, { periodicidad: sel.periodicidad, metodo: sel.metodo, hoy });
      const cnt = { AL_DIA: 0, POR_VENCER: 0, MOROSO: 0 };
      const omitidos = calculo.filter((i) => i.omitido);
      for (const it of calculo) if (!it.omitido) cnt[L.calcularEstado({ ...it.c, proximo_pago: it.proximo, baja: false }, hoy, dias).codigo]++;
      const aplicables = calculo.length - omitidos.length;
      return {
        cuerpo: `${pasoDe(3)}
          <h3 style="margin-bottom:8px">¿Tus clientes van al corriente con sus pagos?</h3>
          <label class="radio-tarjeta"><input type="radio" name="metodo" value="ciclo" ${sel.metodo === 'ciclo' ? 'checked' : ''}><span><b>Sí, casi todos van al corriente</b><br>
            <span class="mini">${L.diasDePeriodicidad(sel.periodicidad)
              ? `Contamos ${sel.periodicidad.toLowerCase()} desde su fecha de inicio y les ponemos el siguiente cobro que viene.`
              : 'Les ponemos como próximo cobro su siguiente día de pago.'} Nadie sale atrasado.${ejemplo ? `<br>Ej.: ${nombreEj} → próximo cobro ${proximoEj('ciclo')}` : ''}</span></span></label>
          <label class="radio-tarjeta"><input type="radio" name="metodo" value="inicio" ${sel.metodo === 'inicio' ? 'checked' : ''}><span><b>No estoy seguro, quiero revisarlos</b><br>
            <span class="mini">Contamos desde su fecha de inicio. Quien no tenga pagos anotados saldrá atrasado 🔴 hasta que registres lo que ya te pagó.${ejemplo ? `<br>Ej.: ${nombreEj} → próximo cobro ${proximoEj('inicio')}` : ''}</span></span></label>
          <div class="seccion" style="margin-top:12px"><h3>Así quedarían tus ${aplicables} clientes</h3>
            <div>🟢 Al día: <b>${cnt.AL_DIA}</b> · 🟡 Por vencer: <b>${cnt.POR_VENCER}</b> · 🔴 Atrasados: <b>${cnt.MOROSO}</b></div>
            ${[['sin fecha de inicio', 'no tienen fecha de inicio'], ['fecha de inicio lejana en el futuro', 'tienen una fecha de inicio que parece un error (muy en el futuro)']].map(([razon, texto]) => {
              const l = omitidos.filter((i) => i.razon === razon);
              return l.length ? `<div class="mini" style="margin-top:8px">⚠️ No tocamos a ${l.length} cliente(s) que ${texto}: <b>${l.slice(0, 5).map((i) => esc(i.c.nombre)).join(', ')}${l.length > 5 ? '…' : ''}</b>. Abre cada uno y ponle su fecha a mano.</div>` : '';
            }).join('')}
            <div class="mini" style="margin-top:8px">¿Te equivocaste? En ☰ Datos → Configuración → «Deshacer último cambio grande».</div></div>`,
        pie: `<button class="btn" data-ir="2" type="button">Atrás</button><button class="btn primario" data-ok type="button" ${aplicables ? '' : 'disabled'}>Guardar fechas (${aplicables})</button>`,
      };
    },
  };

  const v = ventana({ titulo: 'Fechas de cobro', cuerpo: '', fondoCierra: false });
  const pintar = () => v.poner(pasos[sel.paso]());
  v.el.addEventListener('change', (e) => {
    if (e.target.name === 'periodicidad') {
      sel.tipo = e.target.value;
      const caja = v.q('.per-dias');
      caja.hidden = sel.tipo !== 'personalizado';
      if (!caja.hidden) v.q('[name="dias_per"]').focus();
    }
    if (e.target.name === 'metodo') { sel.metodo = e.target.value; pintar(); }
  });
  v.el.addEventListener('input', (e) => { if (e.target.name === 'dias_per') sel.dias = e.target.value; });
  v.el.addEventListener('click', (e) => {
    const ir = e.target.closest('[data-ir]');
    if (ir) {
      const destino = Number(ir.dataset.ir);
      if (sel.paso === 2 && destino === 3) {
        if (!elegida()) return aviso(AVISO_DIAS, true);
        sel.periodicidad = elegida();
      }
      sel.paso = destino; pintar(); v.q('.modal-cuerpo').scrollTop = 0;
    }
    if (e.target.closest('[data-ok]')) seguro(async () => {
      const n = await S.aplicarMasivo(calculo, sel.periodicidad, sel.metodo);
      v.cerrar(); aviso(`Listo: ${n} clientes ya tienen fecha de cobro`); render();
    });
  });
  pintar();
}

// ---------- Papelera ----------
export function abrirPapelera() {
  const pintar = (v) => {
    v.poner({
      cuerpo: S.db.papelera.length
        ? `<ul class="lista-simple">${S.db.papelera.map((p) => `<li style="display:flex;gap:12px;align-items:center;justify-content:space-between">
            <div><b>${esc(p.cliente.nombre)}</b><div class="mini">Eliminado el ${L.fmtFechaHora(p.ts)} · ${p.cliente.pagos.length} pago(s)</div></div>
            <button class="btn chico" data-restaurar="${p.id}">Restaurar</button></li>`).join('')}</ul>`
        : '<div class="vacio"><h2>Papelera vacía</h2></div>',
      pie: S.db.papelera.length ? `<button class="btn peligro" data-vaciar type="button">Vaciar papelera</button>` : '',
    });
  };
  const v = ventana({ titulo: 'Papelera', cuerpo: '' });
  pintar(v);
  v.el.addEventListener('click', (e) => seguro(async () => {
    const r = e.target.closest('[data-restaurar]');
    if (r) { await S.restaurarDePapelera(r.dataset.restaurar); aviso('Cliente restaurado'); pintar(v); render(); }
    if (e.target.closest('[data-vaciar]')) {
      const ok = await confirmar({ titulo: 'Vaciar papelera', mensaje: 'Se eliminarán definitivamente los clientes de la papelera. Esta acción no se puede deshacer.', ok: 'Vaciar', peligro: true });
      if (ok) { await S.vaciarPapelera(); pintar(v); }
    }
  }));
}

// ---------- Cuenta (nube) ----------
// ---------- Mi cuenta ----------
// ---------- Bloqueo con PIN ----------
const campoPin = (nombre, etiqueta, auto = 'new-password') => `<label>${etiqueta}<input type="password" name="${nombre}" inputmode="numeric"
  pattern="[0-9]{4}" maxlength="4" minlength="4" autocomplete="${auto}" required class="campo-pin"></label>`;

export async function abrirBloqueo() {
  const hayBio = await B.biometriaDisponible();
  const bio = B.nombreBiometria();
  const v = ventana({ titulo: '🔒 Bloqueo de la app', cuerpo: '' });
  const opcionesTiempo = () => B.TIEMPOS.map(([m, t]) => `<option value="${m}" ${m === B.minutos() ? 'selected' : ''}>${t}</option>`).join('');

  const pintar = () => {
    if (!B.activo()) {
      v.poner({
        cuerpo: `<p style="margin-bottom:10px">Si alguien más toma tu teléfono, <b>no podrá ver tu cartera</b> (nombres, CURP, NSS, celulares) sin tu PIN.</p>
          <form id="f-pin" class="rejilla">
            ${campoPin('pin', 'Crea un PIN de 4 números')}
            ${campoPin('pin2', 'Repite el PIN')}
            <label>Pedir el PIN<select name="minutos">${opcionesTiempo()}</select></label>
            ${hayBio ? `<label class="radio-tarjeta"><input type="checkbox" name="bio" checked><span>Desbloquear también con <b>${bio}</b></span></label>` : ''}
          </form>
          <p class="mini" style="margin-top:10px">El PIN se guarda solo en este teléfono. Si lo olvidas, cierras sesión y vuelves a entrar con tu correo y contraseña: tus clientes siguen en la nube.</p>`,
        pie: '<button class="btn" data-cerrar type="button">Ahora no</button><button class="btn primario" type="submit" form="f-pin">Activar bloqueo</button>',
      });
      v.q('#f-pin').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        if (!/^\d{4}$/.test(f.pin.value)) return aviso('El PIN debe tener 4 números', true);
        if (f.pin.value !== f.pin2.value) return aviso('Los dos PIN no coinciden. Escríbelos de nuevo.', true);
        seguro(async () => {
          await B.guardarPin(f.pin.value, Number(f.minutos.value));
          if (f.bio?.checked) {
            try { await B.activarBiometria(N.estado.usuario); } catch { aviso(`No se activó ${bio}; puedes intentarlo después aquí mismo.`, true); }
          }
          aviso('🔒 Bloqueo activado');
          render();
          pintar();
        });
      });
      return;
    }
    v.poner({
      cuerpo: `<div class="banner info"><p>🔒 <b>Bloqueo activado</b> en este teléfono${B.conBiometria() ? `, también con ${bio}` : ''}.</p></div>
        <label>Pedir el PIN<select data-minutos>${opcionesTiempo()}</select></label>
        ${hayBio ? `<label class="radio-tarjeta" style="margin-top:10px"><input type="checkbox" data-bio ${B.conBiometria() ? 'checked' : ''}><span>Desbloquear también con <b>${bio}</b></span></label>` : ''}
        <div class="acc-fila" style="margin-top:12px"><button class="btn" data-cambiar type="button">Cambiar PIN</button>
          <button class="btn peligro" data-quitar type="button">Quitar bloqueo</button></div>`,
      pie: '<button class="btn primario" data-cerrar type="button">Listo</button>',
    });
    v.q('[data-minutos]').addEventListener('change', (e) => { B.cambiarMinutos(Number(e.target.value)); aviso('Guardado'); });
    v.q('[data-bio]')?.addEventListener('change', (e) => seguro(async () => {
      if (e.target.checked) {
        try { await B.activarBiometria(N.estado.usuario); aviso(`${bio} activado`); } catch { e.target.checked = false; aviso(`No se activó ${bio}`, true); }
      } else { B.quitarBiometria(); aviso(`${bio} desactivado`); }
    }));
    // Cambiar o quitar pide el PIN actual.
    const conPinActual = (titulo, textoOk, alConfirmar) => {
      const w = ventana({
        titulo, fondoCierra: false,
        cuerpo: `<form id="f-pin-actual" class="rejilla">${campoPin('actual', 'Tu PIN actual', 'current-password')}
          ${textoOk === 'Cambiar' ? campoPin('pin', 'PIN nuevo') + campoPin('pin2', 'Repite el PIN nuevo') : ''}</form>`,
        pie: `<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn ${textoOk === 'Cambiar' ? 'primario' : 'peligro solido'}" type="submit" form="f-pin-actual">${textoOk}</button>`,
      });
      w.q('#f-pin-actual').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        seguro(async () => {
          if (!(await B.pinCorrecto(f.actual.value))) return aviso('El PIN actual no es correcto', true);
          if (f.pin && (!/^\d{4}$/.test(f.pin.value) || f.pin.value !== f.pin2.value)) return aviso('El PIN nuevo debe tener 4 números y coincidir las dos veces', true);
          await alConfirmar(f);
          w.cerrar();
          render();
          pintar();
        });
      });
    };
    v.q('[data-cambiar]').addEventListener('click', () => conPinActual('Cambiar PIN', 'Cambiar', async (f) => { await B.guardarPin(f.pin.value); aviso('PIN cambiado'); }));
    v.q('[data-quitar]').addEventListener('click', () => conPinActual('Quitar bloqueo', 'Quitar', async () => { B.quitar(); aviso('Bloqueo quitado'); }));
  };
  pintar();
}

function abrirCuenta() {
  const p = N.estado.perfil || {};
  const v = ventana({
    titulo: 'Mi cuenta',
    cuerpo: `<div class="seccion"><dl class="datos">
        <div><dt>Nombre</dt><dd>${esc(p.nombre) || '—'}</dd></div>
        <div><dt>Correo</dt><dd>${esc(N.estado.usuario)}</dd></div>
        <div><dt>País</dt><dd>${esc(PAISES[p.pais] || p.pais) || '—'}</dd></div>
        <div><dt>Celular</dt><dd>${esc(p.telefono) || '—'}</dd></div></dl></div>
      <div class="seccion acc-fila"><button class="btn" data-salir>Cerrar sesión</button></div>
      <div class="seccion"><h3>Eliminar cuenta</h3>
        <p class="mini" style="margin-bottom:10px">Borra de forma permanente tu cuenta y todos tus clientes, pagos e historial. Antes descarga un respaldo si quieres conservarlos.</p>
        <button class="btn peligro" data-eliminar>Eliminar mi cuenta</button></div>
      <p class="mini"><a href="privacidad.html" target="_blank" rel="noopener">Aviso de privacidad</a> · <a href="terminos.html" target="_blank" rel="noopener">Términos de uso</a> · versión ${esc(MARCA.version)}</p>`,
  });
  v.q('[data-salir]').addEventListener('click', async () => {
    const ok = await confirmar({
      titulo: 'Cerrar sesión',
      mensaje: 'Se cerrará tu sesión y se borrará la copia guardada en este dispositivo (tus datos siguen a salvo en tu cuenta). Para volver a verlos necesitarás internet.',
      ok: 'Cerrar sesión',
    });
    if (ok) await seguro(async () => { await N.salir(); location.reload(); });
  });
  v.q('[data-eliminar]').addEventListener('click', () => {
    const w = ventana({
      titulo: 'Eliminar mi cuenta', fondoCierra: false,
      cuerpo: `<p style="margin-bottom:12px">Esto <b>no se puede deshacer</b>. Se borrarán tus ${S.db.clientes.length} clientes y todo su historial.</p>
        <form id="f-elim"><label>Escribe tu contraseña para confirmar<input type="password" name="clave" autocomplete="current-password" required></label></form>`,
      pie: '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn peligro solido" type="submit" form="f-elim">Eliminar definitivamente</button>',
    });
    w.q('#f-elim').addEventListener('submit', (e) => {
      e.preventDefault();
      const clave = e.target.clave.value;
      if (!clave) return aviso('Escribe tu contraseña', true);
      seguro(async () => {
        try { await N.eliminarCuenta(clave); } catch (err) { aviso(N.mensajeError(err), true); return; }
        location.reload();
      });
    });
  });
}

// ---------- Plan ----------
function avisoLimite() {
  const pe = N.estado.planEf;
  if (pe.tipo === 'beta') {
    ventana({
      titulo: 'Tope de la beta gratuita',
      cuerpo: `<p>Durante la <b>beta gratuita</b> puedes tener hasta <b>${pe.limite}</b> clientes y ya tienes ${S.db.clientes.length}.</p>
        <p style="margin-top:10px">Tus clientes siguen igual y puedes seguir trabajando con ellos. ¿Necesitas agregar más? Escríbenos y lo vemos contigo.</p>`,
      pie: `<button class="btn" data-cerrar type="button">Cerrar</button><button class="btn primario" data-accion="ayuda" data-texto="En la beta necesito más de ${pe.limite} clientes: " data-cerrar>Escribir a soporte</button>`,
    });
    return;
  }
  ventana({
    titulo: 'Límite de tu plan',
    cuerpo: `<p>El <b>${esc(pe.nombre)}</b> permite hasta <b>${pe.limite}</b> clientes y ya tienes ${S.db.clientes.length}.</p>
      ${enPlay() ? '' : '<p style="margin-top:10px">Activa el Plan Pro para agregar clientes sin límite.</p>'}`,
    pie: `<button class="btn" data-cerrar type="button">Cerrar</button><button class="btn primario" data-accion="plan" data-cerrar>${enPlay() ? 'Mi plan' : 'Ver planes'}</button>`,
  });
}

function avisoSoloLectura() {
  const pe = N.estado.planEf;
  ventana({
    titulo: 'Activa tu plan para continuar',
    cuerpo: `<p>${pe.termino === 'pro' ? 'Tu Plan Pro venció' : 'Tu prueba gratis terminó'}. Tus ${S.db.clientes.length} clientes siguen guardados y puedes verlos y exportarlos.</p>
      <p style="margin-top:10px">Para registrar pagos, editar o agregar clientes necesitas el Plan Pro.</p>`,
    pie: `<button class="btn" data-cerrar type="button">Ahora no</button><button class="btn primario" data-accion="plan" data-cerrar>${enPlay() ? 'Mi plan' : 'Ver planes'}</button>`,
  });
}

function abrirPlan() {
  const pe = N.estado.planEf;
  const sis = N.estado.sistema || {};
  const medios = mediosOrdenados(sis.medios, N.estado.perfil?.pais || '');
  const precios = textoPrecios(sis);
  const local = equivalenteLocal(sis, N.estado.perfil?.pais || '');
  const legado = (sis.datosPago || '').trim(); // formato anterior: texto libre
  const uso = pe.ilimitado ? `${S.db.clientes.length} clientes (sin límite)` : `${S.db.clientes.length} de ${pe.limite} clientes`;
  const listaMedios = medios.length
    ? `<ul class="lista-simple">${medios.map((m) => `<li><b>${esc(m.nombre)}</b> <span class="mini">· ${esc(PAISES[m.pais] || 'Cualquier país')}</span>
        <div class="dato-pago">${esc(m.dato)}</div>${m.titular ? `<div class="mini">Titular: ${esc(m.titular)}</div>` : ''}</li>`).join('')}</ul>`
    : (legado ? `<p style="white-space:pre-wrap">${esc(legado)}</p>` : '');
  const puedePagar = !!listaMedios;
  const cobro = pe.tipo === 'beta'
    ? `<div class="banner info"><p>Estás en la <b>beta gratuita</b>: todas las funciones sin costo, hasta <b>${pe.limite}</b> clientes. Te avisaremos antes de que empiecen los planes de pago.</p></div>
       ${precios ? `<p class="mini">Precio del Plan Pro después de la beta: <b>${esc(precios)}</b>${local ? ` (${esc(local)})` : ''}.</p>` : ''}`
    : `<div class="seccion"><h3>Plan Pro</h3>${precios ? `<div class="grande" style="font-size:1.2rem">${esc(precios)}</div>` : ''}
        ${local ? `<div class="mini">${esc(local)} según la tasa de hoy</div>` : ''}
        ${Number(sis.precioAnual) > 0 && Number(sis.precioMensual) > 0 && sis.precioAnual < sis.precioMensual * 12 ? `<div class="etq nuevo" style="margin-top:6px">Plan anual: ahorras ${Math.round(sis.precioMensual * 12 - sis.precioAnual)} ${esc(sis.moneda || 'USD')}</div>` : ''}
        <p class="mini" style="margin-top:4px">Clientes sin límite.</p></div>
      ${puedePagar ? `<div class="seccion"><h3>Cómo pagar</h3>${listaMedios}</div>
        <form id="f-pago-plan" class="seccion"><h3>Ya pagué</h3>
          ${medios.length ? `<label>Medio de pago<select name="medio">${medios.map((m, i) => `<option value="${i}">${esc(m.nombre)}</option>`).join('')}</select></label>` : ''}
          <label style="margin-top:10px">Monto pagado<input name="monto" inputmode="decimal" maxlength="40" placeholder="Ej. 5 USD" required></label>
          <label style="margin-top:10px">Referencia o número de transacción<input name="ref" maxlength="120" required></label>
          <p class="mini" style="margin-top:6px">Lo revisamos y te confirmamos por Ayuda y soporte al activar tu plan.</p>
          <button class="btn primario" type="submit" style="margin-top:10px">Enviar comprobante</button></form>`
    : '<p class="mini">Pronto publicaremos los medios de pago. Escríbenos desde Ayuda y soporte.</p>'}`;
  // Versión de Google Play: solo el estado del plan, sin precios ni medios de pago.
  const cobroFinal = enPlay()
    ? (pe.tipo === 'beta' ? `<div class="banner info"><p>Estás en la <b>beta gratuita</b>: todas las funciones sin costo, hasta <b>${pe.limite}</b> clientes.</p></div>` : '')
    : cobro;
  const infoPrueba = pe.tipo === 'prueba'
    ? `<div class="banner info"><p>🎁 Estás en tu <b>prueba gratis</b>: ${pe.diasRestantes <= 0 ? 'termina hoy' : `te quedan ${pe.diasRestantes} día(s)`}.${enPlay() ? '' : ' Puedes activar el Plan Pro cuando quieras.'}</p></div>` : '';
  const v = ventana({
    titulo: 'Mi plan',
    cuerpo: `<div class="seccion destacado"><div><div class="mini">Plan actual</div><div class="grande">${esc(pe.nombre)}</div>
        <div class="mini">${uso}</div></div>
        ${pe.vence ? `<div style="text-align:right"><div class="mini">Vence</div><b>${L.fmtFecha(L.hoyISO(new Date(pe.vence)))}</b></div>` : ''}</div>
      ${pe.vencido ? `<div class="banner mal"><p>Tu Plan Pro venció. Tus clientes siguen guardados${enPlay() ? '' : '; renueva para seguir agregando'}.</p></div>` : ''}
      ${infoPrueba}${cobroFinal}
      <div class="seccion"><h3>Mis pagos del plan</h3><div id="mis-pagos" class="mini">Cargando…</div></div>`,
  });
  N.misPagosPlan().then((ps) => {
    const el = v.q('#mis-pagos');
    if (!el) return;
    el.innerHTML = ps.length ? `<ul class="lista-simple">${ps.map((p) => `<li><b>${esc(p.monto)} ${esc(p.moneda || '')}</b> · ${esc(p.medio || '')}
        <div class="mini">${p.registrado?.toMillis ? L.fmtFecha(L.hoyISO(new Date(p.registrado.toMillis()))) : ''}${p.hasta ? ` · plan hasta ${L.fmtFecha(L.hoyISO(new Date(p.hasta)))}` : ''}</div></li>`).join('')}</ul>`
      : 'Aún no hay pagos registrados.';
  }).catch(() => { const el = v.q('#mis-pagos'); if (el) el.textContent = 'No se pudo cargar (revisa tu conexión).'; });
  v.q('#f-pago-plan')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.monto.value.trim() || !f.ref.value.trim()) return aviso('Escribe el monto y la referencia', true);
    const medio = medios[Number(f.medio?.value)]?.nombre || 'Otro';
    const texto = `Pagué el Plan Pro.\nMedio: ${medio}\nMonto: ${f.monto.value.trim()}\nReferencia: ${f.ref.value.trim()}`;
    seguro(async () => {
      const id = await N.crearConversacion({ tipo: 'pago', texto, contexto: contextoSoporte() });
      v.cerrar();
      aviso('Recibimos tu comprobante. Te confirmaremos por Ayuda y soporte.');
      abrirConversacion(id, 'pago');
    });
  });
}

// ---------- Ayuda y soporte (conversaciones) ----------
let ultimoError = '';
window.addEventListener('error', (e) => { ultimoError = String(e.message || '').slice(0, 300); });
window.addEventListener('unhandledrejection', (e) => { ultimoError = String(e.reason?.message || e.reason || '').slice(0, 300); });

/** Datos técnicos que acompañan una conversación. Nunca incluye datos de clientes. */
function contextoSoporte() {
  return {
    version: MARCA.version, navegador: navigator.userAgent.slice(0, 300), pantalla: `${innerWidth}x${innerHeight}`,
    enLinea: navigator.onLine, clientes: S.db.clientes.length, plan: N.estado.planEf.tipo, ultimoError,
    errorSincro: String(N.estado.error || '').slice(0, 300),
  };
}

const PREGUNTAS = [
  ['¿Cómo cargo mis clientes desde Excel?', 'Menú ☰ → Importar y exportar → Importar Excel. La app te pregunta dónde está tu lista y te guía en 3 pasos. Tu Excel puede tener sus columnas con cualquier nombre y en cualquier orden: la app reconoce cuál es cada una y tú solo revisas antes de importar. Si el archivo está en tu computadora, lo más fácil es entrar a carteraasesor.com/app desde ahí con tu misma cuenta e importarlo: tus clientes aparecen solos en el teléfono. Si tu lista está en Google o en Numbers, primero guárdala como Excel; si no la tienes en Excel, descarga la plantilla.'],
  ['¿Cómo registro un pago?', 'Toca «Registrar pago» en el cliente. La próxima fecha se calcula sola según su periodicidad.'],
  ['¿Qué significa cada color?', '🟢 al día · 🟡 vence pronto · 🔴 moroso (ya pasó su fecha) · ⚫ dado de baja · ⚪ aún sin fecha de pago.'],
  ['¿Otro asesor puede ver mis clientes?', 'No. Cada cuenta ve únicamente sus propios clientes.'],
  ['¿Cómo evito que alguien vea mi cartera si toma mi teléfono?', 'Activa el bloqueo: Menú ☰ → Bloqueo con PIN. Creas un PIN de 4 números (y, si tu teléfono lo permite, también huella o Face ID) y eliges cuándo pedirlo. Si olvidas el PIN, en la pantalla de bloqueo toca «¿Olvidaste tu PIN?»: cierras sesión, vuelves a entrar con tu correo y contraseña, y tus clientes siguen ahí porque están en la nube.'],
  ['¿Funciona sin internet?', 'Sí. Los cambios se guardan en el teléfono y se envían a tu cuenta cuando vuelve la conexión.'],
  ['Cambié de teléfono, ¿pierdo mis datos?', 'No. Inicia sesión con tu mismo correo y tus clientes aparecen.'],
];

const fechaTs = (t) => (t?.toMillis ? L.fmtFechaHora(t.toMillis()) : '');

function listaConversaciones() {
  if (!N.soporte.listo) return '<p class="mini">Cargando…</p>';
  const ts = N.soporte.tickets;
  if (!ts.length) return '<p class="mini">Aún no nos has escrito. Cuéntanos cualquier duda: te respondemos aquí mismo.</p>';
  return `<ul class="lista-simple">${ts.map((t) => `<li><button type="button" class="conv" data-conv="${esc(t.id)}">
      <span class="conv-tit">${t.noLeidoAsesor ? '<span class="punto" aria-label="Respuesta nueva"></span>' : ''}<b>${esc(NOMBRE_TIPO[t.tipo] || t.tipo)}</b>
        <span class="etq ${t.estado === 'cerrado' ? 'gris' : 'ambar'}">${t.estado === 'cerrado' ? 'Resuelta' : 'Abierta'}</span>
        ${t.noLeidoAsesor ? '<span class="etq nuevo">Respuesta nueva</span>' : ''}</span>
      <span class="mini conv-ult">${t.ultimoDe === 'soporte' ? 'Soporte: ' : 'Tú: '}${esc(t.ultimoMensaje || t.asunto || t.respuesta || t.mensaje || '')}</span>
      <span class="mini">${fechaTs(t.actualizado || t.creado)}</span></button></li>`).join('')}</ul>`;
}

function abrirAyuda(texto = '') {
  const v = ventana({
    titulo: 'Ayuda y soporte', ancho: true,
    cuerpo: `<div class="seccion"><h3>Tus conversaciones</h3><div id="convs"></div></div>
      <form id="f-ticket" class="seccion"><h3>Escribir a soporte</h3>
        <label>Tema<select name="tipo">${Object.entries(TIPOS_TICKET).map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('')}</select></label>
        <label style="margin-top:10px">Tu mensaje<textarea name="mensaje" maxlength="2000" required placeholder="Cuéntanos qué necesitas o qué pasó"></textarea></label>
        <p class="mini" style="margin-top:6px">Se envían también datos técnicos (versión, tipo de teléfono, último error) para ayudarte más rápido. No se envían datos de tus clientes.</p>
        <button class="btn primario" type="submit" style="margin-top:10px">Enviar</button></form>
      <div class="seccion"><h3>Preguntas frecuentes</h3><ul class="lista-simple">
        ${PREGUNTAS.map(([p, r]) => `<li><details><summary><b>${esc(p)}</b></summary><p class="mini" style="margin-top:6px">${esc(r)}</p></details></li>`).join('')}</ul></div>`,
  });
  const pintar = () => { v.q('#convs').innerHTML = listaConversaciones(); };
  v.repintarSoporte = pintar;
  pintar();
  // Llegó desde un botón «¿Te atoraste?»: el mensaje ya viene empezado y listo para escribir.
  if (texto) {
    v.q('[name=tipo]').value = 'pregunta';
    const t = v.q('[name=mensaje]');
    t.value = texto;
    t.scrollIntoView({ block: 'center' });
    t.focus();
  }
  v.q('#convs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-conv]');
    if (b) abrirConversacion(b.dataset.conv);
  });
  v.q('#f-ticket').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.mensaje.value.trim()) return aviso('Escribe tu mensaje', true);
    seguro(async () => {
      const id = await N.crearConversacion({ tipo: f.tipo.value, texto: f.mensaje.value, contexto: contextoSoporte() });
      const tipo = f.tipo.value;
      f.reset();
      abrirConversacion(id, tipo);
    });
  });
}

function abrirConversacion(id, tipoInicial = '') {
  const t0 = N.soporte.tickets.find((x) => x.id === id) || { id, tipo: tipoInicial };
  let mensajes = [];
  let parar = null;
  const v = ventana({
    titulo: NOMBRE_TIPO[t0.tipo] || 'Conversación con soporte', ancho: true,
    cuerpo: '<div class="chat" id="chat"><p class="mini">Cargando…</p></div>',
    pie: `<form id="f-resp" class="chat-form"><textarea name="texto" rows="2" maxlength="2000" placeholder="Escribe tu mensaje…" aria-label="Mensaje"></textarea>
      <button class="btn primario" type="submit">Enviar</button></form>`,
    onCerrar: () => { if (parar) parar(); },
  });
  const chat = v.q('#chat');
  const pintar = () => {
    const t = N.soporte.tickets.find((x) => x.id === id) || t0;
    const lista = mensajesDeConversacion(t, mensajes);
    chat.innerHTML = lista.map((m) => `<div class="burbuja ${m.de === 'soporte' ? 'de-soporte' : 'mia'}">
        <div class="quien">${m.de === 'soporte' ? 'Soporte' : 'Tú'}</div>
        <div class="txt">${esc(m.texto)}</div>
        <div class="hora">${m.creado?.toMillis ? L.fmtFechaHora(m.creado.toMillis()) : 'Enviando…'}</div></div>`).join('')
      + (t.estado === 'cerrado' ? '<p class="mini" style="text-align:center;margin:10px 0">Marcamos esta conversación como resuelta. Si nos escribes, se vuelve a abrir.</p>'
        : (t.ultimoDe === 'asesor' ? '<p class="mini" style="text-align:center;margin:10px 0">Recibimos tu mensaje. Te avisaremos aquí cuando respondamos.</p>' : ''));
    const cuerpo = v.q('.modal-cuerpo');
    cuerpo.scrollTop = cuerpo.scrollHeight;
  };
  v.repintarSoporte = pintar;
  parar = N.escucharMensajes(id, (m) => {
    mensajes = m;
    pintar();
    N.marcarLeida(id).catch(() => { /* se reintenta al volver a abrir */ });
  }, (e) => { chat.innerHTML = `<p class="mini">${esc(N.mensajeError(e))}</p>`; });
  const f = v.q('#f-resp');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = f.texto.value.trim();
    if (!texto) return;
    f.texto.value = '';
    seguro(async () => { await N.responderConversacion(id, texto); });
  });
}

/** Llamado por la nube cuando cambia la lista de conversaciones (p. ej. llega una respuesta de soporte). */
export function alCambiarSoporte(nuevas = []) {
  render();
  for (const v of pila) if (v.repintarSoporte) v.repintarSoporte();
  if (nuevas.length) aviso(`💬 Soporte te respondió${nuevas.length > 1 ? ` (${nuevas.length} conversaciones)` : ''}. Míralo en ☰ Datos → Ayuda y soporte.`);
}

/** Se llama cuando llegan cambios de otro dispositivo: refresca la lista y las fichas abiertas. */
export function refrescarTodo() {
  render();
  for (const v of [...pila]) {
    if (!v.detalleId) continue;
    if (S.buscar(v.detalleId)) abrirDetalle(v.detalleId, v);
    else v.cerrar();
  }
}

// ---------- Vencimientos ----------
export function abrirVencimientos() {
  const cfg = S.db.config;
  const v = ventana({
    titulo: '🔔 Vencimientos',
    cuerpo: `<form id="f-cfg" class="seccion">
        <label>Días para marcar «Próximo a vencer»<input type="number" name="diasAviso" min="1" max="90" value="${cfg.diasAviso}" inputmode="numeric">
          <div class="ayuda">Un cliente es 🟡 cuando faltan entre 0 y este número de días para su próximo pago.</div></label>
        <label style="margin-top:12px">Periodicidad sugerida
          ${campoPeriodicidad(cfg.periodicidadDefecto, { nombre: 'periodicidadDefecto' })}
          <div class="ayuda">La que aparece elegida al configurar el pago de un cliente nuevo.</div></label>
        <button class="btn primario" type="submit" style="margin-top:12px">Guardar</button></form>`,
  });
  enlazarPeriodicidad(v.q('#f-cfg'), 'periodicidadDefecto');
  v.q('#f-cfg').addEventListener('submit', (e) => { e.preventDefault(); seguro(async () => {
    const f = e.target;
    const d = Math.max(1, Math.min(90, parseInt(f.diasAviso.value, 10) || 7));
    const per = leerPeriodicidad(f, 'periodicidadDefecto');
    if (!per) return aviso(AVISO_DIAS, true);
    await S.guardarConfig({ diasAviso: d, periodicidadDefecto: per });
    aviso('Vencimientos guardados'); render(); v.cerrar();
  }); });
}

// ---------- Mensajes de cobro ----------
export function abrirMensajesCobro() {
  const cfg = S.db.config;
  const v = ventana({
    titulo: '📲 Mensajes de cobro',
    cuerpo: `<form id="f-plantillas" class="seccion">
        <p class="mini" style="margin-bottom:8px">Se envían por WhatsApp con el botón «Recordar». Puedes escribir {nombre}, {fecha} y {dias}.</p>
        <label>Cuando está por vencer<textarea name="porVencer" rows="4">${esc(cfg.plantillasCobro?.porVencer || L.PLANTILLAS_COBRO.porVencer)}</textarea></label>
        <label style="margin-top:10px">Cuando ya venció<textarea name="moroso" rows="4">${esc(cfg.plantillasCobro?.moroso || L.PLANTILLAS_COBRO.moroso)}</textarea></label>
        <h3 style="margin-top:16px">✅ Comprobante de pago</h3>
        <p class="mini" style="margin-bottom:8px">Se ofrece al registrar un pago. Puedes escribir {nombre}, {monto}, {fecha_pago}, {proximo}, {metodo} y {asesor} (tu nombre).</p>
        <label>Mensaje del comprobante<textarea name="comprobante" rows="5">${esc(cfg.plantillaComprobante || L.PLANTILLA_COMPROBANTE)}</textarea></label>
        <label class="radio-tarjeta" style="margin-top:10px"><input type="checkbox" name="preguntar" ${cfg.preguntarComprobante === false ? '' : 'checked'}><span>Preguntarme si lo envío cada vez que registro un pago</span></label>
        <div class="acc-fila" style="margin-top:10px"><button class="btn primario" type="submit">Guardar mensajes</button>
          <button class="btn" type="button" data-sugeridos>Usar los sugeridos</button></div></form>`,
  });
  v.q('#f-plantillas').addEventListener('submit', (e) => { e.preventDefault(); seguro(async () => {
    const f = e.target;
    await S.guardarConfig({
      plantillasCobro: { porVencer: f.porVencer.value.trim(), moroso: f.moroso.value.trim() },
      plantillaComprobante: f.comprobante.value.trim(),
      preguntarComprobante: f.preguntar.checked,
    });
    aviso('Mensajes guardados'); v.cerrar();
  }); });
  v.q('[data-sugeridos]').addEventListener('click', () => {
    const f = v.q('#f-plantillas');
    f.porVencer.value = L.PLANTILLAS_COBRO.porVencer;
    f.moroso.value = L.PLANTILLAS_COBRO.moroso;
    f.comprobante.value = L.PLANTILLA_COMPROBANTE;
  });
}

// ---------- Configuración ----------
export function abrirConfig() {
  const pintar = (v) => {
    const cfg = S.db.config;
    const st = S.estadoAlmacen;
    v.poner({
      cuerpo: `${grupoMenu('Cobranza')}
        ${opMenu('vencimientos', '🔔', 'Vencimientos', 'Cuándo marcar 🟡 y la periodicidad sugerida.', { sub: true })}
        ${opMenu('mensajes', '📲', 'Mensajes de cobro', 'Recordatorios y comprobante de pago por WhatsApp.', { sub: true })}
        <div class="seccion"><h3>Campos personalizados</h3>
          <p class="mini" style="margin-bottom:8px">Agrega columnas nuevas a tus clientes sin afectar los datos existentes.</p>
          <ul class="lista-simple">${cfg.camposPersonalizados.map((x) => `<li style="display:flex;justify-content:space-between;gap:8px;align-items:center">
            <span>${esc(x.etiqueta)} <span class="mini">(${esc(x.tipo)})${x.archivado ? ' · oculto' : ''}</span></span>
            <button class="btn chico" data-arch="${esc(x.clave)}" data-val="${x.archivado ? '0' : '1'}">${x.archivado ? 'Mostrar' : 'Ocultar'}</button></li>`).join('') || '<li class="mini">Aún no hay campos personalizados.</li>'}</ul>
          <form id="f-campo" class="rejilla dos" style="margin-top:10px">
            <label>Nombre del campo<input name="etiqueta" required></label>
            <label>Tipo<select name="tipo"><option value="texto">Texto</option><option value="numero">Número</option><option value="fecha">Fecha</option><option value="nota">Nota larga</option></select></label>
            <button class="btn completo" type="submit">Agregar campo</button></form></div>
        <div class="seccion"><h3>Almacenamiento</h3>
          <p>${N.nubeActiva ? '☁️ Sincronizado con la nube y con copia en este dispositivo.<br>' : ''}${st.motor === 'indexeddb' ? '✅ Guardado en este dispositivo (IndexedDB).' : st.motor === 'localstorage' ? '⚠️ Guardado con método alterno (localStorage).' : '❌ Sin almacenamiento disponible.'}
          ${st.persistente ? '<br>Protegido contra borrado automático.' : ''}</p>
          <p class="mini" style="margin-top:6px">${S.db.clientes.length} clientes · ${S.db.historial.length} eventos de historial. Haz respaldos periódicos desde el menú Datos.</p>
          <button class="btn" data-accion="previa" style="margin-top:10px">Deshacer último cambio grande (importar/restaurar/masivo)</button></div>`,
    });
    v.q('#f-campo').addEventListener('submit', (e) => { e.preventDefault(); seguro(async () => {
      await S.agregarCampoPersonalizado(e.target.etiqueta.value, e.target.tipo.value);
      aviso('Campo agregado'); pintar(v);
    }); });
    v.el.querySelectorAll('[data-arch]').forEach((b) => b.addEventListener('click', () => seguro(async () => {
      await S.archivarCampo(b.dataset.arch, b.dataset.val === '1'); pintar(v);
    })));
    const bp = v.q('[data-accion="previa"]');
    bp.addEventListener('click', () => seguro(async () => {
      const p = await S.leerCopiaPrevia();
      if (!p) return aviso('No hay ninguna copia previa guardada');
      const ok = await confirmar({ titulo: 'Volver a la copia previa', mensaje: `Se restaurará el estado de antes de: <b>${esc(p.motivo)}</b> (${L.fmtFechaHora(p.ts)}, ${p.datos.clientes.length} clientes). Lo que hayas hecho después se perderá.`, ok: 'Restaurar', peligro: true });
      if (!ok) return;
      await S.restaurarCopiaPrevia(); v.cerrar(); aviso('Copia previa restaurada'); render();
    }));
    bp.addEventListener('click', (e) => e.stopPropagation());
  };
  const v = ventana({ titulo: 'Configuración', cuerpo: '', ancho: true });
  pintar(v);
}

// =====================================================================
// Eventos globales
// =====================================================================
export function enlazarEventos() {
  const filtrosEl = $('#filtros');
  let t;
  $('#q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { F.busqueda = e.target.value; render(); }, 120); });
  $('#btnFiltros').addEventListener('click', (e) => {
    filtrosEl.hidden = !filtrosEl.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!filtrosEl.hidden));
  });
  const bind = (id, clave) => $(id).addEventListener('input', (e) => { F[clave] = e.target.value; render(); });
  bind('#fEstado', 'estado'); bind('#fPDesde', 'pDesde'); bind('#fPHasta', 'pHasta');
  bind('#fIDesde', 'iDesde'); bind('#fIHasta', 'iHasta'); bind('#fEtiqueta', 'etiqueta'); bind('#orden', 'orden');
  $('#dir').addEventListener('click', () => { F.dir = F.dir === 'asc' ? 'desc' : 'asc'; render(); });
  const limpiar = () => {
    Object.assign(F, { estado: 'todos', etiqueta: '', pDesde: '', pHasta: '', iDesde: '', iHasta: '' });
    ['#fPDesde', '#fPHasta', '#fIDesde', '#fIHasta'].forEach((s) => ($(s).value = ''));
    render();
  };
  $('#btnLimpiar').addEventListener('click', limpiar);

  const acciones = {
    nuevo: () => { if (N.cupoPara(S.db.clientes.length).permitido) abrirFormulario(null); else avisoLimite(); },
    menu: abrirMenu,
    importar: abrirImportar,
    exportar: exportarExcel,
    respaldo: exportarRespaldo,
    restaurar: abrirRestaurar,
    revision: abrirRevision,
    asistente: abrirAsistente,
    papelera: abrirPapelera,
    config: abrirConfig,
    archivos: abrirArchivos,
    vencimientos: abrirVencimientos,
    mensajes: abrirMensajesCobro,
    cuenta: abrirCuenta,
    plan: abrirPlan,
    ayuda: (el) => abrirAyuda(el.dataset.texto),
    bloqueo: abrirBloqueo,
    comprobante: (el) => abrirComprobante(el.dataset.id, el.dataset.pago),
    'ocultar-bloqueo': () => { lsSet('cartera:ocultar-aviso-bloqueo', '1'); render(); },
    limpiar,
    estado: (el) => { F.estado = F.estado === el.dataset.cod ? 'todos' : el.dataset.cod; render(); },
    'ocultar-instalar': () => { lsSet('cartera:ocultar-instalar', '1'); render(); },
    'guia-instalar': () => { const v = ventana({ titulo: '📲 Instalar en iPhone', cuerpo: I.guiaIOS({ flecha: true }) }); I.enlazarGuia(v.el); },
    instalar: () => { I.instalar().then((ok) => { if (ok) aviso('Instalando… puede tardar hasta 1 minuto.'); render(); }); },
    abrir: (el) => abrirDetalle(el.dataset.id),
    editar: (el) => abrirFormulario(el.dataset.id),
    pago: (el) => abrirPago(el.dataset.id),
    baja: (el) => abrirBaja(el.dataset.id),
    reactivar: (el) => seguro(async () => { await S.reactivar(el.dataset.id); aviso('Cliente reactivado'); render(); refrescarDetalleAbierto(el.dataset.id); }),
    eliminar: (el) => accionEliminar(el.dataset.id),
    anular: (el) => accionAnular(el.dataset.id),
    recordar: (el) => {
      const c = S.buscar(el.dataset.id);
      const est = L.calcularEstado(c, L.hoyISO(), S.db.config.diasAviso);
      const url = L.enlaceWhatsApp(c.celular, L.mensajeCobro(c, est, S.db.config.plantillasCobro));
      if (!url) return aviso('Este cliente no tiene un celular válido', true);
      window.open(url, '_blank', 'noopener');
      S.anotarRecordatorio(c.id).then(() => { render(); refrescarDetalleAbierto(c.id); }).catch(() => {});
    },
  };
  // Con el plan vencido y más clientes que el límite gratis, la cartera queda en solo lectura.
  const REQUIEREN_PLAN = new Set(['nuevo', 'editar', 'pago', 'baja', 'reactivar', 'eliminar', 'anular', 'importar', 'restaurar', 'asistente']);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-accion]');
    if (a && acciones[a.dataset.accion]) {
      if (a.tagName === 'A' && a.getAttribute('href') === '#') e.preventDefault();
      if (REQUIEREN_PLAN.has(a.dataset.accion) && !N.puedeEditarCartera()) { avisoSoloLectura(); return; }
      acciones[a.dataset.accion](a);
      return;
    }
    const fila = e.target.closest('tr.fila');
    if (fila) abrirDetalle(fila.dataset.id);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (cerrarSuperior()) e.preventDefault(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('tr.fila')) { e.preventDefault(); abrirDetalle(e.target.dataset.id); }
  });
}
