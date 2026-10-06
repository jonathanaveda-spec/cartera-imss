import { AbsoluteFill, Series } from "remotion";
import { Background } from "./components/Background";
import { Gancho } from "./scenes/excel2/Gancho";
import { TalCual } from "./scenes/excel2/TalCual";
import { Donde } from "./scenes/excel2/Donde";
import { Archivo } from "./scenes/excel2/Archivo";
import { Columnas } from "./scenes/excel2/Columnas";
import { Revisar } from "./scenes/excel2/Revisar";
import { Listo } from "./scenes/excel2/Listo";
import { Cierre } from "./scenes/comun/Cierre";

export type Props = { guias: boolean };

// Duraciones en cuadros (30 fps). Ver videos/guiones/tiktok-02-excel.md
export const ESCENAS_02 = {
  gancho: 72, // 0.0 - 2.4 s
  talCual: 90, // 2.4 - 5.4 s
  donde: 90, // 5.4 - 8.4 s
  archivo: 75, // 8.4 - 10.9 s
  columnas: 108, // 10.9 - 14.5 s
  revisar: 90, // 14.5 - 17.5 s
  listo: 90, // 17.5 - 20.5 s
  cierre: 120, // 20.5 - 24.5 s
} as const;

export const TOTAL_02 = Object.values(ESCENAS_02).reduce((a, b) => a + b, 0);

export const TikTok02Excel: React.FC<Props> = ({ guias }) => (
  <AbsoluteFill>
    <Background guias={guias} />
    <Series>
      <Series.Sequence name="1 Gancho" durationInFrames={ESCENAS_02.gancho}>
        <Gancho />
      </Series.Sequence>
      <Series.Sequence name="2 Tal cual" durationInFrames={ESCENAS_02.talCual}>
        <TalCual />
      </Series.Sequence>
      <Series.Sequence name="3 Donde" durationInFrames={ESCENAS_02.donde}>
        <Donde />
      </Series.Sequence>
      <Series.Sequence name="4 Archivo" durationInFrames={ESCENAS_02.archivo}>
        <Archivo />
      </Series.Sequence>
      <Series.Sequence name="5 Columnas" durationInFrames={ESCENAS_02.columnas}>
        <Columnas />
      </Series.Sequence>
      <Series.Sequence name="6 Revisar" durationInFrames={ESCENAS_02.revisar}>
        <Revisar />
      </Series.Sequence>
      <Series.Sequence name="7 Listo" durationInFrames={ESCENAS_02.listo}>
        <Listo />
      </Series.Sequence>
      <Series.Sequence name="8 Cierre" durationInFrames={ESCENAS_02.cierre}>
        <Cierre frase={["Importa tu Excel", "en 2 minutos"]} />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
