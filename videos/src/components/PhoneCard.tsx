import type React from "react";
import { Img, staticFile } from "remotion";
import { C } from "../brand";

// El telefono completo (con marco) mide 800 px, centrado en x = 540 (x 140-940)
export const CARD_W = 772;
const FRAME = 14; // grosor del marco del telefono
const SRC_W = 1080;
const SRC_H = 1920;

type Props = {
  src: string;
  alto: number; // alto visible de la pantalla
  zoom: number; // 1 = ancho completo de la captura
  cx: number; // punto de la captura (en px de la captura) que queda al centro
  cy: number;
  left: number;
  top: number;
  opacity?: number;
  translateY?: number;
  children?: React.ReactNode; // elementos en coordenadas de la captura (anillos, etc.)
};

// Muestra una captura real dentro de un marco de telefono, con zoom suave hacia un punto.
export const PhoneCard: React.FC<Props> = ({
  src,
  alto,
  zoom,
  cx,
  cy,
  left,
  top,
  opacity = 1,
  translateY = 0,
  children,
}) => {
  const s = (CARD_W / SRC_W) * zoom;
  // Que no se salga de la captura
  const minX = CARD_W - SRC_W * s;
  const minY = alto - SRC_H * s;
  const tx = Math.min(0, Math.max(minX, CARD_W / 2 - cx * s));
  const ty = Math.min(0, Math.max(minY, alto / 2 - cy * s));
  return (
    <div
      style={{
        position: "absolute",
        left: left - FRAME,
        top: top - FRAME,
        width: CARD_W + FRAME * 2,
        height: alto + FRAME * 2,
        borderRadius: 64,
        background: C.tinta,
        boxShadow:
          "0 40px 80px rgba(3,12,40,0.5), 0 0 0 3px rgba(255,255,255,0.18)",
        opacity,
        translate: `0px ${translateY}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: FRAME,
          top: FRAME,
          width: CARD_W,
          height: alto,
          borderRadius: 50,
          overflow: "hidden",
          background: C.nube,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SRC_W,
            height: SRC_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${s})`,
          }}
        >
          <Img src={staticFile(src)} style={{ width: SRC_W, height: SRC_H }} />
          {children}
        </div>
      </div>
    </div>
  );
};

// Anillo de foco en coordenadas de la captura
export const Anillo: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  p: number; // 0..1 entrada
  radio?: number;
  pulso?: number; // 0..1 para latido
}> = ({ x, y, w, h, color, p, radio = 36, pulso = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x - 8 - pulso * 6,
      top: y - 8 - pulso * 6,
      width: w + 16 + pulso * 12,
      height: h + 16 + pulso * 12,
      borderRadius: radio + 8,
      border: `10px solid ${color}`,
      boxShadow: `0 0 0 8px rgba(255,255,255,0.35), 0 0 40px ${color}`,
      opacity: p,
      scale: 0.92 + p * 0.08,
    }}
  />
);
