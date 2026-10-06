import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, textos } from "../brand";
import { ease, contar } from "../anim";
import { Caption, Etiqueta } from "../components/Caption";

// Escena 2 (2.2-5 s): el dolor de la libreta, "se te paso cobrar a 3 clientes".
// Nombres inventados.
const FILAS = [
  { n: "Doña Rosa", marca: true },
  { n: "Don Luis", marca: false },
  { n: "Karen", marca: true },
  { n: "Tere", marca: false },
  { n: "Don Memo", marca: true },
];

export const Libreta: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 12);
  const deriva = interpolate(frame, [0, 84], [0, -2.2], {
    extrapolateRight: "clamp",
  });
  const marcadas = FILAS.filter((f) => f.marca).length;
  const cuenta = contar(frame, 28, 60, marcadas);
  let nMarca = -1;
  return (
    <AbsoluteFill>
      {/* Hoja de libreta */}
      <div
        style={{
          position: "absolute",
          left: 130,
          top: 250,
          width: 740,
          height: 760,
          background: "#FFF8E6",
          borderRadius: 28,
          boxShadow: "0 40px 70px rgba(3,12,40,0.45)",
          rotate: `${-3 + deriva * 0.5}deg`,
          translate: `0px ${(1 - entra) * 120}px`,
          opacity: 0.55 + entra * 0.45,
          overflow: "hidden",
        }}
      >
        {/* Margen rojo de libreta */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 0,
            bottom: 0,
            width: 4,
            background: "rgba(220,38,38,0.45)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 130,
            top: 40,
            fontFamily: textos,
            fontWeight: 800,
            fontSize: 48,
            color: "#5B4A2E",
            fontStyle: "italic",
          }}
        >
          Cobros del mes
        </div>
        {FILAS.map((f, i) => {
          if (f.marca) nMarca += 1;
          const idx = nMarca;
          const p = f.marca ? ease(frame, 20 + idx * 12, 30 + idx * 12) : 0;
          return (
            <div
              key={f.n}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 150 + i * 118,
                height: 118,
                borderBottom: "3px solid rgba(29,78,216,0.22)",
                display: "flex",
                alignItems: "center",
                paddingLeft: 130,
                paddingRight: 36,
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: textos,
                  fontWeight: 600,
                  fontSize: 46,
                  fontStyle: "italic",
                  color: "#4A4A58",
                }}
              >
                {f.n}
              </span>
              {f.marca ? (
                <span
                  style={{
                    scale: 1.6 - p * 0.6,
                    opacity: p,
                    rotate: "-6deg",
                  }}
                >
                  <Etiqueta color={C.rojo} size={42}>
                    ¿pagó?
                  </Etiqueta>
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: textos,
                    fontWeight: 800,
                    fontSize: 50,
                    color: C.verde,
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Contador de atrasados */}
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 190,
          rotate: "5deg",
          opacity: ease(frame, 26, 38),
          scale: 0.7 + ease(frame, 26, 40, Easing.out(Easing.back(1.4))) * 0.3,
        }}
      >
        <Etiqueta color={C.rojo} size={50}>
          {cuenta} atrasados
        </Etiqueta>
      </div>
      <Caption
        top={1090}
        delay={1}
        size={78}
        lineas={[
          [{ t: "Se te pasó cobrarle" }],
          [{ t: "a " }, { t: "3 clientes", oro: true }],
        ]}
      />
    </AbsoluteFill>
  );
};
