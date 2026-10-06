import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease, contar } from "../anim";
import { Caption } from "../components/Caption";
import { Anillo, PhoneCard } from "../components/PhoneCard";

// Escena 4 (7.8-11.4 s): resumen de la cartera con la captura real (clientes inventados).
const ESTADOS = [
  { id: "dia", etiqueta: "Al día", total: 10, color: C.verde, ini: 20, x: 553, y: 200 },
  { id: "vencer", etiqueta: "Por vencer", total: 3, color: C.ambar, ini: 44, x: 40, y: 425 },
  { id: "moroso", etiqueta: "Morosos", total: 3, color: C.rojo, ini: 68, x: 553, y: 425 },
] as const;

export const Resumen: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  const zoom = interpolate(frame, [0, 108], [1, 1.015], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <PhoneCard
        src="1-inicio.png"
        left={154}
        top={200}
        alto={736}
        zoom={zoom}
        cx={540}
        cy={430}
        opacity={0.3 + entra * 0.7}
        translateY={(1 - entra) * 100}
      >
        {ESTADOS.map((e) => {
          const entrada = ease(frame, e.ini, e.ini + 10);
          const salida = ease(frame, e.ini + 22, e.ini + 30);
          const ultimo = e.id === "moroso";
          return (
            <Anillo
              key={e.id}
              x={e.x}
              y={e.y}
              w={487}
              h={e.id === "dia" ? 200 : 202}
              color={e.color}
              p={entrada * (ultimo ? 1 : 1 - salida)}
              pulso={Math.sin(frame / 4) * 0.5 + 0.5}
            />
          );
        })}
      </PhoneCard>
      {/* Cifras que cuentan */}
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 985,
          display: "flex",
          gap: 25,
          justifyContent: "center",
        }}
      >
        {ESTADOS.map((e) => {
          const p = ease(frame, e.ini, e.ini + 12);
          return (
            <div
              key={e.id}
              style={{
                width: 250,
                height: 160,
                borderRadius: 32,
                background: C.nube,
                borderBottom: `14px solid ${e.color}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.25 + p * 0.75,
                translate: `0px ${(1 - p) * 20}px`,
                boxShadow: "0 16px 30px rgba(3,12,40,0.35)",
              }}
            >
              <div
                style={{
                  fontFamily: titulos,
                  fontWeight: 800,
                  fontSize: 90,
                  lineHeight: 1,
                  color: C.tinta,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {contar(frame, e.ini, e.ini + 14, e.total)}
              </div>
              <div
                style={{
                  fontFamily: textos,
                  fontWeight: 800,
                  fontSize: 40,
                  color: C.tinta,
                  marginTop: 4,
                }}
              >
                {e.etiqueta}
              </div>
            </div>
          );
        })}
      </div>
      <Caption
        top={1180}
        size={66}
        lineas={[
          [{ t: "Tu cartera clara" }],
          [{ t: "de un " }, { t: "vistazo", oro: true }],
        ]}
      />
    </AbsoluteFill>
  );
};
