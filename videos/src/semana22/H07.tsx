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

// H07 · «Lo que nadie te cuenta de la cobranza #2» (vie 23/10, 8 p. m.). Voces: Alejo (el asesor que confiesa) + Jorge HD.
// Citlali = conductora en foto (hace las preguntas con globos de texto; no habla). Clientes inventados.
export type H07Props = { frases?: VozFrase[] };

// Segundos donde empieza cada escena (con la voz medida en voz/h07-cobranza-2)
const T = { quiz: 5.5, antes: 12.7, ahora: 17.2, sino: 24.0, cierre: 27.6 };
export const TOTAL_H07 = T.cierre + 2.9;

export const calcularH07: CalculateMetadataFunction<H07Props> = async () => {
  const frases = await cargarFrases("h07-cobranza-2");
  return { durationInFrames: Math.round(TOTAL_H07 * 30), props: { frases } };
};

const Fila: React.FC<{ nombre: string; estado: string; color: string; detalle: string; top: number; en: number; frame: number; fps: number }> = ({ nombre, estado, color, detalle, top, en, frame, fps }) => {
  const p = ease(frame, Math.round(en * fps), Math.round(en * fps) + 9, Easing.out(Easing.back(1.3)));
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top, height: 150, borderRadius: 34, background: C.blanco, boxShadow: "0 18px 36px rgba(3,12,40,0.38)", display: "flex", alignItems: "center", padding: "0 34px", gap: 24, opacity: p, translate: `${(1 - p) * 90}px 0px` }}>
      <div style={{ width: 34, height: 34, borderRadius: 999, background: color, flex: "none" }} />
      <div style={{ flex: 1, fontFamily: textos, fontWeight: 800, color: C.tinta }}>
        <div style={{ fontSize: 50, lineHeight: 1.1 }}>{nombre}</div>
        <div style={{ fontSize: 36, color: "#475569", fontWeight: 600 }}>{detalle}</div>
      </div>
      <div style={{ background: color, color: C.blanco, borderRadius: 999, fontFamily: textos, fontWeight: 800, fontSize: 38, padding: "6px 26px 10px", whiteSpace: "nowrap" }}>{estado}</div>
    </div>
  );
};

const Opcion: React.FC<{ letra: string; texto: string; top: number; en: number; frame: number; fps: number }> = ({ letra, texto, top, en, frame, fps }) => {
  const p = ease(frame, Math.round(en * fps), Math.round(en * fps) + 8, Easing.out(Easing.back(1.4)));
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top, height: 118, borderRadius: 34, background: C.blanco, boxShadow: "0 16px 32px rgba(3,12,40,0.35)", display: "flex", alignItems: "center", padding: "0 30px", gap: 28, opacity: p, scale: 0.9 + p * 0.1 }}>
      <div style={{ width: 76, height: 76, borderRadius: 999, background: C.azulCartera, color: C.blanco, fontFamily: titulos, fontWeight: 800, fontSize: 54, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 4 }}>{letra}</div>
      <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: 58, letterSpacing: -1.2, color: C.tinta }}>{texto}</div>
    </div>
  );
};

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

export const H07: React.FC<H07Props> = ({ frases }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = frases!;
  const rel = (t0: number) => frame - Math.round(t0 * fps);

  let escena: React.ReactNode = null;

  if (t < T.quiz) {
    // GANCHO: en el cuadro 0 ya se lee todo; se mueve el zoom y «cobrar» da un golpe cuando se dice
    const zoom = interpolate(frame, [0, 160], [1, 1.03], { extrapolateRight: "clamp" });
    const golpe = 1 + 0.12 * Math.max(0, 1 - Math.abs(t - 3.9) / 0.25) * (t >= 3.9 ? 1 : 0);
    escena = (
      <AbsoluteFill style={{ scale: zoom }}>
        <Chip texto="Lo que nadie te cuenta #2" top={215} desde={-10} />
        <div style={{ position: "absolute", left: 140, width: 800, top: 380, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 86, lineHeight: 1.04, letterSpacing: -2.5, color: C.blanco, textShadow: "0 8px 30px rgba(5,20,60,0.5)", whiteSpace: "nowrap" }}>
          <div>Nadie me dijo</div>
          <div>esto cuando empecé:</div>
          <div style={{ marginTop: 40 }}>el problema no</div>
          <div>era <Rico t="**vender**" />…</div>
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1000, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 210, lineHeight: 1, letterSpacing: -7, color: C.oro, textShadow: "0 10px 36px rgba(5,20,60,0.55)", scale: golpe, whiteSpace: "nowrap" }}>
          <div style={{ fontSize: 100, color: C.blanco, letterSpacing: -3 }}>era</div>
          COBRAR
        </div>
      </AbsoluteFill>
    );
  } else if (t < T.antes) {
    // QUIZ A/B/C + cuenta regresiva + «comenta tu letra»
    const fr = rel(T.quiz);
    const cd0 = T.quiz + 3.7; // 9.2
    const enCuenta = t >= cd0 && t < cd0 + 2.1;
    const despues = t >= cd0 + 2.1;
    escena = (
      <AbsoluteFill>
        <Chip texto="Pausa y cuenta ⏸️" top={195} fondo={C.verde} color={C.blanco} />
        <CitlaliCirculo cara={despues ? "c21" : "c13"} size={250} left={415} top={290} pop={despues ? Math.round((cd0 + 2.1) * fps) : 0} aro={C.oro} />
        <Burbuja left={140} top={590} width={800} desde={2} size={56}>
          <div>¿Cuántos clientes tienes</div>
          <div>
            <span style={{ color: C.azulCartera }}>atrasados</span> hoy?
          </div>
        </Burbuja>
        <Opcion letra="A" texto="Ninguno" top={840} en={1.0} frame={fr} fps={fps} />
        <Opcion letra="B" texto="Uno o dos" top={980} en={1.4} frame={fr} fps={fps} />
        <Opcion letra="C" texto="Tres o más" top={1120} en={1.8} frame={fr} fps={fps} />
        {enCuenta ? <Anillo t={t} t0={cd0} top={1250} /> : null}
        {despues ? (
          <div style={{ position: "absolute", left: 140, width: 800, top: 1262, textAlign: "center", opacity: ease(frame, Math.round((cd0 + 2.1) * fps), Math.round((cd0 + 2.1) * fps) + 8), scale: 0.8 + ease(frame, Math.round((cd0 + 2.1) * fps), Math.round((cd0 + 2.1) * fps) + 8, Easing.out(Easing.back(1.8))) * 0.2 }}>
            <span style={{ background: C.oro, color: C.tinta, borderRadius: 999, fontFamily: titulos, fontWeight: 800, fontSize: 68, letterSpacing: -1.5, padding: "10px 44px 18px" }}>Comenta tu letra 👇</span>
          </div>
        ) : null}
      </AbsoluteFill>
    );
  } else if (t < T.ahora) {
    const fr = rel(T.antes);
    escena = (
      <AbsoluteFill>
        <Chip texto="ANTES" top={200} fondo={C.rojo} color={C.blanco} />
        <div style={{ position: "absolute", left: 140, width: 800, top: 300, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 72, lineHeight: 1.04, letterSpacing: -2, color: C.blanco, textShadow: "0 6px 28px rgba(5,20,60,0.45)", whiteSpace: "nowrap" }}>
          <div>Vendía…</div>
          <div>y se me <Rico t="**olvidaba**" /></div>
          <div>la fecha de cobro</div>
        </div>
        <Fila nombre="Doña Rosa" detalle="Cobro: 3 oct" estado="Atrasado" color={C.rojo} top={700} en={0.8} frame={fr} fps={fps} />
        <Fila nombre="Don Luis" detalle="Cobro: 8 oct" estado="Atrasado" color={C.rojo} top={880} en={1.5} frame={fr} fps={fps} />
        <Fila nombre="Karen" detalle="Cobro: 12 oct" estado="Atrasado" color={C.rojo} top={1060} en={2.2} frame={fr} fps={fps} />
        <div style={{ position: "absolute", left: 140, width: 800, top: 1260, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 52, color: C.secundario, opacity: ease(fr, 80, 92) }}>3 clientes atrasados 😬</div>
      </AbsoluteFill>
    );
  } else if (t < T.sino) {
    const fr = rel(T.ahora);
    const campana = ease(fr, 62, 72, Easing.out(Easing.back(1.5)));
    escena = (
      <AbsoluteFill>
        <Chip texto="AHORA" top={200} fondo={C.verde} color={C.blanco} />
        <div style={{ position: "absolute", left: 140, width: 800, top: 320, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 86, lineHeight: 1.04, letterSpacing: -2.5, color: C.blanco, textShadow: "0 6px 28px rgba(5,20,60,0.45)", whiteSpace: "nowrap" }}>
          <div>Cada venta, con</div>
          <div>su <Rico t="**fecha**" /></div>
        </div>
        <Fila nombre="Doña Rosa" detalle="Cobro: 28 oct" estado="Al día" color={C.verde} top={700} en={0.7} frame={fr} fps={fps} />
        <Fila nombre="Don Luis" detalle="Cobro: 30 oct" estado="Al día" color={C.verde} top={880} en={1.3} frame={fr} fps={fps} />
        <Fila nombre="Karen" detalle="Cobro: 2 nov" estado="Al día" color={C.verde} top={1060} en={1.9} frame={fr} fps={fps} />
        <div style={{ position: "absolute", left: 140, width: 800, top: 1250, display: "flex", justifyContent: "center", opacity: campana, scale: 0.85 + campana * 0.15 }}>
          <div style={{ background: C.oro, color: C.tinta, borderRadius: 999, fontFamily: titulos, fontWeight: 800, fontSize: 58, letterSpacing: -1.2, padding: "10px 42px 16px", whiteSpace: "nowrap", boxShadow: "0 18px 36px rgba(3,12,40,0.4)" }}>🔔 Aviso 3 días antes</div>
        </div>
      </AbsoluteFill>
    );
  } else if (t < T.cierre) {
    const fr = rel(T.sino);
    const vacia = 1 - Math.min(1, Math.max(0, (t - T.sino - 1.4) / 2.0));
    const bote = Math.sin(fr / 4) * 10;
    const resp = (txt: string, color: string, left: number, en: number) => {
      const p = ease(fr, en, en + 8, Easing.out(Easing.back(1.6)));
      return (
        <div style={{ position: "absolute", left, top: 880, width: 385, height: 190, borderRadius: 40, background: color, color: C.blanco, fontFamily: titulos, fontWeight: 800, fontSize: 112, letterSpacing: -3, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 12, boxShadow: "0 22px 44px rgba(3,12,40,0.45)", opacity: p, scale: 0.8 + p * 0.2, border: "6px solid rgba(255,255,255,0.35)" }}>{txt}</div>
      );
    };
    escena = (
      <AbsoluteFill>
        <Chip texto="Tu turno" top={195} fondo={C.verde} color={C.blanco} />
        <CitlaliCirculo cara="c13" size={270} left={405} top={285} aro={C.oro} pop={0} />
        <Burbuja left={140} top={610} width={800} desde={2} size={72}>
          <div>¿A ti te lo</div>
          <div>
            <span style={{ color: C.azulCartera }}>dijeron</span>?
          </div>
        </Burbuja>
        {resp("SÍ", C.azulCartera, 140, 6)}
        {resp("NO", C.azulNoche, 555, 10)}
        <div style={{ position: "absolute", left: 240, width: 600, top: 1150, height: 20, borderRadius: 999, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
          <div style={{ width: `${vacia * 100}%`, height: "100%", background: C.oro, borderRadius: 999 }} />
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1215, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 48, color: C.secundario }}>Responde en los comentarios</div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1300, textAlign: "center", fontSize: 80, translate: `0px ${bote}px` }}>👇</div>
      </AbsoluteFill>
    );
  } else {
    escena = <Cierre frase={["¿Te lo dijeron?", "Sí o no 👇"]} grande />;
  }

  // ---------- efectos de sonido (pixabay primero) ----------
  const s: React.ReactNode[] = [];
  const add = (src: string, en: number, vol = 0.45, dur = 1.5) => s.push(<Sfx key={`${src}${en}`} src={src} en={en} vol={vol} dur={dur} />);
  add("pixabay/pop-a.mp3", 0, 0.55, 0.7);
  add("pixabay/whoosh-a.mp3", 0.02, 0.4, 0.7);
  add("pixabay/pop-b.mp3", 1.6, 0.35, 1);
  add("kenney/impactPunch_medium_000.ogg", 3.9, 0.55, 0.6); // «COBRAR»
  // quiz
  add("pixabay/whoosh-b.mp3", T.quiz - 0.04, 0.32, 0.9);
  add("pixabay/pop-burbuja.mp3", T.quiz + 0.15, 0.45, 1);
  add("pixabay/pop-a.mp3", T.quiz + 1.0, 0.4, 0.6);
  add("pixabay/pop-a.mp3", T.quiz + 1.4, 0.4, 0.6);
  add("pixabay/pop-a.mp3", T.quiz + 1.8, 0.4, 0.6);
  for (let n = 0; n < 3; n++) {
    add("kenney/tick_001.ogg", T.quiz + 3.7 + n * 0.7, 1, 0.3);
    add("pixabay/clic-boton.mp3", T.quiz + 3.7 + n * 0.7, 1, 0.3);
  }
  add("pixabay/ding-exito.mp3", T.quiz + 5.8, 0.5, 1.7);
  // antes (mal)
  add("pixabay/whoosh-b.mp3", T.antes - 0.04, 0.32, 0.9);
  add("pixabay/buzzer-error.mp3", T.antes + 0.1, 0.35, 1.2);
  add("pixabay/pop-a.mp3", T.antes + 0.8, 0.45, 0.6);
  add("pixabay/pop-a.mp3", T.antes + 1.5, 0.45, 0.6);
  add("pixabay/pop-b.mp3", T.antes + 2.2, 0.4, 1);
  add("pixabay/disco-rayado.mp3", T.antes + 2.9, 0.25, 1.5);
  // ahora (bien)
  add("pixabay/whoosh-a.mp3", T.ahora - 0.04, 0.35, 0.6);
  add("pixabay/ding-exito.mp3", T.ahora + 0.1, 0.45, 1.7);
  add("pixabay/pop-a.mp3", T.ahora + 0.7, 0.45, 0.6);
  add("pixabay/pop-burbuja.mp3", T.ahora + 1.3, 0.45, 1);
  add("pixabay/pop-b.mp3", T.ahora + 1.9, 0.4, 1);
  add("pixabay/notificacion-a.mp3", T.ahora + 2.05, 0.5, 1.5);
  add("pixabay/caja-kaching.mp3", T.ahora + 4.5, 0.4, 2);
  // sí o no
  add("pixabay/whoosh-b.mp3", T.sino - 0.04, 0.32, 0.9);
  add("pixabay/pop-burbuja.mp3", T.sino + 0.15, 0.45, 1);
  add("pixabay/pop-a.mp3", T.sino + 0.2 + 0.2, 0.4, 0.6);
  add("pixabay/pop-a.mp3", T.sino + 0.33, 0.4, 0.6);
  add("pixabay/subida-tension.mp3", T.sino + 1.0, 0.2, 2.5);
  // cierre
  add("pixabay/whoosh-b.mp3", T.cierre - 0.04, 0.35, 0.9);
  add("pixabay/tada.mp3", T.cierre + 0.25, 0.4, 1.2);
  add("pixabay/pop-burbuja.mp3", T.cierre + 1.0, 0.45, 1);

  // ---------- voces ----------
  const v = [
    <VozEn key="1" frase={f[0]} en={0} />,
    <VozEn key="2" frase={f[1]} en={T.quiz + 0.1} />,
    <VozEn key="3" frase={f[2]} en={T.quiz + 5.9} />,
    <VozEn key="4" frase={f[3]} en={T.antes + 0.1} />,
    <VozEn key="5" frase={f[4]} en={T.ahora + 0.1} />,
    <VozEn key="6" frase={f[5]} en={T.sino + 0.1} />,
    <VozEn key="7" frase={f[6]} en={T.cierre + 0.2} />,
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
