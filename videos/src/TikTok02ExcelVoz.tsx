import { Gancho } from "./scenes/excel2/Gancho";
import { TalCual } from "./scenes/excel2/TalCual";
import { Donde } from "./scenes/excel2/Donde";
import { Archivo } from "./scenes/excel2/Archivo";
import { Columnas } from "./scenes/excel2/Columnas";
import { Revisar } from "./scenes/excel2/Revisar";
import { Listo } from "./scenes/excel2/Listo";
import { Cierre } from "./scenes/comun/Cierre";
import { EscenasConVoz, metadataVoz } from "./conVoz";
import type { EscenaVoz, PropsVoz } from "./conVoz";

// #2 «Pásale tu Excel en 2 minutos» con voz (Jorge). Mismas escenas que TikTok02Excel; cada una dura lo que su frase.
// Mínimos = cuadro en que termina la animación de cada escena + unos cuadros de aire. Guion: guiones/tiktok-02-excel.md
const ESCENAS: EscenaVoz[] = [
  { nombre: "1 Gancho", min: 72, el: () => <Gancho /> },
  { nombre: "2 Tal cual", min: 64, el: () => <TalCual /> },
  { nombre: "3 Donde", min: 78, el: () => <Donde /> },
  { nombre: "4 Archivo", min: 76, el: () => <Archivo /> },
  { nombre: "5 Columnas", min: 100, el: () => <Columnas /> },
  { nombre: "6 Revisar", min: 62, el: () => <Revisar /> },
  { nombre: "7 Listo", min: 60, el: () => <Listo /> },
  { nombre: "8 Cierre", min: 0, retraso: 10, pad: 0.9, el: () => <Cierre frase={["Importa tu Excel", "en 2 minutos"]} /> },
];

export const calcular02Voz = metadataVoz("tiktok-02-excel", ESCENAS);

export const TikTok02ExcelVoz: React.FC<PropsVoz> = (p) => <EscenasConVoz {...p} escenas={ESCENAS} />;
