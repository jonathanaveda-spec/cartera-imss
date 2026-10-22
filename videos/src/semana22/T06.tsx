import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";
import { Background } from "../components/Background";
import { Cierre } from "../scenes/comun/Cierre";
import { Rico } from "../texto";
import { Burbuja, Chip, CitlaliCirculo, Sfx, VozEn, cargarFrases } from "./Comun";
import type { Cara } from "./Comun";
import type { VozFrase } from "../voz";

// T06 · «Asesor, responde en UNA palabra» (jue 22/10, 8 p. m.). Voz: Alejo. Citlali = conductora en foto (sin hablar).
// 3 preguntas con cuenta regresiva y la 4.ª para los comentarios.
export type T06Props = { frases?: VozFrase[] };

const LARGO_P = 4.7; // segundos por pregunta
const PREGUNTAS = [
  { q: ["¿Tu peor día", "de **cobro**?"], palabra: "LUNES", t0: 3.4, voz: 1, vozRev: 2 },
  { q: ["¿El **pretexto**", "más usado?"], palabra: "MAÑANA", t0: 3.4 + LARGO_P, voz: 3, vozRev: 4 },
  { q: ["¿Tu mejor", "**aliado**?"], palabra: "WHATSAPP", t0: 3.4 + LARGO_P * 2, voz: 5, vozRev: 6 },
];
const T_Q4 = 3.4 + LARGO_P * 3; // 17.5
const T_CIERRE = T_Q4 + 5.8; // 23.3
export const TOTAL_T06 = T_CIERRE + 4.2;

export const calcularT06: CalculateMetadataFunction<T06Props> = async () => {
  const frases = await cargarFrases("t06-una-palabra");
  return { durationInFrames: Math.round(TOTAL_T06 * 30), props: { frases } };
};

const Cuenta: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  // 3 · 2 · 1 (0,7 s cada uno) con un anillo que se vacía
  const k = t - t0;
  const num = k < 0.7 ? 3 : k < 1.4 ? 2 : 1;
  const dentro = (k % 0.7) / 0.7;
  const pulso = 1 + 0.12 * Math.max(0, 1 - dentro * 3.5);
  const color = num === 1 ? C.rojo : num === 2 ? C.ambar : C.oro;
  const R = 150;
  const circ = 2 * Math.PI * R;
  const prog = Math.min(1, k / 2.1);
  return (
    <div style={{ position: "absolute", left: 340, top: 900, width: 400, height: 400, scale: pulso }}>
      <svg width="400" height="400" viewBox="0 0 400 400">
        <circle cx="200" cy="200" r={R} fill="rgba(11,42,111,0.75)" stroke="rgba(255,255,255,0.25)" strokeWidth="22" />
        <circle cx="200" cy="200" r={R} fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * prog} transform="rotate(-90 200 200)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: titulos, fontWeight: 800, fontSize: 230, color, letterSpacing: -6, paddingBottom: 14 }}>{num}</div>
    </div>
  );
};

const Revela: React.FC<{ palabra: string; frame: number; ini: number }> = ({ palabra, frame, ini }) => {
  const p = ease(frame, ini, ini + 8, Easing.out(Easing.back(1.8)));
  const tam = palabra.length > 6 ? 125 : palabra.length > 5 ? 150 : 200;
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top: 930, textAlign: "center", opacity: p, scale: 0.6 + p * 0.4 }}>
      <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: tam, letterSpacing: -5, lineHeight: 1, color: C.oro, textShadow: "0 10px 34px rgba(5,20,60,0.55)", whiteSpace: "nowrap" }}>{palabra}</div>
      <div style={{ marginTop: 22, fontFamily: textos, fontWeight: 800, fontSize: 46, color: C.verde, background: C.blanco, display: "inline-block", borderRadius: 999, padding: "6px 34px 12px" }}>✔ ¿Coincidimos?</div>
    </div>
  );
};

export const T06: React.FC<T06Props> = ({ frases }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = frases!;

  const enGancho = t < PREGUNTAS[0].t0;
  const idx = PREGUNTAS.findIndex((p, i) => t >= p.t0 && t < (PREGUNTAS[i + 1]?.t0 ?? T_Q4));
  const enQ4 = t >= T_Q4 && t < T_CIERRE;
  const enCierre = t >= T_CIERRE;

  let escena: React.ReactNode = null;

  if (enGancho) {
    // Cuadro 0: gancho completo. Se mueve el zoom, la flecha y Citlali.
    const zoom = interpolate(frame, [0, 100], [1.0, 1.04], { extrapolateRight: "clamp" });
    const bote = Math.sin(frame / 4) * 12;
    escena = (
      <AbsoluteFill style={{ scale: zoom }}>
        <div style={{ position: "absolute", left: 140, width: 800, top: 200, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 132, lineHeight: 1.02, letterSpacing: -4, color: C.blanco, textShadow: "0 8px 30px rgba(5,20,60,0.5)", whiteSpace: "nowrap" }}>
          <div>Asesor,</div>
          <div>responde en</div>
          <div style={{ fontSize: 190, letterSpacing: -6 }}>
            <Rico t="**UNA**" />
          </div>
          <div>palabra</div>
        </div>
        <CitlaliCirculo cara="c01" size={400} left={340} top={960} aro={C.oro} pop={0} />
        <div style={{ position: "absolute", left: 140, width: 800, top: 1370, textAlign: "center", fontSize: 80, translate: `0px ${bote}px` }}>👇</div>
      </AbsoluteFill>
    );
  } else if (idx >= 0) {
    const p = PREGUNTAS[idx];
    const k = t - p.t0;
    const fr = frame - Math.round(p.t0 * fps);
    const cd0 = 1.6;
    const rev0 = cd0 + 2.1;
    const enCuenta = k >= cd0 && k < rev0;
    const revelado = k >= rev0;
    const cara: Cara = revelado ? "c21" : enCuenta ? "c06" : "c13";
    escena = (
      <AbsoluteFill>
        <Chip texto={`Pregunta ${idx + 1} de 3`} top={195} desde={0} />
        <CitlaliCirculo cara={cara} size={290} left={395} top={300} aro={revelado ? C.verde : C.blanco} pop={revelado ? Math.round(rev0 * fps) : 0} />
        <Burbuja left={140} top={660} width={800} desde={1} size={70}>
          {p.q.map((l, i) => (
            <div key={i}>
              <Rico t={l} color={C.azulCartera} />
            </div>
          ))}
        </Burbuja>
        {!revelado && !enCuenta ? (
          <div style={{ position: "absolute", left: 140, width: 800, top: 1040, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 56, color: C.secundario, opacity: ease(fr, 14, 22) }}>Piensa tu respuesta… 🤔</div>
        ) : null}
        {enCuenta ? <Cuenta t={t} t0={p.t0 + cd0} /> : null}
        {enCuenta ? <div style={{ position: "absolute", left: 140, width: 800, top: 1330, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 48, color: C.blanco }}>Responde ahora, en tu cabeza</div> : null}
        {revelado ? <Revela palabra={p.palabra} frame={fr} ini={Math.round(rev0 * fps)} /> : null}
      </AbsoluteFill>
    );
  } else if (enQ4) {
    const k = t - T_Q4;
    const fr = frame - Math.round(T_Q4 * fps);
    const caret = Math.floor(fr / 8) % 2 === 0;
    const vacia = 1 - Math.min(1, Math.max(0, (k - 2.3) / 3.2));
    const bote = Math.sin(fr / 4) * 12;
    escena = (
      <AbsoluteFill>
        <Chip texto="Ahora te toca a ti" top={195} desde={0} fondo={C.verde} color={C.blanco} />
        <CitlaliCirculo cara="c01" size={290} left={395} top={300} aro={C.oro} pop={0} />
        <Burbuja left={140} top={660} width={800} desde={1} size={64}>
          <div>¿Lo que más te</div>
          <div>
            cuesta de <span style={{ color: C.azulCartera }}>cobrar</span>?
          </div>
        </Burbuja>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1000, height: 150, borderRadius: 40, background: C.blanco, boxShadow: "0 24px 48px rgba(3,12,40,0.4)", display: "flex", alignItems: "center", padding: "0 40px", gap: 14, fontFamily: textos, fontWeight: 600, fontSize: 50, color: "#64748B", opacity: ease(fr, 16, 26) }}>
          <span style={{ color: C.azulCartera, fontWeight: 800, fontSize: 56 }}>{caret ? "|" : " "}</span>
          Escribe UNA palabra…
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1190, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 46, color: C.secundario, opacity: ease(fr, 20, 30) }}>Pausa un segundo y piénsala ⏳</div>
        <div style={{ position: "absolute", left: 240, width: 600, top: 1275, height: 22, borderRadius: 999, background: "rgba(255,255,255,0.22)", overflow: "hidden", opacity: ease(fr, 20, 30) }}>
          <div style={{ width: `${vacia * 100}%`, height: "100%", background: C.oro, borderRadius: 999 }} />
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1320, textAlign: "center", fontSize: 80, translate: `0px ${bote}px` }}>👇</div>
      </AbsoluteFill>
    );
  } else if (enCierre) {
    escena = <Cierre frase={["Las leo todas 👇", "las mejores se vuelven video"]} grande />;
  }

  // --- efectos de sonido (pixabay primero, kenney para el tic) ---
  const sfx: React.ReactNode[] = [];
  sfx.push(<Sfx key="g1" src="pixabay/pop-a.mp3" en={0} vol={0.55} />);
  sfx.push(<Sfx key="g2" src="pixabay/whoosh-a.mp3" en={0.02} vol={0.4} />);
  sfx.push(<Sfx key="g3" src="pixabay/pop-b.mp3" en={1.45} vol={0.4} dur={1} />);
  PREGUNTAS.forEach((p, i) => {
    sfx.push(<Sfx key={`w${i}`} src="pixabay/whoosh-b.mp3" en={p.t0 - 0.04} vol={0.32} dur={0.9} />);
    sfx.push(<Sfx key={`q${i}`} src={i % 2 ? "pixabay/pop-a.mp3" : "pixabay/pop-burbuja.mp3"} en={p.t0 + 0.1} vol={0.45} />);
    for (let n = 0; n < 3; n++) {
      sfx.push(<Sfx key={`t${i}${n}`} src="kenney/tick_001.ogg" en={p.t0 + 1.6 + n * 0.7} vol={1} dur={0.3} />);
      sfx.push(<Sfx key={`c${i}${n}`} src="pixabay/clic-boton.mp3" en={p.t0 + 1.6 + n * 0.7} vol={1} dur={0.3} />);
    }
    sfx.push(<Sfx key={`r${i}`} src="pixabay/ding-exito.mp3" en={p.t0 + 3.7} vol={0.5} dur={1.7} />);
  });
  sfx.push(<Sfx key="q4a" src="pixabay/whoosh-a.mp3" en={T_Q4 - 0.04} vol={0.35} dur={0.6} />);
  sfx.push(<Sfx key="q4b" src="pixabay/notificacion-b.mp3" en={T_Q4 + 0.15} vol={0.45} dur={0.6} />);
  sfx.push(<Sfx key="q4c" src="pixabay/teclado.mp3" en={T_Q4 + 2.2} vol={0.3} dur={1.5} />);
  sfx.push(<Sfx key="q4d" src="pixabay/subida-tension.mp3" en={T_Q4 + 2.6} vol={0.22} dur={2.6} />);
  sfx.push(<Sfx key="ci1" src="pixabay/whoosh-b.mp3" en={T_CIERRE - 0.04} vol={0.35} dur={0.9} />);
  sfx.push(<Sfx key="ci2" src="pixabay/tada.mp3" en={T_CIERRE + 0.25} vol={0.4} dur={1.2} />);
  sfx.push(<Sfx key="ci3" src="pixabay/pop-burbuja.mp3" en={T_CIERRE + 1.0} vol={0.45} />);

  // --- voz de Alejo ---
  const voces: React.ReactNode[] = [<VozEn key="v0" frase={f[0]} en={0} />];
  PREGUNTAS.forEach((p) => {
    voces.push(<VozEn key={`vq${p.voz}`} frase={f[p.voz]} en={p.t0 + 0.05} />);
    voces.push(<VozEn key={`vr${p.vozRev}`} frase={f[p.vozRev]} en={p.t0 + 3.72} />);
  });
  voces.push(<VozEn key="v7" frase={f[7]} en={T_Q4 + 0.1} />);
  voces.push(<VozEn key="v8" frase={f[8]} en={T_CIERRE + 0.2} />);

  return (
    <AbsoluteFill>
      <Background />
      {escena}
      {sfx}
      {voces}
    </AbsoluteFill>
  );
};
