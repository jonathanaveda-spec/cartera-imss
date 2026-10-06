import { AbsoluteFill, Easing } from "remotion";
import { useCurrentFrame } from "remotion";
import { C, textos } from "../brand";
import { ease } from "../anim";
import { Caption, Etiqueta } from "../components/Caption";
import { Anillo, PhoneCard } from "../components/PhoneCard";

// Escena 6 (14.4-17.2 s): "Y mandale su comprobante" (captura 4-comprobante).
export const Comprobante: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const mov = ease(frame, 0, 60, Easing.bezier(0.45, 0, 0.2, 1));
  const zoom = 1;
  const cy = 1500;
  const msg = ease(frame, 14, 24);
  const boton = ease(frame, 40, 50);
  const pulso = Math.sin(frame / 3) * 0.5 + 0.5;
  const listo = ease(frame, 30, 42, Easing.out(Easing.back(1.4)));
  return (
    <AbsoluteFill>
      <PhoneCard
        src="4-comprobante.png"
        left={100}
        top={200}
        alto={680}
        zoom={zoom}
        cx={540}
        cy={cy}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo
          x={40}
          y={1086}
          w={1000}
          h={394}
          color={C.verde}
          p={msg * (1 - boton)}
          radio={44}
        />
        <Anillo
          x={505}
          y={1780}
          w={535}
          h={110}
          color={C.verde}
          p={boton}
          radio={36}
          pulso={pulso}
        />
      </PhoneCard>
      <div
        style={{
          position: "absolute",
          left: 60,
          width: 880,
          top: 925,
          display: "flex",
          justifyContent: "center",
          opacity: listo,
          scale: 0.8 + listo * 0.2,
        }}
      >
        <div
          style={{ boxShadow: "0 16px 30px rgba(3,12,40,0.4)", borderRadius: 999 }}
        >
          <Etiqueta color={C.verde} size={46}>
            <span style={{ fontFamily: textos }}>✓ Pago registrado</span>
          </Etiqueta>
        </div>
      </div>
      <Caption
        top={1040}
        size={72}
        lineas={[
          [{ t: "Y mándale su" }],
          [{ t: "comprobante", oro: true }],
        ]}
      />
    </AbsoluteFill>
  );
};
