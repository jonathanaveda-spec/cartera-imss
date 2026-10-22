import type React from "react";
import { Audio } from "@remotion/media";
import { Easing, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";
import { aCuadros, cargarVoz } from "../voz";
import type { VozFrase } from "../voz";

// Piezas comunes de los videos del 22–23/10/2026 (T06 y H07): efectos de sonido, voz por segundos, Citlali y burbujas.

// ---------- Efecto de sonido en el segundo `en` ----------
export const Sfx: React.FC<{ src: string; en: number; vol?: number; dur?: number }> = ({ src, en, vol = 0.5, dur }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(en * fps)} durationInFrames={Math.ceil((dur ?? 2.8) * fps)} layout="none">
      <Audio src={staticFile(`sfx/${src}`)} volume={vol} />
    </Sequence>
  );
};

// ---------- Voz de una frase en el segundo `en` ----------
export const VozEn: React.FC<{ frase: VozFrase; en: number }> = ({ frase, en }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(en * fps)} durationInFrames={Math.ceil((frase.seg + 0.2) * fps)} layout="none">
      <Audio src={staticFile(frase.archivo)} />
    </Sequence>
  );
};

export const cargarFrases = (id: string) => cargarVoz(id);
export { aCuadros };

// ---------- Citlali como conductora: foto redonda con zoom suave (no habla; la voz es del narrador) ----------
export type Cara = "c01" | "c13" | "c21" | "c06";
export const CitlaliCirculo: React.FC<{ cara: Cara; size: number; left: number; top: number; pop?: number; aro?: string; zoomLento?: boolean }> = ({ cara, size, left, top, pop, aro = C.blanco }) => {
  const frame = useCurrentFrame();
  const respira = 1 + Math.sin(frame / 14) * 0.012;
  const golpe = pop === undefined ? 1 : 1 + 0.08 * Math.max(0, 1 - Math.abs(frame - pop) / 8) * (frame >= pop ? 1 : 0);
  const zoomFoto = 1.12 + Math.sin(frame / 40) * 0.02;
  return (
    <div style={{ position: "absolute", left, top, width: size, height: size, scale: respira * golpe }}>
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: `10px solid ${aro}`, boxShadow: "0 24px 50px rgba(3,12,40,0.5)", background: "#1e293b" }}>
        <Img src={staticFile(`presentadora/cara/${cara}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", scale: zoomFoto }} />
      </div>
    </div>
  );
};

// ---------- Burbuja de texto (de Citlali) ----------
export const Burbuja: React.FC<{ left: number; top: number; width: number; desde: number; children: React.ReactNode; size?: number; flecha?: "arriba" | "abajo" | "ninguna"; fondo?: string; color?: string }> = ({ left, top, width, desde, children, size = 58, flecha = "arriba", fondo = C.blanco, color = C.tinta }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, desde, desde + 9, Easing.out(Easing.back(1.5)));
  return (
    <div style={{ position: "absolute", left, top, width, opacity: p, scale: 0.85 + p * 0.15, transformOrigin: "50% 0%" }}>
      {flecha === "arriba" ? <div style={{ position: "absolute", left: width / 2 - 22, top: -20, width: 44, height: 44, background: fondo, rotate: "45deg", borderRadius: 6 }} /> : null}
      <div style={{ position: "relative", background: fondo, color, borderRadius: 44, padding: "26px 36px 32px", textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: size, lineHeight: 1.08, letterSpacing: -1.2, boxShadow: "0 22px 44px rgba(3,12,40,0.4)" }}>{children}</div>
    </div>
  );
};

export const Chip: React.FC<{ texto: string; top: number; color?: string; desde?: number; fondo?: string }> = ({ texto, top, color = C.secundario, desde = 0, fondo = "rgba(11,42,111,0.82)" }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, desde, desde + 8);
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top, display: "flex", justifyContent: "center", opacity: p }}>
      <div style={{ background: fondo, border: "4px solid rgba(255,255,255,0.3)", borderRadius: 999, padding: "10px 38px 14px", fontFamily: textos, fontWeight: 800, fontSize: 44, color, whiteSpace: "nowrap" }}>{texto}</div>
    </div>
  );
};
