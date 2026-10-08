// Genera los 3 videos del martes 13 con HyperFrames (HTML + GSAP) a partir de los tiempos de la voz de Azure.
// Uso (desde videos/hyperframes/):  node generar.mjs [m02|t02|p06]   (sin argumento = los 3)
// Cada video queda en su carpeta (m02/, t02/, p06/) con index.html + assets/ (fuentes, logo, voz, capturas).
// Los tiempos salen de ../public/voz/<id>/tiempos.json (lo que dura de verdad cada frase; ver medir-voz.mjs).
// Se respeta la skill marca-cartera-asesor: 1080x1920, zona segura, x=540, Bricolage + Plus Jakarta, oro = palabra clave.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const F = 30;
const COLCHON = 0.35, RETRASO = 4, RETRASO_CIERRE = 10, PAD_FINAL = 0.9; // = plantillas de Remotion, para que se vean igual
const r3 = (n) => Math.round(n * 1000) / 1000;
const seg = (frames) => r3(frames / F);
const aCuadros = (s) => Math.round(s * F);
const rico = (t) => t.replace(/\*\*([^*]+)\*\*/g, '<span class="oro">$1</span>');

const leerVoz = (id) => JSON.parse(readFileSync(join(AQUI, '..', 'public', 'voz', id, 'tiempos.json'), 'utf8')).frases;

function preparar(dir, vozId, capturas = []) {
  const base = join(AQUI, dir);
  mkdirSync(join(base, 'assets', 'fonts'), { recursive: true });
  mkdirSync(join(base, 'assets', 'voz'), { recursive: true });
  for (const f of ['bricolage-800.woff2', 'jakarta.woff2']) copyFileSync(join(AQUI, '_compartido', 'fonts', f), join(base, 'assets', 'fonts', f));
  copyFileSync(join(AQUI, '_compartido', 'logo.png'), join(base, 'assets', 'logo.png'));
  const frases = leerVoz(vozId);
  frases.forEach((f) => copyFileSync(join(AQUI, '..', 'public', f.archivo), join(base, 'assets', 'voz', basename(f.archivo))));
  if (capturas.length) mkdirSync(join(base, 'assets', 'capturas'), { recursive: true });
  for (const c of capturas) copyFileSync(join(AQUI, '..', 'public', 'capturas', c), join(base, 'assets', 'capturas', c));
  return { base, frases };
}

const CSS = `
@font-face { font-family: "Bricolage Grotesque"; src: url("assets/fonts/bricolage-800.woff2") format("woff2"); font-weight: 800; font-display: block; }
@font-face { font-family: "Plus Jakarta Sans"; src: url("assets/fonts/jakarta.woff2") format("woff2"); font-weight: 200 800; font-display: block; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: #0B2A6F; }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Plus Jakarta Sans", sans-serif; color: #fff;
  background: linear-gradient(170deg, #0B2A6F, #1D4ED8); }
.clip { position: absolute; inset: 0; }
#glow { position: absolute; left: -240px; top: -300px; width: 1800px; height: 1400px; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(26,163,245,0.55), rgba(26,163,245,0) 100%); }
.oro { color: #FFD166; }
.caja { position: absolute; left: 140px; width: 800px; }
.titulo { font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; text-align: center; white-space: nowrap; color: #fff;
  letter-spacing: -2.5px; text-shadow: 0 6px 28px rgba(5,20,60,0.45); }
.titulo > div { will-change: transform; }
/* Tarjeta (M02, T02) */
#tit { top: 600px; font-size: 112px; line-height: 1.04; transform-origin: 50% 0%; }
#tit.gigante { top: 400px; }
#tit .l0g { font-size: 400px; line-height: 0.95; letter-spacing: -12px; margin-bottom: 14px; }
#lineas { top: 440px; display: flex; flex-direction: column; gap: 18px; }
#lineas.gigante { top: 650px; gap: 30px; }
.linea { display: flex; align-items: center; gap: 26px; padding: 22px 30px 24px 24px; border-radius: 40px;
  background: rgba(11,42,111,0.62); border: 3px solid rgba(255,255,255,0.12); box-shadow: 0 18px 36px rgba(3,12,40,0.28); }
.gigante .linea { padding: 34px 36px 36px 34px; }
.num { flex: none; width: 76px; height: 76px; border-radius: 999px; background: #fff; color: #0B2A6F;
  font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; font-size: 48px; display: flex; align-items: center; justify-content: center; }
.txt { font-weight: 800; font-size: 48px; line-height: 1.18; letter-spacing: -0.5px; }
.gigante .txt { font-size: 62px; }
/* Llamado final / cierre */
.logo { position: absolute; left: 440px; width: 200px; height: 200px; border-radius: 48px; box-shadow: 0 28px 56px rgba(3,12,40,0.5); }
.nombre { font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; text-align: center; letter-spacing: -1.5px; color: #fff; }
.boton { display: flex; justify-content: center; }
.boton > div { background: #16A34A; color: #fff; font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; letter-spacing: -1px;
  border-radius: 999px; box-shadow: 0 22px 44px rgba(3,12,40,0.45); border: 6px solid rgba(255,255,255,0.35); white-space: nowrap; }
.resto { text-align: center; font-weight: 800; color: #DBE8FF; line-height: 1.3; }
/* Teléfono con captura real (P06) */
.tel { position: absolute; left: 140px; top: 186px; width: 800px; height: 888px; border-radius: 64px; background: #0F172A;
  box-shadow: 0 40px 80px rgba(3,12,40,0.5), 0 0 0 3px rgba(255,255,255,0.18); }
.pantalla { position: absolute; left: 14px; top: 14px; width: 772px; height: 860px; border-radius: 50px; overflow: hidden; background: #F5F8FF; }
.cap { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; transform-origin: 0 0; }
.cap img { width: 1080px; height: 1920px; display: block; }
.anillo { position: absolute; border: 10px solid #1D4ED8; box-shadow: 0 0 0 8px rgba(255,255,255,0.35), 0 0 40px #1D4ED8; }
.anillo.verde { border-color: #16A34A; box-shadow: 0 0 0 8px rgba(255,255,255,0.35), 0 0 40px #16A34A; }
.subt { position: absolute; left: 140px; width: 800px; display: flex; justify-content: center; }
.subt > div { background: rgba(11,42,111,0.82); border-radius: 40px; padding: 28px 32px 32px; white-space: nowrap; text-align: center;
  font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; font-size: 64px; line-height: 1.08; letter-spacing: -1.5px;
  color: #fff; text-shadow: 0 4px 18px rgba(5,20,60,0.45); }
.emoji { text-align: center; line-height: 1; }
`;

function pagina({ titulo, total, cuerpo, audios, js }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1080, height=1920">
<title>${titulo}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>${CSS}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${r3(total)}" data-width="1080" data-height="1920">
  <div id="glow"></div>
${cuerpo}
${audios}
</div>
<script>
const tl = gsap.timeline({ paused: true });
const E = "expo.out";
tl.fromTo("#glow", { x: -70, y: 0 }, { x: 70, y: 40, duration: ${r3(total)}, ease: "none" }, 0);
${js}
window.__timelines["main"] = tl;
</script>
</body>
</html>
`;
}

const audiosDe = (frases, inicios) =>
  frases
    .map((f, i) => `  <audio id="voz-${i + 1}" src="assets/voz/${basename(f.archivo)}" data-start="${r3(inicios[i])}" data-duration="${r3((f.fin ?? f.segundos) + 0.15)}" data-track-index="9" data-volume="1"></audio>`)
    .join('\n');

// ------------------------------------------------------------------------------------------------
// Llamado / cierre: logo, nombre, texto, botón verde y «Pruébala gratis en la beta»
// ------------------------------------------------------------------------------------------------
function llamadoHTML(p, t0, dur, { logoTop, nombreTop, nombreSize, textoTop, textoSize, botonTop, botonSize, restoTop, restoHtml, lineas }) {
  return `  <section id="${p}" class="clip" data-start="${r3(t0)}" data-duration="${r3(dur)}" data-track-index="2">
    <img id="${p}-logo" class="logo" src="assets/logo.png" style="top:${logoTop}px" alt="">
    <div id="${p}-nombre" class="caja nombre" style="top:${nombreTop}px;font-size:${nombreSize}px">Cartera Asesor</div>
    <div id="${p}-texto" class="caja titulo" style="top:${textoTop}px;font-size:${textoSize}px;line-height:1.04;letter-spacing:-3px">
${lineas.map((l, i) => `      <div id="${p}-t${i}">${rico(l)}</div>`).join('\n')}
    </div>
    <div id="${p}-boton" class="caja boton" style="top:${botonTop}px"><div id="${p}-boton-in" style="font-size:${botonSize}px;padding:28px 42px 32px">carteraasesor.com</div></div>
    <div id="${p}-resto" class="caja resto" style="top:${restoTop}px;font-size:46px">${restoHtml}</div>
  </section>`;
}
function llamadoJS(p, t0, n, durTotal, { conLatido = true } = {}) {
  const T = (f) => r3(t0 + f / F);
  let js = `
// ${p}: llamado final
tl.fromTo("#${p}-logo", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: ${seg(16)}, ease: "back.out(1.2)" }, ${T(0)});
tl.fromTo("#${p}-nombre", { opacity: 0 }, { opacity: 1, duration: ${seg(14)}, ease: E }, ${T(4)});`;
  for (let i = 0; i < n; i++)
    js += `\ntl.fromTo("#${p}-t${i}", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: ${seg(14)}, ease: E }, ${T(8 + i * 6)});`;
  js += `
tl.fromTo("#${p}-boton", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: ${seg(14)}, ease: "back.out(1.3)" }, ${T(34)});
tl.fromTo("#${p}-resto", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: ${seg(14)}, ease: E }, ${T(44)});`;
  if (conLatido) {
    const resto = durTotal - (55 + 8) / F;
    const veces = Math.max(1, Math.floor(resto / 0.8));
    js += `\ntl.to("#${p}-boton-in", { scale: 1.03, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: ${veces * 2 - 1} }, ${T(55)});`;
  }
  return js;
}

// ------------------------------------------------------------------------------------------------
// TARJETA (M02 y T02): titular + líneas que entran una por una + llamado
// ------------------------------------------------------------------------------------------------
function tarjeta({ dir, vozId, nombreArchivo, titular, lineas, numerar, gigante, llamado }) {
  const { base, frases } = preparar(dir, vozId);
  const n = lineas.length + 2;
  if (frases.length !== n) throw new Error(`${vozId}: la voz tiene ${frases.length} frases y la tarjeta necesita ${n}`);
  const durF = frases.map((f, i) => aCuadros((f.fin ?? f.segundos) + (i === n - 1 ? PAD_FINAL : COLCHON)) + (i === 1 ? 10 : 0));
  const iniF = durF.map((_, i) => durF.slice(0, i).reduce((a, b) => a + b, 0));
  const totalF = durF.reduce((a, b) => a + b, 0);
  const total = seg(totalF);
  const iCall = n - 1;
  const tCall = seg(iniF[iCall]);

  const titHTML = titular.map((l, i) => `      <div class="t${i}${gigante && i === 0 ? ' l0g' : ''}">${rico(l)}</div>`).join('\n');
  const linHTML = lineas
    .map((l, i) => `      <div class="linea" id="l${i}">${numerar ? `<div class="num">${i + 1}</div>` : ''}<div class="txt">${rico(l)}</div></div>`)
    .join('\n');
  const cuerpo = `  <section id="cuerpo" class="clip" data-start="0" data-duration="${r3(tCall + 0.2)}" data-track-index="1">
    <div id="cuerpo-in" style="position:absolute;inset:0">
    <div id="tit" class="caja titulo${gigante ? ' gigante' : ''}">
${titHTML}
    </div>
    <div id="lineas" class="caja${gigante ? ' gigante' : ''}">
${linHTML}
    </div>
    </div>
  </section>
${llamadoHTML('ll', tCall, total - tCall, {
    logoTop: 230, nombreTop: 470, nombreSize: 70, textoTop: 620, textoSize: 124, botonTop: 1010, botonSize: 62, restoTop: 1190,
    restoHtml: 'Pruébala <span class="oro">gratis</span> en la beta', lineas: llamado })}`;

  const inicios = frases.map((_, i) => seg(iniF[i] + (i === 1 ? 14 : RETRASO)));
  let js = `// Titular: entra línea por línea, grande al centro; sube y se achica cuando llega la primera línea
${titular.map((_, i) => `tl.fromTo("#tit .t${i}", { opacity: 0.45, y: 40 }, { opacity: 1, y: 0, duration: ${seg(10)}, ease: E }, ${seg(i * 3)});`).join('\n')}
tl.to("#tit", { y: ${190 - (gigante ? 400 : 600)}, scale: 0.6, duration: ${seg(16)}, ease: "power2.inOut" }, ${seg(iniF[1])});`;
  lineas.forEach((_, i) => {
    const t0 = iniF[i + 1], espera = i === 0 ? 14 : 3;
    js += `\ntl.fromTo("#l${i}", { opacity: 0, y: 70, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: ${seg(14)}, ease: E }, ${seg(t0 + espera)});`;
    // la línea que se está diciendo se ilumina
    js += `\ntl.to("#l${i}", { backgroundColor: "rgba(6,24,74,0.92)", borderColor: "rgba(255,255,255,0.8)", duration: 0.15 }, ${seg(t0 + espera)});`;
    js += `\ntl.to("#l${i}", { backgroundColor: "rgba(11,42,111,0.62)", borderColor: "rgba(255,255,255,0.12)", duration: 0.2 }, ${seg(t0 + durF[i + 1])});`;
  });
  js += `\n// el contenido se va justo antes del llamado\ntl.to("#cuerpo-in", { opacity: 0, duration: ${seg(10)}, ease: "power1.in" }, ${r3(tCall - 8 / F)});`;
  js += llamadoJS('ll', tCall, 2, total - tCall);

  writeFileSync(join(base, 'index.html'), pagina({ titulo: nombreArchivo, total, cuerpo, audios: audiosDe(frases, inicios), js }));
  console.log(`${dir}: ${total.toFixed(2)} s · ${n} tramos`);
  return total;
}

// ------------------------------------------------------------------------------------------------
// P06: historia con capturas reales de la app dentro de un teléfono
// ------------------------------------------------------------------------------------------------
function p06() {
  const dir = 'p06', vozId = 'p06-fecha-sola';
  const { base, frases } = preparar(dir, vozId, ['sem-periodicidad.png', 'sem-pago.png', 'sem-pago-15dias.png']);
  const fin = frases.map((f) => f.fin ?? f.segundos);
  // 5 escenas = 5 frases: gancho, selector, registrar pago, cada 15 días, cierre
  const durF = fin.map((s, i) => (i === 4 ? RETRASO_CIERRE + aCuadros(s + PAD_FINAL) : RETRASO + aCuadros(s + COLCHON)));
  const iniF = durF.map((_, i) => durF.slice(0, i).reduce((a, b) => a + b, 0));
  const total = seg(durF.reduce((a, b) => a + b, 0));
  const T = (i, f = 0) => seg(iniF[i] + f);
  const D = (i) => seg(durF[i]);

  // Capturas: zoom 1 = ancho completo (772 px de pantalla / 1080 px de captura)
  const S = 772 / 1080, ALTO = 860;
  const pos = (cy) => {
    const ty = Math.min(0, Math.max(ALTO - 1920 * S, ALTO / 2 - cy * S));
    return { tx: 0, ty: r3(ty), s: r3(S) };
  };
  const anillo = (id, x, y, w, h, radio, color = '') =>
    `<div id="${id}" class="anillo ${color}" data-layout-allow-overflow style="left:${x - 8}px;top:${y - 8}px;width:${w + 16}px;height:${h + 16}px;border-radius:${radio + 8}px"></div>`;
  const tel = (id, img, pz, anillos) => `    <div id="${id}-tel" class="tel">
      <div class="pantalla"><div id="${id}-cap" class="cap" data-layout-allow-overflow style="transform:translate(0px,${pz.ty}px) scale(${pz.s})"><img src="assets/capturas/${img}" alt="">
        ${anillos.join('\n        ')}
      </div></div>
    </div>`;
  const subt = (id, lineas) => `    <div id="${id}-subt" class="subt" style="top:1150px"><div>${lineas.map((l) => `<div>${rico(l)}</div>`).join('')}</div></div>`;

  const cuerpo = `  <section id="s1" class="clip" data-start="${T(0)}" data-duration="${D(0)}" data-track-index="1">
    <div id="s1-emoji" class="caja emoji" style="top:330px;font-size:190px">🗓️</div>
    <div id="s1-tit" class="caja titulo" style="top:600px;font-size:100px;line-height:1.03">
      <div>Registras</div><div>el pago y la</div><div>próxima <span class="oro">fecha</span></div><div>se pone sola</div>
    </div>
  </section>
  <section id="s2" class="clip" data-start="${T(1)}" data-duration="${D(1)}" data-track-index="1">
${tel('s2', 'sem-periodicidad.png', pos(1020), [anillo('s2-a', 40, 825, 1000, 520, 40), anillo('s2-b', 40, 1365, 1000, 225, 40, 'verde')])}
${subt('s2', ['Elige <span class="oro">cada cuánto</span>', 'te paga'])}
  </section>
  <section id="s3" class="clip" data-start="${T(2)}" data-duration="${D(2)}" data-track-index="1">
${tel('s3', 'sem-pago.png', pos(1330), [anillo('s3-a', 40, 1573, 1000, 110, 36, 'verde')])}
${subt('s3', ['La próxima fecha', 'se calcula <span class="oro">sola</span>'])}
  </section>
  <section id="s4" class="clip" data-start="${T(3)}" data-duration="${D(3)}" data-track-index="1">
${tel('s4', 'sem-pago-15dias.png', pos(1040), [anillo('s4-a', 22, 1175, 1036, 240, 36)])}
${subt('s4', ['También <span class="oro">cada 15 días</span>'])}
  </section>
${llamadoHTML('ll', T(4), D(4), {
    logoTop: 250, nombreTop: 500, nombreSize: 84, textoTop: 630, textoSize: 100, botonTop: 960, botonSize: 66, restoTop: 1150,
    restoHtml: `Beta gratuita · hasta 100 clientes<div style="font-weight:600;font-size:42px;margin-top:14px"><div>¿Tus clientes cómo te pagan?</div><div>Cuéntamelo 👇</div></div>`,
    lineas: ['Pruébala **gratis**', 'en la beta'] })}`;

  const inicios = frases.map((_, i) => T(i, i === 4 ? RETRASO_CIERRE : RETRASO));
  let js = `// Escena 1: gancho
tl.fromTo("#s1-emoji", { scale: 0.7, opacity: 0.5 }, { scale: 1, opacity: 1, duration: ${seg(16)}, ease: "back.out(1.4)" }, ${T(0)});
${[0, 1, 2, 3].map((i) => `tl.fromTo("#s1-tit > div:nth-child(${i + 1})", { opacity: 0.4, y: 55 }, { opacity: 1, y: 0, duration: ${seg(12)}, ease: E }, ${T(0, i * 4)});`).join('\n')}
tl.fromTo("#s1", { scale: 1 }, { scale: 1.03, duration: ${D(0)}, ease: "none" }, ${T(0)});
// Capturas: el recorte (zoom 1 hacia un punto) va en el CSS de cada captura; aquí solo entran desde abajo`;
  for (const k of [2, 3, 4]) {
    const i = k - 1;
    js += `\ntl.fromTo("#s${k}-tel", { opacity: 0.3, y: 100 }, { opacity: 1, y: 0, duration: ${seg(14)}, ease: E }, ${T(i)});
tl.fromTo("#s${k}-subt", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: ${seg(12)}, ease: E }, ${T(i, 4)});`;
  }
  // Anillos: entran con rebote suave y laten
  const aro = (id, t) => `tl.fromTo("#${id}", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: ${seg(12)}, ease: E }, ${t});
tl.to("#${id}", { scale: 1.02, duration: 0.35, ease: "sine.inOut", yoyo: true, repeat: 5 }, ${r3(t + 0.45)});`;
  const tB = r3(T(1) + fin[1] * 0.62); // el anillo pasa a «Personalizado» cuando la voz dice «o los días que tú quieras»
  js += `\n${aro('s2-a', T(1, 16))}\ntl.to("#s2-a", { opacity: 0, duration: 0.2 }, ${tB});\n${aro('s2-b', r3(tB + 0.1))}`;
  js += `\n${aro('s3-a', T(2, 22))}\n${aro('s4-a', T(3, 22))}`;
  js += llamadoJS('ll', T(4), 2, D(4) / 1);
  // salida suave de cada escena de captura (no hace falta: el corte ya cambia el contenido)

  writeFileSync(join(base, 'index.html'), pagina({ titulo: 'P06 fecha sola', total, cuerpo, audios: audiosDe(frases, inicios), js }));
  console.log(`${dir}: ${total.toFixed(2)} s · 5 escenas`);
  return total;
}

const quiero = process.argv[2];
if (!quiero || quiero === 'm02')
  tarjeta({
    dir: 'm02', vozId: 'm02-4-datos', nombreArchivo: 'M02 4 datos',
    titular: ['4 datos que', '**siempre** pides', 'a cada cliente'],
    lineas: ['Nombre **completo**', 'Celular con **WhatsApp**', 'Su día de **cobro**', 'Cada cuándo te **paga**'],
    numerar: true, gigante: false, llamado: ['¿Te falta', '**alguno**? 👇'],
  });
if (!quiero || quiero === 't02')
  tarjeta({
    dir: 't02', vozId: 't02-aviso-3-dias', nombreArchivo: 'T02 aviso 3 dias',
    titular: ['**#1**', 'Cobranza en', '15 segundos'],
    lineas: ['Avisa **3 días** antes de que venza', 'Un mensaje corto y **amable**', 'Así tu cliente aparta el **dinero**'],
    numerar: false, gigante: true, llamado: ['¿Tú cuándo', '**avisas**? 👇'],
  });
if (!quiero || quiero === 'p06') p06();
