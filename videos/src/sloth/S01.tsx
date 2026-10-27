import type React from "react";
import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";
import { Background } from "../components/Background";
import { Burbuja, Sfx, VozEn, cargarFrases } from "../semana22/Comun";

import type { VozFrase } from "../voz";

// S01 · «Quién está al día, quién vence y quién debe» — PRUEBA del estilo «video explicativo» (inspirado en Sloth):
//   UN MUNDO (escritorio en 2.5D con transformaciones 3D de CSS) que la cámara recorre SIN CORTES,
//   UN FOCO (lo que se dice tiene color; lo demás queda apagado), texto palabra por palabra arriba,
//   Citlali (foto como sticker, no habla) abajo, UNA PRUEBA (cada número pegado a lo que mide).
// Voz: Valeria (Azure). Clientes inventados. Interactivos: cuenta regresiva «comenta su número» (seg 2,0) y «Escribe YO» (seg ~22).
export type S01Props = { frases?: VozFrase[] };

const FPS = 30;
const ID_VOZ = "s01-estilo-sloth";
export const TOTAL_S01 = 30.0;

export const calcularS01: CalculateMetadataFunction<S01Props> = async () => {
  const frases = await cargarFrases(ID_VOZ);
  return { durationInFrames: Math.round(TOTAL_S01 * FPS), props: { frases } };
};

// ---------- guion: cuándo empieza cada frase y cómo se parte en trozos de texto (** = oro, ~ = se dice pero no se ve) ----------
const FRASES = [
  { s: 0.0, ch: ["¿Cuál de estos cinco **clientes** ya te debe?"] },
  { s: 2.0, ch: ["Tienes **tres** segundos.", "Comenta su **número**."] },
  { s: 5.3, ch: ["En la libreta, todos se ven **igual**."] },
  { s: 8.4, ch: ["Cartera Asesor los **pinta** solos.", "**Verde**, al día.", "**Amarillo**, por vencer.", "**Rojo**, ya te deben."] },
  { s: 16.4, ch: ["Cuatro en **rojo**, sin buscar nada.", "Con un toque en **Recordar**,", "les avisas por **WhatsApp**."] },
  { s: 21.75, ch: ["¿Todavía llevas tu cartera en **libreta**?", "Escribe **YO**."] },
  { s: 25.4, ch: ["Beta **gratuita**", "~en carteraasesor.com", "Escríbeme **CARTERA**"] },
];
const CARAS: string[] = ["c06", "c04", "c06", "c21", "c13", "c04", "c21"];
const REACCION = ["Mmm… 🤔", "¡Piénsalo!", "¡Todos igual!", "¡Mira eso!", "¡Listo!", "¡Dime YO!", "¡Te espero!"];

type Pal = { txt: string; key: boolean; show: boolean; t: number; chunk: number; frase: number };
const construirPalabras = (frases: VozFrase[]): Pal[] => {
  const res: Pal[] = [];
  FRASES.forEach((fr, i) => {
    const toks: { txt: string; key: boolean; show: boolean; chunk: number; w: number }[] = [];
    fr.ch.forEach((c, ci) =>
      c.split(" ").forEach((raw) => {
        const show = !raw.startsWith("~");
        const txt = raw.replace(/\*\*/g, "").replace(/^~/, "");
        toks.push({ txt, key: raw.includes("**"), show, chunk: ci, w: txt.length + 2 + (txt.includes(".com") ? 7 : 0) + (/[,.?]$/.test(txt) ? 3 : 0) });
      }),
    );
    const W = toks.reduce((a, b) => a + b.w, 0);
    const D = (frases[i]?.seg ?? 3) * 0.96;
    let acc = 0;
    toks.forEach((k) => {
      res.push({ txt: k.txt, key: k.key, show: k.show, chunk: k.chunk, frase: i, t: fr.s + (acc / W) * D });
      acc += k.w;
    });
  });
  return res;
};
const inicioTrozo = (pal: Pal[], frase: number, chunk: number) => pal.find((p) => p.frase === frase && p.chunk === chunk)!.t;
const tiempoPalabra = (pal: Pal[], frase: number, txt: string) => pal.find((p) => p.frase === frase && p.txt.startsWith(txt))!.t;

// ---------- el mundo: medidas (px de mundo; el celular se dibuja a 520 px de ancho = la captura de 1080 × K) ----------
const K = 520 / 1080;
const LIB = { x: -700, y: 40 }; // centro de la libreta
const TEL = { x: 700, y: 0 }; // centro del celular
const aMundo = (sx: number, sy: number) => ({ x: TEL.x - 260 + sx * K, y: TEL.y - 462 + sy * K });
const TILES = {
  verde: { x: 555, y: 295, w: 485, h: 202, c: C.verde },
  amb: { x: 40, y: 523, w: 487, h: 199, c: C.ambar },
  rojo: { x: 555, y: 523, w: 485, h: 199, c: C.rojo },
};
const centroTile = (k: keyof typeof TILES) => aMundo(TILES[k].x + TILES[k].w / 2, TILES[k].y + TILES[k].h / 2);

// ---------- cámara: pasa por puntos clave con curvas suaves (sin cortes) ----------
type KF = { t: number; cx: number; cy: number; s: number; rx: number; rz: number; pass?: boolean };
const hermite = (v0: number, v1: number, m0: number, m1: number, u: number, dt: number) => {
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * dt * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * dt * m1;
};
const camaraEn = (kf: KF[], t: number): KF => {
  const n = kf.length;
  if (t <= kf[0].t) return kf[0];
  if (t >= kf[n - 1].t) return kf[n - 1];
  let i = 0;
  while (t > kf[i + 1].t) i++;
  const a = kf[i], b = kf[i + 1], dt = b.t - a.t, u = (t - a.t) / dt;
  const campos = ["cx", "cy", "s", "rx", "rz"] as const;
  const out: Record<string, number> = { t };
  for (const c of campos) {
    const val = (k: KF) => (c === "s" ? Math.log(k.s) : k[c]);
    const tan = (j: number) => {
      const p = kf[j];
      if (!p.pass || j === 0 || j === n - 1) return 0;
      return (val(kf[j + 1]) - val(kf[j - 1])) / (kf[j + 1].t - kf[j - 1].t);
    };
    const r = hermite(val(a), val(b), tan(i), tan(i + 1), u, dt);
    out[c] = c === "s" ? Math.exp(r) : r;
  }
  return out as unknown as KF;
};

// ---------- piezas del mundo ----------
const Hoja: React.FC<{ x: number; y: number; w: number; h: number; rot: number; fondo: string; children: React.ReactNode }> = ({ x, y, w, h, rot, fondo, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, rotate: `${rot}deg`, background: fondo, borderRadius: 10, boxShadow: "0 18px 34px rgba(3,12,40,0.5)", padding: 18, fontFamily: textos, fontWeight: 800, fontSize: 40, color: "#1E293B", lineHeight: 1.1 }}>{children}</div>
);

const NOMBRES = [
  { n: "Doña Rosa", m: "$850", extra: "¿jueves?" },
  { n: "Don Luis", m: "$1,200", extra: "pagó ✓?" },
  { n: "Karen M.", m: "$640", extra: "recibo" },
  { n: "Toño R.", m: "$900", extra: "…" },
  { n: "Mari G.", m: "$1,050", extra: "llamar" },
];
const Libreta: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const igual = Math.min(1, Math.max(0, (t - 5.4) / 1.6));
  return (
    <>
      {/* hojas sueltas y desorden (todo en tinta azul: nada delata quién debe) */}
      <Hoja x={LIB.x - 480} y={LIB.y - 250} w={250} h={190} rot={-9} fondo="#FFE98A">cobrar el jueves…</Hoja>
      <Hoja x={LIB.x + 320} y={LIB.y - 470} w={290} h={170} rot={7} fondo="#FFC9DC">¿Karen ya pagó?</Hoja>
      <Hoja x={LIB.x - 470} y={LIB.y + 330} w={230} h={150} rot={6} fondo="#F5F8FF">recibo?? ¿cuál mes?</Hoja>
      <div style={{ position: "absolute", left: LIB.x + 250, top: LIB.y + 300, width: 190, height: 190, borderRadius: 999, border: "16px solid rgba(120,70,30,0.35)" }} />
      <div style={{ position: "absolute", left: LIB.x + 240, top: LIB.y + 470, width: 340, height: 24, borderRadius: 12, background: "linear-gradient(90deg,#1D4ED8,#0B2A6F)", rotate: "-24deg", boxShadow: "0 12px 20px rgba(3,12,40,0.5)" }} />
      {/* la libreta */}
      <div style={{ position: "absolute", left: LIB.x - 360, top: LIB.y - 430, width: 720, height: 860, rotate: "-3deg", borderRadius: 22, background: "#FFF8E7", boxShadow: "0 40px 70px rgba(3,12,40,0.55)", overflow: "hidden" }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (<div key={i} style={{ position: "absolute", left: 0, right: 0, top: 150 + i * 100, height: 3, background: "#BFD2EE" }} />))}
        <div style={{ position: "absolute", left: 96, top: 0, bottom: 0, width: 4, background: "#E8A0A0" }} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (<div key={i} style={{ position: "absolute", left: 24, top: 36 + i * 94, width: 30, height: 30, borderRadius: 999, background: "#9AA9C4" }} />))}
        <div style={{ position: "absolute", left: 120, top: 36, fontFamily: titulos, fontWeight: 800, fontSize: 70, letterSpacing: -1.5, color: "#1E3A8A" }}>Mis clientes</div>
        {NOMBRES.map((r, i) => {
          const pulso = igual > 0 ? 1 + 0.035 * Math.max(0, Math.sin(frame / 5 - i * 0.9)) : 1;
          return (
            <div key={r.n} style={{ position: "absolute", left: 112, right: 20, top: 150 + i * 120 - 8, height: 100, display: "flex", alignItems: "center", gap: 20, scale: pulso, transformOrigin: "0 50%" }}>
              <div style={{ width: 72, height: 72, borderRadius: 999, background: "#1E3A8A", color: "#fff", fontFamily: titulos, fontWeight: 800, fontSize: 50, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 4, flex: "none" }}>{i + 1}</div>
              <div style={{ fontFamily: textos, fontWeight: 600, fontSize: 48, color: "#1E293B", flex: 1, whiteSpace: "nowrap" }}>{r.n}</div>
              <div style={{ fontFamily: textos, fontWeight: 600, fontSize: 34, color: "#475569", textAlign: "right", lineHeight: 1.05 }}>
                <div>{r.m}</div>
                <div style={{ fontSize: 26, rotate: `${(i % 2 ? 3 : -3)}deg` }}>{r.extra}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Ripple: React.FC<{ t: number; t0: number; x: number; y: number }> = ({ t, t0, x, y }) => {
  const k = (t - t0) / 0.5;
  if (k < 0 || k > 1) return null;
  return <div style={{ position: "absolute", left: x * K - 60, top: y * K - 60, width: 120, height: 120, borderRadius: 999, background: "rgba(255,255,255,0.8)", opacity: 1 - k, scale: 0.3 + k * 1.1 }} />;
};

type Cues = { verde: number; amb: number; rojo: number; tapRojo: number; listaRoja: number; recordar: number; whats: number };

const Telefono: React.FC<{ t: number; cue: Cues }> = ({ t, cue }) => {
  // pantalla: inicio (con los cuatro cuadros) → al tocar «Morosos» aparece la lista de morosos
  const lista = Math.min(1, Math.max(0, (t - cue.listaRoja) / 0.35));
  const orden: (keyof typeof TILES)[] = ["verde", "amb", "rojo"];
  const veces = [cue.verde, cue.amb, cue.rojo];
  let idx = -1;
  veces.forEach((v, i) => { if (t >= v - 0.05) idx = i; });
  const dest = idx >= 0 ? TILES[orden[idx]] : TILES.verde;
  const prev = idx > 0 ? TILES[orden[idx - 1]] : dest;
  const m = idx > 0 ? Math.min(1, Math.max(0, (t - (veces[idx] - 0.05)) / 0.35)) : 1;
  const mm = m * m * (3 - 2 * m);
  const rect = { x: prev.x + (dest.x - prev.x) * mm, y: prev.y + (dest.y - prev.y) * mm, w: prev.w + (dest.w - prev.w) * mm, h: prev.h + (dest.h - prev.h) * mm };
  const color = dest.c;
  const velo = idx >= 0 ? Math.min(1, (t - (cue.verde - 0.05)) / 0.3) * (1 - lista) : 0;
  const pulsoBoton = t > cue.recordar && t < cue.recordar + 0.3 ? 0.94 : 1;
  return (
    <div style={{ position: "absolute", left: TEL.x - 280, top: TEL.y - 500, width: 560, height: 1000, borderRadius: 80, background: "#0B1220", boxShadow: "0 50px 90px rgba(3,12,40,0.6), inset 0 0 0 6px #2B3A57" }}>
      <div style={{ position: "absolute", left: 20, top: 38, width: 520, height: 924, borderRadius: 56, overflow: "hidden", background: "#F3F4F6" }}>
        <Img src={staticFile("capturas/sem-inicio.png")} style={{ position: "absolute", left: 0, top: 0, width: 520, height: 924, opacity: 1 - lista }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 520, height: 924, opacity: lista, translate: `0px ${(1 - lista) * 60}px` }}>
          <Img src={staticFile("capturas/sem-lista-rojo.png")} style={{ position: "absolute", left: 0, top: 0, width: 520, height: 924 }} />
          <div style={{ position: "absolute", left: 88 * K, top: 495 * K, width: 452 * K, height: 100 * K, borderRadius: 18, scale: pulsoBoton, boxShadow: t > cue.recordar - 0.6 && t < cue.recordar ? `0 0 0 6px ${C.oro}` : undefined }} />
        </div>
        {/* foco dentro del celular: se apaga todo menos el cuadro que se nombra */}
        <div style={{ position: "absolute", left: rect.x * K, top: rect.y * K, width: rect.w * K, height: rect.h * K, borderRadius: 18, boxShadow: `0 0 0 3000px rgba(11,42,111,${0.78 * velo}), 0 0 0 ${7 * velo}px ${color}`, opacity: velo > 0 ? 1 : 0 }} />
        <Ripple t={t} t0={cue.tapRojo} x={TILES.rojo.x + 240} y={TILES.rojo.y + 100} />
        <Ripple t={t} t0={cue.recordar} x={314} y={545} />
      </div>
    </div>
  );
};

// ---------- texto palabra por palabra (arriba) ----------
const Palabras: React.FC<{ t: number; pal: Pal[] }> = ({ t, pal }) => {
  let fr = 0;
  FRASES.forEach((f, i) => { if (t >= f.s) fr = i; });
  const delFr = pal.filter((p) => p.frase === fr);
  let ch = 0;
  delFr.forEach((p) => { if (t >= p.t - 0.04) ch = Math.max(ch, p.chunk); });
  const palabras = delFr.filter((p) => p.chunk === ch && p.show);
  if (palabras.length === 0) return null;
  const largo = palabras.some((p) => p.txt.includes(".com"));
  const tam = largo ? 92 : palabras.length > 6 ? 98 : 106;
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top: 190, minHeight: 330, display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "flex-start", columnGap: 22, rowGap: 0, fontFamily: titulos, fontWeight: 800, fontSize: tam, lineHeight: 1.04, letterSpacing: -3, textShadow: "0 8px 30px rgba(5,20,60,0.55)" }}>
      {palabras.map((p, i) => {
        const hablada = fr === 0 ? 1 : ease(t * FPS, p.t * FPS - 1, p.t * FPS + 6, Easing.out(Easing.back(1.8)));
        const op = fr === 0 ? (t >= p.t - 0.05 ? 1 : 0.62) : hablada;
        const punto = p.txt.match(/^(Verde|Amarillo|Rojo)/);
        const colorPunto = punto ? (punto[1] === "Verde" ? C.verde : punto[1] === "Amarillo" ? C.ambar : C.rojo) : null;
        return (
          <span key={i} style={{ color: p.key ? C.oro : C.blanco, opacity: op, translate: fr === 0 ? undefined : `0px ${(1 - hablada) * 26}px`, scale: fr === 0 ? undefined : 0.85 + hablada * 0.15, display: "inline-block" }}>
            {colorPunto ? <span style={{ display: "inline-block", width: tam * 0.4, height: tam * 0.4, borderRadius: 999, background: colorPunto, marginRight: 14, boxShadow: "0 0 0 5px rgba(255,255,255,0.85)" }} /> : null}
            {p.txt}
          </span>
        );
      })}
    </div>
  );
};

// ---------- Citlali como sticker (foto en círculo con borde blanco; no habla) ----------
const Sticker: React.FC<{ frameInicio: number; cara: string; frame: number }> = ({ cara, frameInicio, frame }) => {
  const p = ease(frame, frameInicio, frameInicio + 10, Easing.out(Easing.back(2.2)));
  const bote = 1 + 0.12 * Math.max(0, 1 - Math.abs(frame - frameInicio - 3) / 9) * (frame >= frameInicio ? 1 : 0);
  const rot = -5 + Math.sin(frame / 18) * 2.2;
  return (
    <div style={{ position: "absolute", left: 70, top: 1215, width: 250, height: 250, rotate: `${rot}deg`, scale: (0.8 + p * 0.2) * bote, filter: "drop-shadow(0 18px 22px rgba(3,12,40,0.55))" }}>
      <div style={{ width: 250, height: 250, borderRadius: 999, background: "#fff", padding: 12 }}>
        <div style={{ width: 226, height: 226, borderRadius: 999, overflow: "hidden", background: "#1e293b" }}>
          <Img src={staticFile(`presentadora/cara/${cara}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%", scale: 1.1 }} />
        </div>
      </div>
    </div>
  );
};

// ---------- cuenta regresiva (interactivo 1) ----------
const Anillo: React.FC<{ t: number; t0: number; top: number; left: number }> = ({ t, t0, top, left }) => {
  const k = t - t0;
  const num = k < 1 ? 3 : k < 2 ? 2 : 1;
  const dentro = k % 1;
  const pulso = 1 + 0.12 * Math.max(0, 1 - dentro * 4);
  const color = num === 1 ? C.rojo : num === 2 ? C.ambar : C.oro;
  const R = 82, circ = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", left, top, width: 200, height: 200, scale: pulso }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={R} fill="rgba(11,42,111,0.85)" stroke="rgba(255,255,255,0.25)" strokeWidth="14" />
        <circle cx="100" cy="100" r={R} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * Math.min(1, k / 3)} transform="rotate(-90 100 100)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: titulos, fontWeight: 800, fontSize: 120, color, paddingBottom: 8 }}>{num}</div>
    </div>
  );
};

export const S01: React.FC<S01Props> = ({ frases }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = frases!;
  const pal = construirPalabras(f);

  // marcas de tiempo (salen de lo que dice la voz)
  const cue: Cues = {
    verde: inicioTrozo(pal, 3, 1),
    amb: inicioTrozo(pal, 3, 2),
    rojo: inicioTrozo(pal, 3, 3),
    tapRojo: FRASES[4].s + 0.5,
    listaRoja: FRASES[4].s + 0.78,
    recordar: tiempoPalabra(pal, 4, "Recordar") + 0.15,
    whats: tiempoPalabra(pal, 4, "WhatsApp") - 0.05,
  };
  const tarjeta = aMundo(540, 540);
  const kfs: KF[] = [
    { t: 0, cx: LIB.x, cy: LIB.y, s: 0.86, rx: 34, rz: -5 },
    { t: 2.0, cx: LIB.x + 10, cy: LIB.y - 10, s: 0.9, rx: 30, rz: -3 },
    { t: 5.2, cx: LIB.x + 10, cy: LIB.y - 10, s: 0.94, rx: 30, rz: -3 },
    { t: 7.3, cx: -60, cy: -80, s: 0.5, rx: 46, rz: 5, pass: true },
    { t: 9.0, cx: TEL.x, cy: TEL.y, s: 0.82, rx: 10, rz: 0 },
    { t: cue.verde - 0.1, cx: TEL.x, cy: TEL.y, s: 0.9, rx: 8, rz: 0 },
    { t: cue.verde + 0.55, cx: centroTile("verde").x, cy: centroTile("verde").y, s: 2.7, rx: 4, rz: 0 },
    { t: cue.amb + 0.5, cx: centroTile("amb").x, cy: centroTile("amb").y, s: 2.7, rx: 4, rz: 0 },
    { t: cue.rojo + 0.5, cx: centroTile("rojo").x, cy: centroTile("rojo").y, s: 2.7, rx: 4, rz: 0 },
    { t: cue.tapRojo + 0.3, cx: centroTile("rojo").x, cy: centroTile("rojo").y, s: 2.7, rx: 4, rz: 0 },
    { t: cue.recordar - 0.35, cx: tarjeta.x - 10, cy: tarjeta.y - 20, s: 1.9, rx: 6, rz: 0 },
    { t: 21.2, cx: tarjeta.x - 10, cy: tarjeta.y - 20, s: 1.95, rx: 6, rz: 0 },
    { t: 23.0, cx: 0, cy: 20, s: 0.46, rx: 40, rz: -4 },
    { t: 25.2, cx: 0, cy: 20, s: 0.47, rx: 40, rz: -4 },
    { t: 27.0, cx: 0, cy: 0, s: 0.4, rx: 20, rz: 0 },
    { t: 30.0, cx: 0, cy: 0, s: 0.4, rx: 20, rz: 0 },
  ];
  const cam = camaraEn(kfs, t);
  const deriva = { x: Math.sin(t * 0.9) * 8, y: Math.cos(t * 0.7) * 6, r: Math.sin(t * 0.6) * 0.35 };

  // foco: libreta y celular (1 = a color y brillante, 0 = apagado de fondo)
  const fLib = t < 7.4 ? 1 : t < 21.8 ? 1 - 0.9 * ease(t * FPS, 7.4 * FPS, 8.6 * FPS) : t < 25.4 ? 0.1 + 0.9 * ease(t * FPS, 21.8 * FPS, 22.8 * FPS) : 0.12;
  const fTel = t < 7.4 ? 0.12 : t < 21.8 ? 0.12 + 0.88 * ease(t * FPS, 7.4 * FPS, 8.8 * FPS) : t < 25.4 ? 1 - 0.6 * ease(t * FPS, 21.8 * FPS, 22.8 * FPS) : 0.12;
  const apagar = (v: number) => ({ filter: `saturate(${0.1 + 0.9 * v}) brightness(${0.42 + 0.58 * v})`, opacity: 0.55 + 0.45 * v });

  // frase actual
  let fr = 0;
  FRASES.forEach((x, i) => { if (t >= x.s) fr = i; });

  // etiquetas con su dato («una prueba»): número pegado a lo que mide
  const etiqueta = (tx: string, n: number, color: string, desde: number, hasta: number) => {
    if (t < desde || t >= hasta) return null;
    const p = ease(t * FPS, desde * FPS, desde * FPS + 9, Easing.out(Easing.back(1.5)));
    const cuenta = Math.round(ease(t * FPS, desde * FPS, desde * FPS + 14, Easing.out(Easing.cubic)) * n);
    return (
      <div key={tx} style={{ position: "absolute", left: 140, width: 800, top: 1105, display: "flex", justifyContent: "center", opacity: p, scale: 0.85 + p * 0.15 }}>
        <div style={{ background: C.blanco, borderRadius: 999, padding: "12px 44px 18px 30px", display: "flex", alignItems: "center", gap: 22, boxShadow: "0 22px 44px rgba(3,12,40,0.5)", border: `8px solid ${color}` }}>
          <div style={{ width: 58, height: 58, borderRadius: 999, background: color }} />
          <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: 96, letterSpacing: -3, color: C.tinta, lineHeight: 1 }}>{cuenta}</div>
          <div style={{ fontFamily: textos, fontWeight: 800, fontSize: 52, color: C.tinta, whiteSpace: "nowrap" }}>{tx}</div>
        </div>
      </div>
    );
  };

  // ---------- efectos de sonido (pixabay primero) ----------
  const s: React.ReactNode[] = [];
  const add = (src: string, en: number, vol = 0.45, dur = 1.2) => s.push(<Sfx key={`${src}${en}`} src={src} en={en} vol={vol} dur={dur} />);
  add("pixabay/pop-a.mp3", 0, 0.55, 0.7);
  add("pixabay/whoosh-a.mp3", 0.03, 0.35, 0.8);
  add("kenney/question_001.ogg", 0.95, 0.45, 1);
  add("pixabay/subida-tension.mp3", 2.0, 0.22, 3.2);
  for (let n = 0; n < 3; n++) { add("kenney/tick_001.ogg", 2.0 + n, 0.9, 0.3); add("pixabay/clic-boton.mp3", 2.0 + n, 0.5, 0.3); }
  add("pixabay/pop-burbuja.mp3", 3.25, 0.4, 1);
  add("pixabay/disco-rayado.mp3", 5.15, 0.3, 1.2);
  add("pixabay/pop-b.mp3", 5.4, 0.4, 0.8);
  add("pixabay/whoosh-b.mp3", 7.25, 0.45, 1.2);
  add("pixabay/pop-a.mp3", 8.95, 0.45, 0.7);
  add("kenney/confirmation_001.ogg", cue.verde, 0.5, 1);
  add("pixabay/pop-a.mp3", cue.verde + 0.02, 0.4, 0.6);
  add("kenney/select_001.ogg", cue.amb, 0.55, 0.8);
  add("pixabay/pop-b.mp3", cue.amb + 0.02, 0.4, 0.8);
  add("kenney/impactPunch_medium_000.ogg", cue.rojo, 0.55, 0.8);
  add("pixabay/pop-burbuja.mp3", cue.rojo + 0.02, 0.4, 1);
  add("pixabay/pop-a.mp3", FRASES[4].s, 0.4, 0.6);
  add("pixabay/clic-boton.mp3", cue.tapRojo, 0.55, 0.4);
  add("kenney/switch_002.ogg", cue.tapRojo + 0.05, 0.5, 0.5);
  add("pixabay/whoosh-a.mp3", cue.listaRoja + 0.2, 0.32, 0.8);
  add("pixabay/clic-boton.mp3", cue.recordar, 0.6, 0.4);
  add("pixabay/mensaje-chat.mp3", cue.recordar + 0.3, 0.5, 1.2);
  add("pixabay/notificacion-a.mp3", cue.whats, 0.45, 1.3);
  add("pixabay/ding-exito.mp3", cue.whats + 0.6, 0.4, 1.4);
  add("pixabay/whoosh-b.mp3", 21.65, 0.4, 1);
  add("pixabay/pop-burbuja.mp3", 21.9, 0.45, 1);
  add("pixabay/pop-a.mp3", tiempoPalabra(pal, 5, "YO"), 0.5, 0.7);
  add("kenney/question_001.ogg", 22.9, 0.4, 1);
  add("pixabay/notificacion-b.mp3", 24.0, 0.35, 1.2);
  add("pixabay/whoosh-b.mp3", 25.35, 0.4, 1);
  add("pixabay/tada.mp3", 25.5, 0.4, 1.4);
  add("pixabay/pop-b.mp3", inicioTrozo(pal, 6, 1), 0.4, 0.8);
  add("pixabay/pop-burbuja.mp3", inicioTrozo(pal, 6, 2), 0.45, 1);
  // reacción de Citlali en cada frase
  FRASES.forEach((x, i) => { if (i > 0 && i !== 2 && i !== 3) add(i % 2 ? "kenney/drop_002.ogg" : "kenney/pluck_001.ogg", x.s + 0.1, 0.4, 0.6); });

  const voces = f.map((fx, i) => <VozEn key={i} frase={fx} en={FRASES[i].s} />);

  // cierre (sobre el mismo mundo, que se apaga)
  const cierre = ease(t * FPS, 25.4 * FPS, 25.4 * FPS + 14);
  const caja = { position: "absolute" as const, left: 140, width: 800, display: "flex", justifyContent: "center" as const };
  const pop = (a: number, b: number) => ease(t * FPS, a * FPS, b * FPS, Easing.out(Easing.back(1.4)));

  return (
    <AbsoluteFill>
      <Background />
      {/* EL MUNDO: un escritorio en 2.5D; la cámara es la transformación de esta capa */}
      <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "540px 930px", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: `translate(540px, 930px) rotateX(${cam.rx}deg) rotateZ(${cam.rz + deriva.r}deg) scale(${cam.s}) translate(${-(cam.cx + deriva.x)}px, ${-(cam.cy + deriva.y)}px)` }}>
          <div style={{ position: "absolute", left: -4000, top: -3000, width: 8000, height: 6000, borderRadius: 60, background: "radial-gradient(1400px 1000px at 50% 40%, rgba(26,163,245,0.35), rgba(26,163,245,0) 70%), repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 3px, transparent 3px 120px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 3px, transparent 3px 120px), linear-gradient(170deg, #0F3A9C, #123FB0)" }} />
          <div style={{ position: "absolute", left: 0, top: 0, ...apagar(fLib) }}>
            <Libreta t={t} frame={frame} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, ...apagar(fTel) }}>
            <Telefono t={t} cue={cue} />
          </div>
        </div>
      </AbsoluteFill>

      {/* sombreado suave de los bordes para dar profundidad */}
      <AbsoluteFill style={{ background: "radial-gradient(1100px 1500px at 50% 45%, rgba(11,42,111,0) 55%, rgba(5,16,50,0.55) 100%)" }} />
      <AbsoluteFill style={{ background: "rgba(5,16,50,0.55)", opacity: cierre }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 620, background: "linear-gradient(180deg, rgba(5,16,50,0.78), rgba(5,16,50,0))" }} />

      {/* interactivo 1: cuenta regresiva */}
      {t >= 2.0 && t < 5.15 ? <Anillo t={t} t0={2.0} top={1235} left={440} /> : null}
      {/* etiquetas con su prueba */}
      {etiqueta("al día", 10, C.verde, cue.verde + 0.35, cue.amb)}
      {etiqueta("por vencer", 5, C.ambar, cue.amb + 0.35, cue.rojo)}
      {etiqueta("morosos", 4, C.rojo, cue.rojo + 0.35, cue.tapRojo + 0.3)}
      {/* el mensaje por WhatsApp sale del botón «Recordar» */}
      {t >= cue.recordar + 0.25 && t < 21.7 ? (() => {
        const p = pop(cue.recordar + 0.25, cue.recordar + 0.5);
        return (
          <div style={{ ...caja, top: 1070, opacity: p, scale: 0.85 + p * 0.15, translate: `0px ${(1 - p) * 40}px` }}>
            <div style={{ background: C.blanco, borderRadius: 40, boxShadow: "0 24px 48px rgba(3,12,40,0.5)", overflow: "hidden", width: 780, border: `6px solid ${C.verde}` }}>
              <div style={{ background: C.verde, color: C.blanco, fontFamily: textos, fontWeight: 800, fontSize: 40, padding: "8px 30px 12px" }}>WhatsApp · José Luis</div>
              <div style={{ padding: "18px 30px 8px", fontFamily: textos, fontWeight: 600, fontSize: 44, color: C.tinta, lineHeight: 1.2 }}>Hola José Luis, te recuerdo tu pago pendiente. ¡Gracias! 🙏</div>
              <div style={{ padding: "0 30px 14px", textAlign: "right", fontFamily: textos, fontWeight: 800, fontSize: 34, color: C.verde }}>✓✓ Enviado</div>
            </div>
          </div>
        );
      })() : null}
      {/* interactivo 2: Escribe YO */}
      {t >= 22.3 && t < 25.4 ? (() => {
        const p = pop(22.3, 22.6);
        const bote = Math.sin((t - 22.3) * 9) * 8;
        return (
          <div style={{ ...caja, top: 1085, opacity: p, scale: 0.8 + p * 0.2 }}>
            <div style={{ background: C.verde, color: C.blanco, borderRadius: 999, fontFamily: titulos, fontWeight: 800, fontSize: 92, letterSpacing: -2, padding: "8px 56px 20px", border: "6px solid rgba(255,255,255,0.4)", boxShadow: "0 22px 44px rgba(3,12,40,0.5)", whiteSpace: "nowrap", translate: `0px ${bote}px` }}>Escribe YO 👇</div>
          </div>
        );
      })() : null}

      {/* cierre */}
      {t >= 25.4 ? (
        <AbsoluteFill style={{ opacity: cierre }}>
          <div style={{ ...caja, top: 600, scale: 0.7 + pop(25.5, 25.9) * 0.3 }}>
            <Img src={staticFile("logo.png")} style={{ width: 210, height: 210, borderRadius: 50, boxShadow: "0 28px 56px rgba(3,12,40,0.5)" }} />
          </div>
          <div style={{ ...caja, top: 835, fontFamily: titulos, fontWeight: 800, fontSize: 80, letterSpacing: -2, color: C.blanco, opacity: pop(25.7, 26.1) }}>Cartera Asesor</div>
          <div style={{ ...caja, top: 975, opacity: pop(26.6, 27.0), scale: 0.85 + pop(26.6, 27.0) * 0.15 }}>
            <div style={{ background: C.verde, color: C.blanco, fontFamily: titulos, fontWeight: 800, fontSize: 64, letterSpacing: -1, padding: "24px 44px 28px", borderRadius: 999, border: "6px solid rgba(255,255,255,0.35)", boxShadow: "0 22px 44px rgba(3,12,40,0.45)" }}>carteraasesor.com</div>
          </div>
          <div style={{ ...caja, top: 1120, fontFamily: textos, fontWeight: 800, fontSize: 48, color: C.secundario, opacity: pop(27.2, 27.6) }}>Beta gratuita · hasta 100 clientes</div>
        </AbsoluteFill>
      ) : null}

      <Palabras t={t} pal={pal} />
      <Sticker frameInicio={Math.round(FRASES[fr].s * fps)} cara={CARAS[fr]} frame={frame} />
      {t >= 2.0 && t < 5.15 ? null : <Burbuja key={`b${fr}`} left={350} top={1300} width={470} desde={Math.round(FRASES[fr].s * fps) + 4} size={52} flecha="ninguna">{REACCION[fr]}</Burbuja>}
      {s}
      {voces}
    </AbsoluteFill>
  );
};
