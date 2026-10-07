import type React from "react";
import { AbsoluteFill, Series } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { Background } from "./components/Background";
import { aCuadros, cargarVoz, COLCHON, RETRASO_VOZ, Voz } from "./voz";
import type { VozFrase } from "./voz";

// Versión con voz de los videos «Así funciona» (#2 y #3): las mismas escenas, pero cada una dura lo que dura su frase de
// voz + un poco de aire. Cada escena tiene un mínimo (lo que necesita su animación para terminar de dibujarse), así que
// ninguna se corta aunque la frase sea corta. Las versiones sin voz (TikTok02Excel, TikTok03Pin) no cambian.
export type EscenaVoz = {
  nombre: string;
  min: number; // cuadros que necesita la animación de la escena
  retraso?: number; // cuadros antes de que entre la voz (por defecto RETRASO_VOZ)
  pad?: number; // segundos de aire después de la frase (por defecto COLCHON)
  el: () => React.ReactNode;
};
export type PropsVoz = { guias: boolean; frases?: VozFrase[] };

const duraciones = (escenas: EscenaVoz[], frases?: VozFrase[]) =>
  escenas.map((e, i) =>
    frases ? Math.max(e.min, (e.retraso ?? RETRASO_VOZ) + aCuadros(frases[i].seg + (e.pad ?? COLCHON))) : e.min,
  );

export const metadataVoz =
  (idVoz: string, escenas: EscenaVoz[]): CalculateMetadataFunction<PropsVoz> =>
  async ({ props }) => {
    const frases = await cargarVoz(idVoz);
    if (frases.length !== escenas.length) {
      throw new Error(`La voz «${idVoz}» tiene ${frases.length} frases y el video tiene ${escenas.length} escenas.`);
    }
    return { durationInFrames: duraciones(escenas, frases).reduce((a, b) => a + b, 0), props: { ...props, frases } };
  };

export const EscenasConVoz: React.FC<PropsVoz & { escenas: EscenaVoz[] }> = ({ escenas, frases, guias }) => {
  const dur = duraciones(escenas, frases);
  let inicio = 0;
  return (
    <AbsoluteFill>
      <Background guias={guias} />
      <Series>
        {escenas.map((e, i) => (
          <Series.Sequence key={e.nombre} name={e.nombre} durationInFrames={dur[i]}>
            {e.el()}
          </Series.Sequence>
        ))}
      </Series>
      {/* La voz va aparte, en cuadros absolutos, para que ninguna se corte al cambiar de escena */}
      {frases
        ? frases.map((f, i) => {
            const desde = inicio + (escenas[i].retraso ?? RETRASO_VOZ);
            inicio += dur[i];
            return <Voz key={i} frase={f} desde={desde} />;
          })
        : null}
    </AbsoluteFill>
  );
};
