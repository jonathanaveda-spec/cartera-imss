import { Composition } from "remotion";
import { calcularHistoria, Historia } from "./historia/Historia";
import type { HistoriaProps } from "./historia/Historia";
import m08 from "../historias/m08-lista-activos.json";
import p12 from "../historias/p12-clientes-activos.json";
import h06 from "../historias/h06-sospechoso-1.json";

// Composiciones de la semana 20–25/10/2026 (plantilla H con las escenas nuevas de historia/Nuevas.tsx).
// Para sumar una: importa su JSON y agrégalo a la lista.
const HISTORIAS = [m08, p12, h06] as unknown as HistoriaProps[];

export const ComposicionesSemana20: React.FC = () => (
  <>
    {HISTORIAS.map((h) => (
      <Composition key={h.id} id={`H-${h.id}`} component={Historia} durationInFrames={600} fps={30} width={1080} height={1920} defaultProps={h} calculateMetadata={calcularHistoria} />
    ))}
  </>
);
