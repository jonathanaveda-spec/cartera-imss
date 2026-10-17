# Seguridad

- Revisión con mentalidad de atacante (Fernanda, 15/10): **sin hallazgos críticos**. Cada asesor solo ve sus datos;
  nadie puede darse Pro ni volverse admin; no hay datos reales ni llaves en el repo.
- **Los repos son públicos:** los detalles de seguridad NO se escriben en GitHub. El informe vive solo en la PC de la oficina.
- Reglas: nunca pegar claves en el chat; Jonathan hace los pagos, las contraseñas, las llaves y la publicación en tiendas;
  nunca subir datos de clientes (ALTAS.xlsx, Respaldo_*.json, imagenes/).
- 17/10: corregido lo de código (respaldos validados, política de contenido en las páginas, topes en las reglas, aviso
  diario más robusto). La política de contenido solo deja cargar código propio y Firebase: **si se agrega un servicio externo
  (App Check con reCAPTCHA, analíticas, fuentes de Google) hay que sumarlo a la etiqueta `Content-Security-Policy`** de los .html.
- Pendientes de Jonathan: publicar `firestore.rules` (17/10); verificación en dos pasos en GitHub y en el correo admin, proteger la rama `main`, App Check
  en Firebase y DMARC en Cloudflare.
- Relacionado: [[App]], [[Cómo trabajamos]].
