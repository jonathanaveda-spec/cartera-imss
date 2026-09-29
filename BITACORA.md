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
  (asunto "Prueba reenvio soporte").

**Pendiente**
- Confirmar que el correo de prueba llegó a la bandeja de Gmail.
- admin.html → Sistema: quitar "Acceso libre para todos" (activa la prueba de 7 días).
- Revisar privacidad.html: dice "persona natural con domicilio en Colombia" y el banner
  "BORRADOR — pendiente de revisión legal".
- GitHub avisó "Possible valid secrets detected" en el repo `cartera-imss`: revisar.
- Siguiente tarea: asistente para importar Excel.
