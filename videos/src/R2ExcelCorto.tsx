import { TalCual } from "./scenes/excel2/TalCual";
import { Columnas } from "./scenes/excel2/Columnas";
import { Listo } from "./scenes/excel2/Listo";
import { Cierre } from "./scenes/comun/Cierre";
import { EscenasConVoz, metadataVoz } from "./conVoz";
import type { EscenaVoz, PropsVoz } from "./conVoz";

// R2 «Pásale tu Excel» corto: recorte del #2 (mismas escenas de excel2) con otro gancho («¿Tu lista está en Excel? Sirve tal cual»)
// y voz humana (Jorge HD). Guion: guiones/r2-excel-corto.md · voz: voz/r2-excel-corto.json
const ESCENAS: EscenaVoz[] = [
  { nombre: "1 Gancho Excel", min: 64, el: () => <TalCual gancho /> },
  { nombre: "2 Columnas", min: 100, el: () => <Columnas /> },
  { nombre: "3 Listo", min: 60, el: () => <Listo /> },
  { nombre: "4 Cierre", min: 0, retraso: 10, pad: 0.9, el: () => <Cierre frase={["Importa tu Excel", "en 2 minutos"]} /> },
];

export const calcularR2 = metadataVoz("r2-excel-corto", ESCENAS);

export const R2ExcelCorto: React.FC<PropsVoz> = (p) => <EscenasConVoz {...p} escenas={ESCENAS} />;
