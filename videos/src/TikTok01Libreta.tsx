import { AbsoluteFill, Series } from "remotion";
import { Background } from "./components/Background";
import { Gancho } from "./scenes/Gancho";
import { Libreta } from "./scenes/Libreta";
import { Excel } from "./scenes/Excel";
import { Resumen } from "./scenes/Resumen";
import { Recordar } from "./scenes/Recordar";
import { Comprobante } from "./scenes/Comprobante";
import { Llamado } from "./scenes/Llamado";

export type Props = { guias: boolean };

// Duraciones en cuadros (30 fps). Total 630 = 21 s. Ver videos/guiones/tiktok-01-libreta.md
export const ESCENAS = {
  gancho: 66, // 0.0 - 2.2 s
  libreta: 84, // 2.2 - 5.0 s
  excel: 84, // 5.0 - 7.8 s
  resumen: 108, // 7.8 - 11.4 s
  recordar: 90, // 11.4 - 14.4 s
  comprobante: 84, // 14.4 - 17.2 s
  llamado: 114, // 17.2 - 21.0 s
} as const;

export const TOTAL = Object.values(ESCENAS).reduce((a, b) => a + b, 0);

export const TikTok01Libreta: React.FC<Props> = ({ guias }) => {
  return (
    <AbsoluteFill>
      <Background guias={guias} />
      <Series>
        <Series.Sequence name="1 Gancho" durationInFrames={ESCENAS.gancho}>
          <Gancho />
        </Series.Sequence>
        <Series.Sequence name="2 Libreta" durationInFrames={ESCENAS.libreta}>
          <Libreta />
        </Series.Sequence>
        <Series.Sequence name="3 Excel" durationInFrames={ESCENAS.excel}>
          <Excel />
        </Series.Sequence>
        <Series.Sequence name="4 Resumen" durationInFrames={ESCENAS.resumen}>
          <Resumen />
        </Series.Sequence>
        <Series.Sequence name="5 Recordar" durationInFrames={ESCENAS.recordar}>
          <Recordar />
        </Series.Sequence>
        <Series.Sequence name="6 Comprobante" durationInFrames={ESCENAS.comprobante}>
          <Comprobante />
        </Series.Sequence>
        <Series.Sequence name="7 Llamado" durationInFrames={ESCENAS.llamado}>
          <Llamado />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
