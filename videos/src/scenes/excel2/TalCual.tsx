import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { C, textos } from "../../brand";
import { ease } from "../../anim";
import { Caption, Etiqueta } from "../../components/Caption";

// Escena 2 (2.4-5.4 s): tu Excel sirve tal cual, con cualquier nombre de columna y en cualquier orden.
// Todo inventado.
const ANCHO_COL = 190;
const COLS = {
  cel: { a: "Cel", b: "Teléfono", filas: ["55 0000 2101", "55 0000 2102", "55 0000 2103"] },
  nombre: { a: "Nombre", b: "Cliente", filas: ["Ernesto Lara", "Sofía Bravo", "Raúl Medina"] },
  frec: { a: "Frecuencia", b: "Periodo", filas: ["Mensual", "Trimestral", "Mensual"] },
  pago: { a: "Próx. pago", b: "Fecha", filas: ["15/10/2026", "02/11/2026", "28/10/2026"] },
} as const;
type Id = keyof typeof COLS;
const ORDEN_1: Id[] = ["cel", "pago", "nombre", "frec"];
const ORDEN_2: Id[] = ["frec", "cel", "pago", "nombre"];

// gancho = versión del R2 («¿Tu lista está en Excel?»): pregunta enorme arriba desde el primer cuadro y la hoja más abajo.
export const TalCual: React.FC<{ gancho?: boolean }> = ({ gancho = false }) => {
  const dy = gancho ? 300 : 0;
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 12);
  const cambio = ease(frame, 34, 54, Easing.bezier(0.45, 0, 0.2, 1));
  const nombres = ease(frame, 40, 52);
  const chip1 = ease(frame, 20, 32, Easing.out(Easing.back(1.3)));
  const chip2 = ease(frame, 44, 56, Easing.out(Easing.back(1.3)));
  const ids = Object.keys(COLS) as Id[];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 280 + dy,
          width: ANCHO_COL * 4,
          height: 96 + 3 * 100,
          background: "#FFFFFF",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 40px 70px rgba(3,12,40,0.45)",
          translate: `0px ${(1 - entra) * 120}px`,
          opacity: 0.55 + entra * 0.45,
          fontFamily: textos,
        }}
      >
        {ids.map((id) => {
          const x1 = ORDEN_1.indexOf(id) * ANCHO_COL;
          const x2 = ORDEN_2.indexOf(id) * ANCHO_COL;
          const x = x1 + (x2 - x1) * cambio;
          return (
            <div key={id} style={{ position: "absolute", left: x, top: 0, width: ANCHO_COL, height: 96 + 3 * 100, background: "#FFFFFF", zIndex: x1 !== x2 ? 2 : 1 }}>
              <div
                style={{
                  height: 96,
                  background: "#E7ECF5",
                  borderLeft: "2px solid #CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  fontWeight: 800,
                  fontSize: 32,
                  color: C.tinta,
                }}
              >
                <span style={{ opacity: 1 - nombres, position: "absolute" }}>{COLS[id].a}</span>
                <span style={{ opacity: nombres, position: "absolute", color: C.azulCartera }}>{COLS[id].b}</span>
              </div>
              {COLS[id].filas.map((t, i) => (
                <div
                  key={i}
                  style={{
                    height: 100,
                    borderTop: "2px solid #CBD5E1",
                    borderLeft: "2px solid #CBD5E1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 25,
                    fontWeight: 600,
                    color: C.tinta,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 740 + dy,
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div style={{ opacity: chip1, scale: 0.8 + chip1 * 0.2 }}>
          <Etiqueta color={C.azulCartera} size={40}>Cualquier nombre</Etiqueta>
        </div>
        <div style={{ opacity: chip2, scale: 0.8 + chip2 * 0.2 }}>
          <Etiqueta color={C.azulCartera} size={40}>Cualquier orden</Etiqueta>
        </div>
      </div>
      {gancho ? (
        <>
          <Caption top={190} size={104} delay={-10} lineas={[[{ t: "¿Tu lista está" }], [{ t: "en " }, { t: "Excel", oro: true }, { t: "?" }]]} />
          <Caption top={1130} size={84} lineas={[[{ t: "Sirve " }, { t: "tal cual", oro: true }]]} />
        </>
      ) : (
        <Caption
          top={880}
          size={76}
          lineas={[[{ t: "Tu Excel sirve" }], [{ t: "tal cual", oro: true }]]}
        />
      )}
    </AbsoluteFill>
  );
};
