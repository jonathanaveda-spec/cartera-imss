import type React from "react";
import { useCurrentFrame } from "remotion";
import { ANCHO_MAX, C, textos, titulos, X0 } from "../brand";
import { ease } from "../anim";

type Props = {
  // Cada linea es una lista de partes; las partes con oro=true van en #FFD166
  lineas: { t: string; oro?: boolean }[][];
  top: number;
  delay?: number;
  size?: number;
  caja?: boolean;
};

// Subtitulo grande con la palabra clave en oro, dentro de la zona segura.
export const Caption: React.FC<Props> = ({
  lineas,
  top,
  delay = 4,
  size = 72,
  caja = true,
}) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, delay + 12);
  return (
    <div
      style={{
        position: "absolute",
        left: X0,
        width: ANCHO_MAX,
        top,
        display: "flex",
        justifyContent: "center",
        opacity: p,
        translate: `0px ${(1 - p) * 40}px`,
      }}
    >
      <div
        style={{
          background: caja ? "rgba(11,42,111,0.82)" : "transparent",
          borderRadius: 40,
          padding: caja ? "28px 32px 32px" : 0,
          whiteSpace: "nowrap",
          textAlign: "center",
          fontFamily: titulos,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.08,
          letterSpacing: -1.5,
          color: C.blanco,
          textShadow: "0 4px 18px rgba(5,20,60,0.45)",
        }}
      >
        {lineas.map((linea, i) => (
          <div key={i}>
            {linea.map((parte, j) => (
              <span key={j} style={{ color: parte.oro ? C.oro : C.blanco }}>
                {parte.t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Etiqueta: React.FC<{
  children: React.ReactNode;
  color: string;
  size?: number;
}> = ({ children, color, size = 44 }) => (
  <div
    style={{
      background: color,
      color: C.blanco,
      fontFamily: textos,
      fontWeight: 800,
      fontSize: size,
      padding: "10px 28px",
      borderRadius: 999,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);
