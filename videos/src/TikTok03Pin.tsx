import { AbsoluteFill, Series } from "remotion";
import { Background } from "./components/Background";
import { Gancho } from "./scenes/pin3/Gancho";
import { Expuesta } from "./scenes/pin3/Expuesta";
import { Pin } from "./scenes/pin3/Pin";
import { Huella } from "./scenes/pin3/Huella";
import { Cuando } from "./scenes/pin3/Cuando";
import { Teclado } from "./scenes/pin3/Teclado";
import { Olvide } from "./scenes/pin3/Olvide";
import { Cierre } from "./scenes/comun/Cierre";

export type Props = { guias: boolean };

// Duraciones en cuadros (30 fps). Ver videos/guiones/tiktok-03-pin.md
export const ESCENAS_03 = {
  gancho: 72, // 0.0 - 2.4 s
  expuesta: 78, // 2.4 - 5.0 s
  pin: 84, // 5.0 - 7.8 s
  huella: 84, // 7.8 - 10.6 s
  cuando: 84, // 10.6 - 13.4 s
  teclado: 102, // 13.4 - 16.8 s
  olvide: 102, // 16.8 - 20.2 s
  cierre: 114, // 20.2 - 24.0 s
} as const;

export const TOTAL_03 = Object.values(ESCENAS_03).reduce((a, b) => a + b, 0);

export const TikTok03Pin: React.FC<Props> = ({ guias }) => (
  <AbsoluteFill>
    <Background guias={guias} />
    <Series>
      <Series.Sequence name="1 Gancho" durationInFrames={ESCENAS_03.gancho}>
        <Gancho />
      </Series.Sequence>
      <Series.Sequence name="2 Expuesta" durationInFrames={ESCENAS_03.expuesta}>
        <Expuesta />
      </Series.Sequence>
      <Series.Sequence name="3 PIN" durationInFrames={ESCENAS_03.pin}>
        <Pin />
      </Series.Sequence>
      <Series.Sequence name="4 Huella" durationInFrames={ESCENAS_03.huella}>
        <Huella />
      </Series.Sequence>
      <Series.Sequence name="5 Cuando" durationInFrames={ESCENAS_03.cuando}>
        <Cuando />
      </Series.Sequence>
      <Series.Sequence name="6 Teclado" durationInFrames={ESCENAS_03.teclado}>
        <Teclado />
      </Series.Sequence>
      <Series.Sequence name="7 Olvide" durationInFrames={ESCENAS_03.olvide}>
        <Olvide />
      </Series.Sequence>
      <Series.Sequence name="8 Cierre" durationInFrames={ESCENAS_03.cierre}>
        <Cierre frase={["Protege tu cartera", "con PIN y huella"]} />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
