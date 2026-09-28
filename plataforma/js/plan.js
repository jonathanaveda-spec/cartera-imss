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

export const PAISES = { MX: 'México', CO: 'Colombia', VE: 'Venezuela', OTRO: 'Otro' };
