# App

- **Código:** `plataforma/` (JS sin frameworks, PWA). Se publica sola con GitHub Actions en cada push a `main`
  → carteraasesor.com/app. Panel admin: `/app/admin.html`. Sitio: `sitio/` → carteraasesor.com.
- **Datos:** en el teléfono (IndexedDB) + nube Firebase (`usuarios/{uid}/...`). Reglas en `plataforma/firestore.rules`
  (Jonathan las publica a mano en la consola de Firebase).
- **Versión:** `tools/sello-sw.py` la pone sola al publicar; verificar en `carteraasesor.com/app/sw.js`.
  Si GitHub Pages se traba («in progress deployment»), Jonathan corre `tools\destrabar-pages.ps1`.
  **No subir cambios muy seguidos:** esperar a que termine una publicación antes de la siguiente.
- **Demo local:** `node serve.js` → `http://localhost:8080/demo/` (Firebase simulado, datos inventados).
- **Pruebas:** `npm test` (68 al 15/10).
- **País del asesor:** México = CURP y NSS arriba; Venezuela y «Otro» = plegados al final. Colombia se trata como México
  hasta que el país sea obligatorio en el registro (ver `PENDIENTES.md`). WhatsApp arma el número según el país.
- **Funciones:** clientes, pagos con comisión en monto, comprobante, recordar por WhatsApp, importar/exportar Excel
  (SheetJS 0.20.3), respaldo, papelera, PIN con esperas crecientes, aviso diario push (GitHub Actions cada hora).
- Relacionado: [[Seguridad]], [[Negocio]].
