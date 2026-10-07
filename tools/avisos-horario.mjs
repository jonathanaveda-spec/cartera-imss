// A quién le toca el aviso diario (sin dependencias, para poder probarlo con `npm test`).
// Lo usa tools/enviar-avisos.mjs, que corre cada hora en GitHub Actions.

const ZONA_DEFECTO = 'America/Mexico_City';

/** Fecha (AAAA-MM-DD) y hora (0–23) de este momento en la zona horaria del asesor. */
export function ahoraEn(zona, ahora = new Date()) {
  let partes;
  try {
    partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: zona || ZONA_DEFECTO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(ahora);
  } catch {
    return ahoraEn(ZONA_DEFECTO, ahora); // zona desconocida: hora de México
  }
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: Number(p.hour) % 24 };
}

/**
 * ¿Hay que mandarle el aviso ahora? A su hora elegida o hasta 3 horas después (GitHub a veces atrasa las tareas
 * programadas), y solo una vez por día.
 */
export function leToca(aviso, fecha, hora) {
  const h = Number.isInteger(aviso.hora) ? aviso.hora : 8;
  return !!aviso.activo && aviso.ultimoEnvio !== fecha && hora >= h && hora < h + 3;
}
