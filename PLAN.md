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
| 13 | Asistente para importar cualquier Excel (elegir qué columna es cada dato) | Claude | ⏳ siguiente |
| 14 | Invitar 5–12 asesores a la beta | Tú | ⏳ |

## Fase 2 — Cobro directo
- Precio mensual/anual (en USD) y límite del plan gratis → **tú**.
- Medios de pago en el panel (Nequi, llave Bre-B, Binance Pay ID, transferencia MX) → ya se pueden escribir en Sistema.
- Comprobante → ticket «pago» → activas con «Activar plan». ✅ ya funciona.
- Pendiente: recordatorio automático de vencimiento del plan, subir foto del comprobante.

## Fase 3 — Google Play (25 USD)
- Empaquetar con Capacitor, notificaciones de «cobros de hoy», chat de soporte con IA (con tope de gasto).
- Prueba cerrada obligatoria: mínimo 12 personas durante 14 días.

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
