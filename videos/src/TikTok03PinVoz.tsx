import { Gancho } from "./scenes/pin3/Gancho";
import { Expuesta } from "./scenes/pin3/Expuesta";
import { Pin } from "./scenes/pin3/Pin";
import { Huella } from "./scenes/pin3/Huella";
import { Cuando } from "./scenes/pin3/Cuando";
import { Teclado } from "./scenes/pin3/Teclado";
import { Olvide } from "./scenes/pin3/Olvide";
import { Cierre } from "./scenes/comun/Cierre";
import { EscenasConVoz, metadataVoz } from "./conVoz";
import type { EscenaVoz, PropsVoz } from "./conVoz";

// #3 «Si alguien toma tu celular… ¿ve tu cartera?» con voz (Dalia). Mismas escenas que TikTok03Pin; cada una dura lo que su frase.
// Mínimos = cuadro en que termina la animación de cada escena + unos cuadros de aire. Guion: guiones/tiktok-03-pin.md
const ESCENAS: EscenaVoz[] = [
  { nombre: "1 Gancho", min: 56, el: () => <Gancho /> },
  { nombre: "2 Expuesta", min: 72, el: () => <Expuesta /> },
  { nombre: "3 PIN", min: 70, el: () => <Pin /> },
  { nombre: "4 Huella", min: 66, el: () => <Huella /> },
  { nombre: "5 Cuando", min: 80, el: () => <Cuando /> },
  { nombre: "6 Teclado", min: 96, el: () => <Teclado /> },
  { nombre: "7 Olvide", min: 64, el: () => <Olvide /> },
  { nombre: "8 Cierre", min: 0, retraso: 10, pad: 0.9, el: () => <Cierre frase={["Protege tu cartera", "con PIN y huella"]} /> },
];

export const calcular03Voz = metadataVoz("tiktok-03-pin", ESCENAS);

export const TikTok03PinVoz: React.FC<PropsVoz> = (p) => <EscenasConVoz {...p} escenas={ESCENAS} />;
