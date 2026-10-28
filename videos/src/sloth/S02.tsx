import type React from "react";
import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";
import { Background } from "../components/Background";
import { Burbuja, Sfx, VozEn, cargarFrases } from "../semana22/Comun";

import type { VozFrase } from "../voz";

// S02 · «Pasar tus clientes del Excel a la app» — mismo estilo «Sloth» que S01 (un mundo 2.5D, cámara sin cortes,
// un foco, texto palabra por palabra, Citlali sticker) pero con GANCHO DISRUPTIVO: 0–1,5 s clip real de una caída
// (Pexels, licencia libre; ver public/clips/CREDITOS.md) con corte seco y golpe de sonido, y luego el mundo.
// Interactivos: «cuenta las versiones FINAL» (seg 5,4) · «comenta tu número» con cuenta regresiva (seg 12,4, mitad) · «Escribe YO» (seg 23,3).
export type S02Props = { frases?: VozFrase[] };

const FPS = 30;
const ID_VOZ = "s02-excel-a-la-app";
export const TOTAL_S02 = 29.0;
const T_CLIP = 1.5; // el clip dura hasta aquí; corte seco al mundo

export const calcularS02: CalculateMetadataFunction<S02Props> = async () => {
  const frases = await cargarFrases(ID_VOZ);
  return { durationInFrames: Math.round(TOTAL_S02 * FPS), props: { frases } };
};

// ---------- guion (** = oro, ~ = se dice pero no se ve) ----------
const FRASES = [
  { s: 1.5, ch: ["Así terminé yo pasando **80** clientes **a mano**."] },
  { s: 5.1, ch: ["Pausa y cuenta:", "¿cuántas versiones **FINAL** tiene tu Excel?"] },
  { s: 8.2, ch: ["En Cartera Asesor", "lo **cargas** tú,", "y reconoce tus **columnas**."] },
  { s: 12.4, ch: ["¿Cuántos **clientes**", "tienes en tu Excel?", "Comenta tu **número**."] },
  { s: 15.6, ch: ["Toca **Traer**", "mis clientes de **Excel**", "y elige tu **archivo**."] },
  { s: 18.9, ch: ["**Revisas**, confirmas,", "y listo: cada uno con su **color**."] },
  { s: 22.7, ch: ["¿Tu **Excel** también es un caos?", "Escribe **YO**."] },
  { s: 25.8, ch: ["Beta **gratuita**", "~en carteraasesor.com"] },
];
const CARAS: string[] = ["c06", "c04", "c21", "c06", "c13", "c21", "c04", "c21"];
const REACCION = ["¡Ouch! 😬", "Mmm… 🤔", "¡Fácil!", "¡Dime!", "¡Mira!", "¡Sin lío!", "¡Dime YO!", "¡Te espero!"];

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

// ---------- el mundo ----------
const K = 520 / 1080;
const LIB = { x: -700, y: 40 }; // centro del Excel
const TEL = { x: 700, y: 0 }; // centro del celular
const aMundo = (sx: number, sy: number) => ({ x: TEL.x - 260 + sx * K, y: TEL.y - 462 + sy * K });
const TILES = {
  verde: { x: 555, y: 295, w: 485, h: 202, c: C.verde },
  amb: { x: 40, y: 523, w: 487, h: 199, c: C.ambar },
  rojo: { x: 555, y: 523, w: 485, h: 199, c: C.rojo },
};
const centroTile = (k: keyof typeof TILES) => aMundo(TILES[k].x + TILES[k].w / 2, TILES[k].y + TILES[k].h / 2);

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

// ---------- piezas del mundo: el Excel desordenado ----------
const Hoja: React.FC<{ x: number; y: number; w: number; h: number; rot: number; fondo: string; pulso?: number; children: React.ReactNode }> = ({ x, y, w, h, rot, fondo, pulso = 1, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, rotate: `${rot}deg`, scale: pulso, background: fondo, borderRadius: 10, boxShadow: "0 18px 34px rgba(3,12,40,0.5)", padding: 16, fontFamily: textos, fontWeight: 800, fontSize: 38, color: "#1E293B", lineHeight: 1.1, display: "flex", alignItems: "center" }}>{children}</div>
);

const FILAS: { c: string[]; mal?: number[]; rojo?: boolean }[] = [
  { c: ["rosa hdz", "5500002101", "$850", "¿jueves?"], mal: [0] },
  { c: ["ROSA HERNANDEZ", "55 0000 2101", "850", "REPETIDO"], mal: [0, 3] },
  { c: ["Don Luis", "(55)0000-2102", "1200", "pagó ✓?"] },
  { c: ["Karen M", "???", "$640", "sin cel"], mal: [1] },
  { c: ["Toño R.", "5500002104", "900", "—"], rojo: true },
  { c: ["Mari G", "55 0000 2105", "1,050", "llamar"] },
  { c: ["mari g.", "550000 2105", "1050", "¿misma?"], mal: [0, 3] },
  { c: ["Ernesto L.", "55-0000-2106", "", "??"], mal: [2] },
];
const COLS = [300, 210, 120, 130];
const Excel: React.FC<{ t: number }> = ({ t }) => {
  const W = 760, H = 940;
  return (
    <div style={{ position: "absolute", left: LIB.x - W / 2, top: LIB.y - H / 2, width: W, height: H, rotate: "-3deg", borderRadius: 22, background: "#F8FAFC", boxShadow: "0 40px 70px rgba(3,12,40,0.55)", overflow: "hidden", fontFamily: textos }}>
      <div style={{ height: 84, background: "#334155", color: "#fff", display: "flex", alignItems: "center", padding: "0 24px", gap: 14, fontWeight: 800, fontSize: 34 }}>
        <div style={{ width: 20, height: 20, borderRadius: 999, background: "#F87171" }} />
        <div style={{ width: 20, height: 20, borderRadius: 999, background: "#FBBF24" }} />
        <div style={{ width: 20, height: 20, borderRadius: 999, background: "#9CA3AF" }} />
        <div style={{ marginLeft: 10, whiteSpace: "nowrap" }}>Clientes_FINAL_v3.xlsx</div>
      </div>
      <div style={{ display: "flex", height: 56, background: "#E2E8F0", borderBottom: "3px solid #CBD5E1" }}>
        {["Nombre", "Cel", "Pago", "Notas"].map((h, i) => (
          <div key={h} style={{ width: COLS[i], borderRight: "3px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 32, color: "#475569" }}>{h}</div>
        ))}
      </div>
      {FILAS.map((r, ri) => (
        <div key={ri} style={{ display: "flex", height: 92, borderBottom: "3px solid #E2E8F0", background: ri % 2 ? "#F1F5F9" : "#fff" }}>
          {r.c.map((v, ci) => {
            const mal = r.mal?.includes(ci);
            return (
              <div key={ci} style={{ width: COLS[ci], borderRight: "3px solid #E2E8F0", padding: "0 12px", display: "flex", alignItems: "center", fontWeight: 600, fontSize: 36, color: r.rojo ? "#B91C1C" : "#1E293B", background: mal ? "#FFE98A" : undefined, whiteSpace: "nowrap", overflow: "hidden" }}>{v}</div>
            );
          })}
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 62, background: "#E2E8F0", display: "flex", alignItems: "center", gap: 14, padding: "0 20px", fontWeight: 800, fontSize: 28, color: "#475569" }}>
        <div style={{ background: "#fff", padding: "4px 18px", borderRadius: 8 }}>Hoja1</div>
        <div>Hoja1 (2)</div><div>COPIA</div><div>viejo</div>
      </div>
      <div style={{ position: "absolute", right: 10, top: 150, width: 14, height: 120, borderRadius: 8, background: "#94A3B8", translate: `0px ${Math.sin(t * 2) * 6}px` }} />
    </div>
  );
};
const Escritorio: React.FC<{ t: number }> = ({ t }) => {
  const pulso = (i: number) => (t > 5.1 && t < 8.2 ? 1 + 0.05 * Math.max(0, Math.sin(t * 7 - i * 1.3)) : 1);
  return (
    <>
      <Hoja x={LIB.x - 520} y={LIB.y - 330} w={370} h={110} rot={-8} fondo="#E2E8F0" pulso={pulso(0)}>📄 Clientes_FINAL.xlsx</Hoja>
      <Hoja x={LIB.x + 430} y={LIB.y - 540} w={420} h={110} rot={6} fondo="#E2E8F0" pulso={pulso(1)}>📄 Clientes_FINAL2.xlsx</Hoja>
      <Hoja x={LIB.x - 540} y={LIB.y + 380} w={450} h={140} rot={5} fondo="#E2E8F0" pulso={pulso(2)}>📄 Clientes_FINAL_ahora_sí.xlsx</Hoja>
      <Hoja x={LIB.x + 450} y={LIB.y + 520} w={380} h={110} rot={-6} fondo="#E2E8F0" pulso={pulso(3)}>📄 Clientes_NO_USAR.xlsx</Hoja>
      <Hoja x={LIB.x + 470} y={LIB.y - 60} w={250} h={170} rot={7} fondo="#FFE98A">¿cuál es el bueno?</Hoja>
      <Excel t={t} />
    </>
  );
};

const Ripple: React.FC<{ t: number; t0: number; x: number; y: number }> = ({ t, t0, x, y }) => {
  const k = (t - t0) / 0.5;
  if (k < 0 || k > 1) return null;
  return <div style={{ position: "absolute", left: x * K - 60, top: y * K - 60, width: 120, height: 120, borderRadius: 999, background: "rgba(255,255,255,0.8)", opacity: 1 - k, scale: 0.3 + k * 1.1 }} />;
};

// pantallas del celular (capturas reales de la app, clientes inventados)
const T_SHEET1 = 9.0, T_SHEET2 = 17.4, T_SHEET3 = 19.0, T_HOME = 20.7;
const TAP_OPCION = 16.7, TAP_IMPORTAR = 20.3;
const TILE_T = { verde: 21.3, amb: 21.9, rojo: 22.5, fin: 23.3 };

const Pantalla: React.FC<{ src: string; desde: number; t: number; slide?: boolean }> = ({ src, desde, t, slide }) => {
  const p = Math.min(1, Math.max(0, (t - desde) / 0.35));
  if (t < desde) return null;
  const e = 1 - (1 - p) * (1 - p);
  return <Img src={staticFile(`capturas/${src}`)} style={{ position: "absolute", left: 0, top: 0, width: 520, height: 924, opacity: e, translate: slide ? `0px ${(1 - e) * 50}px` : undefined }} />;
};

const Telefono: React.FC<{ t: number }> = ({ t }) => {
  let idx = -1;
  const orden: (keyof typeof TILES)[] = ["verde", "amb", "rojo"];
  const veces = [TILE_T.verde, TILE_T.amb, TILE_T.rojo];
  veces.forEach((v, i) => { if (t >= v - 0.05) idx = i; });
  const dest = idx >= 0 ? TILES[orden[idx]] : TILES.verde;
  const prev = idx > 0 ? TILES[orden[idx - 1]] : dest;
  const m = idx > 0 ? Math.min(1, Math.max(0, (t - (veces[idx] - 0.05)) / 0.35)) : 1;
  const mm = m * m * (3 - 2 * m);
  const rect = { x: prev.x + (dest.x - prev.x) * mm, y: prev.y + (dest.y - prev.y) * mm, w: prev.w + (dest.w - prev.w) * mm, h: prev.h + (dest.h - prev.h) * mm };
  const velo = t >= TILE_T.verde - 0.05 && t < TILE_T.fin ? Math.min(1, (t - (TILE_T.verde - 0.05)) / 0.3) * (1 - Math.min(1, Math.max(0, (t - (TILE_T.fin - 0.3)) / 0.3))) : 0;
  return (
    <div style={{ position: "absolute", left: TEL.x - 280, top: TEL.y - 500, width: 560, height: 1000, borderRadius: 80, background: "#0B1220", boxShadow: "0 50px 90px rgba(3,12,40,0.6), inset 0 0 0 6px #2B3A57" }}>
      <div style={{ position: "absolute", left: 20, top: 38, width: 520, height: 924, borderRadius: 56, overflow: "hidden", background: "#F3F4F6" }}>
        <Pantalla src="importar-1-donde.png" desde={T_SHEET1} t={t} />
        {/* la hoja dice «unos 2 minutos»: aquí se tapa esa línea para no prometer un tiempo exacto */}
        {t >= T_SHEET1 && t < T_SHEET2 + 0.2 ? (
          <div style={{ position: "absolute", left: 30 * K, top: 944 * K, width: 1020 * K, height: 96 * K, background: "#FFFFFF", fontFamily: textos, fontWeight: 400, fontSize: 34 * K, color: "#64748B", display: "flex", alignItems: "center", paddingLeft: 10 * K, opacity: t < T_SHEET1 + 0.35 ? Math.max(0, (t - T_SHEET1) / 0.35) : 1 }}>
            <span><b style={{ color: "#334155" }}>No se borra nada</b> de lo que ya tienes.</span>
          </div>
        ) : null}
        <Pantalla src="importar-2-columnas.png" desde={T_SHEET2} t={t} />
        <Pantalla src="importar-3-revisar.png" desde={T_SHEET3} t={t} />
        <Pantalla src="sem-inicio.png" desde={T_HOME} t={t} />
        <div style={{ position: "absolute", left: rect.x * K, top: rect.y * K, width: rect.w * K, height: rect.h * K, borderRadius: 18, boxShadow: `0 0 0 3000px rgba(11,42,111,${0.78 * velo}), 0 0 0 ${7 * velo}px ${dest.c}`, opacity: velo > 0 ? 1 : 0 }} />
        <Ripple t={t} t0={TAP_OPCION} x={540} y={1190} />
        <Ripple t={t} t0={TAP_IMPORTAR} x={810} y={1833} />
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
        const hablada = ease(t * FPS, p.t * FPS - 1, p.t * FPS + 6, Easing.out(Easing.back(1.8)));
        return (
          <span key={i} style={{ color: p.key ? C.oro : C.blanco, opacity: hablada, translate: `0px ${(1 - hablada) * 26}px`, scale: 0.85 + hablada * 0.15, display: "inline-block" }}>{p.txt}</span>
        );
      })}
    </div>
  );
};

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

export const S02: React.FC<S02Props> = ({ frases }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = frases!;
  const pal = construirPalabras(f);

  const tarjeta = aMundo(540, 640);
  const columnas = aMundo(540, 900);
  const kfs: KF[] = [
    { t: 0, cx: LIB.x, cy: LIB.y, s: 0.86, rx: 34, rz: -5 },
    { t: 1.5, cx: LIB.x, cy: LIB.y, s: 0.86, rx: 34, rz: -5 },
    { t: 5.1, cx: LIB.x + 10, cy: LIB.y - 10, s: 0.9, rx: 30, rz: -3 },
    { t: 7.0, cx: -60, cy: -80, s: 0.5, rx: 46, rz: 5, pass: true },
    { t: 9.0, cx: TEL.x, cy: TEL.y, s: 0.82, rx: 10, rz: 0 },
    { t: 12.2, cx: TEL.x, cy: TEL.y + 30, s: 0.95, rx: 8, rz: 0 },
    { t: 16.2, cx: columnas.x, cy: columnas.y - 30, s: 1.45, rx: 5, rz: 0 },
    { t: 19.3, cx: tarjeta.x, cy: tarjeta.y + 60, s: 1.5, rx: 5, rz: 0 },
    { t: 20.9, cx: TEL.x, cy: TEL.y, s: 0.95, rx: 8, rz: 0 },
    { t: TILE_T.verde + 0.4, cx: centroTile("verde").x, cy: centroTile("verde").y, s: 2.6, rx: 4, rz: 0 },
    { t: TILE_T.amb + 0.4, cx: centroTile("amb").x, cy: centroTile("amb").y, s: 2.6, rx: 4, rz: 0 },
    { t: TILE_T.rojo + 0.4, cx: centroTile("rojo").x, cy: centroTile("rojo").y, s: 2.6, rx: 4, rz: 0 },
    { t: 24.0, cx: 0, cy: 20, s: 0.46, rx: 40, rz: -4 },
    { t: 25.8, cx: 0, cy: 20, s: 0.47, rx: 40, rz: -4 },
    { t: 27.5, cx: 0, cy: 0, s: 0.4, rx: 20, rz: 0 },
    { t: 29.0, cx: 0, cy: 0, s: 0.4, rx: 20, rz: 0 },
  ];
  const cam = camaraEn(kfs, t);
  const deriva = { x: Math.sin(t * 0.9) * 8, y: Math.cos(t * 0.7) * 6, r: Math.sin(t * 0.6) * 0.35 };

  // foco: Excel y celular
  const fLib = t < 7.0 ? 1 : t < 23.4 ? 1 - 0.9 * ease(t * FPS, 7.0 * FPS, 8.3 * FPS) : t < 25.8 ? 0.1 + 0.9 * ease(t * FPS, 23.4 * FPS, 24.3 * FPS) : 0.12;
  const fTel = t < 7.0 ? 0.12 : t < 23.4 ? 0.12 + 0.88 * ease(t * FPS, 7.0 * FPS, 8.6 * FPS) : t < 25.8 ? 1 - 0.6 * ease(t * FPS, 23.4 * FPS, 24.3 * FPS) : 0.12;
  const apagar = (v: number) => ({ filter: `saturate(${0.1 + 0.9 * v}) brightness(${0.42 + 0.58 * v})`, opacity: 0.55 + 0.45 * v });

  let fr = 0;
  FRASES.forEach((x, i) => { if (t >= x.s) fr = i; });

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
  add("pixabay/pop-a.mp3", 0, 0.5, 0.7); // cuadro 0
  add("pixabay/whoosh-a.mp3", 0.02, 0.35, 0.8);
  add("pixabay/buzzer-error.mp3", 0.35, 0.22, 0.9); // se desespera frente a la compu
  add("kenney/impactPunch_medium_000.ogg", T_CLIP - 0.04, 0.7, 0.9); // golpe en el corte seco
  add("pixabay/disco-rayado.mp3", T_CLIP - 0.12, 0.45, 1.3); // corte seco al mundo
  add("pixabay/pop-b.mp3", T_CLIP + 0.05, 0.45, 0.8);
  add("pixabay/whoosh-b.mp3", T_CLIP, 0.3, 0.8);
  add("pixabay/pop-a.mp3", 5.1, 0.45, 0.7);
  add("pixabay/subida-tension.mp3", 5.6, 0.18, 2.6);
  add("kenney/question_001.ogg", 5.15, 0.4, 1);
  add("pixabay/pop-burbuja.mp3", 5.5, 0.4, 1);
  add("pixabay/whoosh-b.mp3", 6.95, 0.45, 1.2);
  add("pixabay/pop-a.mp3", 8.2, 0.4, 0.7);
  add("pixabay/whoosh-a.mp3", 8.9, 0.3, 0.8);
  add("pixabay/pop-b.mp3", 10.4, 0.35, 0.8);
  // interactivo 2: cuenta regresiva
  for (let n = 0; n < 3; n++) { add("kenney/tick_001.ogg", 12.4 + n, 0.9, 0.3); add("pixabay/clic-boton.mp3", 12.4 + n, 0.5, 0.3); }
  add("pixabay/subida-tension.mp3", 12.4, 0.2, 3.2);
  add("pixabay/ding-exito.mp3", 15.45, 0.35, 1.2);
  add("pixabay/pop-a.mp3", 15.6, 0.4, 0.6);
  add("pixabay/clic-boton.mp3", TAP_OPCION, 0.6, 0.4);
  add("kenney/switch_002.ogg", TAP_OPCION + 0.05, 0.5, 0.5);
  add("pixabay/whoosh-a.mp3", T_SHEET2, 0.32, 0.8);
  add("pixabay/pop-burbuja.mp3", T_SHEET2 + 0.3, 0.4, 1);
  add("kenney/confirmation_001.ogg", T_SHEET3, 0.5, 1);
  add("pixabay/pop-a.mp3", 18.9, 0.4, 0.6);
  add("pixabay/clic-boton.mp3", TAP_IMPORTAR, 0.6, 0.4);
  add("pixabay/whoosh-b.mp3", T_HOME - 0.05, 0.4, 1);
  add("pixabay/tada.mp3", T_HOME + 0.1, 0.4, 1.4);
  add("kenney/confirmation_001.ogg", TILE_T.verde, 0.5, 1);
  add("pixabay/pop-a.mp3", TILE_T.verde + 0.02, 0.4, 0.6);
  add("kenney/select_001.ogg", TILE_T.amb, 0.55, 0.8);
  add("pixabay/pop-b.mp3", TILE_T.amb + 0.02, 0.4, 0.8);
  add("kenney/impactPunch_medium_000.ogg", TILE_T.rojo, 0.5, 0.8);
  add("pixabay/pop-burbuja.mp3", TILE_T.rojo + 0.02, 0.4, 1);
  add("pixabay/whoosh-b.mp3", 23.5, 0.4, 1);
  add("pixabay/pop-burbuja.mp3", 22.75, 0.45, 1);
  add("pixabay/pop-a.mp3", 23.9, 0.45, 0.7);
  add("pixabay/notificacion-b.mp3", 24.9, 0.35, 1.2);
  add("pixabay/whoosh-b.mp3", 25.75, 0.4, 1);
  add("pixabay/tada.mp3", 25.9, 0.4, 1.4);
  add("pixabay/pop-b.mp3", inicioTrozo(pal, 7, 1), 0.4, 0.8);
  FRASES.forEach((x, i) => { if (i > 1 && i !== 2 && i !== 5) add(i % 2 ? "kenney/drop_002.ogg" : "kenney/pluck_001.ogg", x.s + 0.1, 0.4, 0.6); });

  const voces = f.map((fx, i) => <VozEn key={i} frase={fx} en={FRASES[i].s} />);

  const cierre = ease(t * FPS, 25.8 * FPS, 25.8 * FPS + 14);
  const caja = { position: "absolute" as const, left: 140, width: 800, display: "flex", justifyContent: "center" as const };
  const pop = (a: number, b: number) => ease(t * FPS, a * FPS, b * FPS, Easing.out(Easing.back(1.4)));


  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "540px 930px", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: `translate(540px, 930px) rotateX(${cam.rx}deg) rotateZ(${cam.rz + deriva.r}deg) scale(${cam.s}) translate(${-(cam.cx + deriva.x)}px, ${-(cam.cy + deriva.y)}px)` }}>
          <div style={{ position: "absolute", left: -4000, top: -3000, width: 8000, height: 6000, borderRadius: 60, background: "radial-gradient(1400px 1000px at 50% 40%, rgba(26,163,245,0.35), rgba(26,163,245,0) 70%), repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 3px, transparent 3px 120px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 3px, transparent 3px 120px), linear-gradient(170deg, #0F3A9C, #123FB0)" }} />
          <div style={{ position: "absolute", left: 0, top: 0, ...apagar(fLib) }}>
            <Escritorio t={t} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, ...apagar(fTel) }}>
            <Telefono t={t} />
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(1100px 1500px at 50% 45%, rgba(11,42,111,0) 55%, rgba(5,16,50,0.55) 100%)" }} />
      <AbsoluteFill style={{ background: "rgba(5,16,50,0.55)", opacity: cierre }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 620, background: "linear-gradient(180deg, rgba(5,16,50,0.78), rgba(5,16,50,0))" }} />

      {/* interactivo 1 (seg 5,4): cuenta las versiones FINAL */}
      {t >= 5.4 && t < 8.1 ? (() => {
        const p = pop(5.4, 5.7);
        const bote = Math.sin((t - 5.4) * 9) * 8;
        return (
          <div style={{ ...caja, top: 1085, opacity: p, scale: 0.8 + p * 0.2 }}>
            <div style={{ background: C.verde, color: C.blanco, borderRadius: 999, fontFamily: titulos, fontWeight: 800, fontSize: 84, letterSpacing: -2, padding: "8px 52px 20px", border: "6px solid rgba(255,255,255,0.4)", boxShadow: "0 22px 44px rgba(3,12,40,0.5)", whiteSpace: "nowrap", translate: `0px ${bote}px` }}>Comenta tu número 👇</div>
          </div>
        );
      })() : null}
      {/* interactivo 2 (seg 12,4, a mitad de video): cuenta regresiva */}
      {t >= 12.4 && t < 15.5 ? <Anillo t={t} t0={12.4} top={1235} left={440} /> : null}
      {etiqueta("al día", 10, C.verde, TILE_T.verde + 0.35, TILE_T.amb)}
      {etiqueta("por vencer", 5, C.ambar, TILE_T.amb + 0.35, TILE_T.rojo)}
      {etiqueta("morosos", 4, C.rojo, TILE_T.rojo + 0.35, TILE_T.fin)}
      {/* interactivo 3 (seg 23,3): Escribe YO */}
      {t >= 23.3 && t < 25.8 ? (() => {
        const p = pop(23.3, 23.6);
        const bote = Math.sin((t - 23.3) * 9) * 8;
        return (
          <div style={{ ...caja, top: 1085, opacity: p, scale: 0.8 + p * 0.2 }}>
            <div style={{ background: C.verde, color: C.blanco, borderRadius: 999, fontFamily: titulos, fontWeight: 800, fontSize: 92, letterSpacing: -2, padding: "8px 56px 20px", border: "6px solid rgba(255,255,255,0.4)", boxShadow: "0 22px 44px rgba(3,12,40,0.5)", whiteSpace: "nowrap", translate: `0px ${bote}px` }}>Escribe YO 👇</div>
          </div>
        );
      })() : null}

      {/* cierre */}
      {t >= 25.8 ? (
        <AbsoluteFill style={{ opacity: cierre }}>
          <div style={{ ...caja, top: 600, scale: 0.7 + pop(25.9, 26.3) * 0.3 }}>
            <Img src={staticFile("logo.png")} style={{ width: 210, height: 210, borderRadius: 50, boxShadow: "0 28px 56px rgba(3,12,40,0.5)" }} />
          </div>
          <div style={{ ...caja, top: 835, fontFamily: titulos, fontWeight: 800, fontSize: 80, letterSpacing: -2, color: C.blanco, opacity: pop(26.1, 26.5) }}>Cartera Asesor</div>
          <div style={{ ...caja, top: 975, opacity: pop(26.6, 27.0), scale: 0.85 + pop(26.6, 27.0) * 0.15 }}>
            <div style={{ background: C.verde, color: C.blanco, fontFamily: titulos, fontWeight: 800, fontSize: 64, letterSpacing: -1, padding: "24px 44px 28px", borderRadius: 999, border: "6px solid rgba(255,255,255,0.35)", boxShadow: "0 22px 44px rgba(3,12,40,0.45)" }}>carteraasesor.com</div>
          </div>
          <div style={{ ...caja, top: 1120, fontFamily: textos, fontWeight: 800, fontSize: 48, color: C.secundario, opacity: pop(27.2, 27.6) }}>Beta gratuita · hasta 100 clientes</div>
        </AbsoluteFill>
      ) : null}

      <Palabras t={t} pal={pal} />
      <Sticker frameInicio={Math.round(FRASES[fr].s * fps)} cara={CARAS[fr]} frame={frame} />
      {(t >= 12.4 && t < 15.5) || (t >= 5.4 && t < 8.1) || (t >= 23.3 && t < 25.8) || t < T_CLIP ? null : <Burbuja key={`b${fr}`} left={350} top={1300} width={470} desde={Math.round(FRASES[fr].s * fps) + 4} size={52} flecha="ninguna">{REACCION[fr]}</Burbuja>}

      {/* GANCHO: clip real (Pexels, ver clips/CREDITOS.md), corte seco al segundo 1,5 */}
      {t < T_CLIP ? (
        <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
          <Sequence from={0} durationInFrames={Math.round(T_CLIP * fps)} layout="none">
            <Video src={staticFile("clips/oficina-grito-laptop.mp4")} muted objectFit="cover" style={{ width: 1080, height: 1920 }} />
          </Sequence>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 420, background: "#0B2A6F", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 40 }}>
            {(() => {
              const p = ease(frame, 0, 6, Easing.out(Easing.back(1.8)));
              return (
                <div style={{ width: 800, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 102, lineHeight: 1.04, letterSpacing: -3, color: C.blanco, scale: 0.92 + p * 0.08 }}>
                  Yo con mi Excel de <span style={{ color: C.oro }}>80</span> clientes:
                </div>
              );
            })()}
          </div>
        </AbsoluteFill>
      ) : null}
      {s}
      {voces}
    </AbsoluteFill>
  );
};
