import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";
import { Anillo as AnilloFoco, PhoneCard } from "../components/PhoneCard";
import { Rico } from "../texto";
import type { ImagenCaptura, ItemResuelto } from "./linea";

// ---------------------------------------------------------------------------------------------
// Escenas nuevas de la plantilla H (semana 20–25/10/2026). Regla del primer segundo: en el CUADRO 0 el gancho ya
// está completo en pantalla (nada nace en opacidad 0) y lo que se mueve es un detalle (tachado, sello, anillo).
// ---------------------------------------------------------------------------------------------

const COLOR_ANILLO = { rojo: C.rojo, verde: C.verde, azul: C.azulCartera, ambar: C.ambar } as const;

// ---------- Sello que «cae» sobre la escena (CASO CERRADO) ----------
export const Sello: React.FC<{ texto: string; top: number; left?: number; color?: string; desde?: number }> = ({ texto, top, color = C.verde, desde = 22 }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, desde, desde + 9, Easing.out(Easing.cubic));
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top, display: "flex", justifyContent: "center", opacity: p, scale: 1.8 - p * 0.8, rotate: "-8deg" }}>
      <div style={{ border: `12px solid ${color}`, borderRadius: 28, background: "rgba(255,255,255,0.94)", color, fontFamily: titulos, fontWeight: 800, fontSize: 92, letterSpacing: -2, padding: "6px 36px 12px", boxShadow: "0 18px 40px rgba(3,12,40,0.45)", whiteSpace: "nowrap" }}>{texto}</div>
    </div>
  );
};

// ---------- M08: «80 clientes» se tacha y baja a «62 activos» ----------
export const NumerosH: React.FC<{ etiqueta: string; arriba: string; de: number; deUnidad: string; pregunta: string[]; a: number; aUnidad: string; nota: string }> = ({ etiqueta, arriba, de, deUnidad, pregunta, a, aUnidad, nota }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 150], [1, 1.03], { extrapolateRight: "clamp" });
  const tacha = ease(frame, 4, 20);
  const apaga = ease(frame, 26, 46);
  const conteo = ease(frame, 30, 72, Easing.out(Easing.cubic));
  const valor = Math.round(de - (de - a) * conteo);
  const hayNumero = frame >= 30;
  const latido = 1 + Math.sin(frame / 3) * 0.05;
  const llega = ease(frame, 30, 44, Easing.out(Easing.back(1.6)));
  return (
    <AbsoluteFill style={{ scale: zoom }}>
      <div style={{ position: "absolute", left: 140, width: 800, top: 215, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "rgba(11,42,111,0.82)", borderRadius: 999, padding: "12px 40px 16px", border: "4px solid rgba(255,255,255,0.3)", fontFamily: textos, fontWeight: 800, fontSize: 46, color: C.secundario, whiteSpace: "nowrap" }}>{etiqueta}</div>
      </div>
      <div style={{ position: "absolute", left: 140, width: 800, top: 330, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 88, letterSpacing: -2, color: C.blanco, textShadow: "0 6px 28px rgba(5,20,60,0.45)", whiteSpace: "nowrap" }}>{arriba}</div>
      {/* 80 clientes… (se tacha) */}
      <div style={{ position: "absolute", left: 140, width: 800, top: 420, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 24, opacity: 1 - apaga * 0.45 }}>
        <div style={{ position: "relative", fontFamily: titulos, fontWeight: 800, fontSize: 320, lineHeight: 1, letterSpacing: -8, color: C.blanco, textShadow: "0 8px 30px rgba(5,20,60,0.5)" }}>
          {de}
          <div style={{ position: "absolute", left: -26, right: -26, top: "52%", height: 26, borderRadius: 14, background: C.rojo, boxShadow: "0 6px 16px rgba(3,12,40,0.5)", rotate: "-9deg", transformOrigin: "0% 50%", scale: `${tacha} 1` }} />
        </div>
        <div style={{ fontFamily: textos, fontWeight: 800, fontSize: 70, lineHeight: 1, paddingBottom: 46, color: C.secundario }}>{deUnidad}</div>
      </div>
      {/* pregunta */}
      <div style={{ position: "absolute", left: 140, width: 800, top: 770, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 92, lineHeight: 1.04, letterSpacing: -2, color: C.blanco, textShadow: "0 6px 28px rgba(5,20,60,0.45)", whiteSpace: "nowrap" }}>
        {pregunta.map((l, i) => (
          <div key={i}>
            <Rico t={l} />
          </div>
        ))}
      </div>
      {/* ¿? → 62 activos */}
      <div style={{ position: "absolute", left: 140, width: 800, top: 1000, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 24 }}>
        <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: 320, lineHeight: 1, letterSpacing: -8, color: C.oro, textShadow: "0 8px 30px rgba(5,20,60,0.5)", scale: hayNumero ? 0.9 + llega * 0.1 : latido, transformOrigin: "50% 80%" }}>{hayNumero ? valor : "?"}</div>
        <div style={{ fontFamily: textos, fontWeight: 800, fontSize: 70, lineHeight: 1, paddingBottom: 46, color: C.blanco, opacity: hayNumero ? 1 : 0.6 }}>{aUnidad}</div>
      </div>
      <div style={{ position: "absolute", left: 140, width: 800, top: 1350, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 42, color: C.secundario, whiteSpace: "nowrap" }}>{nota}</div>
    </AbsoluteFill>
  );
};

// ---------- P12: gancho con la captura ya visible (titular arriba, teléfono abajo) ----------
export const CapturaGanchoH: React.FC<{ titular: string[]; imagenes: ImagenCaptura[]; zoomFinal?: number }> = ({ titular, imagenes, zoomFinal }) => {
  const frame = useCurrentFrame();
  const im = imagenes[0];
  const zoom = zoomFinal ? im.zoom + (zoomFinal - im.zoom) * ease(frame, 0, 70, Easing.inOut(Easing.cubic)) : im.zoom;
  const lista = im.anillo ? (Array.isArray(im.anillo) ? im.anillo : [im.anillo]) : [];
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 140, width: 800, top: 205, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 96, lineHeight: 1.04, letterSpacing: -2.5, color: C.blanco, textShadow: "0 6px 28px rgba(5,20,60,0.45)", whiteSpace: "nowrap" }}>
        {titular.map((l, i) => (
          <div key={i}>
            <Rico t={l} />
          </div>
        ))}
      </div>
      <PhoneCard src={im.src} left={154} top={610} alto={740} zoom={zoom} cx={im.cx} cy={im.cy}>
        {lista.map((a, k) => (
          <AnilloFoco key={k} x={a.x} y={a.y} w={a.w} h={a.h} color={COLOR_ANILLO[a.color]} p={ease(frame, 8 + k * 14, 20 + k * 14)} pulso={pulso} radio={a.radio ?? 30} />
        ))}
      </PhoneCard>
    </AbsoluteFill>
  );
};

// ---------- H06: ficha policiaca con silueta y rasgos que aparecen al decirse ----------
const Silueta: React.FC<{ w: number; h: number; frame: number }> = ({ w, h, frame }) => (
  <div style={{ position: "relative", width: w, height: h, borderRadius: 24, background: "#CBD5E1", overflow: "hidden", border: "6px solid #94A3B8" }}>
    <svg viewBox="0 0 200 240" width={w - 12} height={h - 12} style={{ position: "absolute", left: 0, top: 0 }}>
      <circle cx="100" cy="92" r="46" fill="#475569" />
      <path d="M18 240 C18 170 60 146 100 146 C140 146 182 170 182 240 Z" fill="#475569" />
    </svg>
    <div style={{ position: "absolute", left: 0, right: 0, top: 54, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 84, color: "#E2E8F0", opacity: 0.85 + Math.sin(frame / 5) * 0.15 }}>?</div>
  </div>
);

export const FichaH: React.FC<{ encabezado: string; sello: string; selloNumero: string; rasgos: { emoji: string; texto: string }[]; tiempos: ItemResuelto[] }> = ({ encabezado, sello, selloNumero, rasgos, tiempos }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 300], [1, 1.035], { extrapolateRight: "clamp" });
  // El sello ya se lee completo en el cuadro 0; solo se asienta con un golpe
  const golpe = ease(frame, 0, 8, Easing.out(Easing.cubic));
  const temblor = frame < 14 ? Math.sin(frame * 2.6) * (14 - frame) * 0.5 : 0;
  return (
    <AbsoluteFill style={{ scale: zoom }}>
      <div style={{ position: "absolute", left: 140, top: 215, width: 800, height: 1130, borderRadius: 40, background: "#FFF8E6", boxShadow: "0 40px 80px rgba(3,12,40,0.5)", rotate: "-1deg", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 86, background: C.tinta, color: "#FFF8E6", fontFamily: textos, fontWeight: 800, fontSize: 38, letterSpacing: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>{encabezado}</div>
        {/* sello */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 125, display: "flex", justifyContent: "center", scale: 1.02 - golpe * 0.02, rotate: `${-5 + temblor}deg` }}>
          <div style={{ border: `12px solid ${C.rojo}`, borderRadius: 24, color: C.rojo, fontFamily: titulos, fontWeight: 800, fontSize: 72, letterSpacing: -2, padding: "4px 22px 12px", whiteSpace: "nowrap", background: "rgba(220,38,38,0.06)" }}>
            {sello} <span style={{ fontSize: 80 }}>{selloNumero}</span>
          </div>
        </div>
        {/* silueta + datos */}
        <div style={{ position: "absolute", left: 50, top: 360, display: "flex", gap: 34, alignItems: "flex-start" }}>
          <Silueta w={270} h={300} frame={frame} />
          <div style={{ fontFamily: textos, fontWeight: 800, color: C.tinta, display: "flex", flexDirection: "column", gap: 14, paddingTop: 10 }}>
            <div style={{ fontSize: 34, opacity: 0.6 }}>NOMBRE</div>
            <div style={{ width: 340, height: 40, background: C.tinta, borderRadius: 6 }} />
            <div style={{ fontSize: 34, opacity: 0.6, marginTop: 14 }}>FOTO</div>
            <div style={{ fontSize: 44 }}>no disponible</div>
          </div>
        </div>
        {/* rasgos */}
        <div style={{ position: "absolute", left: 50, right: 50, top: 700, fontFamily: textos, fontWeight: 800, fontSize: 36, letterSpacing: 3, color: C.tinta, opacity: 0.6 }}>SE LE CONOCE POR…</div>
        <div style={{ position: "absolute", left: 50, right: 30, top: 760, display: "flex", flexDirection: "column", gap: 10 }}>
          {rasgos.map((r, i) => {
            const t = tiempos[i]?.ini ?? 0;
            const p = ease(frame, t, t + 9, Easing.out(Easing.back(1.4)));
            return (
              <div key={i} style={{ height: 82, display: "flex", alignItems: "center", gap: 18, opacity: p, translate: `${(1 - p) * 70}px 0px`, borderBottom: "3px solid rgba(15,23,42,0.14)", fontFamily: textos, fontWeight: 800, fontSize: 42, color: C.tinta, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 44, color: C.rojo }}>{r.emoji}</span>
                <span>{r.texto}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
