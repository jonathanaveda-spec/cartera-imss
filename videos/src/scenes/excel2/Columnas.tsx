import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C } from "../../brand";
import { ease } from "../../anim";
import { Caption } from "../../components/Caption";
import { Anillo, PhoneCard } from "../../components/PhoneCard";

// Escena 5 (10.9-14.5 s): la app reconoce las columnas sola. Geometria tomada de la captura real
// (paso «Columnas»): caja «Ya reconocimos» y las insignias «✓ reconocida» de las tarjetas A y B.
export const Columnas: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const baja = ease(frame, 50, 84, Easing.bezier(0.45, 0, 0.2, 1));
  const caja = ease(frame, 14, 24);
  const cajaSale = ease(frame, 50, 58);
  const a = ease(frame, 66, 76);
  const b = ease(frame, 82, 92);
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/importar-2-columnas.png"
        left={154}
        top={200}
        alto={780}
        zoom={1.06}
        cx={540}
        cy={640 + baja * 700}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo x={40} y={425} w={1000} h={305} color={C.verde} p={caja * (1 - cajaSale)} pulso={pulso} radio={36} />
        <Anillo x={335} y={1048} w={220} h={50} color={C.verde} p={a} pulso={pulso} radio={26} />
        <Anillo x={356} y={1373} w={220} h={50} color={C.verde} p={b} pulso={pulso} radio={26} />
      </PhoneCard>
      <Caption
        top={1050}
        size={64}
        lineas={[
          [{ t: "La app reconoce" }],
          [{ t: "tus " }, { t: "columnas", oro: true }],
        ]}
      />
    </AbsoluteFill>
  );
};
