import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, textos } from "../brand";
import { ease } from "../anim";
import { Caption, Etiqueta } from "../components/Caption";
import { Anillo, PhoneCard } from "../components/PhoneCard";

// Escena 5 (11.4-14.4 s): "Recuerdale por WhatsApp con un toque" (boton verde Recordar).
export const Recordar: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const mov = ease(frame, 4, 40, Easing.bezier(0.45, 0, 0.2, 1));
  const zoom = 1 + mov * 0.12;
  const cy = 520 + mov * 320;
  const cx = 540;
  const anillo = ease(frame, 30, 40);
  const pulso = Math.sin(frame / 3) * 0.5 + 0.5;
  // Toque del dedo en el boton
  const toque = ease(frame, 50, 74, Easing.out(Easing.cubic));
  const presionado = interpolate(frame, [48, 52, 58], [1, 0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const listo = ease(frame, 62, 74, Easing.out(Easing.back(1.4)));
  return (
    <AbsoluteFill>
      <PhoneCard
        src="2-cliente.png"
        left={154}
        top={200}
        alto={640}
        zoom={zoom}
        cx={cx}
        cy={cy}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo
          x={75}
          y={930}
          w={455}
          h={120}
          color={C.azulCartera}
          p={anillo}
          radio={36}
          pulso={pulso}
        />
        {/* Ondas del toque */}
        <div
          style={{
            position: "absolute",
            left: 450 - 90,
            top: 1010 - 90,
            width: 180,
            height: 180,
            borderRadius: 999,
            border: "8px solid rgba(255,255,255,0.95)",
            background: "rgba(255,255,255,0.35)",
            opacity: frame >= 50 ? 1 - toque : 0,
            scale: 0.3 + toque * 1.3,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 450 - 24,
            top: 1010 - 24,
            width: 48,
            height: 48,
            borderRadius: 999,
            background: "rgba(255,255,255,0.55)",
            border: "6px solid white",
            boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
            opacity: ease(frame, 40, 48) * (1 - ease(frame, 70, 78)),
            scale: presionado,
          }}
        />
      </PhoneCard>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 880,
          display: "flex",
          justifyContent: "center",
          opacity: listo,
          scale: 0.8 + listo * 0.2,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 16px 30px rgba(3,12,40,0.4)",
            borderRadius: 999,
          }}
        >
          <Etiqueta color={C.verde} size={46}>
            <span style={{ fontFamily: textos }}>✓ Mensaje listo</span>
          </Etiqueta>
        </div>
      </div>
      <Caption
        top={1000}
        size={62}
        lineas={[
          [{ t: "Recuérdale por" }],
          [{ t: "WhatsApp", oro: true }, { t: " con un toque" }],
        ]}
      />
    </AbsoluteFill>
  );
};
