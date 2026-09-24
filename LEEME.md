# Cartera IMSS — guía rápida

App web instalable (PWA) para gestionar la cartera de clientes. Los datos se guardan **solo en el teléfono** donde se usa.

## Contenido de esta carpeta

| Archivo / carpeta | Qué es |
|---|---|
| `app/` | La aplicación. **Es lo único que se publica en internet** (no contiene datos de clientes). |
| `ALTAS.xlsx` | Tu Excel original. La app nunca lo modifica. |
| `Respaldo_inicial.json` | Tus 116 clientes ya cargados, con los ajustes indicados (ver abajo). **Contiene datos personales: no lo subas a internet.** |
| `tools/`, `tests/`, `serve.js` | Herramientas de desarrollo y pruebas automáticas (`node --test tests/logic.test.mjs tests/excel.test.mjs`). |

## Poner la app en el iPhone

1. Publicar la carpeta `app/` en un hosting con HTTPS (Netlify Drop, GitHub Pages, Cloudflare Pages…). Sin HTTPS el iPhone no la instala ni funciona sin conexión.
2. En el iPhone, abrir el enlace en **Safari** → botón Compartir → **Agregar a pantalla de inicio**.
3. Pasar `Respaldo_inicial.json` al iPhone (AirDrop, iCloud Drive, correo…), abrir la app → ☰ **Datos** → **Restaurar respaldo**.
4. ☰ **Datos** → **Configurar pagos iniciales** (o fijar la fecha cliente por cliente).

Alternativa a los pasos 3: ☰ Datos → **Importar Excel** con `ALTAS.xlsx` (las filas en rojo entran como dadas de baja).

## Respaldos

- ☰ Datos → **Exportar a Excel**: crea un archivo **nuevo** (Clientes, Pagos, Historial). Nunca sobrescribe el original.
- ☰ Datos → **Descargar respaldo completo**: `.json` con todo; se recupera con **Restaurar respaldo**.
- Conviene exportar cada mes. Si se borran los datos de Safari o se elimina la app, los datos se pierden.

## Reglas de estado

- ⚫ **Dado de baja**: manual; siempre tiene prioridad. La falta de pago nunca da de baja.
- 🔴 **Moroso**: la fecha de próximo pago ya pasó.
- 🟡 **Próximo a vencer**: faltan de 0 a 7 días (el límite se cambia en ☰ Datos → Configuración). El día 0 (vence hoy) se considera próximo a vencer.
- 🟢 **Al día**: falta más que ese límite.
- ⚪ **Sin configurar**: aún no tiene fecha de próximo pago.
- La «FECHA DE inicio» del Excel indica el **día de pago** (24 = paga cada 24 del mes): la app muestra «Día 24 de cada mes» y calcula el siguiente pago desde ahí.
- Al registrar un pago, el próximo vencimiento avanza según la periodicidad (mensual, trimestral, semestral, anual), conservando el día del mes.
