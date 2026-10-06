import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C, textos } from "../../brand";
import { ease } from "../../anim";
import { Caption } from "../../components/Caption";
import { Anillo, PhoneCard } from "../../components/PhoneCard";

// Escena 5 (10.6-13.4 s): «Pedir el PIN»: tú eliges cuándo (al salir, 1, 5 o 20 minutos).
// Geometria medida en la captura real: lista «Pedir el PIN».
const SELECTOR = { x: 40, y: 1255, w: 1000, h: 175 };
const OPCIONES = ["Al salir", "1 min", "5 min", "20 min"];

export const Cuando: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const anillo = ease(frame, 10, 20);
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/bloqueo-2-activo.png"
        left={154}
        top={200}
        alto={640}
        zoom={1}
        cx={540}
        cy={1330}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        <Anillo {...SELECTOR} color={C.azulCartera} p={anillo} pulso={pulso} radio={30} />
      </PhoneCard>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 905,
          display: "flex",
          justifyContent: "center",
          gap: 18,
          fontFamily: textos,
        }}
      >
        {OPCIONES.map((t, i) => {
          const ini = 18 + i * 14;
          const p = ease(frame, ini, ini + 10, Easing.out(Easing.back(1.4)));
          const activa = frame >= ini + 6 && frame < ini + 20 + (i === 3 ? 100 : 0);
          return (
            <div
              key={t}
              style={{
                opacity: p,
                scale: 0.8 + p * 0.2,
                background: activa ? C.oro : C.nube,
                color: C.tinta,
                fontWeight: 800,
                fontSize: 42,
                padding: "16px 26px",
                borderRadius: 999,
                boxShadow: "0 14px 28px rgba(3,12,40,0.38)",
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
      <Caption
        top={1015}
        size={64}
        lineas={[[{ t: "Tú eliges " }, { t: "cuándo", oro: true }], [{ t: "se pide" }]]}
      />
    </AbsoluteFill>
  );
};
