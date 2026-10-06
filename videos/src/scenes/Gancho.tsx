import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, titulos } from "../brand";
import { ease } from "../anim";

// Escena 1 (0-2.2 s): gancho. Visible desde el primer cuadro; solo se mueve, no aparece de la nada.
export const Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const zoomLento = interpolate(frame, [0, 66], [1, 1.03], {
    extrapolateRight: "clamp",
  });
  const linea = (i: number) => {
    const p = ease(frame, i * 4, i * 4 + 12);
    return {
      translate: `0px ${(1 - p) * 60}px`,
      scale: 1.04 - p * 0.04,
    };
  };
  const subrayado = ease(frame, 14, 30);
  const cuaderno = ease(frame, 0, 14);
  const estilo = {
    fontFamily: titulos,
    fontWeight: 800,
    fontSize: 136,
    lineHeight: 1.02,
    letterSpacing: -3,
    color: C.blanco,
    textShadow: "0 6px 28px rgba(5,20,60,0.45)",
    textAlign: "center" as const,
  };
  return (
    <AbsoluteFill style={{ scale: zoomLento }}>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 440,
          textAlign: "center",
          fontSize: 190,
          lineHeight: 1,
          scale: 0.85 + cuaderno * 0.15,
          rotate: `${-10 + cuaderno * 6}deg`,
        }}
      >
        📒
      </div>
      <div style={{ position: "absolute", left: 140, width: 800, top: 710 }}>
        <div style={{ ...estilo, ...linea(0) }}>¿Todavía</div>
        <div style={{ ...estilo, ...linea(1) }}>cobras con</div>
        <div style={{ ...estilo, ...linea(2), color: C.oro, position: "relative" }}>
          <span style={{ position: "relative", display: "inline-block" }}>
            libreta?
            <svg
              width="560"
              height="40"
              viewBox="0 0 560 40"
              style={{
                position: "absolute",
                left: -20,
                bottom: -34,
                overflow: "visible",
              }}
            >
              <path
                d="M6 24 C 90 4, 160 38, 250 20 S 430 6, 552 22"
                fill="none"
                stroke={C.oro}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="620"
                strokeDashoffset={620 * (1 - subrayado)}
              />
            </svg>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
