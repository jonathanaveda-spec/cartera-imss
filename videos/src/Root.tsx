import { Composition } from "remotion";
import { TikTok01Libreta } from "./TikTok01Libreta";
import { TikTok02Excel, TOTAL_02 } from "./TikTok02Excel";
import { TikTok03Pin, TOTAL_03 } from "./TikTok03Pin";
import { TikTok02ExcelVoz, calcular02Voz } from "./TikTok02ExcelVoz";
import { TikTok03PinVoz, calcular03Voz } from "./TikTok03PinVoz";
import { calcularTarjeta, Tarjeta } from "./tarjeta/Tarjeta";
import type { TarjetaProps } from "./tarjeta/Tarjeta";
import { calcularHistoria, Historia } from "./historia/Historia";
import type { HistoriaProps } from "./historia/Historia";
import t01 from "../tarjetas/t01-5-senales.json";
import h01 from "../historias/h01-11pm.json";
import ejemplo from "../historias/ejemplo-antes-despues.json";
import p04 from "../historias/tiktok-04-mensajes.json";

// Cada archivo de videos/tarjetas/*.json y videos/historias/*.json es una composición:
// para sumar una, importa su JSON arriba y agrégalo a estas listas.
const TARJETAS = [t01] as unknown as TarjetaProps[];
const HISTORIAS = [h01, ejemplo] as unknown as HistoriaProps[];
const MENSAJES = p04 as unknown as HistoriaProps; // TikTok #4 (misma plantilla de historia)

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TikTok01Libreta"
        component={TikTok01Libreta}
        durationInFrames={630}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ guias: false }}
      />
      <Composition
        id="TikTok02Excel"
        component={TikTok02Excel}
        durationInFrames={TOTAL_02}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ guias: false }}
      />
      <Composition
        id="TikTok03Pin"
        component={TikTok03Pin}
        durationInFrames={TOTAL_03}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ guias: false }}
      />
      <Composition
        id="TikTok02ExcelVoz"
        component={TikTok02ExcelVoz}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ guias: false }}
        calculateMetadata={calcular02Voz}
      />
      <Composition
        id="TikTok03PinVoz"
        component={TikTok03PinVoz}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ guias: false }}
        calculateMetadata={calcular03Voz}
      />
      <Composition
        id="TikTok04Mensajes"
        component={Historia}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={MENSAJES}
        calculateMetadata={calcularHistoria}
      />
      {TARJETAS.map((t) => (
        <Composition
          key={t.id}
          id={`T-${t.id}`}
          component={Tarjeta}
          durationInFrames={450}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={t}
          calculateMetadata={calcularTarjeta}
        />
      ))}
      {HISTORIAS.map((h) => (
        <Composition
          key={h.id}
          id={`H-${h.id}`}
          component={Historia}
          durationInFrames={600}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={h}
          calculateMetadata={calcularHistoria}
        />
      ))}
    </>
  );
};
