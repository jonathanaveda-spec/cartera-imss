# App

- **Código:** `plataforma/` (JS sin frameworks, PWA). Se publica sola con GitHub Actions en cada push a `main`
  → carteraasesor.com/app. Panel admin: `/app/admin.html`. Sitio: `sitio/` → carteraasesor.com.
- **Datos:** en el teléfono (IndexedDB) + nube Firebase (`usuarios/{uid}/...`). Reglas en `plataforma/firestore.rules`
  (Jonathan las publica a mano en la consola de Firebase).
- **Versión:** `tools/sello-sw.py` la pone sola al publicar; verificar en `carteraasesor.com/app/sw.js`.
  Si GitHub Pages se traba («in progress deployment»), Jonathan corre `tools\destrabar-pages.ps1`.
  **No subir cambios muy seguidos:** esperar a que termine una publicación antes de la siguiente.
- **Demo local:** `node serve.js` → `http://localhost:8080/demo/` (Firebase simulado, datos inventados).
- **Pruebas:** `npm test` (68 al 16/10).
- **País del asesor** (obligatorio desde 16/10; cambiable en ☰ → Mi cuenta): México = CURP y NSS arriba, celular +52;
  Colombia = +57; Venezuela = +58; «Otro» = el celular se escribe con «+». Venezuela, Colombia y «Otro» llevan los campos
  del IMSS plegados al final. Las cuentas viejas con «Colombia» (venía marcado por defecto) confirman una vez al entrar;
  mientras no confirmen se tratan como México. La confirmación queda en `config/main` (`paisConfirmado`), sin tocar reglas.
- **Funciones:** clientes, pagos con comisión en monto, comprobante, recordar por WhatsApp, importar/exportar Excel
  (SheetJS 0.20.3), respaldo, papelera, PIN con esperas crecientes, aviso diario push (GitHub Actions cada hora).
- Relacionado: [[Seguridad]], [[Negocio]].
