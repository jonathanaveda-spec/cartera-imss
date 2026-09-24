// Interfaz: render de resumen/lista, ventanas (detalle, formularios, pagos, importación, etc.).
import * as L from './logic.js';
import * as S from './store.js';
import * as E from './excel.js';
import * as N from './nube.js';

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

function ventana({ titulo, cuerpo, pie = '', ancho = false, fondoCierra = true, onCerrar }) {
  const fondo = document.createElement('div');
  fondo.className = 'fondo-modal';
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
      titulo,
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
  if (S.estadoAlmacen.motor === 'ninguno') {
    a.push(`<div class="banner mal"><p><b>Atención:</b> este navegador no permite guardar datos. Lo que captures se perderá al cerrar. Abre la app desde Safari y agrégala a la pantalla de inicio.</p></div>`);
  }
  if (esIOS() && !enModoApp() && !lsGet('cartera:ocultar-instalar')) {
    a.push(`<div class="banner info"><p><b>Para usarla como app en el iPhone:</b> toca el botón Compartir (cuadro con flecha) → <b>Agregar a pantalla de inicio</b>.</p>
      <button class="btn chico" data-accion="ocultar-instalar">Entendido</button></div>`);
  }
  if (cnt.total && cnt.SIN_CONFIG) {
    a.push(`<div class="banner"><p><b>${cnt.SIN_CONFIG}</b> ${cnt.SIN_CONFIG === 1 ? 'cliente aún no tiene' : 'clientes aún no tienen'} fecha de próximo pago (el Excel original no traía pagos). Puedes asignarla uno por uno o con el asistente.</p>
      <button class="btn chico" data-accion="asistente">Configurar pagos</button></div>`);
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
    cont.innerHTML = `<div class="vacio"><h2>Aún no hay clientes</h2>
      <p>Importa tu Excel (ALTAS.xlsx) para empezar, o agrega clientes uno por uno.</p>
      <button class="btn primario" data-accion="importar">Importar mi Excel</button>
      <button class="btn" data-accion="nuevo">Agregar cliente</button></div>`;
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
  return `<tr class="fila est-${e.clase}" data-id="${c.id}" tabindex="0" role="button" aria-label="Abrir ${esc(c.nombre)}">
    <td class="c-estado"><span class="insignia ${e.clase}">${e.icono} ${e.etiqueta}</span></td>
    <td class="c-nombre"><div class="nombre">${esc(c.nombre) || '<i>(sin nombre)</i>'}</div><div class="sub">${esc(c.curp)}</div></td>
    <td class="c-cel">${esc(c.celular) || '—'}</td>
    <td class="solo-escritorio">${esc(c.opcion) || '—'}<div class="sub">${esc(c.proveedor)}</div></td>
    <td class="solo-escritorio">${esc(c.periodicidad) || '—'}${L.textoDiaPago(c) ? `<div class="sub">${L.textoDiaPago(c)}</div>` : ''}</td>
    <td class="c-vence"><span class="lin-fecha">${conFecha ? L.fmtFecha(c.proximo_pago) : ''}</span> <span class="dias ${e.clase}">${L.textoDias(e)}</span></td>
    <td class="solo-escritorio">${up ? L.fmtFecha(up.fecha_pago) : '—'}</td>
    <td class="c-acc"><div class="acciones">${boton}</div></td></tr>`;
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
  const tel = L.telefonoDe(c.celular);
  const otros = L.otrosDuplicados(c, dup).map(S.buscar).filter(Boolean);
  const hist = S.historialDe(id).slice(0, 40);
  const ult = S.ultimoPagoRegistrado(c);
  const extras = S.db.config.camposPersonalizados.filter((x) => c.extra?.[x.clave] || !x.archivado);

  const cuerpo = `
    <div class="seccion destacado">
      <div><span class="insignia ${e.clase}">${e.icono} ${e.etiqueta}</span>
        <div class="dias ${e.clase}" style="margin-top:6px">${L.textoDias(e)}</div></div>
      <div style="text-align:right"><div class="mini">Próximo pago</div><div class="grande">${c.proximo_pago ? L.fmtFecha(c.proximo_pago) : '—'}</div>
        <div class="mini">${esc(c.periodicidad) || 'Sin periodicidad'}${L.textoDiaPago(c) ? ' · <b>' + L.textoDiaPago(c) + '</b>' : ''}</div></div>
    </div>
    ${e.codigo === 'BAJA' ? `<div class="banner mal"><p>Dado de baja${c.baja_fecha ? ' el ' + L.fmtFecha(c.baja_fecha) : ''}${c.baja_motivo ? ': ' + esc(c.baja_motivo) : ''}. Si vuelve a cotizar, usa «Reactivar». Este estado tiene prioridad sobre las fechas de pago.</p></div>` : ''}
    <div class="seccion acc-fila">
      ${e.codigo === 'BAJA' ? '' : `<button class="btn primario" data-accion="pago" data-id="${id}">Registrar pago</button>`}
      <button class="btn" data-accion="editar" data-id="${id}">Editar</button>
      ${tel ? `<a class="btn" href="tel:${tel}">Llamar</a><a class="btn" href="https://wa.me/52${tel}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
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
        <div class="mini">Cubre desde ${L.fmtFecha(p.periodo_desde)} · siguiente vencimiento ${L.fmtFecha(p.periodo_hasta)}${p.nota ? ' · ' + esc(p.nota) : ''}</div></li>`).join('')}</ul>
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
        <select name="periodicidad"><option value="">Sin definir</option>
          ${Object.keys(L.PERIODICIDADES).map((p) => `<option ${v.periodicidad === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
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

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const datos = Object.fromEntries([...fd.entries()].filter(([k]) => !k.startsWith('x:')));
    if (!String(datos.nombre || '').trim()) { form.nombre.focus(); return aviso('El nombre es obligatorio', true); }
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
      <label>Periodicidad *<select name="periodicidad" required>
        ${c.periodicidad ? '' : '<option value="">Elegir…</option>'}
        ${Object.keys(L.PERIODICIDADES).map((p) => `<option ${c.periodicidad === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
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
    const per = form.periodicidad.value || null;
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
  form.addEventListener('input', (ev) => { if (ev.target.name === 'nuevo_proximo') manual = !!ev.target.value; else if (ev.target.name === 'periodicidad' || ev.target.name === 'fecha_pago' || ev.target.name === 'cubre_desde') manual = false; calc(); });
  calc();

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!form.fecha_pago.value) return aviso('Indica la fecha del pago', true);
    if (!form.periodicidad.value) return aviso('Elige la periodicidad', true);
    if (!form.nuevo_proximo.value) return aviso('No se pudo calcular el próximo pago', true);
    seguro(async () => {
      const fd = Object.fromEntries(new FormData(form).entries());
      await S.registrarPago(id, fd);
      ven.cerrar();
      aviso('Pago registrado');
      render();
      refrescarDetalleAbierto(id);
    });
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
export function abrirMenu() {
  const { hoy } = ctx();
  const dup = L.indexarDuplicados(S.db.clientes);
  const nAvisos = S.db.clientes.filter((c) => L.avisosDeCliente(c, dup, hoy).length).length;
  const op = (acc, ico, tit, desc) => `<button class="opcion-menu" data-accion="${acc}"><span class="ico">${ico}</span><span><b>${tit}</b><span class="d">${desc}</span></span></button>`;
  const v = ventana({
    titulo: 'Datos y opciones',
    cuerpo: [
      op('importar', '📥', 'Importar Excel', 'Carga un archivo .xlsx (por ejemplo ALTAS.xlsx). No borra nada de lo que ya tienes.'),
      op('exportar', '📤', 'Exportar a Excel', 'Crea un archivo nuevo con clientes, pagos e historial. El original no se toca.'),
      op('respaldo', '💾', 'Descargar respaldo completo', 'Copia de todos los datos de la app (.json) para guardarla o pasarla a otro teléfono.'),
      op('restaurar', '♻️', 'Restaurar respaldo', 'Recupera datos desde un respaldo .json. Guarda antes una copia de lo actual.'),
      op('revision', '🔎', 'Revisión de datos', nAvisos ? `${nAvisos} cliente(s) con datos por revisar.` : 'Sin avisos.'),
      op('asistente', '🗓️', 'Configurar pagos iniciales', 'Asigna periodicidad y próxima fecha a los clientes que aún no la tienen.'),
      op('papelera', '🗑️', 'Papelera', `${S.db.papelera.length} cliente(s) eliminados.`),
      op('config', '⚙️', 'Configuración', 'Días de aviso, campos nuevos y estado del almacenamiento.'),
      ...(N.nubeActiva ? [op('cuenta', '☁️', 'Cuenta', `${esc(N.estado.usuario || '')} · datos sincronizados en la nube. Toca para cerrar sesión.`)] : []),
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

export function abrirImportar() {
  pedirArchivo('.xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel', (f) => seguro(async () => {
    const buf = await f.arrayBuffer();
    mostrarVistaPreviaImport(E.leerExcel(new Uint8Array(buf), f.name));
  }));
}

export function mostrarVistaPreviaImport(parsed) {
  const prep = S.prepararImportacion(parsed);
  const rojas = prep.nuevas.filter((f) => f.baja).length;
  const sinNombre = prep.nuevas.filter((f) => !f.datos.nombre).length;
  const v = ventana({
    titulo: 'Importar Excel', fondoCierra: false,
    cuerpo: `<div class="seccion"><h3>Archivo</h3>
        <p><b>${esc(parsed.archivo)}</b> · hoja «${esc(parsed.hoja)}»</p>
        <p class="mini">Columnas: ${parsed.encabezados.map(esc).join(' · ')}</p></div>
      <div class="seccion"><h3>Qué se va a importar</h3><ul class="lista-simple">
        <li><b>${prep.nuevas.length}</b> cliente(s) nuevos</li>
        ${prep.repetidas.length ? `<li><b>${prep.repetidas.length}</b> fila(s) ya importadas antes (se omiten, no se duplican)</li>` : ''}
        ${rojas ? `<li><b>${rojas}</b> fila(s) con celdas en <span style="color:#dc2626">rojo</span>: se importan como ⚫ <b>DADO DE BAJA</b> (no se borran; puedes reactivarlos si vuelven a cotizar).</li>` : ''}
        ${sinNombre ? `<li><b>${sinNombre}</b> fila(s) sin nombre</li>` : ''}
        ${parsed.columnasVacias.length ? `<li>Columna(s) vacía(s) que se ignoran: ${parsed.columnasVacias.map(esc).join(', ')}</li>` : ''}
        ${parsed.camposNuevos.length ? `<li>Columnas extra que pasan a campos personalizados: ${parsed.camposNuevos.map((x) => esc(x.etiqueta)).join(', ')}</li>` : ''}
        ${parsed.hojasVacias.length ? `<li class="mini">Hojas sin datos (no se importan): ${parsed.hojasVacias.map(esc).join(', ')}</li>` : ''}
      </ul></div>
      <p class="mini">Cada valor original se guarda tal cual venía en el Excel. Solo se eliminan espacios sobrantes al inicio y al final de los textos. Nada se corrige automáticamente.</p>`,
    pie: `<button class="btn" data-cerrar type="button">Cancelar</button>
          <button class="btn primario" data-ok type="button" ${prep.nuevas.length ? '' : 'disabled'}>Importar ${prep.nuevas.length} cliente(s)</button>`,
  });
  v.q('[data-ok]').addEventListener('click', () => seguro(async () => {
    const n = await S.aplicarImportacion(parsed, prep);
    v.cerrar();
    render();
    resultadoImport(n);
  }));
}

function resultadoImport(n) {
  const { hoy } = ctx();
  const dup = L.indexarDuplicados(S.db.clientes);
  const conAviso = S.db.clientes.filter((c) => L.avisosDeCliente(c, dup, hoy).length).length;
  const sin = S.db.clientes.filter((c) => !c.proximo_pago && !c.baja).length;
  const v = ventana({
    titulo: 'Importación completa',
    cuerpo: `<p style="margin-bottom:12px"><b>${n}</b> cliente(s) importados. Total en la app: <b>${S.db.clientes.length}</b>.</p>
      <p style="margin-bottom:8px">Siguientes pasos recomendados:</p>
      <ol class="pasos">
        <li><b>${conAviso}</b> cliente(s) tienen datos que conviene revisar (CURP/NSS incompletos, duplicados, fechas raras…).</li>
        <li><b>${sin}</b> cliente(s) aún no tienen periodicidad ni fecha de próximo pago.</li>
      </ol>`,
    pie: `<button class="btn" data-cerrar type="button">Cerrar</button>
          <button class="btn" data-accion="revision">Revisar datos</button>
          <button class="btn primario" data-accion="asistente">Configurar pagos</button>`,
  });
  v.el.addEventListener('click', (e) => { if (e.target.closest('[data-accion]')) v.cerrar(); });
}

// ---------- Exportar / respaldo ----------
export async function exportarExcel() {
  await seguro(async () => {
    const bytes = E.exportarExcelBytes(S.db, L.hoyISO());
    const ok = await E.descargar(bytes, `Cartera_IMSS_${L.hoyISO()}.xlsx`, MIME_XLSX);
    if (ok) {
      await S.marcarRespaldo();
      aviso('Excel exportado. Tu archivo original no se modificó.');
      render();
    }
  });
}

export async function exportarRespaldo() {
  await seguro(async () => {
    const ok = await E.descargar(S.exportarJSON(), `Respaldo_Cartera_IMSS_${L.hoyISO()}.json`, 'application/json');
    if (ok) { await S.marcarRespaldo(); aviso('Respaldo descargado'); render(); }
  });
}

export function abrirRestaurar() {
  pedirArchivo('.json,application/json', (f) => seguro(async () => {
    const texto = await f.text();
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
export function abrirAsistente() {
  const pendientes = S.db.clientes.filter((c) => !c.proximo_pago && !c.baja);
  if (!pendientes.length) return aviso('Todos los clientes ya tienen fecha de próximo pago');
  const { hoy, aviso: dias } = ctx();
  const cuerpo = `<form id="f-asis">
    <div class="banner info"><p>En el Excel, la «FECHA DE inicio» indica el <b>día de pago</b> de cada cliente (por ejemplo, el 24 = paga cada 24). Lo que el Excel no dice es si ya pagó los meses pasados. Verás el resultado antes de aplicarlo, y luego puedes ajustar cliente por cliente.</p></div>
    <label style="margin-bottom:12px">Periodicidad para estos ${pendientes.length} clientes
      <select name="periodicidad">${Object.keys(L.PERIODICIDADES).map((p) => `<option ${S.db.config.periodicidadDefecto === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    <label class="radio-tarjeta"><input type="radio" name="metodo" value="ciclo" checked><span><b>Suponer que están al corriente</b><br>
      <span class="mini">El próximo pago es el siguiente día de pago a partir de hoy (ej. si paga el 24 y hoy es 24/09, el próximo es 24/10). Nadie aparecerá como moroso hasta que pase esa fecha.</span></span></label>
    <label class="radio-tarjeta"><input type="radio" name="metodo" value="inicio"><span><b>No suponer nada</b><br>
      <span class="mini">El primer vencimiento es un periodo después de la fecha de inicio. Los clientes antiguos aparecerán como morosos hasta que registres sus pagos.</span></span></label>
    <div class="seccion" id="prev-asis" style="margin-top:12px"></div></form>`;
  const v = ventana({
    titulo: 'Configurar pagos iniciales', cuerpo, fondoCierra: false,
    pie: `<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn primario" data-ok type="button">Aplicar</button>`,
  });
  const form = v.q('#f-asis');
  let calculo = [];
  const actualizar = () => {
    calculo = S.calcularMasivo(pendientes, { periodicidad: form.periodicidad.value, metodo: form.metodo.value, hoy });
    const cnt = { AL_DIA: 0, POR_VENCER: 0, MOROSO: 0 };
    let omit = 0;
    for (const it of calculo) {
      if (it.omitido) { omit++; continue; }
      cnt[L.calcularEstado({ ...it.c, proximo_pago: it.proximo, baja: false }, hoy, dias).codigo]++;
    }
    const aplicables = calculo.length - omit;
    v.q('#prev-asis').innerHTML = `<h3>Vista previa (${aplicables} clientes)</h3>
      <div>🟢 Al día: <b>${cnt.AL_DIA}</b> · 🟡 Próximos a vencer: <b>${cnt.POR_VENCER}</b> · 🔴 Morosos: <b>${cnt.MOROSO}</b></div>
      ${omit ? `<div class="mini" style="margin-top:6px">${omit} cliente(s) no se tocan por no tener una fecha de inicio confiable: ${[...new Set(calculo.filter((i) => i.omitido).map((i) => i.razon))].join(', ')}. Los puedes configurar a mano.</div>` : ''}`;
    v.q('[data-ok]').disabled = !aplicables;
    v.q('[data-ok]').textContent = `Aplicar a ${aplicables} clientes`;
  };
  form.addEventListener('input', actualizar);
  actualizar();
  v.q('[data-ok]').addEventListener('click', () => seguro(async () => {
    const n = await S.aplicarMasivo(calculo, form.periodicidad.value, form.metodo.value);
    v.cerrar(); aviso(`Listo: ${n} clientes configurados`); render();
  }));
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
async function abrirCuenta() {
  const ok = await confirmar({
    titulo: 'Cerrar sesión',
    mensaje: `Se cerrará la sesión de <b>${esc(N.estado.usuario || '')}</b> y se <b>borrarán los datos guardados en este dispositivo</b> (siguen a salvo en la nube). Para volver a verlos tendrás que iniciar sesión otra vez con internet.`,
    ok: 'Cerrar sesión', peligro: true,
  });
  if (!ok) return;
  await seguro(async () => { await N.salir(); location.reload(); });
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

// ---------- Configuración ----------
export function abrirConfig() {
  const pintar = (v) => {
    const cfg = S.db.config;
    const st = S.estadoAlmacen;
    v.poner({
      cuerpo: `<form id="f-cfg">
        <div class="seccion"><h3>Vencimientos</h3>
          <label>Días para marcar «Próximo a vencer»<input type="number" name="diasAviso" min="1" max="90" value="${cfg.diasAviso}" inputmode="numeric">
            <div class="ayuda">Un cliente es 🟡 cuando faltan entre 0 y este número de días para su próximo pago.</div></label>
          <label style="margin-top:12px">Periodicidad sugerida
            <select name="periodicidadDefecto">${Object.keys(L.PERIODICIDADES).map((p) => `<option ${cfg.periodicidadDefecto === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
          <button class="btn primario" type="submit" style="margin-top:12px">Guardar</button></div></form>
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
    v.q('#f-cfg').addEventListener('submit', (e) => { e.preventDefault(); seguro(async () => {
      const f = e.target;
      const d = Math.max(1, Math.min(90, parseInt(f.diasAviso.value, 10) || 7));
      await S.guardarConfig({ diasAviso: d, periodicidadDefecto: f.periodicidadDefecto.value });
      aviso('Configuración guardada'); render(); pintar(v);
    }); });
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
    nuevo: () => abrirFormulario(null),
    menu: abrirMenu,
    importar: abrirImportar,
    exportar: exportarExcel,
    respaldo: exportarRespaldo,
    restaurar: abrirRestaurar,
    revision: abrirRevision,
    asistente: abrirAsistente,
    papelera: abrirPapelera,
    config: abrirConfig,
    cuenta: abrirCuenta,
    limpiar,
    estado: (el) => { F.estado = F.estado === el.dataset.cod ? 'todos' : el.dataset.cod; render(); },
    'ocultar-instalar': () => { lsSet('cartera:ocultar-instalar', '1'); render(); },
    abrir: (el) => abrirDetalle(el.dataset.id),
    editar: (el) => abrirFormulario(el.dataset.id),
    pago: (el) => abrirPago(el.dataset.id),
    baja: (el) => abrirBaja(el.dataset.id),
    reactivar: (el) => seguro(async () => { await S.reactivar(el.dataset.id); aviso('Cliente reactivado'); render(); refrescarDetalleAbierto(el.dataset.id); }),
    eliminar: (el) => accionEliminar(el.dataset.id),
    anular: (el) => accionAnular(el.dataset.id),
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-accion]');
    if (a && acciones[a.dataset.accion]) {
      if (a.tagName === 'A' && a.getAttribute('href') === '#') e.preventDefault();
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
