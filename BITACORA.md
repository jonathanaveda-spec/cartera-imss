# Bitácora de trabajo — Cartera Asesor

Registro de lo hecho en cada sesión (código y también acciones fuera del código:
Cloudflare, panel de administración, correos), para poder retomarlo desde cualquier PC
con `git pull`.

## 2026-09-28 (PC de casa)

**Código**
- Repo clonado en `D:\Claude\carteraasesor` (se instaló Git en esta PC).
- `plataforma/privacidad.html`: responsable = Jonathan Naveda (antes `[NOMBRE COMPLETO]`).
- `plataforma/sw.js`: versión del service worker `cartera-asesor-v10` → `v11`.

**Fuera del código**
- Cloudflare Email Routing: reenvío de soporte@carteraasesor.com → jonathanaveda@gmail.com
  (activado, destino verificado, regla "soporte"). Lo hizo Jonathan.
- Correo de prueba enviado desde jonathanaveda@gmail.com a soporte@carteraasesor.com
  (asunto "Prueba reenvio soporte"). **REBOTÓ**: `550 5.1.1 Address does not exist`.
  El DNS está bien (MX route1/2/3.mx.cloudflare.net, SPF de Cloudflare), así que Cloudflare
  recibe el correo pero no encuentra una regla activa para "soporte".
- Publicado en carteraasesor.com (commit 9e75b98): comprobado en línea que sw.js es v11
  y que privacidad.html muestra el nombre.
- Git en esta PC ya tiene la sesión de GitHub guardada (jonathanaveda-spec).

**Pendiente**
- Cloudflare → carteraasesor.com → Enrutamiento de correo electrónico → Reglas: revisar que
  la regla sea exactamente "soporte", acción "Enviar a un correo electrónico" →
  jonathanaveda@gmail.com, que esté ACTIVADA y que el destino figure como Verificado.
  Después mandar otra prueba. (El panel de Cloudflare no cargó desde Claude in Chrome.)
- admin.html → Sistema: quitar "Acceso libre para todos" (activa la prueba de 7 días).
  No se tocó: falta que Jonathan decida si ya se empieza a cobrar.
- Revisar privacidad.html: dice "persona natural con domicilio en Colombia" y el banner
  "BORRADOR — pendiente de revisión legal".
- GitHub avisó "Possible valid secrets detected" en el repo `cartera-imss`: revisar.
- Siguiente tarea: asistente para importar Excel.

## 2026-09-29

**Respaldo en Excel (para pasar a Yami de la app vieja a la nueva)**
- Problema: en Android, "Descargar respaldo completo" abría la hoja de compartir (solo
  WhatsApp) y el archivo era .json, que no se podía guardar en el celular.
- Ahora el respaldo es un **Excel (.xlsx)**: hojas Clientes/Pagos/Historial visibles y una hoja
  oculta "Respaldo" con todos los datos. "Restaurar respaldo" acepta ese .xlsx (y los .json viejos).
  "Exportar a Excel" también trae la hoja oculta, así que también sirve para restaurar.
- En Android el archivo se descarga directo a Descargas; en iPhone sigue la hoja de
  compartir ("Guardar en Archivos").
- Cambio en `app/` (app vieja, github.io/cartera-imss, sw cartera-imss-v5) y en `plataforma/`
  (app nueva, carteraasesor.com/app, sw cartera-asesor-v12). Se publica en los dos repos
  (carteraasesor y cartera-imss comparten el mismo historial).
- Probado en el navegador: un respaldo .xlsx hecho en la app vieja se restaura en la nueva.
- Pasos para Yami: en la app vieja ☰ Datos → Descargar respaldo completo (queda en Descargas);
  en la nueva ☰ Datos → Restaurar respaldo → elegir Respaldo_Cartera_IMSS_<fecha>.xlsx.

- Yami ya se mudó a la app nueva.

**Correo de soporte: RESUELTO.** Causa: en Cloudflare no existía ninguna regla ("Reglas de
enrutamiento: 0"); solo estaba la regla general "Para todo" (Descartar, desactivada). Se creó la
regla soporte@carteraasesor.com → Enviar a jonathanaveda@gmail.com (Activa; destino Verificado).
Prueba 3 sin rebote y el Registro de actividad de Cloudflare la muestra como "Forwarded".
Nota: si la prueba se manda desde el mismo Gmail, Gmail no muestra la copia reenviada en Recibidos;
para verla, probar desde otra cuenta.
(Si Claude in Chrome no carga Cloudflare, es porque la ventana de Chrome está minimizada.)

**Panel de administración**
- Logo de Cartera Asesor en el encabezado, la pantalla de acceso y el ícono (2f01999).
- Instalable como app aparte "Cartera Admin": `plataforma/admin.webmanifest` (id "admin",
  scope "admin") + registro del service worker en admin.js (36e9cbd, sw v14). Antes Chrome
  solo ofrecía "Crear acceso directo" porque admin.html no tenía manifiesto.

**App de asesores: menú ☰**
- "Vencimientos" (días para 🟡 y periodicidad sugerida) y "Mensajes de cobro" (textos de
  WhatsApp del botón «Recordar») salen de Configuración y tienen su propio apartado, justo
  debajo de "Mi plan". Configuración queda con campos personalizados y almacenamiento. (sw v15)
- "Configurar pagos iniciales" → **"Fechas de cobro"**, rehecho como asistente de 3 pasos:
  1) qué es, con un cliente real de ejemplo (fecha de inicio → día de cobro); 2) ¿cada cuánto
  te pagan?; 3) ¿van al corriente? (con el próximo cobro del ejemplo en cada opción) + resumen
  🟢🟡🔴 y la lista de clientes que no se tocan, separados por motivo. La lógica de cálculo no
  cambió (S.calcularMasivo / S.aplicarMasivo).
- Encabezado: "Cartera Asesor" ya no se parte en dos líneas en el celular; en pantallas
  menores a 360px solo se ve el logo. (sw v16)
- **Periodicidad personalizada "cada N días"** (1 a 365). Se guarda como texto «Cada 15 días»
  (logic.js: diasDePeriodicidad / periodicidadDias / esPeriodicidad; siguienteVencimiento suma
  días; sin día fijo del mes → dia_pago = null). Disponible en: asistente Fechas de cobro (paso 2),
  ficha del cliente, Registrar pago y Vencimientos (periodicidad sugerida). Pruebas nuevas en
  tests/plataforma.test.mjs (no se pudieron correr aquí: esta PC no tiene Node; se verificó
  lo mismo en el navegador). La app vieja (app/) no se tocó. (sw v17)
