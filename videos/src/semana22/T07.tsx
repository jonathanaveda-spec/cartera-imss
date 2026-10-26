import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";
import { Background } from "../components/Background";
import { Cierre } from "../scenes/comun/Cierre";
import { Rico } from "../texto";
import { Burbuja, Chip, CitlaliCirculo, Sfx, VozEn, cargarFrases } from "./Comun";
import type { VozFrase } from "../voz";

// T07 · «👻 Cosas que un asesor debería dejar en visto» (sáb 24/10 → sale lun 26/10, 8 p. m.). Voz: Dalia HD.
// Citlali = conductora en foto (no habla). Interactivos: adivina (seg 3) y «elige 1, 2 o 3» (seg 21).
export type T07Props = { frases?: VozFrase[] };

const T = { quiz: 3.0, c1: 9.6, c2: 11.7, c3: 13.8, giro: 15.8, poll: 20.8, cierre: 27.1 };
export const TOTAL_T07 = T.cierre + 3.3;

export const calcularT07: CalculateMetadataFunction<T07Props> = async () => {
  const frases = await cargarFrases("t07-dejar-en-visto");
  return { durationInFrames: Math.round(TOTAL_T07 * 30), props: { frases } };
};

const LISTA = ["La libreta que se moja", "Cobrar de memoria", "La CURP por cualquier chat", "El Excel con 5 versiones"];

// Fantasma (emoji) que flota
const Fantasma: React.FC<{ size: number; top: number; frame: number; left?: number }> = ({ size, top, frame, left = 140 }) => (
  <div style={{ position: "absolute", left, width: 800, top, textAlign: "center", fontSize: size, lineHeight: 1, translate: `0px ${Math.sin(frame / 9) * 14}px`, rotate: `${Math.sin(frame / 14) * 4}deg` }}>👻</div>
);

const Anillo: React.FC<{ t: number; t0: number; top: number }> = ({ t, t0, top }) => {
  const k = t - t0;
  const num = k < 0.7 ? 3 : k < 1.4 ? 2 : 1;
  const dentro = (k % 0.7) / 0.7;
  const pulso = 1 + 0.12 * Math.max(0, 1 - dentro * 3.5);
  const color = num === 1 ? C.rojo : num === 2 ? C.ambar : C.oro;
  const R = 82;
  const circ = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", left: 440, top, width: 200, height: 200, scale: pulso }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={R} fill="rgba(11,42,111,0.8)" stroke="rgba(255,255,255,0.25)" strokeWidth="14" />
        <circle cx="100" cy="100" r={R} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * Math.min(1, k / 2.1)} transform="rotate(-90 100 100)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: titulos, fontWeight: 800, fontSize: 120, color, paddingBottom: 8 }}>{num}</div>
    </div>
  );
};

const Opcion: React.FC<{ letra: string; texto: string; top: number; en: number; frame: number; fps: number; estado?: "normal" | "gana" | "pierde"; size?: number; extra?: number }> = ({ letra, texto, top, en, frame, fps, estado = "normal", size = 50, extra = 0 }) => {
  const p = ease(frame, Math.round(en * fps), Math.round(en * fps) + 8, Easing.out(Easing.back(1.4)));
  const fondo = estado === "gana" ? C.oro : C.blanco;
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top, height: 118, borderRadius: 34, background: fondo, boxShadow: "0 16px 32px rgba(3,12,40,0.35)", display: "flex", alignItems: "center", padding: "0 30px", gap: 26, opacity: p * (estado === "pierde" ? 0.45 : 1), scale: (0.9 + p * 0.1) * (1 + extra * 0.06), border: estado === "gana" ? `6px solid ${C.blanco}` : "6px solid transparent" }}>
      <div style={{ width: 76, height: 76, borderRadius: 999, background: C.azulCartera, color: C.blanco, fontFamily: titulos, fontWeight: 800, fontSize: 54, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 4, flex: "none" }}>{letra}</div>
      <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: size, letterSpacing: -1, color: C.tinta, whiteSpace: "nowrap" }}>{texto}</div>
      {estado === "gana" ? <div style={{ marginLeft: "auto", fontSize: 64 }}>👻</div> : null}
    </div>
  );
};

// Lista de lo ya "dejado en visto" (se va llenando)
const Pila: React.FC<{ n: number; frame: number; fps: number; desde: number[] }> = ({ n, frame, fps, desde }) => (
  <>
    {LISTA.slice(0, n).map((txt, i) => {
      const p = ease(frame, Math.round(desde[i] * fps), Math.round(desde[i] * fps) + 8, Easing.out(Easing.back(1.3)));
      return (
        <div key={txt} style={{ position: "absolute", left: 140, width: 800, top: 1135 + i * 66, display: "flex", justifyContent: "center", opacity: p, translate: `0px ${(1 - p) * 30}px` }}>
          <div style={{ background: "rgba(11,42,111,0.82)", border: "3px solid rgba(255,255,255,0.28)", borderRadius: 999, padding: "4px 30px 8px", fontFamily: textos, fontWeight: 800, fontSize: 38, color: C.secundario, whiteSpace: "nowrap" }}>👻 {txt}</div>
        </div>
      );
    })}
  </>
);

// Cartel que sostiene el fantasma
const Cartel: React.FC<{ lineas: string[]; frame: number; fps: number; ini: number }> = ({ lineas, frame, fps, ini }) => {
  const fr = frame - Math.round(ini * fps);
  const p = ease(fr, 0, 9, Easing.out(Easing.back(1.5)));
  const ticks = ease(fr, 20, 28);
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top: 640, opacity: p, scale: 0.7 + p * 0.3, rotate: `${-2 + (1 - p) * -6}deg` }}>
      <div style={{ background: C.azulNoche, border: `8px solid ${C.blanco}`, borderRadius: 48, padding: "40px 30px 36px", textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: lineas.some((l) => l.length > 16) ? 74 : 96, lineHeight: 1.04, letterSpacing: -2.5, color: C.blanco, boxShadow: "0 28px 56px rgba(3,12,40,0.5)" }}>
        {lineas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            <Rico t={l} />
          </div>
        ))}
        <div style={{ marginTop: 18, fontFamily: textos, fontWeight: 800, fontSize: 44, letterSpacing: 0, color: C.celeste, opacity: ticks }}>
          ✓✓ visto
        </div>
      </div>
    </div>
  );
};

export const T07: React.FC<T07Props> = ({ frases }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = frases!;
  const rel = (t0: number) => frame - Math.round(t0 * fps);

  let escena: React.ReactNode = null;

  if (t < T.quiz) {
    // GANCHO: el fantasma con el cartel, completo desde el cuadro 0
    const zoom = interpolate(frame, [0, 90], [1, 1.04], { extrapolateRight: "clamp" });
    const golpe = 1 + 0.1 * Math.max(0, 1 - Math.abs(t - 2.1) / 0.25) * (t >= 2.1 ? 1 : 0);
    escena = (
      <AbsoluteFill style={{ scale: zoom }}>
        <Fantasma size={250} top={190} frame={frame} />
        <div style={{ position: "absolute", left: 140, width: 800, top: 500, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 80, lineHeight: 1.04, letterSpacing: -2.5, color: C.blanco, textShadow: "0 8px 30px rgba(5,20,60,0.5)", whiteSpace: "nowrap" }}>
          <div>Cosas que un asesor</div>
          <div>debería dejar</div>
          <div style={{ fontSize: 210, letterSpacing: -7, marginTop: 14, scale: golpe }}>
            <Rico t="**en visto**" />
          </div>
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1100, display: "flex", justifyContent: "center" }}>
          <div style={{ background: C.blanco, color: C.celeste, borderRadius: 40, padding: "12px 44px 16px", fontFamily: textos, fontWeight: 800, fontSize: 66, boxShadow: "0 22px 44px rgba(3,12,40,0.4)", opacity: ease(frame, 4, 14) }}>✓✓ Visto</div>
        </div>
        <CitlaliCirculo cara="c01" size={250} left={415} top={1210} aro={C.oro} pop={0} />
      </AbsoluteFill>
    );
  } else if (t < T.c1) {
    // INTERACTIVO 1: adivina + cuenta regresiva
    const fr = rel(T.quiz);
    const cd0 = T.quiz + 2.7; // 5.7
    const rev = cd0 + 2.1; // 7.8
    const enCuenta = t >= cd0 && t < rev;
    const despues = t >= rev;
    escena = (
      <AbsoluteFill>
        <Chip texto="Adivina antes de que lo diga 🔮" top={195} fondo={C.verde} color={C.blanco} />
        <CitlaliCirculo cara={despues ? "c21" : "c13"} size={250} left={415} top={290} pop={despues ? Math.round(rev * fps) : 0} aro={C.oro} />
        <Burbuja left={140} top={590} width={800} desde={2} size={60}>
          <div>¿Qué dejarías</div>
          <div>
            en <span style={{ color: C.azulCartera }}>visto</span> primero?
          </div>
        </Burbuja>
        <Opcion letra="A" texto="La libreta que se moja" top={850} en={0.7} frame={fr} fps={fps} estado={despues ? "gana" : "normal"} size={46} />
        <Opcion letra="B" texto="El cliente que paga" top={990} en={1.1} frame={fr} fps={fps} estado={despues ? "pierde" : "normal"} size={50} />
        {enCuenta ? <Anillo t={t} t0={cd0} top={1170} /> : null}
        {despues ? (
          <div style={{ position: "absolute", left: 140, width: 800, top: 1200, textAlign: "center", fontSize: 150, opacity: ease(frame, Math.round(rev * fps), Math.round(rev * fps) + 8), scale: 0.6 + ease(frame, Math.round(rev * fps), Math.round(rev * fps) + 10, Easing.out(Easing.back(2))) * 0.4 }}>👻</div>
        ) : null}
      </AbsoluteFill>
    );
  } else if (t < T.giro) {
    // Carteles uno por uno (2 s cada uno) con la pila abajo
    const n = t < T.c2 ? 2 : t < T.c3 ? 3 : 4;
    const ini = t < T.c2 ? T.c1 : t < T.c3 ? T.c2 : T.c3;
    const lineas = t < T.c2 ? ["Cobrar de", "**memoria**"] : t < T.c3 ? ["Mandar la **CURP**", "por cualquier chat"] : ["El **Excel**", "con 5 versiones"];
    escena = (
      <AbsoluteFill>
        <Chip texto={`En visto 👻 ${n - 1} de 3`} top={195} desde={t < T.c2 ? -10 : 0} />
        <Fantasma size={250} top={290} frame={frame} />
        <Cartel key={ini} lineas={lineas} frame={frame} fps={fps} ini={ini} />
        <Pila n={n} frame={frame} fps={fps} desde={[0, T.c1, T.c2, T.c3]} />
      </AbsoluteFill>
    );
  } else if (t < T.poll) {
    // GIRO: esto NO se deja en visto
    const fr = rel(T.giro);
    const sale = ease(fr, 0, 16, Easing.in(Easing.cubic));
    const entra = ease(fr, 12, 24, Easing.out(Easing.back(1.4)));
    const aviso = ease(fr, 66, 78, Easing.out(Easing.back(1.5)));
    escena = (
      <AbsoluteFill>
        <Chip texto="Pero esto NO 🚫" top={195} fondo={C.verde} color={C.blanco} />
        <div style={{ position: "absolute", left: 140, width: 800, top: 330, textAlign: "center", fontSize: 230, lineHeight: 1, opacity: 1 - sale, translate: `${sale * 700}px ${-sale * 150}px`, rotate: `${sale * 30}deg` }}>👻</div>
        <CitlaliCirculo cara="c21" size={290} left={395} top={300} aro={C.verde} pop={Math.round(0.4 * fps)} />
        <div style={{ opacity: entra, scale: 0.9 + entra * 0.1 }}>
          <Burbuja left={140} top={660} width={800} desde={14} size={64}>
            <div>Avisarle a tu cliente</div>
            <div>
              <span style={{ color: C.verde }}>3 días antes</span> ✅
            </div>
          </Burbuja>
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1010, opacity: aviso, translate: `0px ${(1 - aviso) * 50}px` }}>
          <div style={{ background: C.blanco, borderRadius: 40, boxShadow: "0 22px 44px rgba(3,12,40,0.4)", padding: "24px 34px 28px", display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ width: 92, height: 92, borderRadius: 24, background: C.verde, color: C.blanco, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, flex: "none" }}>💬</div>
            <div style={{ fontFamily: textos, fontWeight: 800, color: C.tinta }}>
              <div style={{ fontSize: 44, lineHeight: 1.1 }}>Aviso enviado por WhatsApp</div>
              <div style={{ fontSize: 36, fontWeight: 600, color: "#475569" }}>Vence en 3 días · Doña Rosa</div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1250, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 54, color: C.secundario, opacity: ease(fr, 84, 96) }}>Eso sí se hace</div>
      </AbsoluteFill>
    );
  } else if (t < T.cierre) {
    // INTERACTIVO 2: elige 1, 2 o 3 → comenta tu número
    const fr = rel(T.poll);
    const vacia = 1 - Math.min(1, Math.max(0, (t - T.poll - 1.6) / 4.3));
    const bote = Math.sin(fr / 4) * 10;
    // el número que se menciona se agranda en el momento en que lo dice la voz
    const bump = (a: number) => Math.max(0, 1 - Math.abs(t - T.poll - a) / 0.35);
    escena = (
      <AbsoluteFill>
        <Chip texto="Pausa y elige ⏸️" top={195} fondo={C.verde} color={C.blanco} />
        <CitlaliCirculo cara="c13" size={250} left={415} top={285} pop={0} aro={C.oro} />
        <Burbuja left={140} top={570} width={800} desde={2} size={58}>
          <div>¿Cuál dejas en</div>
          <div>
            <span style={{ color: C.azulCartera }}>visto</span> primero?
          </div>
        </Burbuja>
        <Opcion letra="1" texto="La libreta" top={820} en={1.9} frame={fr} fps={fps} extra={bump(3.3)} />
        <Opcion letra="2" texto="La memoria" top={955} en={2.3} frame={fr} fps={fps} extra={bump(3.75)} />
        <Opcion letra="3" texto="El Excel" top={1090} en={2.7} frame={fr} fps={fps} extra={bump(4.1)} />
        <div style={{ position: "absolute", left: 240, width: 600, top: 1235, height: 20, borderRadius: 999, background: "rgba(255,255,255,0.22)", overflow: "hidden", opacity: ease(fr, 40, 50) }}>
          <div style={{ width: `${vacia * 100}%`, height: "100%", background: C.oro, borderRadius: 999 }} />
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1268, display: "flex", justifyContent: "center", opacity: ease(fr, 124, 134), scale: 0.85 + ease(fr, 124, 136, Easing.out(Easing.back(1.8))) * 0.15 }}>
          <span style={{ background: C.oro, color: C.tinta, borderRadius: 999, fontFamily: titulos, fontWeight: 800, fontSize: 60, letterSpacing: -1.2, padding: "8px 40px 16px", whiteSpace: "nowrap" }}>Comenta tu número</span>
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1372, textAlign: "center", fontSize: 56, translate: `0px ${bote}px`, opacity: ease(fr, 124, 134) }}>👇</div>
      </AbsoluteFill>
    );
  } else {
    escena = <Cierre frase={["¿Qué más dejarías", "en visto? 👇"]} grande />;
  }

  // ---------- efectos de sonido (pixabay primero; kenney para el tic) ----------
  const s: React.ReactNode[] = [];
  const add = (src: string, en: number, vol = 0.45, dur = 1.5) => s.push(<Sfx key={`${src}${en}`} src={src} en={en} vol={vol} dur={dur} />);
  // gancho
  add("pixabay/pop-a.mp3", 0, 0.55, 0.7);
  add("pixabay/whoosh-a.mp3", 0.02, 0.4, 0.7);
  add("pixabay/pop-b.mp3", 0.5, 0.35, 1);
  add("pixabay/subida-tension.mp3", 0.9, 0.2, 1.4);
  add("kenney/impactBell_heavy_000.ogg", 2.1, 0.4, 1.2);
  // adivina
  add("pixabay/whoosh-b.mp3", T.quiz - 0.04, 0.32, 0.9);
  add("pixabay/pop-burbuja.mp3", T.quiz + 0.15, 0.45, 1);
  add("pixabay/pop-a.mp3", T.quiz + 0.7, 0.4, 0.6);
  add("pixabay/pop-b.mp3", T.quiz + 1.1, 0.4, 0.8);
  for (let n = 0; n < 3; n++) {
    add("kenney/tick_001.ogg", T.quiz + 2.7 + n * 0.7, 1, 0.3);
    add("pixabay/clic-boton.mp3", T.quiz + 2.7 + n * 0.7, 1, 0.3);
  }
  add("pixabay/ding-exito.mp3", T.quiz + 4.8, 0.5, 1.7);
  add("pixabay/boing.mp3", T.quiz + 5.0, 0.25, 1);
  // carteles
  [T.c1, T.c2, T.c3].forEach((c, i) => {
    add("pixabay/whoosh-b.mp3", c - 0.04, 0.3, 0.8);
    add(i % 2 ? "pixabay/pop-a.mp3" : "pixabay/pop-burbuja.mp3", c + 0.1, 0.5, 1);
    add("kenney/select_001.ogg", c + 0.66, 0.35, 0.5);
  });
  // giro
  add("pixabay/disco-rayado.mp3", T.giro - 0.05, 0.25, 1.2);
  add("pixabay/whoosh-a.mp3", T.giro + 0.05, 0.4, 0.6);
  add("pixabay/ding-exito.mp3", T.giro + 0.5, 0.5, 1.7);
  add("pixabay/pop-b.mp3", T.giro + 0.55, 0.4, 0.8);
  add("pixabay/notificacion-a.mp3", T.giro + 2.2, 0.5, 1.5);
  add("pixabay/mensaje-chat.mp3", T.giro + 2.4, 0.3, 1.2);
  add("pixabay/pop-a.mp3", T.giro + 2.8, 0.4, 0.6);
  // elige
  add("pixabay/whoosh-b.mp3", T.poll - 0.04, 0.32, 0.9);
  add("pixabay/pop-burbuja.mp3", T.poll + 0.15, 0.45, 1);
  add("pixabay/pop-a.mp3", T.poll + 1.9, 0.4, 0.6);
  add("pixabay/pop-b.mp3", T.poll + 2.3, 0.4, 0.8);
  add("pixabay/pop-a.mp3", T.poll + 2.7, 0.4, 0.6);
  add("kenney/select_003.ogg", T.poll + 3.3, 0.4, 0.4);
  add("kenney/select_003.ogg", T.poll + 3.75, 0.4, 0.4);
  add("kenney/select_003.ogg", T.poll + 4.1, 0.4, 0.4);
  add("pixabay/subida-tension.mp3", T.poll + 1.6, 0.18, 3);
  add("pixabay/notificacion-b.mp3", T.poll + 4.15, 0.45, 0.8);
  // cierre
  add("pixabay/whoosh-b.mp3", T.cierre - 0.04, 0.35, 0.9);
  add("pixabay/tada.mp3", T.cierre + 0.25, 0.4, 1.2);
  add("pixabay/pop-burbuja.mp3", T.cierre + 1.0, 0.45, 1);

  // ---------- voz (Dalia HD) ----------
  const v = [
    <VozEn key="0" frase={f[0]} en={0} />,
    <VozEn key="1" frase={f[1]} en={T.quiz + 0.1} />,
    <VozEn key="2" frase={f[2]} en={T.quiz + 4.9} />,
    <VozEn key="3" frase={f[3]} en={T.c1 + 0.1} />,
    <VozEn key="4" frase={f[4]} en={T.c2 + 0.1} />,
    <VozEn key="5" frase={f[5]} en={T.c3 + 0.1} />,
    <VozEn key="6" frase={f[6]} en={T.giro + 0.1} />,
    <VozEn key="7" frase={f[7]} en={T.poll + 0.1} />,
    <VozEn key="8" frase={f[8]} en={T.cierre + 0.2} />,
  ];

  return (
    <AbsoluteFill>
      <Background />
      {escena}
      {s}
      {v}
    </AbsoluteFill>
  );
};
