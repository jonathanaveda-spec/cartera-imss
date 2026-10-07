import type React from "react";
import { Audio } from "@remotion/media";
import { staticFile, useVideoConfig } from "remotion";

// Voz en off (ver .claude/skills/voz-cartera-asesor). `node voz.mjs voz/<id>.json` + `node medir-voz.mjs <id>`
// dejan public/voz/<id>/NN.mp3 y tiempos.json con lo que dura de verdad cada frase (sin el silencio de Azure).

export type VozFrase = { archivo: string; seg: number; texto: string };

// Segundos de voz de cada frase, leídos de tiempos.json (se usa dentro de calculateMetadata).
export const cargarVoz = async (id: string): Promise<VozFrase[]> => {
  const r = await fetch(staticFile(`voz/${id}/tiempos.json`));
  if (!r.ok) throw new Error(`No hay voz para «${id}». Corre: node voz.mjs voz/${id}.json && node medir-voz.mjs ${id}`);
  const t = (await r.json()) as {
    frases: { archivo: string; texto: string; segundos: number; fin?: number }[];
  };
  return t.frases.map((f) => ({ archivo: f.archivo, texto: f.texto, seg: f.fin ?? f.segundos }));
};

export const FPS = 30;
// Aire entre el final de una frase y el corte a la siguiente escena
export const COLCHON = 0.35;
// La voz entra unos cuadros después de que aparece lo que dice (la vista guía al oído)
export const RETRASO_VOZ = 4;

export const aCuadros = (seg: number) => Math.round(seg * FPS);

// Una frase de voz colocada en un cuadro de la composición.
export const Voz: React.FC<{ frase: VozFrase; desde: number }> = ({ frase, desde }) => {
  const { fps } = useVideoConfig();
  return (
    <Audio
      src={staticFile(frase.archivo)}
      from={desde}
      durationInFrames={Math.ceil((frase.seg + 0.15) * fps)}
      premountFor={fps}
    />
  );
};
