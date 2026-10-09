# Cartera Asesor — instrucciones para Claude

Jonathan trabaja este proyecto desde **tres lugares**: la PC de la casa, la PC del local (oficina)
y el celular (Remote Control de la app de Claude). Todo tiene que poder retomarse desde cualquiera:
**GitHub es la fuente de verdad**, no la PC.

## Al empezar una sesión
1. `git pull` en `main` (puede haber cambios hechos en la otra PC o desde la nube).
2. Leer **`PENDIENTES.md`** (lista única de lo que falta: se actualiza al terminar cada cosa), `BITACORA.md` (arriba) y `PLAN.md`.
3. Si falta el remoto de la app vieja: `git remote add cartera-imss https://github.com/jonathanaveda-spec/cartera-imss.git`.

## Al terminar cada cambio
1. Versión y precarga de `plataforma/` son **automáticas**: al publicar, `tools/sello-sw.py` (desde
   `pages.yml`) pone `VERSION = cartera-asesor-<commit>` y mete todos los archivos en `ARCHIVOS`.
   Los teléfonos y el panel buscan la versión nueva solos (`js/actualizar.js`) y se recargan cuando
   no hay una ventana abierta. No hace falta subir la versión a mano. (`app/` vieja: sí, a mano en `app/sw.js`.)
2. Tachar en `PENDIENTES.md` lo terminado (✅ + fecha) y agregar lo nuevo. Anotar en `BITACORA.md` qué se hizo, incluso lo hecho fuera del código (Cloudflare, panel admin, correos).
3. Commit y push a **los dos** remotos: `git push origin main` y `git push cartera-imss main`
   (comparten historial).
4. **Verificar que quedó en línea**: `https://carteraasesor.com/app/sw.js` debe mostrar
   `cartera-asesor-<primeros 10 caracteres del commit>` (1-2 minutos). También sirve la API pública de Actions.
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

## Diseño
- Skills de diseño en el repo: `.claude/skills/emil-design-eng` y `.claude/skills/mobile-native`
  (de github.com/emilkowalski/skills, licencia MIT en `.claude/skills/LICENSE-emilkowalski-skills.txt`).
  Usarlas al tocar la interfaz de `plataforma/` o `sitio/`: animaciones con propósito, `:active`, hover solo con mouse,
  `prefers-reduced-motion`, safe-area, sin destello al tocar.

## Marca y videos
- **Identidad de marca aprobada** (06/10/2026): skill `.claude/skills/marca-cartera-asesor` (colores, tipografía Bricolage
  Grotesque + Plus Jakarta Sans, voz, formato TikTok, ritmo y **revisión de fotogramas antes de exportar**). Es regla para
  todo material de la marca. Tablero visual: `tienda/marca/tablero.png`.
- **Empresa madre NeuroProyectos IA** (07/10/2026; antes «Puente Digital»): skill `.claude/skills/marca-puente-digital`
  (logo «A · Nodo», grafito + verde azulado, Inter). Se usa para lo de la **empresa** (perfil de Google Play, firma, LinkedIn,
  página), no para los videos de Cartera Asesor. Archivos y tablero en `empresa/puente-digital/`.
- Videos: agente `productor-videos` (`.claude/agents/`, modelo Sonnet) con Remotion en `videos/`. Skills de Remotion
  instaladas solo en la PC del local (ver `BITACORA.md`).

## Equipo de agentes
- 11 agentes en `.claude/agents/` que trabajan como **empleadas expertas** (pedido de Jonathan 07/10/2026). Todas leen
  primero el **manual del equipo** `.claude/equipo.md` (meta del negocio, mentalidad, cómo reportar, reglas de la casa).
- Jonathan llama a Claude **Emma**: coordina al equipo, revisa lo que entregan y hace commit/push.
- Nombres: Lucía (videos), Victoria (estrategia de redes, Opus), Luna (tendencias), Frida (ideas visuales), Ximena
  (avatares), Julieta (textos), Clara (soporte), Tere (pruebas), Fernanda (datos y privacidad, Opus), Andrea (tiendas),
  Mariana (mercado). Las demás usan Sonnet.

## Forma de trabajar con Jonathan
- Todo en español, simple y sin tecnicismos: Jonathan no es programador.
- Probar los cambios de interfaz en tamaño de celular (muchos usuarios usan iPhone).
- Acciones con su cuenta (pagos, llaves, contraseñas, publicar en tiendas) las hace él; Claude guía.
- Metas en espera: App Store (plan en `BITACORA.md`, "Meta pendiente: App Store").
