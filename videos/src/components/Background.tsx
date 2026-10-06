import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, ZONA } from "../brand";

// Fondo de marca: degradado azul noche -> azul cartera con brillo celeste que se mueve despacio.
export const Background: React.FC<{ guias?: boolean }> = ({ guias }) => {
  const frame = useCurrentFrame();
  const dx = Math.sin(frame / 55) * 70;
  const dy = Math.cos(frame / 70) * 40;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(170deg, ${C.azulNoche}, ${C.azulCartera})`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${420 + dx}px ${120 + dy}px, rgba(26,163,245,0.55), rgba(26,163,245,0) 70%)`,
        }}
      />
      {guias ? (
        <div
          style={{
            position: "absolute",
            left: ZONA.x0,
            top: ZONA.y0,
            width: ZONA.x1 - ZONA.x0,
            height: ZONA.y1 - ZONA.y0,
            outline: "4px dashed rgba(255,0,200,0.9)",
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
