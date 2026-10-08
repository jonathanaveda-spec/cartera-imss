---
name: voz-cartera-asesor
description: Voz en off de los videos de Cartera Asesor con Azure Speech (voces neuronales de México). Úsala cuando un video de la marca lleve narración: escribir el guion de voz, generar los MP3 con videos/voz.mjs, sincronizarlos en Remotion con los subtítulos y entregar el video narrado.
---

# Voz en off — Cartera Asesor

Decisión de Jonathan (07/10/2026): los videos llevan **voz artificial de Azure Speech**, generada por Claude en la
sesión local. La **música la pone Jonathan en TikTok** (biblioteca de música comercial), no va en el archivo.
Complementa a la skill `marca-cartera-asesor` (ritmo, subtítulos, zona segura, revisión de fotogramas).

## 1. Requisitos (una sola vez, los hace Jonathan)
- Recurso **Speech** de Azure, plan **Free F0** (gratis: 0.5 millones de caracteres al mes ≈ 300+ videos).
- Variables de entorno de Windows (cuenta del usuario): `AZURE_SPEECH_KEY` (Clave 1) y `AZURE_SPEECH_REGION`
  (p. ej. `eastus`). Después de crearlas hay que cerrar y abrir la app de Claude.
- **Nunca** pedir ni escribir la clave en el chat, en el repo ni en un archivo. Si falta, el script avisa: decirle a
  Jonathan que revise las variables, no pedírsela.

## 2. La voz de la marca
- **SOLO VOCES HUMANAS (decisión 08/10/2026):** Jonathan oyó Larissa en el M01 y la sintió «muy robótica». Desde ahí
  **solo** se usan estas 4 voces (las más naturales de Azure; **sí funcionan en el plan gratis F0**, probado el 08/10):
  | Rol | Voz (valor de `"voz"`) |
  |---|---|
  | Mujer principal | **`es-MX-Valeria:MAI-Voice-2`** (Valeria) |
  | Hombre principal | **`es-MX-Alejo:MAI-Voice-2`** (Alejo) |
  | Mujer, para variar | `es-MX-Dalia:DragonHDLatestNeural` (Dalia HD) |
  | Hombre, para variar | `es-MX-Jorge:DragonHDLatestNeural` (Jorge HD) |
  Comparación oída por Jonathan: `public/voz/Comparar_voces_humanas.mp3` (se regenera con `voz/prueba-humana-*.json`).
  **Prohibidas** las voces neuronales «normales» secundarias (Larissa, Gerardo, Nuria, Yago, Luciano, Candela, Cecilio,
  Beatriz, Renata, Marina…) y también `es-MX-DaliaNeural`/`es-MX-JorgeNeural` sin «HD».
- **Variedad** (pensamiento diverso): alternar las 4; no repetir la misma voz dos videos seguidos; en diálogos, cada
  personaje con una de las 4 (`"voz"` por frase). Valeria y Alejo traen emociones (`"estilo"`: `happy`, `hopeful`,
  `excited`, `sad`, `surprised`, `softvoice`, `whispering`, `determined`…); Dalia/Jorge HD ponen la emoción solos según
  el texto (no usar `"estilo"`). Si un estilo no suena bien, quitarlo.
- **Para que suene humano, el guion importa tanto como la voz:** escribir como se habla («Oye, antes de salir a
  cobrar… revisa esto»), con muletillas suaves y pausas (`"pausa": 250–400`), nada de listas leídas tipo robot
  («Uno: …, Dos: …» → «Primero…, luego…, y por último…»). Velocidad **`+0%`** (más rápido suena a máquina).
- Acentos de otros países (`es-AR`, `es-CO`…) solo para personajes de otro país; el narrador siempre es de México.
- Anotar en `videos/resultados.md` qué voz llevó cada video, para ver cuáles funcionan mejor.
- Velocidad `+0%` (ver arriba; antes era `+5%`). Tono de colega asesor, de tú, frases cortas (voz de la skill de marca).
- Las frases de voz **no repiten letra por letra** el texto en pantalla: lo acompañan (la pantalla dice la idea en 3–6
  palabras; la voz la dice completa y natural).
- Escribir para el oído: números con letra si se leen raro («cien clientes»), «carteraasesor punto com», sin siglas
  raras, sin emojis. CURP y NSS se leen bien tal cual.

## 3. Proceso por video
1. En el guion del video (`videos/guiones/…md`) agregar la columna «Voz» por escena y que **Jonathan la apruebe**
   junto con el resto del guion.
2. Crear `videos/voz/<id-del-video>.json` con una frase por escena (formato en el encabezado de `videos/voz.mjs`).
3. Generar: `cd videos && node voz.mjs voz/<id>.json` → `public/voz/<id>/NN.mp3` + `tiempos.json`.
3b. Medir la voz real: `node medir-voz.mjs <id-del-video>` anota en `tiempos.json` el `inicio` y el `fin` de lo que se oye de
   verdad (Azure agrega ≈ 0.8 s de silencio al final de cada MP3, así que `segundos` es más largo que la frase). La plantilla
   usa `fin`. Después del render, `node medir-voz.mjs --video entregas/<archivo>.mp4` lista los tramos con voz y su volumen,
   para revisar sin escuchar que nada se corta ni se encima y que el llamado final termina antes del último cuadro.
   Para revisar fotogramas de cualquier composición: `node fotos.mjs <Composición> <cada-N>` y `node hojas.mjs <Composición> <cada-N>`.
4. En la composición de Remotion: cada escena dura **lo que dure su frase + 0.3–0.6 s** (leer `tiempos.json`);
   colocar cada MP3 con `<Audio src={staticFile('voz/<id>/NN.mp3')} />` dentro de su `<Sequence>`; volumen 1.
   Los subtítulos (Plus Jakarta Sans 800, palabra clave en oro) siguen a la frase que se escucha.
5. Revisar fotogramas como dice la skill de marca y además **escuchar el render completo**: que la voz no se corte entre
   escenas, que no se encime y que el llamado final se oiga completo antes del último cuadro.
6. Entregar en `videos/entregas/` con el nombre `TikTokNN_<tema>_con_voz.mp4` (sin música).
7. Recordar a Jonathan: al publicar, activar en TikTok **«Contenido generado por IA»** (voz sintética) y agregar música
   de la biblioteca comercial con volumen bajo (≈ 15–25 %) para que se escuche la voz.

## 4. Costos y límites
- Free F0 acepta ~20 frases por minuto: el script espera y reintenta solo (mensaje «Azure pide esperar»).
- Free F0: si se pasa del límite del mes, Azure deja de responder (no cobra) hasta el mes siguiente. El script muestra
  el error 429/401; avisar a Jonathan.
- Los MP3 generados quedan en `videos/public/voz/` (no se suben a GitHub; se regeneran con el script).
