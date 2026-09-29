# Cartera Asesor — instrucciones para Claude

Jonathan trabaja este proyecto desde **tres lugares**: la PC de la casa, la PC del local (oficina)
y el celular (Remote Control de la app de Claude). Todo tiene que poder retomarse desde cualquiera:
**GitHub es la fuente de verdad**, no la PC.

## Al empezar una sesión
1. `git pull` en `main` (puede haber cambios hechos en la otra PC o desde la nube).
2. Leer `BITACORA.md` (sección **Estado actual y próximos pasos**, arriba) y `PLAN.md`.
3. Si falta el remoto de la app vieja: `git remote add cartera-imss https://github.com/jonathanaveda-spec/cartera-imss.git`.

## Al terminar cada cambio
1. Subir `VERSION` en `plataforma/sw.js` (`cartera-asesor-vN`) si cambió algo de `plataforma/`
   (y `app/sw.js` si cambió `app/`). Sin eso los teléfonos no reciben la versión nueva.
   Todo archivo nuevo de `plataforma/` que la app o el panel usen va también en `ARCHIVOS` de `sw.js`.
2. Anotar en `BITACORA.md` qué se hizo, incluso lo hecho fuera del código (Cloudflare, panel admin, correos).
3. Commit y push a **los dos** remotos: `git push origin main` y `git push cartera-imss main`
   (comparten historial).
4. **Verificar que quedó en línea**: `https://carteraasesor.com/app/sw.js` debe mostrar la versión nueva
   (1-2 minutos). También sirve la API pública de Actions del repo.
   Si GitHub Pages dice "due to in progress deployment. Please cancel <SHA>", el flujo ya intenta
   cancelarlo solo; si aun así falla, Jonathan corre `powershell -ExecutionPolicy Bypass -File tools\destrabar-pages.ps1`.
   Claude no usa la sesión de GitHub guardada en Git para llamar a la API.

## Proyecto
- `plataforma/` = app multiusuario → **carteraasesor.com/app/** (admin: `/app/admin.html`). Es la que se desarrolla.
- `sitio/` = página de presentación → carteraasesor.com.
- `app/` = app vieja personal de Yamileth (github.io/cartera-imss). Yamileth ya migró a la nueva; no tocar salvo pedido.
- Publicación: GitHub Actions (`.github/workflows/pages.yml`) en cada push a `main`.
- Firebase (proyecto cartera-asesor) para cuentas y nube; datos locales en IndexedDB.
- Correo soporte@carteraasesor.com → reenvío a Gmail con Cloudflare Email Routing (funciona desde el 29/09).
- Pruebas: `npm test` (necesita Node; la PC de la casa no lo tiene → probar en el navegador del panel).

## Forma de trabajar con Jonathan
- Todo en español, simple y sin tecnicismos: Jonathan no es programador.
- Probar los cambios de interfaz en tamaño de celular (muchos usuarios usan iPhone).
- Acciones con su cuenta (pagos, llaves, contraseñas, publicar en tiendas) las hace él; Claude guía.
- Metas en espera: App Store (plan en `BITACORA.md`, "Meta pendiente: App Store").
