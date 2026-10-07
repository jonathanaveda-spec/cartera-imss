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
- Voz por defecto: **`es-MX-DaliaNeural`** (mujer, México, cálida y clara). Alternativa masculina: `es-MX-JorgeNeural`.
  Usar siempre la misma en todos los videos (la elige Jonathan oyendo `voz/prueba-voces.json`; anotar aquí cuál quedó).
- Velocidad `+5%` (TikTok es rápido). Tono de colega asesor, de tú, frases cortas (voz de la skill de marca).
- Las frases de voz **no repiten letra por letra** el texto en pantalla: lo acompañan (la pantalla dice la idea en 3–6
  palabras; la voz la dice completa y natural).
- Escribir para el oído: números con letra si se leen raro («cien clientes»), «carteraasesor punto com», sin siglas
  raras, sin emojis. CURP y NSS se leen bien tal cual.

## 3. Proceso por video
1. En el guion del video (`videos/guiones/…md`) agregar la columna «Voz» por escena y que **Jonathan la apruebe**
   junto con el resto del guion.
2. Crear `videos/voz/<id-del-video>.json` con una frase por escena (formato en el encabezado de `videos/voz.mjs`).
3. Generar: `cd videos && node voz.mjs voz/<id>.json` → `public/voz/<id>/NN.mp3` + `tiempos.json`.
4. En la composición de Remotion: cada escena dura **lo que dure su frase + 0.3–0.6 s** (leer `tiempos.json`);
   colocar cada MP3 con `<Audio src={staticFile('voz/<id>/NN.mp3')} />` dentro de su `<Sequence>`; volumen 1.
   Los subtítulos (Plus Jakarta Sans 800, palabra clave en oro) siguen a la frase que se escucha.
5. Revisar fotogramas como dice la skill de marca y además **escuchar el render completo**: que la voz no se corte entre
   escenas, que no se encime y que el llamado final se oiga completo antes del último cuadro.
6. Entregar en `videos/entregas/` con el nombre `TikTokNN_<tema>_con_voz.mp4` (sin música).
7. Recordar a Jonathan: al publicar, activar en TikTok **«Contenido generado por IA»** (voz sintética) y agregar música
   de la biblioteca comercial con volumen bajo (≈ 15–25 %) para que se escuche la voz.

## 4. Costos y límites
- Free F0: si se pasa del límite del mes, Azure deja de responder (no cobra) hasta el mes siguiente. El script muestra
  el error 429/401; avisar a Jonathan.
- Los MP3 generados quedan en `videos/public/voz/` (no se suben a GitHub; se regeneran con el script).
