// Lógica pura de planes y límites (sin Firebase ni DOM).
//  - sistema: documento global { betaAbierta, limiteGratis, diasPrueba, precios, medios, tasas }
//  - plan:    documento del asesor { tipo: 'prueba' | 'pro' | 'gratis', vence: milisegundos | null } (solo lo escribe el administrador)
//  - creado:  fecha de registro del asesor (milisegundos); sin documento de plan, la prueba gratis corre desde ahí.

export const LIMITE_GRATIS_DEFECTO = 15;
export const DIAS_PRUEBA_DEFECTO = 7;
const DIA = 86400000;
const diasHasta = (v, ahora) => (v == null ? null : Math.ceil((v - ahora) / DIA));

export function planEfectivo({ plan, sistema, creado } = {}, ahora = Date.now()) {
  const limite = Number.isFinite(sistema?.limiteGratis) ? sistema.limiteGratis : LIMITE_GRATIS_DEFECTO;
  const diasPrueba = Number.isFinite(sistema?.diasPrueba) ? sistema.diasPrueba : DIAS_PRUEBA_DEFECTO;
  const vence = plan?.vence ?? null;
  const ilimitado = (tipo, nombre, v) => ({ tipo, nombre, ilimitado: true, limite: Infinity, vence: v, vencido: false, diasRestantes: diasHasta(v, ahora) });

  if (plan?.tipo === 'pro' && (vence == null || vence > ahora)) return ilimitado('pro', 'Plan Pro', vence);
  if (sistema?.betaAbierta) return ilimitado('beta', 'Beta gratuita', null);
  if (plan?.tipo === 'prueba' && vence != null && vence > ahora) return ilimitado('prueba', 'Prueba gratis', vence);
  // Sin plan asignado: prueba automática desde el registro.
  const finPrueba = !plan?.tipo && creado != null ? creado + diasPrueba * DIA : null;
  if (finPrueba != null && finPrueba > ahora) return ilimitado('prueba', 'Prueba gratis', finPrueba);

  // Se acabó la prueba o el Pro (o el administrador lo dejó en gratis): plan gratis con límite.
  const termino = plan?.tipo === 'pro' || plan?.tipo === 'prueba' ? plan.tipo : finPrueba != null ? 'prueba' : null;
  return { tipo: 'gratis', nombre: 'Plan gratis', ilimitado: false, limite, vence: termino ? (vence ?? finPrueba) : null,
    vencido: !!termino, termino, diasRestantes: null };
}

/** Con el plan vencido y más clientes que el límite gratis, la cartera queda en solo lectura (ver y exportar). */
export function puedeEditar(planEf, clientes) {
  return planEf.ilimitado || clientes <= planEf.limite;
}

/** ¿Se pueden agregar `nuevos` clientes teniendo `actuales`? Devuelve cuántos caben. */
export function cupo(planEf, actuales, nuevos = 1) {
  if (planEf.ilimitado) return { permitido: true, caben: nuevos };
  const libres = Math.max(0, planEf.limite - actuales);
  return { permitido: nuevos <= libres, caben: Math.min(nuevos, libres) };
}

export const TIPOS_TICKET = { problema: 'Algo no funciona', pregunta: 'Tengo una pregunta', sugerencia: 'Sugerencia' };

export const PAISES = { CO: 'Colombia', VE: 'Venezuela', MX: 'México', OTRO: 'Otro' };

export const NOMBRE_TIPO = { ...TIPOS_TICKET, pago: 'Comprobante de pago', aviso: 'Mensaje de soporte' };

/** Medios de pago con los del país del asesor primero (se conserva el orden configurado dentro de cada grupo). */
export function mediosOrdenados(medios = [], pais = '') {
  const lista = (medios || []).filter((m) => m && m.nombre && m.dato);
  return [...lista.filter((m) => m.pais === pais), ...lista.filter((m) => m.pais !== pais)];
}

/** "5 USD al mes · 50 USD al año" (omite lo que no esté configurado). */
export function textoPrecios(sistema = {}) {
  const mon = sistema.moneda || 'USD';
  const p = [];
  if (Number(sistema.precioMensual) > 0) p.push(`${sistema.precioMensual} ${mon} al mes`);
  if (Number(sistema.precioAnual) > 0) p.push(`${sistema.precioAnual} ${mon} al año`);
  return p.join(' · ');
}

/**
 * Mensajes de una conversación. Los tickets antiguos guardaban el primer mensaje y la respuesta en el propio
 * documento (campos mensaje / respuesta); se muestran como los primeros mensajes del hilo.
 */
export function mensajesDeConversacion(ticket, mensajes = []) {
  const previos = [];
  if (ticket?.mensaje) previos.push({ id: 'legado-1', de: 'asesor', texto: ticket.mensaje, creado: ticket.creado });
  if (ticket?.respuesta) previos.push({ id: 'legado-2', de: 'soporte', texto: ticket.respuesta, creado: ticket.creado });
  return [...previos, ...mensajes];
}

// Moneda local de cada país y redondeo para mostrar un monto "limpio".
const MONEDA_LOCAL = { CO: { moneda: 'COP', redondeo: 1000 }, MX: { moneda: 'MXN', redondeo: 5 } };

/**
 * Equivalente aproximado en la moneda del país del asesor, con la tasa (unidades por 1 USD) que fija el administrador.
 * Devuelve '' si no aplica (precio no en USD, país sin moneda local configurada o sin tasa).
 */
export function equivalenteLocal(sistema = {}, pais = '') {
  const loc = MONEDA_LOCAL[pais];
  const tasa = Number(sistema.tasas?.[loc?.moneda]);
  if (!loc || !(tasa > 0) || (sistema.moneda || 'USD') !== 'USD') return '';
  const fmt = (usd) => {
    const n = Math.ceil((Number(usd) * tasa) / loc.redondeo) * loc.redondeo;
    return `${new Intl.NumberFormat('es-CO').format(n)} ${loc.moneda}`;
  };
  const p = [];
  if (Number(sistema.precioMensual) > 0) p.push(`≈ ${fmt(sistema.precioMensual)} al mes`);
  if (Number(sistema.precioAnual) > 0) p.push(`≈ ${fmt(sistema.precioAnual)} al año`);
  return p.join(' · ');
}
