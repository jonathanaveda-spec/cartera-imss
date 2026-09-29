# Plan de trabajo — Cartera Asesor (plataforma para asesores)

Visión: una cartera inteligente para asesores que trabajan clientes del IMSS en México (desde México, Colombia o Venezuela).
Solo paga el asesor. Cada asesor ve únicamente sus clientes.

Estrategia: **web primero** (sin tiendas ni comisiones) → cobro directo con activación manual → Google Play → App Store.

- `app/` = versión personal de Yamileth (congelada; no se toca hasta migrarla).
- `plataforma/` = versión multiusuario nueva.

## Fase 1 — Beta web multiusuario

| # | Paso | Quién | Estado |
|---|---|---|---|
| 1 | Plan de trabajo | Claude | ✅ |
| 2 | Carpeta `plataforma/` separada de la app de Yamileth (base de datos local distinta) | Claude | ✅ |
| 3 | Registro con correo verificado, perfil del asesor, cartera aislada por asesor | Claude | ✅ |
| 4 | Reglas de seguridad multiusuario (`plataforma/firestore.rules`) | Claude | ✅ (falta probarlas en Firebase real) |
| 5 | Planes: beta abierta / plan gratis con límite / Plan Pro con vencimiento | Claude | ✅ |
| 6 | Ayuda y soporte: preguntas frecuentes + tickets con respuesta | Claude | ✅ |
| 7 | Panel de administrador (`admin.html`): resumen, asesores, planes, tickets, sistema, registro de accesos | Claude | ✅ |
| 8 | Borradores de aviso de privacidad y términos | Claude | ✅ borrador — **revisar y completar** |
| 9 | Eliminar cuenta desde la app (requisito de Apple y Google) | Claude | ✅ |
| 10 | Crear proyecto Firebase de la plataforma y pasar configuración + tu UID | **Tú** | ⏳ ver `plataforma/LEEME_FIREBASE.md` |
| 11 | Nombre final, logo (Corel), correo de contacto | **Tú** | ⏳ |
| 12 | Publicar la beta y probar de punta a punta con Firebase real | Claude (tras 10) | ⏳ |
| 13 | Asistente para importar cualquier Excel (elegir qué columna es cada dato) | Claude | ✅ |
| 14 | Invitar 5–12 asesores a la beta | Tú | ⏳ |

## Fase 2 — Cobro directo
- Precio mensual/anual (en USD) y límite del plan gratis → **tú**.
- Medios de pago en el panel (Nequi, llave Bre-B, Binance Pay ID, transferencia MX) → ya se pueden escribir en Sistema.
- Comprobante → ticket «pago» → activas con «Activar plan». ✅ ya funciona.
- Pendiente: recordatorio automático de vencimiento del plan, subir foto del comprobante.

## Fase 3 — Google Play (25 USD) — EN MARCHA (01/10)
Motivo: en Android la instalación desde la web es lenta y algunos teléfonos (Tecno/Infinix/itel,
antivirus de Transsion) muestran «Pueden existir riesgos». Desde Play Store eso desaparece.
| Paso | Quién | Estado |
|---|---|---|
| Ficha: textos e imagen 1024×500 (`tienda/`) | Claude | ✅ |
| Crear cuenta de Play Console (25 USD, verificar identidad) — **personal** (decidido 01/10); pago programado para el sábado 03/10 | Jonathan | ⏳ |
| Versión de Play sin precios ni medios de pago (`js/origen.js`, se activa con `?origen=play`) | Claude | ✅ |
| Empaquetar con PWABuilder (pwabuilder.com → carteraasesor.com/app/ → Android). Opciones: paquete `com.carteraasesor.app`, nombre «Cartera Asesor», URL de inicio `/app/?origen=play`. Jonathan guarda el .zip (trae la llave de firma: **no perderla**, copia en Drive) | Jonathan + Claude | ⏳ |
| Publicar `sitio/.well-known/assetlinks.json` con la huella del .zip y la de «Firma de apps» de Play Console (quita la barra del navegador) | Claude | ⏳ |
| Capturas de pantalla y cuenta de prueba para el revisor | Claude + Jonathan | ⏳ |
| Prueba cerrada: 12 personas durante 14 días (solo cuentas personales) | Jonathan invita | ⏳ |
| Enviar a revisión y publicar | Jonathan | ⏳ |
- Pagos: mientras la app de Play no cobre dentro de la app, no mostrar ahí los precios ni los medios de pago del Plan Pro (política de pagos de Google).
- Después: notificaciones de «cobros de hoy», chat de soporte con IA (con tope de gasto).

## Ideas aprendidas de la competencia (29/09)
Revisadas «Cobros y Deudas» (DT-Soft, 10K) y «CobrApp» (100K+, en realidad es para préstamos y cobradores).
Buscando «imss asesores» en Google Play **no hay ninguna app para que el asesor IMSS maneje su cartera**: el nicho
está libre. CobrApp paga anuncios para salir en esa búsqueda: usar esas palabras en nuestra ficha.
Decisiones: nada de publicidad dentro de la app, la nube es para todos (se cobra por crecer, no por guardar) y nos
quedamos en el nicho de asesores IMSS (después: otros oficios de cobro recurrente; préstamos, si acaso, como app aparte).
| Idea | Estado |
|---|---|
| Bloqueo con PIN y huella / Face ID | ✅ 29/09 |
| Comprobante de pago por WhatsApp con el nombre del asesor | pendiente (siguiente) |
| Pantalla «Acerca de» con marca del desarrollador + botón Compartir la app | pendiente: Jonathan elige el nombre de marca |
| Entrar con Google | pendiente |
| Filtros rápidos «Pagan hoy» / «Pagaron hoy» | pendiente |
| Tour de bienvenida corto y tutoriales (video) dentro de la app | pendiente |
| «Usada por N asesores» (prueba social) cuando haya usuarios | después |
| Notificaciones «hoy vencen N clientes» (necesita servidor pagado) | después |
No copiar: préstamos/intereses/rutas, banners de Premium por todos lados, botones flotantes que se tapan.

## Fase 4 — App Store (99 USD/año)
- Iniciar sesión con Apple, pagos dentro de la tienda (RevenueCat).

## Fase 5 — Automatizar cobros
- Wompi / Mercado Pago / Binance Pay API cuando la activación manual quite mucho tiempo.

## Migrar a Yamileth
Cuando la plataforma esté estable: crea su cuenta, restaura su respaldo desde la app y queda como una asesora más.
(Con esto ya no hace falta activar la nube en la app personal.)

## Probar localmente
```
node serve.js
```
- App de Yamileth: http://localhost:8080/app/
- Plataforma con Firebase **simulado**: http://localhost:8080/demo/ (administrador de prueba: cualquier correo que empiece con `admin@`)
- Pruebas automáticas: `npm test`
