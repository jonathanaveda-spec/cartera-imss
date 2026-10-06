import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C, textos } from "../../brand";
import { ease } from "../../anim";
import { Caption } from "../../components/Caption";

// Escena 2 (2.4-5.0 s): el problema. Una lista de clientes sin protección (todo dibujado, sin datos reales)
// y chips rojos con lo que se ve: nombres, CURP, NSS, celulares.
const FILAS = [0, 1, 2, 3, 4];
const CHIPS = [
  { t: "Nombres", x: 40, y: 150, ini: 16 },
  { t: "CURP", x: 460, y: 300, ini: 26 },
  { t: "NSS", x: 70, y: 450, ini: 36 },
  { t: "Celulares", x: 400, y: 560, ini: 46 },
];

export const Expuesta: React.FC = () => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 154 - 14,
          top: 200 - 14,
          width: 772 + 28,
          height: 700 + 28,
          borderRadius: 64,
          background: C.tinta,
          boxShadow: "0 40px 80px rgba(3,12,40,0.5), 0 0 0 3px rgba(255,255,255,0.18)",
          opacity: 0.3 + entra * 0.7,
          translate: `0px ${(1 - entra) * 100}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 14,
            width: 772,
            height: 700,
            borderRadius: 50,
            overflow: "hidden",
            background: C.nube,
            fontFamily: textos,
          }}
        >
          <div style={{ background: C.azulCartera, height: 100, color: C.blanco, fontWeight: 800, fontSize: 42, lineHeight: "100px", paddingLeft: 36 }}>
            Cartera Asesor
          </div>
          {FILAS.map((i) => {
            const p = ease(frame, 4 + i * 3, 16 + i * 3);
            return (
              <div
                key={i}
                style={{
                  margin: "20px 28px 0",
                  height: 96,
                  borderRadius: 24,
                  background: C.blanco,
                  boxShadow: "0 4px 14px rgba(15,23,42,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  paddingLeft: 24,
                  opacity: p,
                  translate: `${(1 - p) * 40}px 0px`,
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 999, background: "#CBD5E1" }} />
                <div>
                  <div style={{ width: 230 + (i % 3) * 50, height: 22, borderRadius: 11, background: "#94A3B8" }} />
                  <div style={{ width: 150 + (i % 2) * 70, height: 16, borderRadius: 8, background: "#CBD5E1", marginTop: 14 }} />
                </div>
              </div>
            );
          })}
          {CHIPS.map((c) => {
            const p = ease(frame, c.ini, c.ini + 10, Easing.out(Easing.back(1.5)));
            return (
              <div
                key={c.t}
                style={{
                  position: "absolute",
                  left: c.x,
                  top: c.y,
                  background: C.rojo,
                  color: C.blanco,
                  fontWeight: 800,
                  fontSize: 44,
                  padding: "10px 28px",
                  borderRadius: 999,
                  boxShadow: "0 12px 24px rgba(3,12,40,0.35)",
                  opacity: p,
                  scale: 0.7 + p * 0.3,
                  rotate: `${(c.x % 3) - 1.5}deg`,
                }}
              >
                👁 {c.t}
              </div>
            );
          })}
        </div>
      </div>
      <Caption
        top={990}
        size={64}
        lineas={[[{ t: "Ahí están los datos" }], [{ t: "de " }, { t: "tus clientes", oro: true }]]}
      />
    </AbsoluteFill>
  );
};
