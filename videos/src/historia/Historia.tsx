import type React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { Cierre } from "../scenes/comun/Cierre";
import { Voz } from "../voz";
import { Chat } from "./Chat";
import { CapturaH, DivididaH, FraseH, GanchoH, MensajeH, TituloH } from "./Escenas";
import { resolverHistoria } from "./linea";
import type { HistoriaProps } from "./linea";

export { calcularHistoria } from "./linea";
export type { HistoriaProps } from "./linea";

// Plantilla H (historia). Ver el encabezado de linea.ts para el formato de videos/historias/<id>.json.
export const Historia: React.FC<HistoriaProps> = (props) => {
  const { fps } = useVideoConfig();
  const { escenas } = resolverHistoria(props);
  return (
    <AbsoluteFill>
      <Background guias={props.guias} />
      {props.escenas.map((e, i) => {
        const r = escenas[i];
        return (
          <Sequence key={i} name={`${i + 1} ${e.tipo}`} from={r.ini} durationInFrames={r.dur} premountFor={fps}>
            {e.tipo === "gancho" ? <GanchoH hora={e.hora} titular={e.titular} icono={e.icono} /> : null}
            {e.tipo === "chat" ? <Chat contacto={e.contacto} items={e.items} tiempos={r.items} /> : null}
            {e.tipo === "titulo" ? <TituloH titular={e.titular} emoji={e.emoji} /> : null}
            {e.tipo === "mensaje" ? <MensajeH numero={e.numero} titular={e.titular} contacto={e.contacto} mensaje={e.mensaje} /> : null}
            {e.tipo === "frase" ? <FraseH titular={e.titular} emoji={e.emoji} /> : null}
            {e.tipo === "captura" ? <CapturaH titular={e.titular} imagenes={e.imagenes} /> : null}
            {e.tipo === "dividida" ? <DivididaH antes={e.antes} despues={e.despues} /> : null}
            {e.tipo === "cierre" ? <Cierre frase={e.frase} /> : null}
          </Sequence>
        );
      })}
      {/* La voz va aparte, en cuadros absolutos, para que ninguna se corte al cambiar de escena */}
      {escenas.flatMap((r, i) => r.audios.map((a, j) => <Voz key={`${i}-${j}`} frase={a.frase} desde={r.ini + a.desde} />))}
    </AbsoluteFill>
  );
};
