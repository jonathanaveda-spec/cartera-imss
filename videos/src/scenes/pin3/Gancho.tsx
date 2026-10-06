import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, titulos } from "../../brand";
import { ease } from "../../anim";

// Escena 1 (0-2.4 s): gancho «Si alguien toma tu celular… ¿ve tu cartera?» con unos ojos que miran.
export const Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const zoomLento = interpolate(frame, [0, 72], [1, 1.03], { extrapolateRight: "clamp" });
  const linea = (i: number) => {
    const p = ease(frame, i * 4, i * 4 + 12);
    return { translate: `0px ${(1 - p) * 60}px`, scale: 1.04 - p * 0.04, opacity: 0.8 + p * 0.2 };
  };
  const ojos = ease(frame, 0, 14);
  // Los ojos miran de lado a lado
  const mira = Math.sin(frame / 7) * 14;
  const estilo = {
    fontFamily: titulos,
    fontWeight: 800,
    fontSize: 112,
    lineHeight: 1.02,
    letterSpacing: -2.5,
    color: C.blanco,
    textShadow: "0 6px 28px rgba(5,20,60,0.45)",
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
  };
  return (
    <AbsoluteFill style={{ scale: zoomLento }}>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 380,
          textAlign: "center",
          fontSize: 190,
          lineHeight: 1,
          scale: 0.85 + ojos * 0.15,
          opacity: 0.8 + ojos * 0.2,
          translate: `${mira}px 0px`,
        }}
      >
        👀
      </div>
      <div style={{ position: "absolute", left: 140, width: 800, top: 650 }}>
        <div style={{ ...estilo, ...linea(0), fontSize: 96 }}>Si alguien</div>
        <div style={{ ...estilo, ...linea(1), fontSize: 96 }}>toma tu celular…</div>
        <div style={{ ...estilo, ...linea(2), marginTop: 36 }}>¿ve tu</div>
        <div style={{ ...estilo, ...linea(3), color: C.oro, fontSize: 132 }}>cartera?</div>
      </div>
    </AbsoluteFill>
  );
};
