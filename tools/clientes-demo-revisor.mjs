// Clientes INVENTADOS para la cuenta de prueba del revisor de Google Play.
// Uso: node tools/clientes-demo-revisor.mjs   → tienda/cuenta-prueba/clientes-demo.xlsx  (Excel real, no CSV: ver nota)
// Las fechas se calculan desde HOY (así salen clientes al día, por vencer y morosos). Si pasan semanas, vuelve a correrlo
// y reimporta el archivo en una cuenta nueva de prueba. Celulares con forma 55 0000 XXXX; sin CURP ni NSS (nada que parezca real).
// Nota: se usa .xlsx porque en un .csv la app lee mal las fechas (corre un día o confunde día y mes). Ver informe de Andrea 08/10.
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const X = createRequire(import.meta.url)(join(RAIZ, 'plataforma', 'vendor', 'xlsx.full.min.js'));

const hoyUTC = Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
const serial = (dias) => Math.round((hoyUTC + dias * 86400000) / 86400000) + 25569; // días desde 1899-12-30
const fecha = (dias) => ({ t: 'n', v: serial(dias), z: 'dd/mm/yyyy' });
const iso = (dias) => new Date(hoyUTC + dias * 86400000).toISOString().slice(0, 10);

const CLIENTES = [
  // [nombre, días hasta el próximo pago (negativo = atrasado), periodicidad]
  ['Cliente Demo Uno', -15, 'Mensual'], ['Cliente Demo Dos', -6, 'Mensual'], ['Cliente Demo Tres', -1, 'Trimestral'],
  ['Cliente Demo Cuatro', 0, 'Mensual'], ['Cliente Demo Cinco', 3, 'Mensual'], ['Cliente Demo Seis', 5, 'Semestral'],
  ['Cliente Demo Siete', 12, 'Mensual'], ['Cliente Demo Ocho', 20, 'Trimestral'], ['Cliente Demo Nueve', 28, 'Mensual'],
  ['Cliente Demo Diez', 45, 'Anual'], ['Cliente Demo Once', 60, 'Semestral'], ['Cliente Demo Doce', 90, 'Anual'],
];
const filas = [['Nombre', 'Celular', 'Fecha de inicio', 'Periodicidad', 'Próximo pago', 'Notas'],
  ...CLIENTES.map(([n, d, p], i) => [n, `55 0000 ${1001 + i * 11}`, fecha(-300 + i * 7), p, fecha(d), 'Cliente de ejemplo con datos inventados'])];
const wb = X.utils.book_new();
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(filas), 'Clientes');
const dir = join(RAIZ, 'tienda', 'cuenta-prueba');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'clientes-demo.xlsx'), Buffer.from(X.write(wb, { type: 'array', bookType: 'xlsx' })));
console.log(`listo tienda/cuenta-prueba/clientes-demo.xlsx (${CLIENTES.length} clientes; hoy = ${iso(0)}; primer próximo pago ${iso(CLIENTES[0][1])})`);
