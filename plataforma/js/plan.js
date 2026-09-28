// Lógica pura de planes y límites (sin Firebase ni DOM).
//  - sistema: documento global { betaAbierta, limiteGratis, datosPago }
//  - plan:    documento del asesor { tipo: 'pro' | 'gratis', vence: milisegundos | null }  (solo lo escribe el administrador)

export const LIMITE_GRATIS_DEFECTO = 15;
const DIA = 86400000;

export function planEfectivo({ plan, sistema } = {}, ahora = Date.now()) {
  const limite = Number.isFinite(sistema?.limiteGratis) ? sistema.limiteGratis : LIMITE_GRATIS_DEFECTO;
  const vence = plan?.vence ?? null;
  if (plan?.tipo === 'pro' && (vence == null || vence > ahora)) {
    return { tipo: 'pro', nombre: 'Plan Pro', ilimitado: true, limite: Infinity, vence, vencido: false,
      diasRestantes: vence == null ? null : Math.ceil((vence - ahora) / DIA) };
  }
  if (sistema?.betaAbierta) {
    return { tipo: 'beta', nombre: 'Beta gratuita', ilimitado: true, limite: Infinity, vence: null, vencido: false, diasRestantes: null };
  }
  return { tipo: 'gratis', nombre: 'Plan gratis', ilimitado: false, limite, vence, vencido: plan?.tipo === 'pro', diasRestantes: null };
}

/** ¿Se pueden agregar `nuevos` clientes teniendo `actuales`? Devuelve cuántos caben. */
export function cupo(planEf, actuales, nuevos = 1) {
  if (planEf.ilimitado) return { permitido: true, caben: nuevos };
  const libres = Math.max(0, planEf.limite - actuales);
  return { permitido: nuevos <= libres, caben: Math.min(nuevos, libres) };
}

export const TIPOS_TICKET = { problema: 'Algo no funciona', pregunta: 'Tengo una pregunta', sugerencia: 'Sugerencia' };

export const PAISES = { CO: 'Colombia', VE: 'Venezuela', MX: 'México', OTRO: 'Otro' };

export const NOMBRE_TIPO = { ...TIPOS_TICKET, pago: 'Comprobante de pago' };

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
