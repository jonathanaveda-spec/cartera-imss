# Bitácora de trabajo — Cartera Asesor

Registro de lo hecho en cada sesión (código y también acciones fuera del código:
Cloudflare, panel de administración, correos), para poder retomarlo desde cualquier PC
con `git pull`.

## ▶ Estado actual y próximos pasos (actualizado 30/09, cierre de la noche)

**En línea:** carteraasesor.com/app → versión `cartera-asesor-945579d83c` (la versión ya se pone sola
con cada publicación). Panel: carteraasesor.com/app/admin.html (ya con 🗑️ Borrar pagos y asesores;
Jonathan confirmó que le llegó la versión nueva).

**Para retomar en otra PC:** `git pull` en la carpeta del repo y decirle a Claude «retomemos».
Claude lee `CLAUDE.md`, esta bitácora y `PLAN.md`.

**Pendientes (en orden sugerido):**
1. ~~Yamileth: probar **Eliminar** y el **scroll** en iPhone~~ ✅ arreglado (Jonathan, 01/10).
2. Que algún usuario de iPhone pruebe la **guía de instalación** nueva desde Safari.
3. ~~Confirmar el destrabe automático de publicaciones~~ ✅ funcionó el 30/09 (v21 salió sola).
4. Seguimos en **beta** (decisión 01/10): no quitar todavía **«Acceso libre para todos»** (admin → Sistema) para activar la prueba de 7 días.
5. ~~`privacidad.html`: domicilio y aviso BORRADOR~~ ✅ domicilio confirmado; se quitó BORRADOR de privacidad y términos (01/10).
6. ~~Asistente para importar cualquier Excel~~ ✅ hecho (PC del local, ver abajo). ~~Video corto~~ ✅ v1 lista (ver abajo).
   Siguiente: **embellecer la página carteraasesor.com** (`sitio/index.html`) con las skills de Emil Kowalski
   (**emil-design-eng** y **mobile-native**, instaladas en la PC del local en `~/.claude/skills/`; en otra PC hay que
   instalarlas de nuevo desde github.com/emilkowalski/skills, carpeta `skills/<nombre>/SKILL.md`). Hacerlo en una
   conversación nueva. Después: **capturas + cuenta de prueba** para Google Play.
   Jonathan prefiere editar él los videos en CapCut (manejar CapCut con clics gasta muchos tokens).
7. En espera: **App Store** (ver «Meta pendiente: App Store» al final).
8. ~~Publicar las reglas nuevas de Firebase~~ ✅ publicadas por Jonathan el 30/09 1:59 a.m. (verificado).
   Falta probar el borrado en el panel (Asesores → 🗑️ Borrar en «Jonathan Prueba»).

## PC del local (después del 01/10) — Importar cualquier Excel

**Importar Excel rehecho** (PLAN.md paso 13). Antes solo funcionaba con el formato de Yami (títulos en la
fila 1 y una columna llamada CLIENTE o NOMBRE). Ahora:
- Pantalla de entrada (☰ → Importar y exportar → Importar Excel) con los 3 pasos para tener el archivo en el
  teléfono (WhatsApp/correo → Descargar o Guardar en Archivos), botón **📄 Plantilla** y **📥 Elegir mi Excel**.
- **Paso 1 de 2 · ¿Qué dato tiene cada columna?**: busca sola la fila de títulos (en las primeras 20 filas; se
  puede cambiar o elegir «Mi archivo no tiene títulos») y sugiere qué es cada columna por el título (Nombre(s),
  Apellidos, Tel. cel., WhatsApp, Fecha alta, Frecuencia, Próximo pago, No. IMSS, Observaciones…) o, si el título
  no dice nada, por el contenido (CURP, NSS de 11 dígitos, celular de 10, nombres). Cada columna tiene un selector:
  un dato de la app, «Otro dato» (campo personalizado) o «No importar». El nombre puede venir en varias columnas
  (nombre + apellidos) y se une en orden; los demás datos van en una sola columna.
- **Paso 2 de 2 · Revisa antes de importar**: tabla con los primeros 5 clientes, qué datos entran y avisos
  (fechas o periodicidades que no se entendieron quedan vacías, nunca se inventan; filas repetidas; filas en rojo).
- Se pueden importar también **Periodicidad** (Mensual, Trimestral, Semestral, Anual, quincenal/semanal, «cada N
  días») y **Próximo pago**: con eso el cliente queda 🟢/🟡/🔴 sin pasar por «Fechas de cobro».
- **Plantilla** `Plantilla_Cartera_Asesor.xlsx` con los títulos, una fila de EJEMPLO (no se importa aunque se
  olvide borrarla) y una hoja «Cómo llenarla».
- «Fechas de cobro» ahora **respeta la periodicidad** que el cliente ya trae (antes la cambiaba por la elegida).
- Código: `js/excel.js` (leerLibro, detectarFilaTitulos, columnasDeHoja, sugerirMapeo, construirImportacion,
  plantillaBytes; leerExcel queda como lectura automática), `js/ui.js` (abrirImportar + asistenteImportar),
  `js/store.js` (calcularMasivo/aplicarMasivo). Pruebas nuevas: `tests/importar.test.mjs` (46 pruebas en total, pasan).
- Verificado: con el ALTAS.xlsx de Yami la lectura nueva da **exactamente** lo mismo que la anterior (116 filas,
  mismos datos y misma huella para no duplicar). Probado en /demo/ en tamaño celular con Excels inventados.

**Video de 30 s**: guion en `tienda/video-guion.md` (escenas con IA 0–8 s + grabación real de la app + CapCut).
Excel de clientes inventados para grabar (25 clientes: 6 🔴, 6 🟡, 13 🟢 según la fecha en que se creó): se le mandó a
Jonathan; no está en el repo (los .xlsx no se suben). Se regenera con un script de Claude si hace falta.
**Video v1 hecho** en CapCut de la PC del local (proyecto «0929 (1)»), exportado a `Descargas/Cartera_Asesor_video_v1.mp4`
(31 s, 9:16, 1080p, música gratis «Summer Mood Upbeat Corporate»). Escenas 1–2 con IA de CapCut: imagen gratis +
«Video de IA» modelo Seedance 1.0 Fast en **480p** (en 720p pide Pro; el primero fue gratis, luego 20 créditos c/u;
quedan ~630). Luego tarjetas PNG hechas con sharp (logo / candado / cierre) y la grabación de Jonathan recortada
(sin el registro de la cuenta: se veía su correo) a 3x y 2x. Falta: voz de Jonathan (opcional); en la grabación
aparece el botón flotante de la grabadora de pantalla (esconderlo la próxima vez).

**Números con código de país**: `logic.js → telefonoInternacional`. Un celular de 10 dígitos sigue siendo de México
(+52); si se escribe con «+» y código de país (ej. +57 300…), WhatsApp y «Llamar» usan ese país. «Llamar» ahora
marca con +52 (antes marcaba los 10 dígitos sin código: desde Colombia o Venezuela no llegaba a México).

## 2026-10-01

**Aviso de GitHub "Possible valid secrets detected"**: se revisó todo el historial. Lo único detectado es
la `apiKey` de Firebase en `plataforma/js/nube-config.js`. No es un secreto: va en la app de todos los
visitantes y solo identifica el proyecto; los datos los protegen el inicio de sesión y `firestore.rules`.
No hay contraseñas, tokens de GitHub ni llaves privadas. Pasos que hace Jonathan (guía en el chat):
(1) Google Cloud → Credenciales → restringir la llave a los sitios carteraasesor.com, github.io,
cartera-asesor.firebaseapp.com y localhost; (2) cerrar la alerta en GitHub como «Won't fix».

**Instalar en Android: había que intentarlo varias veces** (Jonathan, 01/10). Causa: al aceptar, Chrome
tarda hasta ~1 min en armar la app, pero la pantalla decía «¡Listo!» al instante y, al terminar
(evento appinstalled), volvía a mostrar los pasos del menú ⋮; además el botón reaparecía y al tocarlo
otra vez se reiniciaba la instalación. Ahora (js/instalar.js) hay estados: «Instalando… no vuelvas a
tocar» → «✅ ¡Lista!» al terminar; si pasan 90 s sin confirmación, pregunta si ya ve el ícono. Si Chrome
dice que la app ya está en el teléfono (manifest `related_applications` + getInstalledRelatedApps),
muestra «Ya tienes la app» en lugar del botón.

**Android: aviso «Pueden existir riesgos»** en el teléfono de Jonathan (antivirus de Transsion: Tecno/Infinix/itel).
El escaneo de virus pasa; avisa solo porque la app no viene de una tienda. Decisión: ir a **Google Play**
(ver PLAN.md, Fase 3). Ya quedaron listos los textos de la ficha y el gráfico 1024×500 en `tienda/`.
Cuenta **personal** (Jonathan paga el sábado 03/10). Nuevo `js/origen.js`: si la app se abre con
`?origen=play` (o referrer android-app://com.carteraasesor…) lo recuerda en el teléfono y «Mi plan» y los
avisos del plan ya no muestran precios, medios de pago ni «Ver planes/Renovar» (política de pagos de Google).
Empaquetado previsto con PWABuilder (pasos en PLAN.md).

**Páginas legales**: se quitó el aviso BORRADOR de `privacidad.html` y `terminos.html`
(Jonathan confirmó responsable y domicilio en Colombia).

## 2026-09-30

**Panel de administración: borrar pagos y asesores (v21)**
- Pagos: botón 🗑️ Borrar en cada pago (confirmación centrada). Solo borra el registro; el plan del asesor no cambia.
- Asesores: botón 🗑️ Borrar (no aparece en la cuenta del propio administrador). Pide escribir BORRAR.
  Borra perfil, plan, cartera (clientes, papelera, historial, config), conversaciones de soporte y,
  si se deja marcado, sus pagos. Queda en admin_log. El acceso (correo/contraseña) sigue en
  Firebase Authentication: si entra de nuevo empieza como cuenta nueva (y si su teléfono aún tiene
  datos guardados, podría volver a subirlos).
- `firestore.rules`: el administrador ahora puede borrar `usuarios/{uid}` y su cartera.
  **Hay que publicarlas en Firebase → Firestore → Reglas** (no se publican con GitHub).
- No se pudo probar el borrado de punta a punta aquí (requiere entrar como administrador).

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

**Publicación trabada (29/09)**: de v15 a v17 no se publicaron porque un despliegue de GitHub Pages (36e9cbd) quedó colgado "en curso". Se destrabó con `tools\destrabar-pages.ps1 -Sha <SHA del error>` (lo corre Jonathan: usa su sesión de GitHub). Ya en línea v17.

**Menú ☰ reorganizado (v18)**: título "Menú"; Mi plan arriba y 3 grupos: Cobranza (Fechas de cobro, resaltada si hay clientes sin fecha; Vencimientos; Mensajes de cobro), Tus datos (📂 Importar y exportar → submenú con Descargar respaldo, Exportar a Excel, Importar Excel, Restaurar respaldo; Papelera; Configuración) y Ayuda y cuenta. Configuración también tiene accesos a Vencimientos y Mensajes.

**iPhone: ventanas cortadas y scroll difícil (v19)**: en iPhone la capa fija de las ventanas quedaba más alta que la pantalla visible; la confirmación "Eliminar cliente" quedaba con los botones fuera de pantalla (Yami no podía borrar un duplicado) y costaba llegar al final de la ficha. Arreglo: js/pantalla.js pone --alto-visible/--tope-visible con visualViewport; .fondo-modal usa esa altura; confirmaciones centradas (ventana({dialogo:true})); overscroll-behavior: contain en .modal-cuerpo.

**Instalar en iPhone (v20)**: guía visual de 4 pasos con íconos dibujados como los de Safari (Compartir, •••, Agregar a inicio), distinta para Safari de iOS 26 (••• → Compartir) y anteriores; flecha animada que apunta a la barra de Safari; ayuda para quien abrió el enlace desde WhatsApp (abrir en Safari / copiar enlace). En la pantalla de acceso va plegada («ver cómo»); dentro de la app, el aviso tiene «Ver cómo (4 pasos)».

**Publicación trabada otra vez**: desde v18 no se publica; GitHub pide cancelar el despliegue 227c1e7544bc4ff2ffd01a1537e795a9e44f4aff. El script ahora lo detecta solo: `powershell -ExecutionPolicy Bypass -File tools\destrabar-pages.ps1` (sin -Sha). Jonathan lo corrió y quedó v20 en línea. Además se agregó a `pages.yml` un paso «Cancelar publicaciones colgadas» (usa el token del propio flujo) para que no vuelva a pasar.

## Meta pendiente: App Store (en espera)
Decisión 29/09: publicar Cartera Asesor en la App Store es la meta, pero queda en espera
(faltan los 99 USD/año de Apple Developer y el trámite). Plan acordado cuando se retome:
1. Jonathan se inscribe en Apple Developer (decidir: persona o empresa; empresa pide D-U-N-S).
2. App Store Connect: acuerdo de apps gratis, app "Cartera Asesor", Bundle ID com.carteraasesor.app,
   llave API (rol App Manager) que sube Jonathan a Codemagic.
3. Claude: empaquetar plataforma/ con Capacitor (rama aparte), notificaciones locales de cobro
   (requisito práctico para no ser rechazada por "solo una web", guía 4.2), ocultar pagos del
   Plan Pro en iOS (guía 3.1.1), compilar en Codemagic sin Mac.
4. TestFlight con Jonathan y Yami → ficha de tienda (capturas 6.9", descripción, privacidad,
   cuenta de prueba para el revisor) → revisión (1-3 días). Tiempo total estimado 2-4 semanas.

**Service worker: panel admin se quedaba viejo (v22)**: admin.html / js/admin.js no estaban en la lista de precarga; al pedirlos, el service worker podía guardar una copia vieja de la caché HTTP de GitHub Pages (10 min) y dejarla pegada toda la versión. Ahora están en ARCHIVOS y lo que no está en la lista se pide con cache: 'no-cache'. Regla: todo archivo nuevo de plataforma/ que se use debe ir en ARCHIVOS de sw.js.

**Actualizaciones 100% automáticas (30/09)**: (1) al publicar, tools/sello-sw.py pone VERSION = commit y mete TODOS los archivos en la precarga (ya no se sube la versión a mano ni se puede olvidar un archivo); (2) js/actualizar.js (app y panel) busca versión nueva al abrir, al volver a la app, al recuperar internet y cada 30 min, y recarga sola cuando la nueva toma el control (si hay una ventana abierta o se está escribiendo, espera); (3) el flujo cancela solo publicaciones colgadas. Los que tengan la versión anterior necesitan recargar una última vez a mano; de ahí en adelante es automático.
