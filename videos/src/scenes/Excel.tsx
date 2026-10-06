import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, textos } from "../brand";
import { ease } from "../anim";
import { Caption } from "../components/Caption";

// Escena 3 (5-7.8 s): el Excel revuelto. Todo inventado, sin datos reales.
const COLS = ["A", "B", "C", "D"];
const FILAS: { celdas: string[]; marca?: number[] }[] = [
  { celdas: ["Cliente", "Fecha", "Monto", "¿Pagó?"] },
  { celdas: ["Rosa", "03/09", "$1,250", "sí"] },
  { celdas: ["Luis", "??", "$980", ""], marca: [1, 3] },
  { celdas: ["Karen", "15/08", "", "no sé"], marca: [2, 3] },
  { celdas: ["Tere", "28/09", "$1,250", "sí"] },
  { celdas: ["Memo", "", "$700", "¿?"], marca: [1, 3] },
];

export const Excel: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 12);
  const sacude = interpolate(frame, [30, 84], [0, 1], {
    extrapolateRight: "clamp",
  });
  const pregunta = ease(frame, 22, 36, Easing.out(Easing.back(1.5)));
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 170,
          top: 270,
          width: 740,
          background: "#FFFFFF",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 40px 70px rgba(3,12,40,0.45)",
          rotate: `${2.5 - sacude * 1.2}deg`,
          translate: `0px ${(1 - entra) * 120}px`,
          opacity: 0.55 + entra * 0.45,
          fontFamily: textos,
        }}
      >
        {/* Letras de columna */}
        <div style={{ display: "flex", background: "#E7ECF5", height: 56 }}>
          <div style={{ width: 60 }} />
          {COLS.map((c) => (
            <div
              key={c}
              style={{
                flex: 1,
                textAlign: "center",
                fontWeight: 800,
                fontSize: 32,
                lineHeight: "56px",
                color: "#64748B",
                borderLeft: "2px solid #CBD5E1",
              }}
            >
              {c}
            </div>
          ))}
        </div>
        {FILAS.map((f, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              height: 104,
              borderTop: "2px solid #CBD5E1",
              background: i === 0 ? "#F1F5F9" : "#FFFFFF",
            }}
          >
            <div
              style={{
                width: 60,
                background: "#E7ECF5",
                textAlign: "center",
                fontWeight: 600,
                fontSize: 28,
                lineHeight: "104px",
                color: "#64748B",
              }}
            >
              {i + 1}
            </div>
            {f.celdas.map((t, j) => {
              const marcada = f.marca?.includes(j);
              return (
                <div
                  key={j}
                  style={{
                    flex: 1,
                    borderLeft: "2px solid #CBD5E1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 38,
                    fontWeight: i === 0 ? 800 : 600,
                    color: C.tinta,
                    background: marcada
                      ? `rgba(217,119,6,${0.25 * ease(frame, 14 + i * 3, 26 + i * 3)})`
                      : "transparent",
                  }}
                >
                  {t}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Signo de pregunta */}
      <div
        style={{
          position: "absolute",
          left: 730,
          top: 150,
          width: 190,
          height: 190,
          borderRadius: 999,
          background: C.blanco,
          color: C.azulCartera,
          fontFamily: textos,
          fontWeight: 800,
          fontSize: 150,
          lineHeight: "190px",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(3,12,40,0.4)",
          scale: pregunta,
          rotate: `${12 - pregunta * 6 + Math.sin(frame / 5) * 3}deg`,
        }}
      >
        ?
      </div>
      <Caption
        top={1090}
        delay={1}
        size={74}
        lineas={[
          [{ t: "¿Y en Excel?" }],
          [{ t: "No sabes" }],
          [{ t: "quién te debe", oro: true }],
        ]}
      />
    </AbsoluteFill>
  );
};
