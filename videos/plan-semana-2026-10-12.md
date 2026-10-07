# Plan de la semana 12–18 de octubre de 2026 — TikTok @carteraasesor

Responsable: Victoria (estrategia). Producción: Lucía (`productor-videos`). Publica y programa: Jonathan.
Base: `plan-diario.md` (2 al día: **P a las 13:00** + **por la noche, a las 20:00, H lun/mié/vie/dom y T mar/jue/sáb**),
`investigacion/tendencias.md` (Luna), skills `marca-cartera-asesor` y `voz-cartera-asesor`. Resultados en `resultados.md`.

**Decisiones que respeta este plan**
- Jonathan (07/10): **nada de videos de noticias del IMSS** por ahora. Ninguno de los 14 lo es (la quincena es una fecha
  de cobro, no una noticia del IMSS).
- Entran el **top 3 de Luna** (P08 quincena, T04 «4 tipos de clientes», H02 «Lo que nadie te cuenta #1»), un video de
  **Halloween** (H05) y uno de **#fraude / cuidar datos** (H03).
- **Variedad:** ninguna voz, formato ni tipo de gancho se repite dos veces seguidas (contando el #4 del domingo 11, Dalia).
- Hashtags: 5 por video = **1 grande + 2 medianos + 2 de nicho**; #carteraasesor siempre es uno de los de nicho.
- Toda pieza: zona segura, centrado en x = 540, palabra clave en oro, nada de prometer ganancias ni hablar como el IMSS,
  solo clientes inventados.

## La jugada de la semana (por qué así)
La cuenta casi no tiene datos todavía, así que esta semana tiene dos trabajos: **probar** y **abrir conversación**. Por eso
cada noche lleva un formato distinto con pregunta al final (TikTok reporta más comentarios cuando el video pregunta, según
Metricool citado por Luna) y cada mediodía enseña **una función distinta** de la app que todavía no salió en video. Arrancan
tres series que se pueden repetir si pegan («Cobranza en 15 segundos», «Lo que nadie te cuenta», «tipos de clientes /
historia de terror»), porque lo que más crece en TikTok es **repetir el formato que funcionó cambiando el contenido**. El
jueves 15 cae en quincena y es el día más fuerte para hablar de cobrar. El sábado y domingo van juntos a propósito: el
sábado «4 tipos de clientes» pregunta «¿cuál es el tuyo?» y el domingo cuenta la historia de terror del más temido, el
fantasma.

---

## 1. Calendario (para programar en TikTok Studio)

| Día | Hora | ID | Formato | Título | Voz | ¿Se puede hacer ya? |
|---|---|---|---|---|---|---|
| Lun 12 | 13:00 | P05 | P | El semáforo de tu cartera 🟢🟡🔴 | Gerardo | 🟡 Sí con capturas que ya hay; mejor con 1 nueva |
| Lun 12 | 20:00 | H02 | H · chat | Lo que nadie te cuenta de cobrar con libreta #1 | Jorge + Candela | ✅ Sí |
| Mar 13 | 13:00 | P06 | P | ¿Mensual, trimestral o cada 15 días? La fecha se pone sola | Dalia | 🔴 Captura nueva |
| Mar 13 | 20:00 | T02 | T | Cobranza en 15 segundos #1: avisa 3 días antes | Renata | ✅ Sí |
| Mié 14 | 13:00 | P07 | P | Abres la app y esto es lo primero que ves (resumen del día) | Luciano | ✅ Sí |
| Mié 14 | 20:00 | H03 | H · antes/después | ¿Dónde guardas la CURP de tus clientes? (#fraude) | Dalia | ✅ Sí |
| Jue 15 | 13:00 | P08 | P | Hoy es quincena: ¿quién te paga hoy? | Jorge (alegre) | 🟡 Sí con plan B; mejor con 1 nueva — **fecha fija** |
| Jue 15 | 20:00 | T03 | T | Mito: «Yo me acuerdo de todos mis clientes» | Nuria | ✅ Sí |
| Vie 16 | 13:00 | P09 | P | Encuentra a cualquier cliente en 1 segundo | Gerardo | 🔴 Captura nueva |
| Vie 16 | 20:00 | H04 | H · chat (2 colegas) | «Soy nuevo, ¿cómo organizo a mis clientes?» | Marina + Cecilio | ✅ Sí |
| Sáb 17 | 13:00 | P10 | P | Sin señal, la app sigue funcionando | Dalia (alegre) | 🔴 Captura nueva |
| Sáb 17 | 20:00 | T04 | T | 4 tipos de clientes que todo asesor conoce | Yago | ✅ Sí |
| Dom 18 | 13:00 | P11 | P | Ponla en tu pantalla de inicio sin tienda de apps | Nuria | 🔴 Captura nueva |
| Dom 18 | 20:00 | H05 | H · chat | Una historia de terror para asesores 👻 (Halloween) | Jorge (susurro) | ✅ Sí |

**Cuenta:** 8 ✅ listos para hacer con plantillas y capturas que ya existen · 2 🟡 se pueden hacer ya y quedan mejor con una
captura nueva · 4 🔴 necesitan capturas nuevas. Las 6 capturas nuevas salen en **una sola corrida** de
`node tools/capturas-videos.mjs` (Lucía agrega los conjuntos nuevos, con clientes inventados).

**Orden de voces:** (Dalia dom 11) → Gerardo → Jorge → Dalia → Renata → Luciano → Dalia → Jorge → Nuria → Gerardo → Marina →
Dalia → Yago → Nuria → Jorge. Dalia y Jorge (las voces de la casa) 3 veces cada una; Gerardo y Nuria 2 veces para poder
compararlas; Renata sigue como voz de las tarjetas de consejo. Antes de producir, Lucía escucha a Gerardo, Luciano, Nuria, Yago,
Candela y Cecilio en `public/voz/Muestrario_24_voces.mp3`; si alguna suena robótica, la cambia por otra de México del mismo
sexo (Beatriz, Carlota, Larissa, Liberto, Pelayo) sin poner dos iguales seguidas.

**Tipos de gancho en orden:** pregunta → confesión → beneficio → serie numerada → curiosidad → pregunta de cuidado → fecha →
mito → número → pregunta de novato → beneficio → humor → tutorial → terror.

**Plantillas (lo que ya existe en `videos/src/`):**
- **T** = `src/tarjeta/Tarjeta.tsx`, se llena con `videos/tarjetas/<id>.json` (titular + líneas + llamado; `numerar` sí/no).
- **H** = `src/historia/Historia.tsx`, se llena con `videos/historias/<id>.json`; escenas: `gancho`, `chat`, `titulo`,
  `mensaje`, `frase`, `captura`, `dividida` (antes/después), `cierre`.
- **P** = no hay plantilla aparte: se hacen como el #4, con la plantilla H usando escenas `gancho` + `captura` + `cierre`.

---

## 2. Fichas para Lucía (una por video)

Formato de cada ficha: gancho del segundo 1 · escenas en breve · voz · capturas · descripción · hashtags.
Las frases exactas de voz y los tiempos los escribe Lucía en el guion (`videos/guiones/`), que Jonathan aprueba.

### P05 · Lun 12 · 13:00 · «El semáforo de tu cartera 🟢🟡🔴» (#5 del plan)
- **Gancho (seg 1):** «¿Qué significa el **rojo** en tu cartera? 🔴»
- **Escenas:** gancho → resumen con los estados (🟢 al día · 🟡 por vencer · 🔴 moroso, con anillo en cada uno) → «Se pinta
  **solo** con la fecha de cobro» → lista de morosos con días de atraso → cierre.
- **Voz:** Gerardo (+5 %), tono de colega que explica.
- **Capturas:** `public/1-inicio.png` y `capturas/cobro-4-morosos.png` (ya existen). Mejor: **nueva** «lista de clientes con sus
  colores».
- **Descripción:** 🟢 al día · 🟡 por vencer · 🔴 moroso. En Cartera Asesor cada cliente se pinta solo según su fecha de cobro.
  ¿Cuántos rojos tienes hoy? 👇 Pruébala gratis en la beta: carteraasesor.com
- **Hashtags:** #emprendedores #cobranza #automatización #appsnegocios #carteraasesor

### H02 · Lun 12 · 20:00 · «Lo que nadie te cuenta de cobrar con libreta #1» (top 3 de Luna)
- **Gancho (seg 1):** etiqueta chica «Lo que nadie te cuenta #1» y grande: «"Ya te pagué" 🙄 …y no lo tienes **anotado**»
- **Escenas:** gancho → chat con «Paty Ruiz» (inventada): «Ya te pagué desde el martes 🙄» · escribiendo… · asesor «¿Seguro?
  No lo tengo anotado 😬» · «Te lo di en efectivo, ¿no te acuerdas?» → frase «Sin registro es tu palabra contra la **suya**» →
  captura: registras el pago al **momento** (queda la fecha) y le mandas su **comprobante** por WhatsApp → cierre «¿Te ha
  pasado? 👇».
- **Voz:** Jorge narrador (triste en el gancho, `chat` en el asesor, alegre en la solución) + Candela como la clienta.
- **Capturas:** `tienda/capturas/crudas/3-pago.png` y `public/4-comprobante.png` (ya existen; Lucía revisa que se vean como la
  app de hoy; si no, las saca de nuevo).
- **Cuidado:** es una escena actuada con personajes inventados; no se presenta como testimonio de una usuaria real.
- **Descripción:** Lo que nadie te cuenta #1 📒 Un «ya te pagué» sin registro es tu palabra contra la suya. ¿Te ha pasado?
  Cuéntame 👇 En Cartera Asesor cada pago queda con su fecha y mandas el comprobante en 1 toque. Pruébala gratis en la beta:
  carteraasesor.com
- **Hashtags:** #dinero #cobranza #clientes #asesorimss #carteraasesor

### P06 · Mar 13 · 13:00 · «¿Mensual, trimestral o cada 15 días? La fecha se pone sola» (#6)
- **Gancho (seg 1):** «Registras el pago y la próxima **fecha** se pone sola»
- **Escenas:** gancho → selector de periodicidad (Mensual · Trimestral · Semestral · Anual · **Personalizado: cada N días**, p. ej. cada 15) → registrar pago → la próxima
  fecha aparece calculada → cierre.
- **Ojo (corregido por Emma 07/10):** la app sí maneja «cada 15 días»: opción **Personalizado → cada N días** (`diasDePeriodicidad` en `plataforma/js/logic.js`; el Excel también entiende «quincenal» y «cada 15 días»). Mostrarlo: es un diferenciador.
- **Voz:** Dalia (+5 %).
- **Capturas:** `3-pago.png` (existe) + **nueva**: selector de periodicidad y la próxima fecha calculada.
- **Plan B** si no salen las capturas: publicar R1 «Comprobante en 1 toque» (ver banca).
- **Descripción:** Mensual, cada 3 meses, cada 6 o cada año: registras el pago y Cartera Asesor calcula solita la próxima
  fecha. ¿Tus clientes cómo te pagan? 👇 Pruébala gratis en la beta: carteraasesor.com
- **Hashtags:** #emprendedores #automatización #negocios #gestiónclientes #carteraasesor

### T02 · Mar 13 · 20:00 · «Cobranza en 15 segundos #1: avisa 3 días antes» (arranca la serie numerada de Luna)
- **Gancho (seg 1):** «Cobranza en 15 segundos **#1**» (número enorme)
- **Líneas (sin numerar):** «Avisa **3 días** antes de que venza» · «Un mensaje corto y **amable**» · «Así tu cliente aparta el
  **dinero**» · llamado «¿Tú cuándo **avisas**? 👇»
- **Regla de la serie:** debe durar **15 s o menos** (si no, el título miente). Máximo 3 líneas y voz a +15 %. Mismo fondo,
  misma entrada y número grande en todas las partes, para que se reconozca.
- **Voz:** Renata (será la voz fija de la serie).
- **Capturas:** ninguna. ✅
- **Descripción:** Cobranza en 15 segundos #1 ⏱️ Avisar antes de que venza le da tiempo a tu cliente de apartar el pago.
  ¿Tú cuántos días antes avisas? 👇 Guárdalo para la quincena. carteraasesor.com
- **Hashtags:** #finanzas #cobranza #educacionfinanciera #fidelización #carteraasesor

### P07 · Mié 14 · 13:00 · «Abres la app y esto es lo primero que ves» (resumen del día ✳)
- **Gancho (seg 1):** «Abres la app y esto es lo **primero** que ves 👀»
- **Escenas:** gancho → resumen del día con anillos (saludo · quién está por vencer · quién debe) → toque en morosos → lista
  con días de atraso → cierre. Solo decir lo que se ve en la captura.
- **Voz:** Luciano (+5 %).
- **Capturas:** `capturas/cobro-3-resumen-dia.png` y `capturas/cobro-4-morosos.png` (ya existen). ✅
- **Descripción:** Así empieza tu día con Cartera Asesor ☀️ Abres la app y ya sabes a quién cobrarle hoy. ¿Tú cómo empiezas
  tu día de cobranza? 👇 Pruébala gratis en la beta: carteraasesor.com
- **Hashtags:** #emprendedores #automatización #clientes #appsnegocios #carteraasesor

### H03 · Mié 14 · 20:00 · «¿Dónde guardas la CURP de tus clientes?» (#fraude + #13 del plan)
- **Gancho (seg 1):** «¿Dónde guardas la **CURP** de tus clientes? 🔒»
- **Escenas:** gancho → antes/después: **Antes 📒 «Datos a la vista»** (la libreta abierta en el escritorio · fotos de la INE
  en tu galería · datos reenviados a cualquier chat) / **Con la app 🔒 «Datos cuidados»** (cada asesor con su propia cuenta ·
  bloqueo con PIN o huella · tú eliges cuándo se pide) → captura del teclado del PIN «Sin tu PIN, **no abre**» → cierre
  «Tus clientes te confían sus **datos**».
- **Tono:** de cuidado, **sin alarmismo** y sin asesoría legal. No decir que la app «evita fraudes»; decir que te ayuda a
  cuidar los datos. El consejo sirve aunque no uses la app.
- **Voz:** Dalia, sin estilo (serena).
- **Capturas:** `capturas/bloqueo-2-activo.png` y `capturas/pin-1-teclado.png` (ya existen). ✅
- **Descripción:** Con tantos casos de fraude, cuidar los datos de tus clientes también es parte de tu trabajo 🔒 CURP, NSS e
  INE no van por cualquier chat. ¿Tú dónde los guardas? 👇 En Cartera Asesor tu cartera se protege con PIN o huella:
  carteraasesor.com
- **Hashtags:** #finanzas #fraude #educacionfinanciera #asesorimss #carteraasesor

### P08 · Jue 15 · 13:00 · «Hoy es quincena: ¿quién te paga hoy?» (top 1 de Luna) — FECHA FIJA, se produce primero
- **Gancho (seg 1):** «Hoy es **15** 📅 ¿Ya sabes quién te paga?»
- **Escenas:** gancho → filtro **«📅 Pagan hoy»** (los clientes cuyo próximo pago es hoy) → cliente → 💬 Recordar → mensaje
  listo por WhatsApp → cierre.
- **Voz:** Jorge, alegre (`cheerful`).
- **Capturas:** **nueva**: lista con el filtro «📅 Pagan hoy» activo. **Plan B** con lo que ya existe: `cobro-3-resumen-dia`
  → `cobro-2-cliente` → `cobro-1-mensajes` (cambiar el texto a «a quién le toca hoy»).
- **Descripción:** Hoy es quincena 📅 Muchos de tus clientes cobran hoy: es el mejor día para recordarles con amabilidad. En
  Cartera Asesor tocas «Pagan hoy» y le mandas el recordatorio por WhatsApp en 1 toque. ¿Tú hoy a cuántos les cobras? 👇
  carteraasesor.com
- **Hashtags:** #dinero #cobranza #automatización #asesorimss #carteraasesor

### T03 · Jue 15 · 20:00 · «Mito: "Yo me acuerdo de todos mis clientes"»
- **Gancho (seg 1):** «**Mito**: "Yo me acuerdo de todos mis clientes"»
- **Líneas (sin numerar):** «Con 10 clientes, tal **vez**» · «Con 40, alguno se te **pasa**» · «Y el que se te pasa es el que no
  **paga**» · «Lo que no se anota, no se **cobra**» · llamado «¿Cuántos clientes llevas **tú**? 👇»
- **Voz:** Nuria (+10 %).
- **Capturas:** ninguna. ✅
- **Descripción:** ¿Mito o realidad? 🤔 Con pocos clientes te acuerdas de todo; con muchos, alguno se te pasa. Lo que no se
  anota, no se cobra. ¿Cuántos clientes llevas tú? 👇 carteraasesor.com
- **Hashtags:** #emprendedores #clientes #educacionfinanciera #asesorindependiente #carteraasesor

### P09 · Vie 16 · 13:00 · «Encuentra a cualquier cliente en 1 segundo» (#12)
- **Gancho (seg 1):** «Encuentra a cualquier cliente en **1 segundo**»
- **Escenas:** gancho → se escriben 3 letras en el buscador («Buscar por nombre, CURP, NSS, celular…», así dice la app) → el
  cliente aparece → filtros y orden → cierre.
- **Voz:** Gerardo (+5 %).
- **Capturas:** **nuevas**: buscador escribiendo y resultado; filtros abiertos.
- **Plan B** si no salen: R2 «Pásale tu Excel» versión corta de 12 s.
- **Descripción:** Por nombre, CURP, NSS o celular: escribes y ahí está 🔎 Sin hojear la libreta. ¿Cuánto tardas hoy en
  encontrar a un cliente? 👇 Pruébala gratis en la beta: carteraasesor.com
- **Hashtags:** #emprendedores #clientes #automatización #gestiónclientes #carteraasesor

### H04 · Vie 16 · 20:00 · «Soy nuevo, ¿cómo organizo a mis clientes?» (chat entre dos colegas)
- **Gancho (seg 1):** burbuja grande: «Soy nuevo de asesor… ¿cómo **organizo** a mis clientes? 😰»
- **Escenas:** chat entre un asesor novato y una asesora con experiencia (los dos inventados) → ella responde en 3 pasos:
  1 «Pasa tu lista a la app» (captura del importador) · 2 «Ponle fecha de cobro a cada cliente» · 3 «Cada mañana revisa tu
  resumen del día» (captura) → cierre «¿Qué le dirías tú a un asesor nuevo? 👇».
- **Voz:** Marina (la asesora con experiencia) + Cecilio (el novato). Es la primera vez que dos colegas platican: prueba de
  formato «diálogo».
- **Capturas:** `capturas/importar-1-donde.png` y `capturas/cobro-3-resumen-dia.png` (ya existen). El paso 2 va en texto; si
  sale la captura del asistente «Fechas de cobro», mejor. ✅
- **Descripción:** Si eres nuevo de asesor, empieza así 👇 1) pasa tu lista 2) ponle fecha a cada cliente 3) revisa tu día
  cada mañana. ¿Qué consejo le darías tú a un asesor nuevo? Pruébala gratis en la beta: carteraasesor.com
- **Hashtags:** #mexico #negocios #clientes #asesorimss #carteraasesor

### P10 · Sáb 17 · 13:00 · «Sin señal, la app sigue funcionando» (#9, pregunta frecuente)
- **Gancho (seg 1):** «Sin señal, la app **sigue** funcionando 📶» con etiqueta «Pregunta frecuente: ¿y si no tengo internet?»
- **Escenas:** gancho → aviso de la app «Sin conexión. Puedes seguir trabajando…» → registrar un pago sin señal → vuelve la
  señal y se sube solo a la nube → cierre.
- **Ojo:** no inventar un comentario de un usuario real (nada de nombres de usuario falsos): se rotula «Pregunta frecuente».
  Cuando llegue un comentario real con una duda, ese reemplaza a este video (formato «Respondo»).
- **Voz:** Dalia, alegre.
- **Capturas:** **nueva**: la app con el aviso «Sin conexión».
- **Plan B** si no salen: R1 «Comprobante en 1 toque» (si no se usó el martes) o R3.
- **Descripción:** ¿Cobras donde no hay señal? 📶 Cartera Asesor sigue funcionando sin internet y se sube sola a la nube cuando
  vuelve la conexión. ¿Dónde se te va la señal a ti? 👇 carteraasesor.com
- **Hashtags:** #emprendedores #negocios #clientes #appsnegocios #carteraasesor

### T04 · Sáb 17 · 20:00 · «4 tipos de clientes que todo asesor conoce» (top 2 de Luna)
- **Gancho (seg 1):** «4 tipos de **clientes** que todo asesor conoce»
- **Líneas (numeradas):** «El que paga el día **1** 😇» · «El de "mañana te **deposito**"» · «El que paga en abonos…
  **eternos**» · «El que sí paga a tiempo… porque le **avisaste** antes» · llamado «¿Cuál es el **tuyo**? 👇»
- **Tono:** humor de situación, sin burlarse de nadie. El «fantasma» se guarda para el domingo (H05), a propósito.
- **Voz:** Yago (+10 %), con ritmo de chiste.
- **Capturas:** ninguna. ✅
- **Descripción:** Todo asesor los conoce 😅 ¿Cuál es el tuyo? Cuéntame en los comentarios 👇 Y si tienes al cuarto, ya sabes
  el secreto: avisar antes. carteraasesor.com
- **Hashtags:** #mexico #cobranza #clientes #asesorimss #carteraasesor

### P11 · Dom 18 · 13:00 · «Ponla en tu pantalla de inicio sin tienda de apps» (#16)
- **Gancho (seg 1):** «Ponla en tu celular **sin** tienda de apps 📲»
- **Escenas:** gancho → entras a carteraasesor.com/app → aviso de la app «Instala la app en tu pantalla de inicio» → en
  iPhone: Compartir → «Agregar a inicio» (pasos dibujados, sin copiar la pantalla de Apple) → el ícono en la pantalla → cierre.
- **Por qué el domingo:** es el día con tiempo para instalar; quita la duda número 1 de quien quiere probarla.
- **Voz:** Nuria (+5 %).
- **Capturas:** **nueva**: el aviso «Instala la app» (Android) y el aviso para iPhone.
- **Descripción:** No necesitas tienda de apps 📲 Entra a carteraasesor.com/app y ponla en tu pantalla de inicio, en iPhone o
  Android. ¿Tú usas iPhone o Android? 👇 Pruébala gratis en la beta.
- **Hashtags:** #emprendedores #negocios #automatización #appsnegocios #carteraasesor

### H05 · Dom 18 · 20:00 · «Una historia de terror para asesores 👻» (Halloween, #halloween)
- **Gancho (seg 1):** «Una historia de **terror** para asesores 👻»
- **Escenas:** gancho (fondo más oscuro) → chat con «Don Beto» (inventado): asesor «Hola, don Beto, ¿cómo va su pago? 😊» ·
  palomitas azules (lo vio) · «escribiendo…» y desaparece · «3 días después» · asesor «¿Sigue por ahí? 👀» · visto → frase
  «Visto… desde **septiembre** 👻» → «No lo puedes obligar a contestar… pero sí **avisarle** antes» (captura del resumen del
  día con «por vencer») → cierre «¿Tienes un cliente fantasma? 👇».
- **Tono:** humor, un solo toque de «terror»; nada de calaveras sangrientas. Colores de marca (el fondo puede ir más oscuro).
- **Voz:** Jorge en susurro (`whispering`) como narrador de cuento de miedo; las burbujas sin voz.
- **Capturas:** `capturas/cobro-3-resumen-dia.png` y `capturas/cobro-2-cliente.png` (ya existen). ✅
- **Siguiente jugada:** si pasa de 2× el promedio, parte 2 el viernes 30 o sábado 31 de octubre (mismo formato, otro cliente).
- **Descripción:** Una historia de terror para asesores 👻 El cliente que deja en visto… desde septiembre. ¿Tienes un cliente
  fantasma? Cuéntame 👇 Avísale antes de que venza con Cartera Asesor: carteraasesor.com
- **Hashtags:** #halloween #cobranza #clientes #asesorimss #carteraasesor

---

## 3. Banca (videos de reserva, listos con lo que ya hay)
Si una captura nueva no sale o un video no pasa la revisión de fotogramas, se publica uno de estos. **Regla de calidad:**
mejor 1 bueno que 2 flojos.
- **R1 · P «Comprobante en 1 toque»** (#8): `public/4-comprobante.png`. Gancho: «Le mandas su **comprobante** en 1 toque ✅».
- **R2 · P «Pásale tu Excel» corto (12 s)**: recorte del #2 ya hecho, otro gancho: «¿Tu lista está en **Excel**? Sirve tal cual».
- **R3 · H «Sábado de cobranza: libreta vs. app»** (antes/después): `cobro-3-resumen-dia.png`. Gancho: «Sábado de cobranza:
  ¿libreta o **app**?».

## 4. Orden de producción para Lucía
1. **P08 (quincena)**: tiene fecha fija del jueves 15. Primero con plan B; si después sale la captura «Pagan hoy», se rehace.
2. Una sola corrida de capturas nuevas (clientes inventados): lista con colores, selector de periodicidad + próxima fecha,
   filtro «📅 Pagan hoy», buscador + filtros, aviso «Sin conexión», avisos de instalación (Android e iPhone).
3. Los 8 ✅ (T02, T03, T04 en una tanda de tarjetas; H02, H03, H04, H05 con la plantilla H; P07).
4. Los 🔴 con sus capturas nuevas (P06, P09, P10, P11) y P05 con la lista de colores.
5. Revisión de fotogramas de todos (skill de marca) y entregar en `videos/entregas/` con nombre `<ID>_<tema>_con_voz.mp4`.
Fecha límite sugerida: **domingo 11 en la noche**, para que Jonathan programe la semana completa (TikTok Studio deja programar
hasta 10 días antes).

## 5. Lo que hace Jonathan
- Aprobar esta lista (sirve como brief); Lucía después le pasa los guiones con la columna de voz para el visto bueno.
- Poner música comercial al 15–25 % y **activar «Contenido generado por IA» en los 14** (todos llevan voz sintética).
- Programar en TikTok Studio (compu) con las horas de la tabla de arriba y copiar descripción y hashtags de cada ficha.
- Lunes 12 en la mañana: mandar las capturas de analíticas (ver `resultados.md`). Si llega un comentario real con una duda,
  avisar: se convierte en un video «Respondo» y reemplaza a P10.

## 6. Las tres jugadas siguientes (para no improvisar)
- **Semana 19–25 oct:** «Cobranza en 15 segundos #2» (anota el pago al momento), «Lo que nadie te cuenta #2» si el #1 llegó al
  promedio, los primeros «Respondo» con comentarios reales y la función ✳ «Pagaron hoy». Luna confirma si hay fechas 2026
  de la Semana Nacional de Educación Financiera (Condusef) para sumarnos con #educacionfinanciera.
- **Semana 26 oct–1 nov:** Halloween parte 2 (vie 30 o sáb 31) si H05 o T04 pegaron; viernes 30 «Fin de mes: revisa quién no
  te ha pagado»; Día de Muertos con el mismo personaje del fantasma (serie).
- **Noviembre:** Buen Fin (13–17) con «aviso antes del puente». Las fechas de pagos del IMSS **no** se tocan mientras siga la
  decisión de no hacer noticias del IMSS.
