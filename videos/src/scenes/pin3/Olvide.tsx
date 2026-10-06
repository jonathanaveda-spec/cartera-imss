import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C } from "../../brand";
import { ease } from "../../anim";
import { Caption, Etiqueta } from "../../components/Caption";
import { Anillo, PhoneCard } from "../../components/PhoneCard";

// Escena 7 (16.8-20.2 s): «¿Olvidaste tu PIN?» → entras con tu correo y tus clientes siguen en la nube.
export const Olvide: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const nube = ease(frame, 40, 54, Easing.out(Easing.back(1.4)));
  const ring = ease(frame, 30, 40);
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/pin-2-olvide.png"
        left={154}
        top={200}
        alto={760}
        zoom={1.0}
        cx={540}
        cy={980}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo x={130} y={885} w={820} h={185} color={C.verde} p={ring} pulso={Math.sin(frame / 4) * 0.5 + 0.5} radio={30} />
      </PhoneCard>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 1010,
          display: "flex",
          justifyContent: "center",
          opacity: nube,
          scale: 0.8 + nube * 0.2,
        }}
      >
        <Etiqueta color={C.verde} size={44}>☁️ Tus clientes siguen en la nube</Etiqueta>
      </div>
      <Caption
        top={1130}
        size={60}
        lineas={[[{ t: "¿Olvidaste el PIN?" }], [{ t: "Entras con tu " }, { t: "correo", oro: true }]]}
      />
    </AbsoluteFill>
  );
};
