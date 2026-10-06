import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C } from "../../brand";
import { ease } from "../../anim";
import { Caption, Etiqueta } from "../../components/Caption";
import { Anillo, PhoneCard } from "../../components/PhoneCard";
import { Toque } from "../../components/Toque";

// Escena 3 (5.4-8.4 s): paso 1 del importador «¿Dónde tienes tu lista de clientes?».
// Geometria medida en la captura real (1080x1920): opcion 1 «En este teléfono» y opcion 2 «En mi computadora».
const OPCION_1 = { x: 40, y: 1072, w: 1000, h: 236 };
const OPCION_2 = { x: 40, y: 1330, w: 1000, h: 180 };
const TOQUE = { x: 540, y: 1190 };

export const Donde: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const mov = ease(frame, 6, 50, Easing.bezier(0.45, 0, 0.2, 1));
  const anillo = ease(frame, 14, 24) * (1 - ease(frame, 50, 58));
  const anillo2 = ease(frame, 52, 62);
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  const c1 = ease(frame, 36, 48, Easing.out(Easing.back(1.3)));
  const c2 = ease(frame, 56, 68, Easing.out(Easing.back(1.3)));
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/importar-1-donde.png"
        left={154}
        top={200}
        alto={860}
        zoom={1 + mov * 0.04}
        cx={540}
        cy={1085}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo {...OPCION_1} color={C.azulCartera} p={anillo} pulso={pulso} radio={36} />
        <Anillo {...OPCION_2} color={C.azulCartera} p={anillo2} pulso={pulso} radio={36} />
        <Toque x={TOQUE.x} y={TOQUE.y} desde={30} />
      </PhoneCard>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 1110,
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div style={{ opacity: c1, scale: 0.8 + c1 * 0.2 }}>
          <Etiqueta color={C.azulCartera} size={42}>📱 Celular</Etiqueta>
        </div>
        <div style={{ opacity: c2, scale: 0.8 + c2 * 0.2 }}>
          <Etiqueta color={C.azulCartera} size={42}>💻 Compu</Etiqueta>
        </div>
      </div>
      <Caption
        top={1210}
        size={64}
        lineas={[[{ t: "Dices " }, { t: "dónde", oro: true }, { t: " está" }], [{ t: "tu lista" }]]}
      />
    </AbsoluteFill>
  );
};
