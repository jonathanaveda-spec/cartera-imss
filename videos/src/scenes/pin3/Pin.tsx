import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C } from "../../brand";
import { ease } from "../../anim";
import { Caption } from "../../components/Caption";
import { Anillo, PhoneCard } from "../../components/PhoneCard";

// Escena 3 (5.0-7.8 s): ventana «🔒 Bloqueo de la app»: «Crea un PIN de 4 números».
// Geometria medida en la captura real: los dos campos de PIN.
const CAMPOS = { x: 24, y: 775, w: 532, h: 395 };

export const Pin: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const anillo = ease(frame, 14, 24);
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/bloqueo-1-activar.png"
        left={154}
        top={200}
        alto={860}
        zoom={1}
        cx={540}
        cy={1060}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo {...CAMPOS} color={C.azulCartera} p={anillo} pulso={pulso} radio={30} />
      </PhoneCard>
      {/* Cuatro puntos que se llenan */}
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 1105,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", gap: 30, background: C.nube, padding: "26px 50px", borderRadius: 999, boxShadow: "0 16px 30px rgba(3,12,40,0.4)" }}>
          {[0, 1, 2, 3].map((i) => {
            const p = ease(frame, 24 + i * 8, 32 + i * 8, Easing.out(Easing.back(2)));
            return (
              <div
                key={i}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  border: `5px solid ${C.azulCartera}`,
                  background: p > 0.5 ? C.azulCartera : "transparent",
                  scale: 0.8 + p * 0.25,
                }}
              />
            );
          })}
        </div>
      </div>
      <Caption
        top={1255}
        size={64}
        lineas={[[{ t: "Un " }, { t: "PIN", oro: true }, { t: " de 4 números" }]]}
      />
    </AbsoluteFill>
  );
};
