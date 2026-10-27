import { Composition } from "remotion";
import { calcularHistoria, Historia } from "./historia/Historia";
import type { HistoriaProps } from "./historia/Historia";
import m08 from "../historias/m08-lista-activos.json";
import p12 from "../historias/p12-clientes-activos.json";
import { T06, calcularT06, TOTAL_T06 } from "./semana22/T06";
import { H07, calcularH07, TOTAL_H07 } from "./semana22/H07";
import { T07, calcularT07, TOTAL_T07 } from "./semana22/T07";
import { H08, calcularH08, TOTAL_H08 } from "./semana22/H08";
import { S01, calcularS01, TOTAL_S01 } from "./sloth/S01";
import h06 from "../historias/h06-sospechoso-1.json";

// Composiciones de la semana 20–25/10/2026 (plantilla H con las escenas nuevas de historia/Nuevas.tsx).
// Para sumar una: importa su JSON y agrégalo a la lista.
const HISTORIAS = [m08, p12, h06] as unknown as HistoriaProps[];

export const ComposicionesSemana20: React.FC = () => (
  <>
    {HISTORIAS.map((h) => (
      <Composition key={h.id} id={`H-${h.id}`} component={Historia} durationInFrames={600} fps={30} width={1080} height={1920} defaultProps={h} calculateMetadata={calcularHistoria} />
    ))}
    <Composition id="T06-una-palabra" component={T06} durationInFrames={Math.round(TOTAL_T06 * 30)} fps={30} width={1080} height={1920} defaultProps={{}} calculateMetadata={calcularT06} />
    <Composition id="H07-cobranza-2" component={H07} durationInFrames={Math.round(TOTAL_H07 * 30)} fps={30} width={1080} height={1920} defaultProps={{}} calculateMetadata={calcularH07} />
    <Composition id="T07-dejar-en-visto" component={T07} durationInFrames={Math.round(TOTAL_T07 * 30)} fps={30} width={1080} height={1920} defaultProps={{}} calculateMetadata={calcularT07} />
    <Composition id="H08-pista-escondida" component={H08} durationInFrames={Math.round(TOTAL_H08 * 30)} fps={30} width={1080} height={1920} defaultProps={{}} calculateMetadata={calcularH08} />
    <Composition id="S01-estilo-sloth" component={S01} durationInFrames={Math.round(TOTAL_S01 * 30)} fps={30} width={1080} height={1920} defaultProps={{}} calculateMetadata={calcularS01} />
  </>
);
