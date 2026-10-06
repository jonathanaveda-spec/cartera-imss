import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C } from "../../brand";
import { ease } from "../../anim";
import { Caption, Etiqueta } from "../../components/Caption";
import { Anillo, PhoneCard } from "../../components/PhoneCard";

// Escena 4 (7.8-10.6 s): «Bloqueo activado, también con huella». Va sobre la captura del bloqueo activo.
// Geometria medida en la captura real: aviso «Bloqueo activado… también con huella» y casilla de huella.
const AVISO = { x: 40, y: 1040, w: 1000, h: 180 };
const CASILLA = { x: 40, y: 1445, w: 1000, h: 120 };

export const Huella: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const anillo = ease(frame, 10, 20) * (1 - ease(frame, 44, 52));
  const anillo2 = ease(frame, 46, 56);
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  const c1 = ease(frame, 30, 42, Easing.out(Easing.back(1.4)));
  const c2 = ease(frame, 44, 56, Easing.out(Easing.back(1.4)));
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/bloqueo-2-activo.png"
        left={154}
        top={200}
        alto={860}
        zoom={1}
        cx={540}
        cy={1260}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo {...AVISO} color={C.verde} p={anillo} pulso={pulso} radio={30} />
        <Anillo {...CASILLA} color={C.azulCartera} p={anillo2} pulso={pulso} radio={30} />
      </PhoneCard>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 1105,
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div style={{ opacity: c1, scale: 0.8 + c1 * 0.2 }}>
          <Etiqueta color={C.azulCartera} size={42}>👆 Huella</Etiqueta>
        </div>
        <div style={{ opacity: c2, scale: 0.8 + c2 * 0.2 }}>
          <Etiqueta color={C.azulCartera} size={42}>🙂 Face ID</Etiqueta>
        </div>
      </div>
      <Caption
        top={1225}
        size={64}
        lineas={[[{ t: "También con" }], [{ t: "huella", oro: true }, { t: " o Face ID" }]]}
      />
    </AbsoluteFill>
  );
};
