import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ease } from "../anim";

// Toque de dedo con ondas, en coordenadas de la captura (va dentro de <PhoneCard>).
export const Toque: React.FC<{ x: number; y: number; desde: number }> = ({
  x,
  y,
  desde,
}) => {
  const frame = useCurrentFrame();
  const onda = ease(frame, desde + 4, desde + 26);
  const dedo = ease(frame, desde - 6, desde);
  const quita = ease(frame, desde + 14, desde + 22);
  const presionado = interpolate(frame, [desde, desde + 3, desde + 9], [1, 0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 90,
          top: y - 90,
          width: 180,
          height: 180,
          borderRadius: 999,
          border: "8px solid rgba(255,255,255,0.95)",
          background: "rgba(255,255,255,0.3)",
          opacity: frame >= desde + 4 ? 1 - onda : 0,
          scale: 0.3 + onda * 1.3,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 26,
          top: y - 26,
          width: 52,
          height: 52,
          borderRadius: 999,
          background: "rgba(255,255,255,0.6)",
          border: "6px solid white",
          boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
          opacity: dedo * (1 - quita),
          scale: presionado,
        }}
      />
    </>
  );
};
