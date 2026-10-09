import { Composition } from "remotion";
import { calcularTarjeta, Tarjeta } from "./tarjeta/Tarjeta";
import type { TarjetaProps } from "./tarjeta/Tarjeta";
import { calcularHistoria, Historia } from "./historia/Historia";
import type { HistoriaProps } from "./historia/Historia";
import { R2ExcelCorto, calcularR2 } from "./R2ExcelCorto";
import m02 from "../tarjetas/m02-4-datos.json";
import t02 from "../tarjetas/t02-aviso-3-dias.json";
import p06 from "../historias/p06-fecha-sola.json";
import p07 from "../historias/p07-resumen-del-dia.json";
import h03 from "../historias/h03-curp.json";

// Composiciones de la semana 12–18/10 (martes 13 en adelante). Para sumar una: importa su JSON y agrégalo a la lista.
// Se separó de Root.tsx para no pisar los cambios de otros.
const TARJETAS = [m02, t02] as unknown as TarjetaProps[];
const HISTORIAS = [p06, p07, h03] as unknown as HistoriaProps[];

export const ComposicionesSemana12: React.FC = () => (
  <>
    <Composition
      id="R2-excel-corto"
      component={R2ExcelCorto}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ guias: false }}
      calculateMetadata={calcularR2}
    />
    {TARJETAS.map((t) => (
      <Composition key={t.id} id={`T-${t.id}`} component={Tarjeta} durationInFrames={450} fps={30} width={1080} height={1920} defaultProps={t} calculateMetadata={calcularTarjeta} />
    ))}
    {HISTORIAS.map((h) => (
      <Composition key={h.id} id={`H-${h.id}`} component={Historia} durationInFrames={600} fps={30} width={1080} height={1920} defaultProps={h} calculateMetadata={calcularHistoria} />
    ))}
  </>
);
