---
name: marca-cartera-asesor
description: Identidad de marca de Cartera Asesor (colores, tipografía, voz, ritmo de video y revisión de fotogramas). Úsala SIEMPRE que se haga un video (TikTok, Reels, Shorts, Remotion), una imagen para redes, una pieza promocional o cualquier material visual de la marca Cartera Asesor.
---

# Identidad de marca — Cartera Asesor

Reglas aprobadas por Jonathan (dueño de la marca) el 06/10/2026. Son obligatorias para todo material de la marca.
Si algo no está aquí, se decide siguiendo el espíritu de estas reglas y se le pregunta a Jonathan antes de inventar.

## 1. Quiénes somos y a quién le hablamos
- **Producto:** Cartera Asesor, app para que el **asesor IMSS** (y de seguros) organice su cartera de clientes, sepa quién
  está al día, por vencer o moroso, y cobre a tiempo por WhatsApp. Web + Android + iPhone. Hoy: **beta gratuita**
  (hasta 100 clientes).
- **Público:** asesores en México (y Colombia/Venezuela) que hoy cobran con libreta, Excel o memoria. Trabajan desde el celular.
- **Promesa:** «Tu cartera de clientes, organizada y al día».
- Sitio: carteraasesor.com · App: carteraasesor.com/app · Soporte: soporte@carteraasesor.com

## 2. Colores (los mismos de la app)
| Nombre | HEX | Uso |
|---|---|---|
| Azul noche | `#0B2A6F` | Fondos principales, inicio del degradado |
| Azul cartera | `#1D4ED8` | Color de marca, botones, mitad del degradado |
| Celeste | `#1AA3F5` | Brillos, final del degradado, detalles |
| **Oro acento** | `#FFD166` | **Solo la palabra clave** de cada frase (una por pantalla) |
| Verde al día | `#16A34A` | WhatsApp, éxito, «al día», llamado a la acción |
| Ámbar | `#D97706` | «Por vencer», advertencia suave |
| Rojo moroso | `#DC2626` | «Moroso», el dolor/problema |
| Nube | `#F5F8FF` | Fondo claro |
| Tinta | `#0F172A` | Texto sobre fondo claro |

- Fondo de marca: `linear-gradient(170deg, #0B2A6F, #1D4ED8)` con un brillo `radial-gradient` celeste arriba.
- Texto sobre azul: blanco `#FFFFFF`; secundario `#DBE8FF`.
- Rojo, ámbar y verde se usan **solo con su significado** (estados de la app). Nunca como decoración.
- Contraste mínimo 4.5:1 para textos.

## 3. Tipografía (opción A · «Cercana»)
- **Títulos y ganchos:** **Bricolage Grotesque**, peso 800, interletrado −1px a −2px, interlineado 1.0–1.1.
- **Textos, subtítulos, datos:** **Plus Jakarta Sans**, pesos 400 / 600 / 800.
- Ambas son de Google Fonts con licencia libre (OFL): se pueden usar en videos y redes.
- En Remotion: `@remotion/google-fonts/BricolageGrotesque` y `@remotion/google-fonts/PlusJakartaSans` (`loadFont()`).
  En HTML: Google Fonts con `display=block`.
- Marca escrita: «Cartera Asesor» en Bricolage Grotesque 800. Siempre junto al logo `plataforma/icons/icon-512.png`
  (esquinas redondeadas, sombra suave). No deformar ni recolorear el logo.
- Tamaños de referencia en 1080×1920: gancho 96–130 px · subtítulo 44–56 px · subtítulos de voz 52–60 px · letra
  mínima 40 px (en TikTok se ve en un celular).

## 4. Voz de la marca
- Habla **de tú**, como un colega asesor, no como un banco. Español de México neutro, cercano y claro.
- Frases cortas, de una idea. Concreto > abstracto: «3 clientes atrasados hoy» en vez de «mejora tu gestión».
- Se nombra el dolor real: la libreta, el Excel desordenado, el cliente que «se te pasó», perseguir pagos.
- Emojis: pocos y con sentido (🟢 🟡 🔴 💬 ✅ 📒). Máximo uno por pantalla.
- Palabras de la marca: cartera, al día, por vencer, moroso, recordar por WhatsApp, comprobante, beta gratuita.
- **Prohibido:** prometer ganancias o «más clientes»; decir o insinuar que somos el IMSS o que hacemos trámites ante el
  IMSS (somos una herramienta de organización); hablar mal de otras marcas por su nombre; inventar cifras de usuarios.
- Llamados a la acción aprobados: «Pruébala gratis en la beta» · «Entra a carteraasesor.com» · «Link en mi perfil».

## 5. Formato de videos (TikTok / Reels / Shorts)
- **1080×1920, 9:16, 30 fps**, 15–25 s (máximo 45 s). Exportar MP4 H.264 + AAC.
- **Zona segura** (TikTok tapa parte de la pantalla): todo texto y dato importante dentro de **x 60–940 px, y 180–1440 px**.
  Abajo (descripción, música) y la columna derecha (me gusta, comentarios) quedan libres de texto.
- **Subtítulos siempre** (mucha gente ve sin sonido): Plus Jakarta Sans 800, blancos con sombra o caja azul noche al 80 %,
  palabra clave en oro. Dentro de la zona segura, en el tercio medio-bajo.
- Pantallas de la app: usar capturas **reales** de la app con **clientes inventados** (`node tools/capturas-play.mjs` deja
  las capturas limpias en `tienda/capturas/crudas/`). Mostrarlas dentro del marco de teléfono de `tienda/marco.html`
  o a pantalla completa con zoom suave a la parte importante.
- Música: solo pistas con licencia libre para uso comercial (biblioteca de TikTok o la de audio de YouTube/Pixabay). Anotar
  de dónde salió. Voz en off opcional (la graba Jonathan).

## 6. Ritmo (estructura de cada video)
| Tiempo | Bloque | Qué pasa |
|---|---|---|
| 0–2 s | **Gancho** | Una pregunta o frase del dolor, enorme, palabra clave en oro. Movimiento desde el primer cuadro. |
| 2–8 s | **Problema** | Libreta, Excel, olvidos, cobros tarde. Rojo/ámbar con moderación. |
| 8–18 s | **Solución en acción** | La app real: resumen al día/por vencer/morosos → recordar por WhatsApp → comprobante. |
| Final 2–4 s | **Llamado** | Logo + «Pruébala gratis en la beta» + carteraasesor.com. Verde para el botón. |

- **Un corte o cambio visual cada 1.5–3 s.** Una sola idea por escena.
- Animaciones con propósito: entradas con *ease-out* o `spring` amortiguado (sin rebotes exagerados), 200–500 ms.
  Nada de transiciones decorativas largas; el movimiento guía la vista a la palabra o dato clave.
- Las cifras que cuentan (16 clientes, 3 morosos) suben con un conteo rápido.

## 7. Forma de trabajo (en este orden, siempre)
1. **Brief:** objetivo del video, idea central y llamado (1–3 líneas).
2. **Guion con tiempos:** escena por escena (texto en pantalla + lo que se ve + duración). **Jonathan lo aprueba** antes de
   programar.
3. **Programar** en el proyecto Remotion `videos/` (una composición por video: `TikTok01Libreta`, `TikTok02…`),
   siguiendo las skills de Remotion (`remotion-best-practices`) y esta skill.
4. **Revisar fotogramas (obligatorio):** antes del video final, sacar fotos de **cada escena** (al menos inicio, mitad y
   final de cada una, y el primer y último cuadro) con `npx remotion still` y **mirarlas una por una**. Revisar:
   - texto dentro de la zona segura y sin cortarse; ortografía y acentos;
   - tipografía y colores de esta skill; palabra clave en oro; contraste;
   - que no aparezcan datos reales de clientes, correos ni contraseñas;
   - que el gancho se entienda en el primer cuadro y el llamado se lea completo.
   Corregir y volver a revisar hasta que todo esté en orden.
5. **Render final** a `videos/out/` (no se sube a GitHub) y entregarlo a Jonathan para que lo vea en su celular.
   Por defecto se entrega **sin música** (o con una pista libre de prueba) para que Jonathan la ponga en CapCut.
6. **Acabado en CapCut Pro (lo hace Jonathan, opcional):** música de la biblioteca de CapCut con el filtro **«uso
   comercial»**, voz en off y ajustes finales. Claude no maneja CapCut a clics (gasta muchos tokens); si hace falta,
   le da a Jonathan los pasos.
7. Jonathan publica en TikTok desde su cuenta. Anotar en `BITACORA.md` qué video se hizo y con qué música.

## 8. Datos y privacidad
- Nunca usar datos reales de clientes (ni de Yamileth ni de nadie). Solo los inventados de las capturas o nombres
  ficticios (p. ej. la asesora «Laura Méndez»). Celulares con forma `55 0000 XXXX`.
- No mostrar correos, contraseñas ni la consola de administración.
