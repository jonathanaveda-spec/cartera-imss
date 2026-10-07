import type { CalculateMetadataFunction } from "remotion";
import { aCuadros, cargarVoz, COLCHON, RETRASO_VOZ } from "../voz";
import type { VozFrase } from "../voz";

// ---------------------------------------------------------------------------------------------
// Plantilla H (historia): una escena de la vida del asesor contada con chat animado o antes/después.
// Se llena desde videos/historias/<id>.json. Los **asteriscos** marcan la palabra en oro.
// Cada escena es de un tipo:
//   gancho    { hora, titular[], icono? }                    reloj + libreta + titular
//   chat      { contacto{nombre, iniciales}, items[] }       burbujas, «escribiendo…», horas y palomitas
//   titulo    { titular[], emoji?, etiqueta? }               título grande con un emoji (gancho sencillo); etiqueta = chip chico arriba
//   mensaje   { numero, titular[], contacto, mensaje }       un mensaje de cobro que se escribe y se envía (#4)
//   frase     { titular[], emoji? }                          frase grande con hojas de libreta que pasan
//   captura   { titular[], imagenes[{src,zoom,cx,cy,anillo?}] } capturas reales de la app en un teléfono
//   dividida  { antes{…}, despues{…} }                       pantalla dividida antes/después
//   cierre    { frase[] }                                    logo + «Pruébala gratis en la beta»
// Voz opcional ("voz": id de public/voz/<id>/). Las frases se consumen en orden: una por escena
// (gancho, frase, captura, dividida, cierre; se salta con "sinVoz": true) y una por cada mensaje de chat con "voz": true.
// Sin voz, cada escena dura "seg" segundos (y cada mensaje, su "seg").
// ---------------------------------------------------------------------------------------------
export type Mensaje = {
  de: "cliente" | "asesor";
  texto: string;
  hora: string;
  voz?: boolean; // este mensaje se dice en voz alta (consume una frase)
  leido?: boolean; // palomitas azules
  seg?: number; // sin voz: cuánto se queda antes del siguiente
  color?: string; // color propio de la burbuja (por defecto, el de WhatsApp)
  grande?: boolean; // letra un poco más grande
};
export type Escribiendo = { escribiendo: "cliente" | "asesor"; seg: number };
export type ItemChat = Mensaje | Escribiendo;

export type Anillo = { x: number; y: number; w: number; h: number; color: "rojo" | "verde" | "azul" | "ambar"; radio?: number };
// `anillo` puede ser uno o varios (varios entran uno tras otro, cada ~0.6 s)
export type ImagenCaptura = { src: string; zoom: number; cx: number; cy: number; anillo?: Anillo | Anillo[] };
export type PanelDividido = { etiqueta: string; emoji: string; titulo: string; lineas: string[] };

type Base = { seg?: number; sinVoz?: boolean };
export type EscenaH =
  | (Base & { tipo: "gancho"; hora: string; titular: string[]; icono?: string })
  | (Base & { tipo: "chat"; contacto: { nombre: string; iniciales: string }; items: ItemChat[] })
  | (Base & { tipo: "titulo"; titular: string[]; emoji?: string; etiqueta?: string })
  | (Base & { tipo: "mensaje"; numero: number; titular: string[]; contacto: { nombre: string; iniciales: string }; mensaje: Mensaje })
  | (Base & { tipo: "frase"; titular: string[]; emoji?: string })
  | (Base & { tipo: "captura"; titular: string[]; imagenes: ImagenCaptura[] })
  | (Base & { tipo: "dividida"; titular?: string[]; antes: PanelDividido; despues: PanelDividido })
  | (Base & { tipo: "cierre"; frase: string[] });

export type HistoriaProps = {
  id: string;
  escenas: EscenaH[];
  voz?: string;
  guias: boolean;
  frases?: VozFrase[]; // las llena calculateMetadata
};

export type ItemResuelto = { ini: number; fin: number };
export type EscenaResuelta = {
  ini: number;
  dur: number;
  audios: { frase: VozFrase; desde: number }[];
  items: ItemResuelto[]; // solo en chat (tiempos relativos al inicio de la escena)
};

export const RETRASO_CIERRE = 10;
const PAD_FINAL = 0.9;
const INICIO_CHAT = 10;

export const esMensaje = (i: ItemChat): i is Mensaje => (i as Mensaje).texto !== undefined;

// Cuántas frases de voz pide la historia (en orden).
export const frasesNecesarias = (escenas: EscenaH[]) =>
  escenas.reduce(
    (n, e) =>
      n +
      (e.tipo === "chat"
        ? e.items.filter((i) => esMensaje(i) && i.voz).length
        : e.sinVoz
          ? 0
          : 1),
    0,
  );

export const resolverHistoria = (p: HistoriaProps): { escenas: EscenaResuelta[]; total: number } => {
  let k = 0; // frase de voz que sigue
  let cursor = 0;
  const salida: EscenaResuelta[] = [];
  for (const e of p.escenas) {
    const audios: EscenaResuelta["audios"] = [];
    const items: ItemResuelto[] = [];
    let dur: number;
    if (e.tipo === "chat") {
      let t = INICIO_CHAT;
      for (const it of e.items) {
        if (!esMensaje(it)) {
          items.push({ ini: t, fin: t + aCuadros(it.seg) });
          t += aCuadros(it.seg);
        } else if (it.voz && p.frases) {
          const f = p.frases[k++];
          items.push({ ini: t, fin: t });
          audios.push({ frase: f, desde: t + RETRASO_VOZ });
          t += RETRASO_VOZ + aCuadros(f.seg + COLCHON);
        } else {
          if (it.voz) k++;
          items.push({ ini: t, fin: t });
          t += aCuadros(it.seg ?? 1.4);
        }
      }
      dur = t + aCuadros(0.4);
    } else if (p.frases && !e.sinVoz) {
      const f = p.frases[k++];
      const retraso = e.tipo === "cierre" ? RETRASO_CIERRE : RETRASO_VOZ;
      audios.push({ frase: f, desde: retraso });
      dur = retraso + aCuadros(f.seg + (e.tipo === "cierre" ? PAD_FINAL : COLCHON));
    } else {
      if (!e.sinVoz && p.voz) k++;
      dur = aCuadros(e.seg ?? 3);
    }
    salida.push({ ini: cursor, dur, audios, items });
    cursor += dur;
  }
  return { escenas: salida, total: cursor };
};

export const calcularHistoria: CalculateMetadataFunction<HistoriaProps> = async ({ props }) => {
  let frases: VozFrase[] | undefined;
  if (props.voz) {
    frases = await cargarVoz(props.voz);
    const n = frasesNecesarias(props.escenas);
    if (frases.length !== n) {
      throw new Error(`La voz «${props.voz}» tiene ${frases.length} frases y la historia necesita ${n} (una por escena y una por mensaje con "voz": true).`);
    }
  }
  const p = { ...props, frases };
  return { durationInFrames: resolverHistoria(p).total, props: p };
};
