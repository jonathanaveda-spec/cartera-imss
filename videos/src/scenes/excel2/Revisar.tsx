import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../../brand";
import { ease } from "../../anim";
import { Caption, Etiqueta } from "../../components/Caption";
import { Anillo, PhoneCard } from "../../components/PhoneCard";

// Escena 6 (14.5-17.5 s): «Último paso: revisa y confirma» con la vista previa.
// Geometria medida en la captura real: tabla de vista previa.
const TABLA = { x: 40, y: 790, w: 1000, h: 328 };

export const Revisar: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const anillo = ease(frame, 16, 26);
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  const chip = ease(frame, 40, 52);
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/importar-3-revisar.png"
        left={154}
        top={200}
        alto={800}
        zoom={1}
        cx={540}
        cy={860}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo {...TABLA} color={C.azulCartera} p={anillo} pulso={pulso} radio={30} />
      </PhoneCard>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 1050,
          display: "flex",
          justifyContent: "center",
          opacity: chip,
          scale: 0.8 + chip * 0.2,
        }}
      >
        <Etiqueta color={C.verde} size={44}>✓ No se borra nada</Etiqueta>
      </div>
      <Caption
        top={1160}
        size={64}
        lineas={[[{ t: "Tú solo " }, { t: "revisas", oro: true }]]}
      />
    </AbsoluteFill>
  );
};
