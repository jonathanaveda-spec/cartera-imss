# Bitácora de trabajo — Cartera Asesor

Registro de lo hecho en cada sesión (código y también acciones fuera del código:
Cloudflare, panel de administración, correos), para poder retomarlo desde cualquier PC
con `git pull`.

## ▶ Estado actual y próximos pasos (actualizado 07/10 tarde, PC del local)

**En línea:** carteraasesor.com/app → versión `cartera-asesor-027ec073ff` (la versión ya se pone sola
con cada publicación). Panel: carteraasesor.com/app/admin.html.

**Lo hecho en esta sesión** (detalle en «PC del local» más abajo):
- Importar Excel guiado en 3 pasos.
- Beta gratuita hasta 100 clientes (se cambia en el panel → Sistema). Precios de la página tras el velo «Beta gratuita».
- Sección «¿Tu Excel está en la computadora?» en la página.
- Bloqueo con PIN y huella: Jonathan lo probó y le encantó.
- Comprobante de pago por WhatsApp.
- Botones del cliente reordenados.
- Gesto «atrás» de Android que ya no minimiza la app: Jonathan confirmó que funciona.
- Competencia revisada, con sus ideas en `PLAN.md`.

**01/10:**
- ✅ **Capturas para Google Play listas.** Son 6 de 1080×1920 con título y marco, en `tienda/capturas/`.
  - Se hicieron con clientes inventados en la demo local y en la versión de Play (sin precios).
  - Para rehacerlas: `node serve.js` y luego `node tools/capturas-play.mjs` (Edge automático por DevTools).
    El marco está en `tienda/marco.html`.
  - Las capturas sin marco quedan en `tienda/capturas/crudas/`, que no se sube a GitHub.

**06/10:**
- **Skills oficiales de Remotion** (videos hechos con código) instaladas en la **PC del local**, en
  `~/.claude/skills/remotion-*`. Son 12: best-practices, create, markup, studio, render, captions, maps, saas,
  interactivity, docs, upgrade y multimedia. Vienen de github.com/remotion-dev/skills (commit 4733526).
- No van dentro del repo porque ese repositorio no declara licencia, así que no corresponde redistribuirlo.
- En otra PC se instalan con `npx skills add remotion-dev/skills`. Otra forma: `git -c core.longpaths=true clone`
  y copiar `skills/*` a `~/.claude/skills/`; hace falta `longpaths` porque en Windows algunas rutas son muy largas.
- Remotion necesita Node, que la PC de la casa no tiene. Es gratis para personas y empresas de hasta 3 empleados.

- **Identidad de marca aprobada:** Jonathan eligió la tipografía **A · Cercana** (Bricolage Grotesque para títulos +
  Plus Jakarta Sans para textos). La paleta es la de la app, más un **oro acento #FFD166** para la palabra clave.
  - Quedó como regla en la skill `.claude/skills/marca-cartera-asesor/SKILL.md`. Incluye la voz, el formato TikTok
    1080×1920 con su zona segura, el ritmo (gancho 0–2 s, problema, app en acción, llamado) y la forma de trabajo:
    guion aprobado → programar → revisar fotogramas → render.
  - Tablero visual: `tienda/marca/tablero.png`, que se rehace con
    `node tools/foto-html.mjs /tienda/marca/tablero.html tienda/marca/tablero.png`. En Git Bash hay que anteponer
    `MSYS_NO_PATHCONV=1`.
  - Agente `productor-videos` (`.claude/agents/productor-videos.md`, **modelo Sonnet**): hace los videos con Remotion en
    `videos/` siguiendo la skill.
  - ✅ **TikTok #1 «¿Todavía cobras con libreta?»**: borrador listo, 21 s, sin música. Lo hizo el agente productor
    (Sonnet) con Remotion en `videos/`; Claude revisó los fotogramas.
    - Guion, descripciones y hashtags: `videos/guiones/tiktok-01-libreta.md`.
    - Video: `videos/out/tiktok-01-libreta.mp4`, solo local (para rehacerlo, ver los comandos en el guion o en
      `videos/renderizar-fotogramas.sh`).
    - Remotion usa Edge como navegador, así que no descarga Chrome.
    - Corregido (v2): todo centrado en x=540 con ancho máximo de 800 px. Ahora es regla de la marca.
    - ✅ **Publicado en TikTok** (@carteraasesor) el 06/10, con la música que Jonathan puso en CapCut y la descripción
      recomendada (la opción 1 del guion, con carteraasesor.com escrito y los hashtags #asesorimss #cobranza
      #carteradeclientes #asesorindependiente #emprendedores #carteraasesor).
  - **Plan de contenido** con 24 videos en 4 series (Así funciona, Tip del asesor, Antes vs. después, Te respondo):
    `videos/plan-contenido.md`. Ritmo: 3 videos por semana.
  - 🎬 **TikTok #2 «Pásale tu Excel en 2 minutos» (24.5 s) y #3 «Si alguien toma tu celular… ¿ve tu cartera?» (24 s)**:
    listos sin música. Para bajarlos desde cualquier PC (también el #1) están en `videos/entregas/`, subidos a GitHub.
    - Los guiones, con descripciones y hashtags, están en `videos/guiones/`.
    - Capturas nuevas de la app con datos inventados: `node tools/capturas-videos.mjs`, que guarda en
      `videos/public/capturas/`. Necesita `node serve.js` corriendo.
    - Detalle: en la pantalla «¡Listo!» del #2 la app muestra «Revisa 3 clientes con datos que conviene corregir»,
      porque los CURP/NSS del Excel inventado están incompletos. Si molesta, se cambian en el script y se rehace.
  - ✅ **Cuenta de TikTok creada: @carteraasesor**.
    - Datos: correo soporte@carteraasesor.com y una línea de celular nueva solo para la marca.
    - Perfil: foto `tienda/marca/avatar-redes.png`, nombre «Cartera Asesor» y la descripción «La app del asesor IMSS:
      quién te debe, quién vence y cobro por WhatsApp 🟢».
- El servidor local (`node serve.js`) ahora abre la app nueva (`/plataforma/`). La app vieja de Yamileth ya no se usa.

**07/10 (PC del local, tarde) — Equipo de agentes:** Jonathan pidió más agentes «como la productora» que piensen y
trabajen como empleadas super inteligentes, y les puso nombre. Se crearon 10 nuevas en `.claude/agents/` + el manual
`.claude/equipo.md` (todas lo leen primero): Tere (probadora-app), Victoria (estratega-redes, Opus), Clara
(soporte-clientes), Fernanda (guardiana-datos, Opus), Julieta (redactora), Andrea (gestora-tiendas), Mariana
(investigadora-mercado), Luna (cazadora-tendencias), Frida (directora-creativa, ideas visuales) y Ximena
(disenadora-avatares: personajes inventados realistas con ficha; nunca personas reales ni testimonios falsos). La
productora es Lucía. Voz: muestrarios de 24 voces (México + emociones) y 38 (Latinoamérica); regla de **variedad de
voces** en la skill `voz-cartera-asesor`. Lucía está haciendo T01, H01 y P#4 con voz + versiones con voz del #2 (Jorge)
y #3 (Dalia): Jonathan **solo publicará las versiones con voz**.

**📋 PENDIENTES CONSOLIDADOS (07/10, tarde) — EMPEZAR POR AQUÍ** (revisados contra esta bitácora, `PLAN.md` y la memoria)

Hecho hoy 07/10 (PC del local): Azure + voces (muestrarios, variedad), equipo de 11 agentes con manual, Tere probó lo
nuevo (54/54 pruebas) y se arreglaron 3 fallas del resumen del día (en línea `027ec073ff`), Luna hizo
`investigacion/tendencias.md`, Lucía entregó 5 videos con voz + plantillas T y H (`videos/entregas/*_con_voz.mp4`).

🔴 Urgente / decisiones de Jonathan:
1. ✅ **Comisión:** Jonathan confirmó que la de Yamileth es en **montos** (07/10). La app sigue con montos; el
   importador ahora **avisa** si un Excel trae porcentajes (quedan vacíos, no se adivinan) y entiende «$1,500» o «1.500,50».
2. ✅ **Yamileth tiene 86 clientes** (lo vio Jonathan en el panel; las 116 filas del Excel incluían bajas): no se topa con
   el tope de 100. Si algún día pasa de 100 → Plan Pro en el panel.
3. ✅ **Sin videos de noticias del IMSS** por ahora (decisión de Jonathan 07/10).

Lo hace Jonathan:
4. ✅ (07/10) #2 Excel y #3 PIN **publicados con voz**. Faltan T01 (jue 8, 20:00), H01 (vie 9, 20:00) y #4 (dom 11, 20:00).
   Antes: revisar y publicar los 5 videos con voz (música comercial 15–25 % + «Contenido generado por IA»). Orden: #2 Excel (Jorge)
   → T01 (Renata) → #3 PIN (Dalia) → H01 (Jorge+Marina) → #4 Mensajes (Dalia). Descripciones en los guiones.
   **#halloween** (antes del 31/10) y **#fraude** van en la próxima tanda.
5. Creative Center (PC): capturas de **Canciones aprobadas para uso comercial** y de **Hashtags con filtro de industria**.
6. Google Play **sábado 10/10**: los Gmail de 12 personas con Android + cuenta de prueba para el revisor.
7. Firebase **Blaze** + secreto `FIREBASE_LLAVE` + clave pública **VAPID** (avisos con la app cerrada).
8. Identidad del desarrollador: Jonathan la trae hecha y **llevará otro nombre** (no «Puente Digital»). Sesión aparte de **Puente Digital** (logo e identidad) → desbloquea la pantalla «Acerca de».
9. ✅ (07/10) Jonathan probó el resumen del día: quedó bien. Probar en el celular: resumen del día, Pagan hoy / Pagaron hoy, 💰 Mis comisiones.
10. ⏰ Recordatorio programado **domingo 11/10, 9:00 a. m.** (tarea «recordatorio-domingo-buscar-videos»). «Ciclo que aprende»: guardar 5–10 virales del nicho en una colección de TikTok; cada lunes captura de analíticas.
11. ✅ Decisión 07/10: Azure (voz) se maneja **solo en la PC del local**. (Antes: PC de la casa: si quiere voz allá, crear `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION` (y esa PC no tiene Node).)
12. ✅ Jonathan (07/10): de los pendientes viejos **solo falta invitar a los 12 asesores a la beta**. (Antes: que un usuario de iPhone pruebe la guía de instalación desde Safari; probar 🗑️ Borrar en el
    panel con «Jonathan Prueba»; invitar 5–12 asesores a la beta.)

Lo hace Emma con el equipo:
13. ✅ Mejoras de comisiones (07/10): «¿Ganas lo mismo con todos?» en Mis comisiones, «atrás» desde un cliente regresa
    a Mis comisiones (y se refresca), una comisión nueva ya no cambia los pagos de antes, y al anotar varias seguidas no
    se pierde el campo. Falta: ver/corregir la comisión de cada pago en el historial.
14. **Victoria:** crear `videos/resultados.md` y el plan de la semana 12–18/10 (top 3 de Luna + Halloween + #fraude).
15. **Lucía:** tanda de la semana con las plantillas T/H/P apenas Victoria arme el plan.
16. **Luna:** lista de canciones cuando lleguen las capturas.
17. **Fernanda:** primera revisión general de datos y seguridad (antes de invitar más asesores).
18. **Andrea + Julieta:** lista y textos de la ficha de Google Play para el sábado.
19. **Ximena:** elenco de personajes (necesita una herramienta de imágenes; Canva está conectado).
20. App, después: «Acerca de» + Compartir, Entrar con Google, tour de bienvenida, aviso de vencimiento del plan, foto del
    comprobante, avisos con la app cerrada (tras Blaze), modo oscuro.

**07/10 — Aviso diario al celular SIN Blaze (gratis, con GitHub Actions):**
- Blaze no se pudo activar: Google rechazó todas las tarjetas (error OR-CBAT-14, sin documentación; probablemente el
  perfil de pagos de Google). Quedó creada la cuenta de facturación «Cartera Asesor» (01AE7E-…) **sin tarjeta y sin
  vincular**: no cobra nada. No reintentar seguido (empeora el bloqueo); si algún día hace falta Blaze → soporte de
  facturación de Google Cloud con el código.
- En su lugar: `.github/workflows/avisos.yml` corre **cada hora** (solo en el repo carteraasesor) y
  `tools/enviar-avisos.mjs` (firebase-admin) manda «Hoy pagan 3 clientes · 2 morosos · 1 por vencer» por Firebase
  Cloud Messaging (gratis en Spark) a quien le toque según su hora y zona (`tools/avisos-horario.mjs`; ventana de 3 h,
  una vez al día). Solo avisa si hay algo que cobrar; borra teléfonos dados de baja; nunca imprime datos.
- App: ☰ → **⏰ Aviso diario** (pide permiso, elige hora, «Ver cómo se ve», desactivar). Guarda en
  `usuarios/{uid}/config/avisos` (ya permitido por las reglas; la sincronización solo usa `config/main`). Al cerrar
  sesión se borra el teléfono. En iPhone exige la app instalada. `sw.js` muestra el aviso y al tocarlo abre la app.
  `resumenAviso` en logic.js. Paquete `vendor/firebase.js` reconstruido con `firebase/messaging` (misma 11.10.0).
  Pruebas: `tests/avisos.test.mjs` (58 en total).
- ⏳ **Para encenderlo falta 1 cosa** (la opción ☰ → ⏰ Aviso diario ya se ve; los que lo activen empiezan a recibir cuando esté la llave):
  1. ✅ (07/10, la sacó Emma) Clave pública VAPID → `vapidKey` en `plataforma/js/nube-config.js` (Firebase → Configuración del proyecto →
     Cloud Messaging → Certificados push web → Generar par de claves). Es pública.
  2. **Jonathan:** Firebase → Configuración del proyecto → Cuentas de servicio → «Generar nueva clave privada» (JSON) →
     GitHub repo **carteraasesor** → Settings → Secrets and variables → Actions → New repository secret
     `FIREBASE_LLAVE` = todo el contenido del JSON → borrar el JSON de la PC. **Nunca en el chat.**
  Prueba: GitHub → Actions → «Aviso diario» → Run workflow → marcar «prueba».

**07/10 — Revisión de seguridad de Fernanda (guardiana-datos):**
- 🔴 Había **nombres/teléfonos reales** de clientas de Yamileth en `tests/logic.test.mjs`, `tests/plataforma.test.mjs`
  y en un comentario de `plataforma/js/logic.js` (que se publica). Los repos son **públicos**. ✅ Cambiados por datos
  inventados (commit f196929). ⏳ **Falta limpiar el historial** de GitHub (camino A: `git filter-repo --replace-text`
  en todas las ramas + push forzado a los dos repos; la lista de textos se arma solo en la PC, nunca se sube). Necesita
  la autorización de Jonathan y que ninguna otra PC tenga cambios pendientes.
- ✅ `.gitignore`: `imagenes/*` (salvo el logo; ahí hay una grabación con el celular y correos de Jonathan que nunca debe
  subirse) y llaves (`*.jks`, `*.keystore`, `.env*`, `google-services.json`…). ✅ Quitado el Gmail personal de la bitácora.
- 🟡 Pendientes: frases de publicidad que prometen de más («100 % privada», «nadie puede ver», «encriptados» → Julieta),
  el admin puede leer carteras (opción: quitarlo antes de cobrar), PIN con esperas crecientes, actualizar SheetJS 0.18.5
  → 0.20.3, `Cartera_Asesor_video_v1.mp4` muestra 2 correos cerca del seg 13, verificación en dos pasos en la cuenta de
  Google del admin, confirmar que la llave de Firebase está restringida a los dominios.
- 🟢 Sin claves expuestas; ALTAS.xlsx y respaldos nunca se subieron; reglas de la nube bien; cerrar sesión borra todo.

**📋 LISTA PARA MAÑANA (08/10) — (histórica; lo vigente está arriba):**
Lo hace Jonathan:
1. ✅ (07/10, PC del local) Azure listo: cuenta actualizada a pago por uso («Azure subscription 1»; la prueba gratis
   estaba bloqueada), grupo `cartera-asesor`, recurso Speech `cartera-voz` **Free F0**, East US. Variables de usuario
   `AZURE_SPEECH_KEY` (la puso Jonathan) y `AZURE_SPEECH_REGION=eastus` en esta PC. Prueba de voces generada y
   funcionando. **En la PC de la casa hay que volver a crear las dos variables** (misma clave). Nunca pegar la clave en el chat.
2. Publicar los TikTok #2 (Excel) y #3 (PIN) con música comercial y las descripciones de `videos/guiones/`.
3. Seguir juntando los Gmail de las 12 personas con Android (Google Play el sábado 10/10).
4. Cuando pueda: Firebase Blaze + llave `FIREBASE_LLAVE` en GitHub + clave pública VAPID (para avisos con la app cerrada).
5. Abrir la sesión aparte de Puente Digital con el mensaje que se le dio (logo e identidad).
6. Probar en su celular lo nuevo: resumen del día, filtros Pagan hoy / Pagaron hoy y 💰 Mis comisiones (y avisar si
   la columna COMISIÓN del Excel de Yamileth era un monto o un porcentaje).
Lo hace Claude en la sesión local:
7. Prueba de voces (Dalia / Jorge) → Jonathan elige → anotarla en la skill `voz-cartera-asesor`.
8. Videos (`videos/plan-diario.md`): plantilla T (tarjetas) y H (chat de WhatsApp y antes/después); capturas nuevas del
   resumen del día, los filtros y Mis comisiones; producir los 2 videos del día 1 **con voz**; revisar fotogramas y
   dejarlos en `videos/entregas/`.
9. «Ciclo que aprende» (`videos/plan-diario.md` §5, sacado del video de @morfeoacademy, versión gratis): Jonathan
   guarda 5–10 virales del nicho en una colección de TikTok y cada lunes manda captura de las analíticas; Claude crea
   `videos/resultados.md`, anota vistas y convierte en serie lo que funcione. Programar en TikTok Studio (PC).

**Siguiente (Jonathan elige):**
1. Pantalla «Acerca de» + Compartir la app. **Desarrollador: Puente Digital** (elegido por Jonathan el 07/10).
   Su identidad de marca (logo, colores, etc.) se hace en una sesión aparte, en `empresa/puente-digital/`.
2. Entrar con Google.
3. ~~Filtros rápidos «Pagan hoy» / «Pagaron hoy»~~ ✅ hechos (07/10, ver abajo).
4. Google Play — **pospuesto al sábado 10/10** (Jonathan está buscando a las 12 personas):
   - ~~capturas de pantalla~~ ✅;
   - cuenta de prueba para el revisor;
   - juntar los Gmail de **12 personas** para la prueba cerrada de 14 días.
5. Si algún asesor pasa de 100 clientes (por ejemplo Yamileth), darle Plan Pro en el panel.

**07/10 (desde la nube):**
- **Filtros rápidos del día**: dos botones debajo de las tarjetas, «📅 Pagan hoy» (próximo pago = hoy, sin los de
  baja) y «✅ Pagaron hoy» (algún pago con fecha de hoy), cada uno con su número. Al tocar uno se quita la tarjeta de
  estado elegida; se cuentan en «Filtros» y se quitan con «Quitar filtros». Mensaje propio si no hay nadie.
  Lógica en `logic.js` (cumpleRapido / contarRapidos), pruebas en `tests/rapidos.test.mjs`. Probado en la demo a
  390 px y 340 px de ancho.
- **Resumen del día** arriba de todo al abrir la app: saludo con el nombre y la fecha, y filas tocables
  (📅 pagan hoy, 🔴 morosos, 🟡 vencen pronto, ✅ ya pagaron hoy; solo las que tienen algo) que aplican el filtro y
  bajan a la lista. «Ocultar» lo esconde hasta el día siguiente (`cartera:resumen-oculto`). Probado en la demo.
- **Notificaciones con la app cerrada** (pedido de Jonathan): requieren Firebase **Blaze** + Cloud Functions +
  Cloud Messaging. Pasos que hace Jonathan: activar Blaze con alerta de 1 USD; cuenta de servicio `github-publicar`
  (rol Editor) con llave JSON guardada como secreto `FIREBASE_LLAVE` en el repo carteraasesor (nunca en el chat);
  y pasar la clave pública VAPID (Cloud Messaging → Certificados push web). Después Claude programa el aviso diario
  («Hoy pagan N · M morosos»), la opción de activarlo y la hora, y el despliegue automático desde GitHub Actions.
- **Videos: 2 al día** (Jonathan pidió 3 y luego bajó a 2). Plan en `videos/plan-diario.md`: cada día un P a mediodía y por
  la noche un H o un T alternados (7 P + 4 H + 3 T por semana): cada día un T (tarjeta de texto con
  plantilla), un P (pantalla de la app) y un H (historia animada: chat o antes/después). **Todos los hace Claude en la
  sesión local con Remotion** (Jonathan no graba a cámara); producción por tandas los domingos y publicaciones
  programadas en TikTok Studio. Banco de 42 ideas (2 semanas) y guiones completos del día 1. Falta: plantilla T en
  Remotion y capturas de las funciones nuevas. Descripciones listas para publicar los #2 y #3 (enlaces de descarga en
  videos/entregas).
- **💰 Mis comisiones** (☰ → Cobranza). Jonathan: la comisión es un monto variable que pone el asesor por cliente.
  - En el cliente: «Tu comisión por pago» (el campo `comision` que ya existía, también viene del Excel).
  - Al registrar un pago: «Tu comisión de este pago», prellenada con la del cliente y editable; se guarda en `pago.comision`
    (los pagos viejos sin ese dato usan la del cliente).
  - Pantalla: «Llevas en <mes>», «Te falta por cobrar» (comisión de activos que vencen este mes o están atrasados),
    gráfica de barras de 6 meses (un solo azul; el mes actual más oscuro; tocar una barra muestra su total),
    lista por cliente del mes y lista de clientes sin comisión con un campo para anotarla ahí mismo.
  - Lógica: `resumenComisiones` / `comisionDePago` / `moverMes` en logic.js; pruebas en `tests/comisiones.test.mjs`.
  - Probado en la demo a 390 px.
- **Voz en off con Azure Speech** (decisión de Jonathan; la música la sigue poniendo él en TikTok). Nueva skill
  `.claude/skills/voz-cartera-asesor` y script `videos/voz.mjs` (genera un MP3 por frase + `tiempos.json` en
  `videos/public/voz/<id>/`, que no se sube). Falta que Jonathan cree el recurso Speech (Free F0) y ponga
  `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION` como variables de entorno en la PC del local; luego en la sesión local:
  `cd videos && node voz.mjs voz/prueba-voces.json` para que elija entre Dalia y Jorge.
- Google Play pospuesto al **sábado 10/10**.
- Nombres sugeridos para la marca del desarrollador: Naveda Labs, Brújula Software, Andamio Apps, Nodo Claro,
  Puente Digital (pendiente que Jonathan elija y revise disponibilidad del dominio y en Play).

**Pruebas locales sin cuenta real:** http://localhost:8080/demo/ (Firebase simulado; ver la nota del comprobante más
abajo para entrar sin escribir contraseña). Borrar después los datos inventados del navegador.

**Para retomar en otra PC:** `git pull` en la carpeta del repo y decirle a Claude «retomemos».
Claude lee `CLAUDE.md`, esta bitácora y `PLAN.md`.

**Pendientes (en orden sugerido):**
1. ~~Yamileth: probar **Eliminar** y el **scroll** en iPhone~~ ✅ arreglado (Jonathan, 01/10).
2. Que algún usuario de iPhone pruebe la **guía de instalación** nueva desde Safari.
3. ~~Confirmar el destrabe automático de publicaciones~~ ✅ funcionó el 30/09 (v21 salió sola).
4. Seguimos en **beta** (decisión 01/10): no quitar todavía **«Acceso libre para todos»** (admin → Sistema) para activar la prueba de 7 días.
5. ~~`privacidad.html`: domicilio y aviso BORRADOR~~ ✅ domicilio confirmado; se quitó BORRADOR de privacidad y términos (01/10).
6. ~~Asistente para importar cualquier Excel~~ ✅ hecho (PC del local, ver abajo). ~~Video corto~~ ✅ v1 lista (ver abajo).
   ~~Embellecer la página carteraasesor.com~~ ✅ hecho con las skills de Emil Kowalski (ver abajo). Las skills
   **emil-design-eng** y **mobile-native** ya van **dentro del repo** en `.claude/skills/` (licencia MIT incluida):
   cualquier PC o sesión en la nube las tiene con `git pull`. Los usuarios ya ven el resultado en la página y en la app.
   Siguiente: **capturas + cuenta de prueba** para Google Play.
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

**Página carteraasesor.com más pulida** (`sitio/index.html`, reglas de emil-design-eng + mobile-native):
íconos SVG propios en lugar de emojis; entrada escalonada de la portada; el teléfono de muestra se anima al entrar en
pantalla (números que cuentan, se «toca» Recordar y aparece la burbuja de WhatsApp con el mensaje); secciones que
aparecen al bajar (una sola vez; seguro de 3 s por si el navegador no avisa); botones que se hunden al presionar;
hover solo con mouse; sin destello gris al tocar; `prefers-reduced-motion` respetado; safe-area del iPhone;
FAQ con «+» que gira y pregunta nueva sobre Excel con otro formato; textos al día (Excel tal como lo tienes,
plantilla, «cada cierto número de días»); correo de soporte en el pie; `og:image` con URL completa para que
WhatsApp muestre el logo al compartir el enlace. Probada en celular (375 px) y computador.

**Jonathan probó el PIN y la huella en su celular: funcionan** («me encantó»).

**Gesto «atrás» de Android ya no minimiza la app** (lo reportó Jonathan):
- Antes, con un cliente abierto, el gesto de atrás salía de la app.
- Ahora, en `ui.js` → `ventana()`, mientras haya una ventana abierta queda una entrada en el historial
  (`history.pushState`). «Atrás» cierra la ventana de arriba, una a la vez.
- Al cerrar la última con la ✕, la entrada se quita sola, así el siguiente «atrás» en la pantalla principal sale
  de la app como es normal.
- Del menú a una opción, la entrada se reutiliza.
- Probado en la demo: abrir cliente → atrás; cliente + registrar pago → atrás, atrás; ✕; menú → Papelera → atrás.

**Botones del detalle del cliente reordenados** (Jonathan: «se ven con desorganización»):
- **💵 Registrar pago** va grande y a lo ancho. Si el cliente está de baja, en su lugar va **↩️ Reactivar cliente**.
- Debajo, contactar: **💬 Recordar** (verde; si el cliente está al día dice «WhatsApp») y **📞 Llamar**. «Llamar» ya
  no se ve como enlace azul subrayado.
- Luego administrar: **✏️ Editar** y **⏸️ Dar de baja**.
- **🗑️ Eliminar cliente** queda aparte, abajo, como texto rojo, para no tocarlo por error.
- El bloque «Próximo pago» se alinea a la izquierda en el celular.
- Probado en la demo con clientes inventados (moroso y de baja).
- A Jonathan le gustó que el asesor decida si envía o no el comprobante.

**Comprobante de pago por WhatsApp**:
- Al registrar un pago aparece «✅ Pago registrado» con el mensaje listo y editable. Ejemplo: «Hola Marta 👋 Recibí tu pago
  de $1,500.00 del 29 de septiembre de 2026. ✅ Tu próximo pago es el 5 de noviembre de 2026. ¡Gracias por tu
  confianza! — (nombre del asesor)». Tiene los botones «📲 Enviar por WhatsApp» y «Ahora no».
- Si el cliente no tiene un celular válido, ofrece «Copiar mensaje».
- La casilla «Preguntarme siempre al registrar un pago» se puede desmarcar. También se cambia en Mensajes de cobro.
- En el historial de pagos del cliente, cada pago tiene su botón «📲 Enviar comprobante». Si ya se envió, dice
  «Reenviar comprobante (✓ enviado)» y además queda anotado en el historial de cambios.
- ☰ → Mensajes de cobro tiene un tercer mensaje, «Comprobante de pago». Admite las variables {nombre}, {monto} (solo si
  se anotó), {fecha_pago}, {proximo}, {metodo} y {asesor} (la firma con el nombre del perfil).
- Código:
  - `logic.js`: `mensajeComprobante`, `fmtFechaLarga` y `fmtDinero`, con prueba nueva (48 en verde).
  - `store.js`: `anotarComprobante`.
- Probado en la **demo local** (http://localhost:8080/demo/, Firebase simulado) con una cuenta y un cliente inventados:
  registrar pago → comprobante → enlace de WhatsApp (+52) → «✓ enviado» en el historial. Los datos se borraron después.
  Truco para entrar a la demo sin escribir: poner en `localStorage.fakefb` un usuario con `emailVerified: true` y `current`.

**Competencia revisada** (capturas de Jonathan: Cobros y Deudas, CobrApp y la búsqueda «imss asesores» en Play).
Conclusiones e ideas pendientes en `PLAN.md` → «Ideas aprendidas de la competencia».

**Bloqueo con PIN y huella / Face ID** (`js/bloqueo.js`, idea tomada de la competencia):
- Se activa en ☰ Menú → «🔒 Bloqueo con PIN». Hay un aviso «Nuevo: protege tu cartera con un PIN» con los botones
  Activar / Ahora no, que sale cuando ya hay clientes.
- PIN de 4 números. Se guarda **solo en ese teléfono** (en `localStorage`, clave `cartera:bloqueo`), como resumen
  SHA-256 con sal, y ligado a la cuenta que lo activó.
- Opcional: huella o Face ID (WebAuthn del propio teléfono), si el teléfono lo permite.
- Cuándo lo pide: al abrir la app, y al volver después de salir por 0, 1, 5 o 20 minutos (se elige; por defecto 5).
  Con 0, se bloquea al salir, así la vista de apps recientes tampoco muestra la cartera.
- Tras 5 intentos fallidos hay que esperar 30 segundos.
- «¿Olvidaste tu PIN?» lleva a cerrar sesión y volver a entrar con correo y contraseña; los clientes están en la nube.
  Al cerrar sesión, el PIN se borra.
- Cambiar o quitar el PIN pide el PIN actual.
- Es una pantalla de privacidad (evita que otra persona vea la cartera). No cifra los datos del teléfono.
- Probado en tamaño celular: teclado, PIN incorrecto, espera, «Olvidé», activar, cambiar tiempo y quitar. Se corrigió
  un error: al volver de «Olvidé», los puntos y los mensajes dejaban de actualizarse.
- La huella / Face ID no se pudo probar aquí; hay que probarla en un celular real.
- Nota para probar en local: el service worker local guarda versiones viejas. Hay que borrarlo o usar
  http://localhost:8080/demo/ (Firebase simulado).
- Nueva pregunta en la ayuda de la app. En la página, la tarjeta «Privada y segura» menciona el PIN o la huella.

**Beta gratuita con tope de 100 clientes** (pedido de Jonathan):
- En `plan.js`, la beta («Acceso libre para todos») ya no es ilimitada: permite hasta `limiteBeta` clientes.
  - Por defecto son 100 (`LIMITE_BETA_DEFECTO`).
  - Se cambia en el panel → Sistema → «Clientes permitidos en la beta gratuita».
- Quien ya tenía más de 100 **no queda bloqueado**: sigue editando y cobrando a los suyos, solo no puede agregar más.
- Al llegar al tope, la app dice «Tope de la beta gratuita» y ofrece escribir a soporte.
- El **Plan Pro** (asignado a mano en el panel) quita el tope. Úsalo para quien necesite más, por ejemplo Yamileth
  si pasa de 100.
- Los textos de «Mi plan», del aviso y del importador explican el tope. El menú muestra «Beta gratuita · N de 100 clientes».

**Página carteraasesor.com:**
- **Precios** detrás de un velo semitransparente: los planes se ven borrosos debajo y encima va la tarjeta
  «BETA GRATUITA · Hoy es gratis, sin letra pequeña».
  - Dice «hasta 100 clientes, no pedimos tarjeta, nada se cobra solo, te avisaremos con tiempo».
  - En el celular la tarjeta se queda fija arriba mientras pasan los planes.
- Se quitaron las promesas de «7 días gratis» de la portada, los pasos, el cierre y la descripción para
  WhatsApp/Google; ahora todo dice «beta gratuita».
- Preguntas nuevas en la FAQ:
  - «¿Me van a cobrar?» reemplaza a «¿Qué pasa cuando terminan los 7 días?».
  - «Tengo más de 100 clientes» reemplaza a «¿Cómo pago?».
  - «Mi Excel está en la computadora».
- Sección nueva **«¿Tu Excel está en la computadora?»** con 5 pasos: abrir carteraasesor.com/app en la compu, entrar con
  la misma cuenta, importar, revisar y abrir el celular. Al lado va la alternativa desde el celular.
- En la app, en la computadora, el importador agrega el paso 4: «abre la app en tu celular y tus clientes ya estarán ahí».
- **Cuando termine la beta**, en la página hay que:
  - quitar el velo (`.velo-beta`) y el `inert` de `.precios`;
  - volver a poner los textos de prueba y cobro.

**Importar Excel más guiado** (pedido de Jonathan: «que no se me queden en el proceso»):
- Barra de avance arriba en todo el recorrido: **1 Tu archivo · 2 Columnas · 3 Revisar**.
- Paso 1 pregunta **«¿Dónde tienes tu lista?»**. Cada respuesta lleva a instrucciones cortas:
  - **En este teléfono**: dónde buscar el archivo, y qué hacer si está en WhatsApp o en un correo.
  - **En mi computadora** (solo en celular): entrar a carteraasesor.com/app en la compu con la misma cuenta, con botón
    📋 Copiar enlace. Los clientes llegan solos al teléfono por la nube.
  - **En Google, en Numbers o en papel**: cómo guardarlo como Excel, o usar la plantilla.
- Ahora también acepta archivos **.csv** y **.ods**.
- Si el archivo no se puede leer (foto, PDF, Numbers, contraseña…), sale una pantalla con las causas comunes en lugar
  de un mensaje de error.
- En el paso de columnas:
  - Resumen al inicio: nombre del archivo, cuántas filas tiene y qué datos se reconocieron.
  - Frase «si todo se ve bien, solo toca Siguiente».
  - La elección de la fila de títulos queda escondida, salvo que falte el nombre.
  - Botón «Otro archivo» para empezar de nuevo.
- La columna de periodicidad se reconoce **por su contenido** («Mensual», «Trimestral»…) aunque el título no lo diga.
  Tiene prueba nueva; son 47 pruebas en verde.
- En cada pantalla hay un enlace «¿Te atoraste? Escríbenos» que abre el chat de soporte con el mensaje ya empezado.
  Lo mismo en la pantalla vacía («Empecemos con tus clientes»).
- Pantalla final «¡Listo! 🎉» con **lo que sigue**: poner fechas de cobro y revisar datos. Solo muestra los botones
  que hacen falta.
- Probado en celular (375 px) con un Excel inventado: los 3 pasos, el error y el chat de ayuda. Los datos de prueba
  locales se borraron después.

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
- Cloudflare Email Routing: reenvío de soporte@carteraasesor.com → el Gmail personal de Jonathan
  (activado, destino verificado, regla "soporte"). Lo hizo Jonathan.
- Correo de prueba enviado desde el Gmail personal de Jonathan a soporte@carteraasesor.com
  (asunto "Prueba reenvio soporte"). **REBOTÓ**: `550 5.1.1 Address does not exist`.
  El DNS está bien (MX route1/2/3.mx.cloudflare.net, SPF de Cloudflare), así que Cloudflare
  recibe el correo pero no encuentra una regla activa para "soporte".
- Publicado en carteraasesor.com (commit 9e75b98): comprobado en línea que sw.js es v11
  y que privacidad.html muestra el nombre.
- Git en esta PC ya tiene la sesión de GitHub guardada (jonathanaveda-spec).

**Pendiente**
- Cloudflare → carteraasesor.com → Enrutamiento de correo electrónico → Reglas: revisar que
  la regla sea exactamente "soporte", acción "Enviar a un correo electrónico" →
  el Gmail personal de Jonathan, que esté ACTIVADA y que el destino figure como Verificado.
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
regla soporte@carteraasesor.com → Enviar a el Gmail personal de Jonathan (Activa; destino Verificado).
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
