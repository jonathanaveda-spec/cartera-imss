import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, textos, titulos } from "../../brand";
import { ease } from "../../anim";

// Escena 1 (0-2.4 s): gancho «Pásale tu Excel en 2 minutos» con un reloj que se llena.
export const Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const zoomLento = interpolate(frame, [0, 72], [1, 1.03], { extrapolateRight: "clamp" });
  const linea = (i: number) => {
    const p = ease(frame, i * 4, i * 4 + 12);
    return { translate: `0px ${(1 - p) * 60}px`, scale: 1.04 - p * 0.04, opacity: 0.8 + p * 0.2 };
  };
  const reloj = ease(frame, 0, 14, Easing.out(Easing.back(1.3)));
  const giro = ease(frame, 4, 64, Easing.bezier(0.45, 0, 0.2, 1));
  const R = 118;
  const L = 2 * Math.PI * R;
  const estilo = {
    fontFamily: titulos,
    fontWeight: 800,
    fontSize: 132,
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
          top: 360,
          display: "flex",
          justifyContent: "center",
          scale: 0.8 + reloj * 0.2,
          opacity: 0.8 + reloj * 0.2,
        }}
      >
        <div style={{ position: "relative", width: 300, height: 300 }}>
          <svg width="300" height="300" viewBox="0 0 300 300" style={{ rotate: "-90deg" }}>
            <circle cx="150" cy="150" r={R} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="22" />
            <circle
              cx="150"
              cy="150"
              r={R}
              fill="none"
              stroke={C.oro}
              strokeWidth="22"
              strokeLinecap="round"
              strokeDasharray={L}
              strokeDashoffset={L * (1 - giro)}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: titulos,
              fontWeight: 800,
              color: C.blanco,
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: 120, letterSpacing: -3 }}>2</span>
            <span style={{ fontFamily: textos, fontSize: 44 }}>min</span>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 140, width: 800, top: 740 }}>
        <div style={{ ...estilo, ...linea(0) }}>Pásale tu</div>
        <div style={{ ...estilo, ...linea(1), color: C.oro }}>Excel</div>
        <div style={{ ...estilo, ...linea(2), fontSize: 112 }}>en 2 minutos</div>
      </div>
    </AbsoluteFill>
  );
};
