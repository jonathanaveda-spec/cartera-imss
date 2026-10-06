import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C, textos } from "../../brand";
import { ease } from "../../anim";
import { Caption } from "../../components/Caption";
import { Anillo, PhoneCard } from "../../components/PhoneCard";
import { Toque } from "../../components/Toque";

// Escena 4 (8.4-10.9 s): «Elige tu archivo» (paso 1b) y cae el archivo «Mis clientes.xlsx».
// Geometria medida en la captura real: tarjeta del paso 1 y boton «Elegir mi archivo».
const PASO_1 = { x: 40, y: 856, w: 1000, h: 134 };
const BOTON = { x: 587, y: 1780, w: 453, h: 110 };

export const Archivo: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 12);
  const anillo = ease(frame, 6, 16) * (1 - ease(frame, 30, 38));
  const anillo2 = ease(frame, 34, 44);
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  const archivo = ease(frame, 52, 66, Easing.out(Easing.back(1.4)));
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/importar-1b-elegir.png"
        left={154}
        top={200}
        alto={860}
        zoom={1}
        cx={540}
        cy={1300}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo {...PASO_1} color={C.azulCartera} p={anillo} pulso={pulso} radio={36} />
        <Anillo {...BOTON} color={C.azulCartera} p={anillo2} pulso={pulso} radio={36} />
        <Toque x={813} y={1835} desde={46} />
      </PhoneCard>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 1105,
          display: "flex",
          justifyContent: "center",
          opacity: archivo,
          scale: 0.7 + archivo * 0.3,
          translate: `0px ${(1 - archivo) * -60}px`,
        }}
      >
        <div
          style={{
            background: C.nube,
            color: C.tinta,
            fontFamily: textos,
            fontWeight: 800,
            fontSize: 44,
            padding: "14px 34px",
            borderRadius: 999,
            boxShadow: "0 16px 30px rgba(3,12,40,0.4)",
            whiteSpace: "nowrap",
          }}
        >
          📄 Mis clientes.xlsx
        </div>
      </div>
      <Caption
        top={1210}
        size={64}
        lineas={[[{ t: "Eliges tu " }, { t: "archivo", oro: true }]]}
      />
    </AbsoluteFill>
  );
};
