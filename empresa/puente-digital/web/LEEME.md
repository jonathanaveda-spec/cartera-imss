# Página web de NeuroProyectos IA

Una sola página (`index.html`), sin programación ni servidor: se abre con doble clic para verla. Enlaza a Cartera Asesor.

## Archivos
`index.html` (la página) · `logo.svg` y `logo-oscuro.svg` · `favicon.svg` · `cartera-asesor-icono.png` ·
`og-imagen.png` (la imagen que sale cuando alguien comparte el enlace por WhatsApp o redes).

## Antes de publicar
- El correo **contacto@neuroproyectos.com** aparece en la página y **todavía no existe**: hay que comprar el dominio y crearlo
  (ver la lista de pendientes). Si publicas antes, cambia el correo en `index.html` (busca `contacto@`).
- La tipografía Inter se carga desde Google Fonts; si no carga, la página usa la del sistema y se ve bien igual.
- Si más adelante cambia el dominio, actualiza la línea `og:image` de `index.html`.

## Dónde publicarla (recomendado: Cloudflare Pages, gratis)
Ya usas Cloudflare para el correo de carteraasesor.com, así que todo queda en el mismo lugar:
1. Compra el dominio (idealmente en Cloudflare Registrar; ver la lista de pendientes).
2. Cloudflare → **Workers y Pages** → **Pages** → conectar con GitHub o subir la carpeta `web/` directamente.
3. Añade el dominio personalizado `neuroproyectos.com` (Cloudflare lo configura casi solo, con candado HTTPS).

Otra opción gratis: GitHub Pages en un repositorio aparte (este repositorio ya publica carteraasesor.com y solo puede
tener una página).
