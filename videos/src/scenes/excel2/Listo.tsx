import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C, textos } from "../../brand";
import { ease, contar } from "../../anim";
import { Caption, Etiqueta } from "../../components/Caption";
import { Anillo, PhoneCard } from "../../components/PhoneCard";

// Escena 7 (17.5-20.5 s): «¡Listo! Importaste 3 clientes» + «Lo que sigue».
// Geometria medida en la captura real: bloque «Lo que sigue».
const SIGUE = { x: 40, y: 1365, w: 1000, h: 335 };

export const Listo: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const anillo = ease(frame, 40, 50);
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  const chip = ease(frame, 10, 24, Easing.out(Easing.back(1.4)));
  const n = contar(frame, 12, 30, 3);
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/importar-4-listo.png"
        left={154}
        top={200}
        alto={800}
        zoom={1}
        cx={540}
        cy={1300}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo {...SIGUE} color={C.verde} p={anillo} pulso={pulso} radio={30} />
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
        <Etiqueta color={C.verde} size={46}>
          <span style={{ fontFamily: textos }}>✓ {n} clientes importados</span>
        </Etiqueta>
      </div>
      <Caption
        top={1160}
        size={64}
        lineas={[[{ t: "¡Listo! Y no se" }], [{ t: "borró " }, { t: "nada", oro: true }]]}
      />
    </AbsoluteFill>
  );
};
