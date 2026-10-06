# TikTok 3 — «Si alguien toma tu celular… ¿ve tu cartera?» (serie A · Así funciona)

**Estado:** video terminado y revisado (composición `TikTok03Pin`); listo para que Jonathan lo vea.
**Duración:** 24.0 s (720 cuadros a 30 fps) · 1080×1920 · sin música ni voz.
**Archivo final:** `videos/out/tiktok-03-pin.mp4`

**Brief:** mostrar que la cartera se puede proteger con un PIN de 4 números y huella o Face ID, que tú eliges cuándo
se pide, y que si olvidas el PIN entras con tu correo y tus clientes siguen en la nube.
**Llamado:** «Pruébala gratis en la beta» + carteraasesor.com.

## Escenas

| # | Tiempo | Texto en pantalla | Qué se ve | Voz en off sugerida (opcional) |
|---|---|---|---|---|
| 1 Gancho | 0.0–2.4 s | «Si alguien toma tu celular… ¿ve tu **cartera**?» | Emoji 👀 que mira de lado a lado y el texto que sube línea por línea | «Si alguien toma tu celular… ¿ve tu cartera?» |
| 2 Problema | 2.4–5.0 s | «Ahí están los datos de **tus clientes**» + chips rojos «Nombres» «CURP» «NSS» «Celulares» | Lista de clientes dibujada (sin datos reales) con los chips que van cayendo encima | «Ahí están los datos de tus clientes: nombres, CURP, NSS, celulares.» |
| 3 PIN | 5.0–7.8 s | «Un **PIN** de 4 números» | Captura real de la ventana «🔒 Bloqueo de la app» (activar) con anillo en los campos de PIN; cuatro puntos que se llenan | «Activas el bloqueo con un PIN de cuatro números.» |
| 4 Huella | 7.8–10.6 s | «También con **huella** o Face ID» + «👆 Huella» «🙂 Face ID» | Captura real de «Bloqueo activado» con anillo verde en el aviso | «Y si quieres, también con tu huella o con Face ID.» |
| 5 Cuándo | 10.6–13.4 s | «Tú eliges **cuándo** se pide» + «Al salir» «1 min» «5 min» «20 min» | Misma captura enfocada en «Pedir el PIN»; las cuatro opciones se iluminan una por una | «Tú eliges cuándo se pide: al salir, a 1, 5 o 20 minutos.» |
| 6 Teclado | 13.4–16.8 s | «Sin PIN, **nadie entra**» | Captura real de «Tu cartera está protegida»: se teclea 2-5-8-0 con toques y los cuatro puntos se llenan | «Sin tu PIN, nadie entra.» |
| 7 Olvidé | 16.8–20.2 s | «¿Olvidaste el PIN? Entras con tu **correo**» + «☁️ Tus clientes siguen en la nube» | Captura real de «¿Olvidaste tu PIN?» (cerrar sesión y volver a entrar) | «¿Olvidaste el PIN? Entras con tu correo y tus clientes siguen en la nube.» |
| 8 Llamado | 20.2–24.0 s | «Pruébala **gratis** en la beta» · botón verde «carteraasesor.com» · «Beta gratuita · hasta 100 clientes» · «Protege tu cartera con PIN y huella» | Logo, nombre, frase y botón con latido leve | «Pruébala gratis en la beta. Entra a carteraasesor.com.» |

Un cambio visual cada 2.4–3.4 s. Todo dentro de la zona segura y centrado en x = 540 con máximo 800 px. Todo inventado:
el PIN que se ve no es de nadie y la huella de las capturas es simulada.

## Música
Ninguna en el archivo. Jonathan la pone en CapCut Pro (filtro «uso comercial») y puede grabar la voz con la columna de voz.

## Opciones de descripción del post (elige una)
1. Si alguien toma tu celular… ¿ve a tus clientes? 🔒 En Cartera Asesor activas un PIN de 4 números y huella o Face ID.
   Pruébala gratis en la beta: carteraasesor.com
2. Tú eliges cuándo se pide el PIN: al salir, a 1, 5 o 20 minutos. Y si lo olvidas, entras con tu correo y tus clientes
   siguen ahí. Beta gratuita en carteraasesor.com
3. Los datos de tus clientes son tu responsabilidad. Ponle candado a tu cartera con un PIN y huella o Face ID. Pruébala gratis
   en la beta: carteraasesor.com

**Hashtags sugeridos:** #asesorimss #asesorindependiente #privacidad #seguridad #cartera #carteraasesor #appmexico

## Notas para revisión
- La app no es del IMSS ni hace trámites ante el IMSS; el video no lo insinúa. Sin promesas ni cifras de usuarios.
- La huella que se muestra es simulada en el navegador de pruebas (no hay huella real guardada); el texto de las ventanas es el real de la app.
- Capturas nuevas con `node tools/capturas-videos.mjs` → `videos/public/capturas/bloqueo-*.png` y `pin-*.png`.
