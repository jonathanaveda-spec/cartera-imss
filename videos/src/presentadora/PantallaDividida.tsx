import type React from "react";
import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";
import { Anillo } from "../components/PhoneCard";
import { Toque } from "../components/Toque";

// ---------------------------------------------------------------------------------------------
// Formato «PRESENTADORA + PANTALLA» (el de moda en TikTok): fondo oscuro; ARRIBA una ventana de navegador con la app
// (capturas con zoom suave, anillos y toques); ABAJO otra ventana con la presentadora hablando a cámara; en el CENTRO,
// entre las dos, el subtítulo grande PALABRA POR PALABRA en una píldora con los colores de la marca.
// Todo se llena desde un JSON de videos/presentadora/<id>.json (ver citlali-01-whatsapp.json):
//   { "id", "url": "carteraasesor.com/app",
//     "presentadora": { "video": "presentadora/citlali-01.mp4" }                       ← el mp4 de HeyGen (en videos/public/)
//                  o { "relleno": { "imagen": "...jpg", "audio": "...mp3" } }          ← mientras no exista el mp4 (se marca RELLENO)
//     "frases": [ { "texto": "Lo que **sí** incomoda…", "desde": 4.85, "fin": 9.07 } ],  ← segundos de lo que SE OYE de verdad
//     "pantallas": [ { "tipo": "captura", "src": "capturas/x.png", "desde": 0, "hasta": 4.85,
//                      "zoom": 1.2, "zoomFin": 1.3, "cx": 540, "cy": 1000, "cyFin": 1100,
//                      "anillos": [ { "x":88,"y":1155,"w":452,"h":100,"color":"verde","en":1.5 } ],
//                      "toque": { "x": 314, "y": 1205, "en": 3.0 } },
//                    { "tipo": "marca", "desde": 19.27, "hasta": 23.9 } ],
//     "extra": 0.9 }                                                                   ← segundos de aire al final
// Los tiempos de cada palabra se calculan solos repartiendo la frase según el largo de cada palabra y sus pausas (comas y puntos
// suspensivos); para tiempos exactos se puede pasar "palabras" a mano: [{ "t": "Hola", "desde": 0.1, "hasta": 0.4, "oro": true }].
// ---------------------------------------------------------------------------------------------
const FPS = 30;

export type AnilloEscena = { x: number; y: number; w: number; h: number; color: "rojo" | "verde" | "azul" | "ambar"; radio?: number; en?: number };
export type PantallaEscena = {
  tipo?: "captura" | "marca";
  src?: string;
  desde: number; // segundos
  hasta: number;
  zoom?: number;
  zoomFin?: number;
  cx?: number;
  cy?: number;
  cxFin?: number;
  cyFin?: number;
  anillos?: AnilloEscena[];
  toque?: { x: number; y: number; en: number };
};
export type FrasePresentadora = { texto: string; desde: number; fin: number };
export type Palabra = { t: string; desde: number; hasta: number; oro?: boolean };
export type PresentadoraProps = {
  id: string;
  url?: string;
  presentadora: { video?: string; relleno?: { imagen: string; audio: string } };
  frases: FrasePresentadora[];
  palabras?: Palabra[];
  pantallas: PantallaEscena[];
  extra?: number;
  etiquetaIA?: string;
  guias?: boolean;
};

// ---------- tiempos por palabra ----------
export const palabrasDeFrases = (frases: FrasePresentadora[]): Palabra[] => {
  const salida: Palabra[] = [];
  for (const f of frases) {
    const partes = f.texto.split(/\s+/).filter(Boolean);
    const info = partes.map((p) => {
      const oro = p.includes("**");
      const limpia = p.replace(/\*\*/g, "");
      const letras = limpia.replace(/[^\p{L}\p{N}]/gu, "").length;
      const pausa = /…|\.\.\./.test(limpia) ? 9 : /[,;:]$/.test(limpia) ? 3 : 0;
      return { t: limpia, oro, peso: letras + 1.2, pausa };
    });
    const total = info.reduce((a, w) => a + w.peso + w.pausa, 0);
    const dur = f.fin - f.desde;
    let t = f.desde;
    for (const w of info) {
      const habla = (w.peso / total) * dur;
      const pausa = (w.pausa / total) * dur;
      // la palabra se queda en pantalla hasta que empieza la siguiente (incluida su pausa)
      salida.push({ t: w.t, desde: t, hasta: t + habla + pausa, oro: w.oro });
      t += habla + pausa;
    }
  }
  return salida;
};

export const calcularPresentadora: CalculateMetadataFunction<PresentadoraProps> = async ({ props }) => {
  const fin = props.frases[props.frases.length - 1].fin;
  const ultimaPantalla = Math.max(...props.pantallas.map((p) => p.hasta));
  const segundos = Math.max(fin + (props.extra ?? 0.9), ultimaPantalla);
  return { durationInFrames: Math.ceil(segundos * FPS), props: { ...props, palabras: props.palabras ?? palabrasDeFrases(props.frases) } };
};

// ---------- medidas (1080×1920, todo centrado en x = 540 y de 800 px como máximo) ----------
const X = 140;
const W = 800;
const BARRA = 56; // barra del navegador
const TOP = { y: 250, h: 480 }; // ventana de la app
const PILDORA_Y = 838; // centro de la píldora de subtítulos
const PRES = { y: 952, h: 520, w: 560 }; // ventana de la presentadora (más angosta: el video de HeyGen es vertical; termina en y = 1485)
const FONDO = "#040C26";

const COLOR_ANILLO = { rojo: C.rojo, verde: C.verde, azul: C.azulCartera, ambar: C.ambar } as const;

// Marco de ventana redondeada con barra de navegador (tres puntitos neutros: el rojo/ámbar/verde de la marca solo tienen su significado).
const Ventana: React.FC<{ y: number; h: number; w?: number; barra?: string; children: React.ReactNode }> = ({ y, h, w = W, barra, children }) => (
  <div
    style={{
      position: "absolute",
      left: 540 - w / 2,
      top: y,
      width: w,
      height: h,
      borderRadius: 40,
      overflow: "hidden",
      background: "#0A1738",
      border: "4px solid rgba(219,232,255,0.28)",
      boxShadow: "0 34px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(26,163,245,0.18)",
    }}
  >
    {barra ? (
      <div style={{ position: "absolute", left: 0, top: 0, width: w - 8, height: BARRA, background: "#16254F", display: "flex", alignItems: "center", gap: 10, padding: "0 22px" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 999, background: "rgba(219,232,255,0.55)" }} />
        ))}
        <div style={{ flex: 1, marginLeft: 14, height: 34, borderRadius: 999, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: textos, fontWeight: 600, fontSize: 22, color: C.secundario, letterSpacing: 0.3 }}>
          {barra}
        </div>
      </div>
    ) : null}
    <div style={{ position: "absolute", left: 0, top: barra ? BARRA : 0, width: w - 8, height: h - 8 - (barra ? BARRA : 0), overflow: "hidden" }}>{children}</div>
  </div>
);

const ANCHO_VISTA = W - 8;
const ALTO_VISTA = TOP.h - 8 - BARRA;

// Una pantalla de la app: captura con zoom suave (de zoom/cx/cy a zoomFin/cxFin/cyFin), anillos y toque.
const Captura: React.FC<{ e: PantallaEscena }> = ({ e }) => {
  const frame = useCurrentFrame();
  const dur = Math.round((e.hasta - e.desde) * FPS);
  const p = interpolate(frame, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const z = (e.zoom ?? 1) + ((e.zoomFin ?? e.zoom ?? 1) - (e.zoom ?? 1)) * p;
  const cx = (e.cx ?? 540) + ((e.cxFin ?? e.cx ?? 540) - (e.cx ?? 540)) * p;
  const cy = (e.cy ?? 960) + ((e.cyFin ?? e.cy ?? 960) - (e.cy ?? 960)) * p;
  const s = (ANCHO_VISTA / 1080) * z;
  const tx = Math.min(0, Math.max(ANCHO_VISTA - 1080 * s, ANCHO_VISTA / 2 - cx * s));
  const ty = Math.min(0, Math.max(ALTO_VISTA - 1920 * s, ALTO_VISTA / 2 - cy * s));
  const pulso = Math.sin(frame / 4) * 0.5 + 0.5;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
      <Img src={staticFile(e.src ?? "")} style={{ width: 1080, height: 1920 }} />
      {(e.anillos ?? []).map((a, i) => (
        <Anillo key={i} x={a.x} y={a.y} w={a.w} h={a.h} color={COLOR_ANILLO[a.color]} radio={a.radio ?? 36} p={ease(frame, Math.round((a.en ?? 0.6) * FPS), Math.round((a.en ?? 0.6) * FPS) + 12)} pulso={pulso} />
      ))}
      {e.toque ? <Toque x={e.toque.x} y={e.toque.y} desde={Math.round(e.toque.en * FPS)} /> : null}
    </div>
  );
};

// Pantalla de cierre de marca (logo + botón verde), dentro de la ventana de arriba.
const Marca: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ease(frame, 0, 14, Easing.out(Easing.back(1.2)));
  const b = ease(frame, 10, 24);
  const c = ease(frame, 22, 36, Easing.out(Easing.back(1.3)));
  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, ${C.azulNoche}, ${C.azulCartera})`, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <Img src={staticFile("logo.png")} style={{ width: 118, height: 118, borderRadius: 28, boxShadow: "0 18px 36px rgba(3,12,40,0.5)", scale: 0.6 + a * 0.4, opacity: a }} />
      <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: 44, letterSpacing: -1, color: C.blanco, opacity: b }}>Cartera Asesor</div>
      <div style={{ background: C.verde, color: C.blanco, fontFamily: titulos, fontWeight: 800, fontSize: 40, letterSpacing: -0.5, padding: "12px 30px 14px", borderRadius: 999, border: "4px solid rgba(255,255,255,0.35)", opacity: c, scale: 0.85 + c * 0.15 }}>
        carteraasesor.com
      </div>
      <div style={{ fontFamily: textos, fontWeight: 800, fontSize: 28, color: C.secundario, opacity: c }}>
        Pruébala <span style={{ color: C.oro }}>gratis</span> en la beta
      </div>
    </AbsoluteFill>
  );
};

// Ventana de arriba: las pantallas, una tras otra con fundido corto.
const Pantallas: React.FC<{ pantallas: PantallaEscena[] }> = ({ pantallas }) => {
  const FUNDIDO = 8;
  return (
    <>
      {pantallas.map((e, i) => {
        const desde = Math.round(e.desde * FPS);
        const dur = Math.round((e.hasta - e.desde) * FPS);
        const antes = i === 0 ? 0 : FUNDIDO;
        return (
          <Sequence key={i} from={desde - antes} durationInFrames={dur + antes} name={`pantalla ${i + 1}`} premountFor={FPS}>
            <PantallaConFundido entra={antes} dur={dur + antes}>
              {e.tipo === "marca" ? <Marca /> : <Captura e={e} />}
            </PantallaConFundido>
          </Sequence>
        );
      })}
    </>
  );
};

const PantallaConFundido: React.FC<{ entra: number; dur: number; children: React.ReactNode }> = ({ entra, dur, children }) => {
  const frame = useCurrentFrame();
  const o = entra ? ease(frame, 0, entra) : 1;
  return <AbsoluteFill style={{ opacity: o, background: "#F4F6FA" }}>{children}</AbsoluteFill>;
};

// Subtítulo palabra por palabra en píldora de marca.
const Pildora: React.FC<{ palabras: Palabra[] }> = ({ palabras }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let idx = -1;
  for (let i = 0; i < palabras.length; i++) if (t >= palabras[i].desde) idx = i;
  const w = idx >= 0 && t <= palabras[idx].hasta + 0.25 ? palabras[idx] : null;
  if (!w) return null;
  const f0 = Math.round(w.desde * FPS);
  const pop = ease(frame, f0, f0 + 5, Easing.out(Easing.back(1.8)));
  return (
    <div style={{ position: "absolute", left: X, width: W, top: PILDORA_Y - 80, height: 160, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          background: C.azulCartera,
          border: "6px solid rgba(255,255,255,0.92)",
          borderRadius: 999,
          padding: "14px 54px 22px",
          boxShadow: "0 22px 46px rgba(0,0,0,0.5), 0 0 0 10px rgba(29,78,216,0.28)",
          fontFamily: titulos,
          fontWeight: 800,
          fontSize: w.t.length > 9 ? 94 : 112,
          lineHeight: 1.05,
          letterSpacing: -2,
          color: w.oro ? C.oro : C.blanco,
          whiteSpace: "nowrap",
          maxWidth: W - 20,
          scale: 0.82 + pop * 0.18,
        }}
      >
        {w.t}
      </div>
    </div>
  );
};

// Ventana de abajo: el video de la presentadora (o el relleno con leve movimiento y la marca RELLENO).
const Presentadora: React.FC<{ p: PresentadoraProps["presentadora"] }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = frame / durationInFrames;
  const alto = PRES.h - 8;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: PRES.w - 8, height: alto, background: "#0A1738", overflow: "hidden" }}>
        {p.video ? (
          <Video src={staticFile(p.video)} objectFit="contain" style={{ position: "absolute", left: 0, top: 0, width: PRES.w - 8, height: (PRES.w - 8) * (16 / 9) }} />
        ) : p.relleno ? (
          <>
            <Img
              src={staticFile(p.relleno.imagen)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: PRES.w - 8,
                height: (PRES.w - 8) * (199 / 112),
                scale: 1.02 + k * 0.1 + Math.sin(frame / 40) * 0.01,
                transformOrigin: "50% 12%",
                translate: `${Math.sin(frame / 55) * 6}px ${-20 + Math.cos(frame / 70) * 5}px`,
                filter: "saturate(1.05)",
              }}
            />
            <Audio src={staticFile(p.relleno.audio)} />
            <div style={{ position: "absolute", left: 0, bottom: 0, width: PRES.w - 8, padding: "10px 0 14px", textAlign: "center", background: "rgba(217,119,6,0.92)", color: C.blanco, fontFamily: textos, fontWeight: 800, fontSize: 30, letterSpacing: 0.5 }}>
              RELLENO · aquí va el video de Citlali (HeyGen)
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

export const PantallaDividida: React.FC<PresentadoraProps> = (props) => {
  const frame = useCurrentFrame();
  const palabras = props.palabras ?? palabrasDeFrases(props.frases);
  const entra = ease(frame, 0, 14);
  return (
    <AbsoluteFill style={{ background: FONDO }}>
      <AbsoluteFill style={{ background: "radial-gradient(900px 640px at 540px 230px, rgba(26,163,245,0.22), rgba(26,163,245,0) 70%), radial-gradient(800px 600px at 540px 1500px, rgba(29,78,216,0.28), rgba(29,78,216,0) 70%)" }} />

      {/* Etiqueta de IA */}
      <div style={{ position: "absolute", left: X, width: W, top: 190, display: "flex", justifyContent: "center", opacity: 0.4 + entra * 0.6 }}>
        <div style={{ background: "rgba(255,255,255,0.12)", border: "3px solid rgba(255,255,255,0.35)", borderRadius: 999, padding: "6px 28px 8px", fontFamily: textos, fontWeight: 800, fontSize: 30, color: C.secundario, whiteSpace: "nowrap" }}>
          ✨ {props.etiquetaIA ?? "Contenido generado por IA"}
        </div>
      </div>

      {/* Ventana de arriba: la app */}
      <div style={{ opacity: 0.6 + entra * 0.4, translate: `0px ${(1 - entra) * -10}px` }}>
        <Ventana y={TOP.y} h={TOP.h} barra={props.url ?? "carteraasesor.com/app"}>
          <Pantallas pantallas={props.pantallas} />
        </Ventana>
      </div>

      {/* Subtítulo al centro */}
      <Pildora palabras={palabras} />

      {/* Ventana de abajo: la presentadora */}
      <div style={{ opacity: 0.6 + entra * 0.4, translate: `0px ${(1 - entra) * 10}px` }}>
        <Ventana y={PRES.y} h={PRES.h} w={PRES.w}>
          <Presentadora p={props.presentadora} />
        </Ventana>
      </div>

      {props.guias ? <div style={{ position: "absolute", left: 60, top: 180, width: 880, height: 1260, outline: "4px dashed rgba(255,0,200,0.9)" }} /> : null}
    </AbsoluteFill>
  );
};
