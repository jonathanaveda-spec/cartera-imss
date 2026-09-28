// Lógica pura de sincronización con la nube (sin Firebase ni DOM, para poder probarla).
// La app trabaja con un objeto `db` en memoria; en la nube cada cliente, cada elemento de la papelera y cada
// evento del historial es un documento propio (evita el límite de 1 MB por documento).

/** JSON con las claves ordenadas: dos objetos iguales dan siempre el mismo texto. */
export function estable(v) {
  return JSON.stringify(v, (_k, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]]))
      : x);
}

/** Copia sin valores `undefined` (Firestore no los acepta). */
export const limpio = (o) => JSON.parse(JSON.stringify(o));

export const COLECCIONES = ['clientes', 'papelera', 'historial'];

/** Todas las piezas de `db` como documentos: clave 'coleccion/id' → objeto. */
export function documentos(db) {
  const m = new Map();
  for (const c of db.clientes) m.set('clientes/' + c.id, c);
  for (const p of db.papelera) m.set('papelera/' + p.id, p);
  for (const h of db.historial) m.set('historial/' + h.id, h);
  m.set('config/main', { ...db.config, importaciones: db.importaciones });
  return m;
}

/**
 * Compara `db` con lo último que se sabe de la nube (`base`: clave → firma) y devuelve lo que falta enviar.
 *  - El historial nunca se modifica ni se borra: solo se agregan eventos nuevos.
 *  - Los borrados solo se piden para documentos que la nube tenía y ya no están en `db`.
 */
export function calcularCambios(db, base) {
  const escribir = [];
  const borrar = [];
  const docs = documentos(db);
  for (const [key, doc] of docs) {
    if (key.startsWith('historial/')) {
      if (!base.has(key)) {
        const d = limpio(doc);
        escribir.push({ key, doc: d, firma: estable(d) });
      }
      continue;
    }
    const d = limpio(doc);
    const firma = estable(d);
    if (base.get(key) !== firma) escribir.push({ key, doc: d, firma });
  }
  for (const key of base.keys()) {
    if (docs.has(key) || key.startsWith('historial/') || key === 'config/main') continue;
    borrar.push(key);
  }
  return { escribir, borrar };
}

/** Actualiza `base` con lo que trae un snapshot de una colección (reemplaza todas sus claves). */
export function actualizarBase(base, coleccion, datos /* array de {id, ...} */) {
  for (const k of [...base.keys()]) if (k.startsWith(coleccion + '/')) base.delete(k);
  for (const d of datos) base.set(`${coleccion}/${d.id}`, estable(limpio(d)));
}

export function separarConfig(doc) {
  if (!doc) return null;
  const { importaciones, ...config } = doc;
  return { config, importaciones: importaciones || [] };
}
