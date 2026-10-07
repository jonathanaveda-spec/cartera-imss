import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";
import { Caption } from "../components/Caption";
import { Anillo as AnilloFoco, PhoneCard } from "../components/PhoneCard";
import { Rico, partes } from "../texto";
import { Chat } from "./Chat";
import type { ImagenCaptura, Mensaje, PanelDividido } from "./linea";

// ---------- Hoja de libreta dibujada (nombres inventados) ----------
const FILAS = ["Doña Rosa  ¿$?", "Don Luis  ¿$?", "Karen  ¿$?", "Tere  ¿$?", "Don Memo  ¿$?"];
export const HojaLibreta: React.FC<{ w: number; h: number; filas?: string[] }> = ({ w, h, filas = FILAS }) => (
  <div style={{ width: w, height: h, background: "#FFF8E6", borderRadius: 28, boxShadow: "0 40px 70px rgba(3,12,40,0.45)", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 80, top: 0, bottom: 0, width: 4, background: "rgba(220,38,38,0.45)" }} />
    <div style={{ position: "absolute", left: 110, top: 30, fontFamily: textos, fontWeight: 800, fontSize: 44, color: "#5B4A2E", fontStyle: "italic" }}>Cobros del mes</div>
    {filas.map((f, i) => (
      <div key={i} style={{ position: "absolute", left: 110, right: 24, top: 120 + i * 92, height: 92, borderBottom: "3px solid rgba(91,74,46,0.22)", fontFamily: textos, fontWeight: 600, fontSize: 42, fontStyle: "italic", color: "#5B4A2E", display: "flex", alignItems: "center" }}>
        {f}
      </div>
    ))}
  </div>
);

// ---------- Gancho: hora + titular + libreta ----------
export const GanchoH: React.FC<{ hora: string; titular: string[]; icono?: string }> = ({ hora, titular, icono = "🌙" }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 120], [1, 1.03], { extrapolateRight: "clamp" });
  const chip = 0.55 + ease(frame, 0, 14, Easing.out(Easing.back(1.4))) * 0.45;
  const hoja = ease(frame, 14, 34);
  return (
    <AbsoluteFill style={{ scale: zoom }}>
      <div style={{ position: "absolute", left: 140, width: 800, top: 215, display: "flex", justifyContent: "center", opacity: chip, scale: 0.8 + chip * 0.2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, background: "rgba(11,42,111,0.82)", borderRadius: 999, padding: "14px 40px 18px", border: "4px solid rgba(255,255,255,0.3)", fontFamily: titulos, fontWeight: 800, fontSize: 84, letterSpacing: -2, color: C.blanco }}>
          <span style={{ fontSize: 76 }}>{icono}</span>
          {hora}
        </div>
      </div>
      <div style={{ position: "absolute", left: 140, width: 800, top: 395, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 104, lineHeight: 1.03, letterSpacing: -2.5, color: C.blanco, textShadow: "0 6px 28px rgba(5,20,60,0.45)", whiteSpace: "nowrap" }}>
        {titular.map((l, i) => {
          const p = 0.4 + ease(frame, i * 4, 12 + i * 4) * 0.6;
          return (
            <div key={i} style={{ opacity: p, translate: `0px ${(1 - p) * 55}px` }}>
              <Rico t={l} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 200, top: 870, opacity: 0.55 + hoja * 0.45, translate: `0px ${(1 - hoja) * 120}px`, rotate: "-3deg" }}>
        <HojaLibreta w={680} h={560} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- Frase con hojas de libreta que pasan ----------
export const FraseH: React.FC<{ titular: string[]; emoji?: string }> = ({ titular, emoji }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      {[0, 1, 2, 3].map((i) => {
        const t0 = i * 14;
        const p = ease(frame, t0, t0 + 40, Easing.out(Easing.cubic));
        const arriba = i % 2 === 0;
        return (
          <div key={i} style={{ position: "absolute", left: 160, top: arriba ? 250 : 1000, opacity: Math.min(1, p * 3) * (1 - ease(frame, durationInFrames - 8, durationInFrames)) * 0.6, translate: `${(arriba ? 1 : -1) * (1 - p) * 700}px 0px`, rotate: `${(arriba ? -1 : 1) * (4 + (1 - p) * 14)}deg` }}>
            <HojaLibreta w={620} h={380} />
          </div>
        );
      })}
      {emoji ? (
        <div style={{ position: "absolute", left: 140, width: 800, top: 330, textAlign: "center", fontSize: 150, opacity: ease(frame, 0, 12) }}>{emoji}</div>
      ) : null}
      <Caption top={600} size={116} lineas={titular.map(partes)} delay={2} />
    </AbsoluteFill>
  );
};

// ---------- Capturas reales de la app en un teléfono ----------
const COLOR_ANILLO = { rojo: C.rojo, verde: C.verde, azul: C.azulCartera } as const;
export const CapturaH: React.FC<{ titular: string[]; imagenes: ImagenCaptura[] }> = ({ titular, imagenes }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const entra = ease(frame, 0, 14);
  const n = imagenes.length;
  const tramo = (durationInFrames - 12) / n;
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  return (
    <AbsoluteFill>
      {imagenes.map((im, i) => {
        const t0 = i * tramo - 4;
        const p = i === 0 ? 1 : ease(frame, t0, t0 + 10);
        const anillo = im.anillo ? ease(frame, i * tramo + 12, i * tramo + 24) : 0;
        return (
          <PhoneCard key={i} src={im.src} left={154} top={200} alto={860} zoom={im.zoom} cx={im.cx} cy={im.cy} opacity={(i === 0 ? 0.3 + entra * 0.7 : p)} translateY={i === 0 ? (1 - entra) * 100 : 0}>
            {im.anillo ? (
              <AnilloFoco x={im.anillo.x} y={im.anillo.y} w={im.anillo.w} h={im.anillo.h} color={COLOR_ANILLO[im.anillo.color]} p={anillo} pulso={pulso} radio={im.anillo.radio ?? 30} />
            ) : null}
          </PhoneCard>
        );
      })}
      <Caption top={1150} size={64} lineas={titular.map(partes)} />
    </AbsoluteFill>
  );
};

// ---------- Pantalla dividida: antes / después ----------
const Panel: React.FC<{ p: PanelDividido; top: number; despues?: boolean; t0: number }> = ({ p, top, despues, t0 }) => {
  const frame = useCurrentFrame();
  const entra = ease(frame, t0, t0 + 16);
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        width: 800,
        top,
        height: 560,
        borderRadius: 48,
        background: despues ? C.nube : "rgba(11,42,111,0.78)",
        border: despues ? `6px solid ${C.verde}` : "4px solid rgba(255,255,255,0.22)",
        boxShadow: "0 30px 60px rgba(3,12,40,0.4)",
        opacity: entra,
        translate: `0px ${(1 - entra) * (despues ? 90 : -90)}px`,
        padding: "30px 36px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ background: despues ? C.verde : C.rojo, color: C.blanco, fontFamily: textos, fontWeight: 800, fontSize: 44, padding: "8px 30px", borderRadius: 999 }}>{p.etiqueta}</div>
        <div style={{ fontSize: 96, lineHeight: 1 }}>{p.emoji}</div>
      </div>
      <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: 66, letterSpacing: -1.5, lineHeight: 1.05, color: despues ? C.tinta : C.blanco }}>
        <Rico t={p.titulo} color={despues ? C.azulCartera : C.oro} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {p.lineas.map((l, i) => {
          const q = ease(frame, t0 + 14 + i * 10, t0 + 26 + i * 10);
          return (
            <div key={i} style={{ fontFamily: textos, fontWeight: 800, fontSize: 46, lineHeight: 1.18, color: despues ? C.tinta : C.secundario, opacity: q, translate: `${(1 - q) * 40}px 0px` }}>
              {despues ? "✅ " : "✖ "}
              <Rico t={l} color={despues ? C.azulCartera : C.oro} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DivididaH: React.FC<{ antes: PanelDividido; despues: PanelDividido }> = ({ antes, despues }) => {
  const frame = useCurrentFrame();
  const vs = ease(frame, 20, 34, Easing.out(Easing.back(2)));
  return (
    <AbsoluteFill>
      <Panel p={antes} top={200} t0={0} />
      <Panel p={despues} top={850} despues t0={22} />
      <div style={{ position: "absolute", left: 540 - 55, top: 765, width: 110, height: 110, borderRadius: 999, background: C.oro, color: C.azulNoche, fontFamily: titulos, fontWeight: 800, fontSize: 56, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 26px rgba(3,12,40,0.4)", scale: vs }}>
        ↓
      </div>
    </AbsoluteFill>
  );
};

// ---------- Título grande con emoji (gancho sencillo) ----------
export const TituloH: React.FC<{ titular: string[]; emoji?: string }> = ({ titular, emoji }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 120], [1, 1.03], { extrapolateRight: "clamp" });
  const e = 0.5 + ease(frame, 0, 16, Easing.out(Easing.back(1.4))) * 0.5;
  return (
    <AbsoluteFill style={{ scale: zoom }}>
      {emoji ? (
        <div style={{ position: "absolute", left: 140, width: 800, top: 360, textAlign: "center", fontSize: 220, lineHeight: 1, scale: 0.7 + e * 0.3, opacity: e }}>{emoji}</div>
      ) : null}
      <div style={{ position: "absolute", left: 140, width: 800, top: 680, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 100, lineHeight: 1.03, letterSpacing: -2.5, color: C.blanco, textShadow: "0 6px 28px rgba(5,20,60,0.45)", whiteSpace: "nowrap" }}>
        {titular.map((l, i) => {
          const p = 0.45 + ease(frame, i * 4, 12 + i * 4) * 0.55;
          return (
            <div key={i} style={{ opacity: p, translate: `0px ${(1 - p) * 55}px` }}>
              <Rico t={l} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Un mensaje de cobro que se escribe y se envía ----------
export const MensajeH: React.FC<{
  numero: number;
  titular: string[];
  contacto: { nombre: string; iniciales: string };
  mensaje: Mensaje;
}> = ({ numero, titular, contacto, mensaje }) => {
  const frame = useCurrentFrame();
  const n = ease(frame, 0, 14, Easing.out(Easing.back(1.6)));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 140, width: 800, top: 205, display: "flex", justifyContent: "center", scale: 0.6 + n * 0.4, opacity: n }}>
        <div style={{ width: 120, height: 120, borderRadius: 999, background: C.blanco, color: C.azulNoche, fontFamily: titulos, fontWeight: 800, fontSize: 80, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 32px rgba(3,12,40,0.4)" }}>
          {numero}
        </div>
      </div>
      <div style={{ position: "absolute", left: 140, width: 800, top: 350, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 100, lineHeight: 1.03, letterSpacing: -2.5, color: C.blanco, textShadow: "0 6px 28px rgba(5,20,60,0.45)", whiteSpace: "nowrap" }}>
        {titular.map((l, i) => {
          const p = ease(frame, 4 + i * 5, 16 + i * 5);
          return (
            <div key={i} style={{ opacity: p, translate: `0px ${(1 - p) * 50}px` }}>
              <Rico t={l} />
            </div>
          );
        })}
      </div>
      <Chat
        contacto={contacto}
        top={620}
        alto={800}
        items={[{ escribiendo: "asesor", seg: 0.6 }, { ...mensaje, de: "asesor", grande: true }]}
        tiempos={[{ ini: 16, fin: 34 }, { ini: 34, fin: 34 }]}
      />
    </AbsoluteFill>
  );
};
