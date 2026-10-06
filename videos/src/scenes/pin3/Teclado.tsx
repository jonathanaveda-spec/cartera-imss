import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../brand";
import { ease } from "../../anim";
import { Caption } from "../../components/Caption";
import { PhoneCard } from "../../components/PhoneCard";
import { Toque } from "../../components/Toque";

// Escena 6 (13.4-16.8 s): la pantalla «Tu cartera está protegida». Se teclea 2-5-8-0 (las teclas quedan en una
// columna, x = 540) y los cuatro puntos se llenan. Posiciones tomadas de la captura de la pantalla de bloqueo.
const TECLAS = [748, 963, 1178, 1393];
const PUNTOS = [412, 497, 582, 667];
const PUNTO_Y = 572;

export const Teclado: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const ini = (i: number) => 20 + i * 14;
  const llenos = TECLAS.filter((_, i) => frame >= ini(i) + 3).length;
  const sube = interpolate(frame, [0, 102], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <PhoneCard
        src="capturas/pin-1-teclado.png"
        left={154}
        top={190}
        alto={940}
        zoom={1.0}
        cx={540}
        cy={1000 + sube * 10}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        {PUNTOS.map((x, i) => {
          const p = ease(frame, ini(i) + 3, ini(i) + 8);
          return (
            <div
              key={x}
              style={{
                position: "absolute",
                left: x - 24,
                top: PUNTO_Y - 24,
                width: 48,
                height: 48,
                borderRadius: 999,
                background: C.blanco,
                opacity: i < llenos ? p : 0,
                scale: 0.6 + p * 0.4,
              }}
            />
          );
        })}
        {TECLAS.map((y, i) => (
          <Toque key={y} x={540} y={y} desde={ini(i)} />
        ))}
      </PhoneCard>
      <Caption
        top={1190}
        size={64}
        lineas={[[{ t: "Sin PIN, " }, { t: "nadie entra", oro: true }]]}
      />
    </AbsoluteFill>
  );
};
