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

**Correo de soporte**: sigue pendiente. El panel de Cloudflare no carga desde Claude in Chrome
(ventana sin tamaño / se queda cargando), así que la regla hay que revisarla a mano.
