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

// H08 · «¿Lo viste en el segundo 1? 🔴» (dom 25/10 → sale mar 27/10, 7:30 a. m.). Voz: Jorge HD (narrador de suspenso).
// Citlali = conductora en foto (no habla). Clientes inventados. Interactivos: «encuentra lo raro» (seg 4,7) y Sí/No (seg 25).
export type H08Props = { frases?: VozFrase[] };

const T = { semana: 7.0, revela: 14.7, app: 19.5, quiz: 25.3, cierre: 27.9 };
export const TOTAL_H08 = T.cierre + 3.0;

export const calcularH08: CalculateMetadataFunction<H08Props> = async () => {
  const frases = await cargarFrases("h08-pista-escondida");
  return { durationInFrames: Math.round(TOTAL_H08 * 30), props: { frases } };
};

// Libreta dibujada: posición del puntito rojo (coordenadas de pantalla)
const NB = { left: 140, top: 560, w: 800, h: 670 };
const NOMBRES = ["Doña Rosa", "Don Luis", "Karen M.", "Toño R.", "Mari G."];
const DOT = { x: 520, y: 1044 };

const Libreta: React.FC<{ brilla?: number }> = ({ brilla = 0 }) => (
  <>
    <div style={{ position: "absolute", left: NB.left, top: NB.top, width: NB.w, height: NB.h, borderRadius: 30, background: "#FFF8E7", boxShadow: "0 30px 60px rgba(3,12,40,0.5)", overflow: "hidden" }}>
      {/* renglones */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 130 + i * 100 + 100, height: 3, background: "#BFD2EE" }} />
      ))}
      <div style={{ position: "absolute", left: 100, top: 0, bottom: 0, width: 4, background: "#E8A0A0" }} />
      <div style={{ position: "absolute", left: 130, top: 26, fontFamily: titulos, fontWeight: 800, fontSize: 62, letterSpacing: -1.5, color: "#1E3A8A" }}>Mis clientes</div>
      {NOMBRES.map((n, i) => (
        <div key={n} style={{ position: "absolute", left: 130, top: 130 + i * 100 + 8, fontFamily: textos, fontWeight: 600, fontSize: 56, color: "#1E293B" }}>
          {n}
        </div>
      ))}
    </div>
    {/* el puntito rojo diminuto (junto a «Toño R.») */}
    <div style={{ position: "absolute", left: DOT.x - 9, top: DOT.y - 9, width: 18, height: 18, borderRadius: 999, background: C.rojo, boxShadow: brilla ? `0 0 ${20 * brilla}px ${8 * brilla}px rgba(220,38,38,0.7)` : undefined }} />
  </>
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

const Fila: React.FC<{ nombre: string; estado: string; color: string; detalle: string; top: number; en: number; frame: number; fps: number; grande?: boolean }> = ({ nombre, estado, color, detalle, top, en, frame, fps, grande }) => {
  const p = ease(frame, Math.round(en * fps), Math.round(en * fps) + 9, Easing.out(Easing.back(1.3)));
  const latido = grande ? 1 + Math.max(0, Math.sin(frame / 5)) * 0.025 : 1;
  return (
    <div style={{ position: "absolute", left: 140, width: 800, top, height: grande ? 170 : 140, borderRadius: 34, background: C.blanco, boxShadow: grande ? "0 0 0 8px rgba(220,38,38,0.55), 0 22px 44px rgba(3,12,40,0.45)" : "0 18px 36px rgba(3,12,40,0.38)", display: "flex", alignItems: "center", padding: "0 34px", gap: 24, opacity: p, translate: `${(1 - p) * 90}px 0px`, scale: latido }}>
      <div style={{ width: grande ? 46 : 34, height: grande ? 46 : 34, borderRadius: 999, background: color, flex: "none" }} />
      <div style={{ flex: 1, fontFamily: textos, fontWeight: 800, color: C.tinta }}>
        <div style={{ fontSize: 50, lineHeight: 1.1 }}>{nombre}</div>
        <div style={{ fontSize: 36, color: "#475569", fontWeight: 600 }}>{detalle}</div>
      </div>
      <div style={{ background: color, color: C.blanco, borderRadius: 999, fontFamily: textos, fontWeight: 800, fontSize: 38, padding: "6px 26px 10px", whiteSpace: "nowrap" }}>{estado}</div>
    </div>
  );
};

export const H08: React.FC<H08Props> = ({ frases }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = frases!;
  const rel = (t0: number) => frame - Math.round(t0 * fps);

  let escena: React.ReactNode = null;

  if (t < T.semana) {
    // GANCHO + INTERACTIVO 1: «encuentra lo raro» (cuenta regresiva de 3 s a partir del seg 4,7)
    const zoom = interpolate(frame, [0, 200], [1, 1.035], { extrapolateRight: "clamp" });
    const cd0 = 4.7;
    const enCuenta = t >= cd0 && t < cd0 + 2.1;
    escena = (
      <AbsoluteFill>
        <AbsoluteFill style={{ scale: zoom, transformOrigin: "50% 45%" }}>
          <CitlaliCirculo cara="c13" size={210} left={435} top={185} aro={C.oro} pop={0} />
          <div style={{ position: "absolute", left: 140, width: 800, top: 410, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 126, lineHeight: 1, letterSpacing: -4, color: C.blanco, textShadow: "0 8px 30px rgba(5,20,60,0.5)", whiteSpace: "nowrap" }}>
            <Rico t="Fíjate **bien** 👀" />
          </div>
          <Libreta />
        </AbsoluteFill>
        {!enCuenta ? (
          <div style={{ position: "absolute", left: 140, width: 800, top: 1285, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 56, color: C.secundario }}>
            ¿Ves algo <span style={{ color: C.oro }}>raro</span>?
          </div>
        ) : (
          <Anillo t={t} t0={cd0} top={1245} />
        )}
      </AbsoluteFill>
    );
  } else if (t < T.revela) {
    // La semana «normal» de Laura
    const fr = rel(T.semana);
    const fila = (txt: string, ic: string, top: number, en: number) => {
      const p = ease(fr, Math.round(en * fps), Math.round(en * fps) + 9, Easing.out(Easing.back(1.3)));
      return (
        <div style={{ position: "absolute", left: 140, width: 800, top, height: 140, borderRadius: 34, background: C.blanco, boxShadow: "0 18px 36px rgba(3,12,40,0.38)", display: "flex", alignItems: "center", padding: "0 38px", gap: 28, opacity: p, translate: `${(1 - p) * 90}px 0px` }}>
          <div style={{ fontSize: 66 }}>{ic}</div>
          <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: 60, letterSpacing: -1.5, color: C.tinta, whiteSpace: "nowrap" }}>{txt}</div>
        </div>
      );
    };
    const ok = ease(fr, 5.6 * fps, 5.6 * fps + 9, Easing.out(Easing.back(1.5)));
    const inquieta = ease(fr, 6.6 * fps, 6.6 * fps + 8);
    escena = (
      <AbsoluteFill>
        <Chip texto="La semana de Laura" top={195} desde={-10} />
        <CitlaliCirculo cara="c21" size={270} left={405} top={285} aro={C.oro} pop={0} />
        {["L", "M", "M", "J", "V"].map((d, i) => {
          const pp = ease(fr, Math.round((0.3 + i * 0.28) * fps), Math.round((0.3 + i * 0.28) * fps) + 8, Easing.out(Easing.back(1.6)));
          return (
            <div key={i} style={{ position: "absolute", left: 140 + 20 + i * 155, top: 600, width: 110, height: 110, borderRadius: 999, background: C.verde, color: C.blanco, fontFamily: titulos, fontWeight: 800, fontSize: 60, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 6, opacity: pp, scale: 0.6 + pp * 0.4, boxShadow: "0 14px 28px rgba(3,12,40,0.4)" }}>{d}</div>
          );
        })}
        {fila("Cobró a sus clientes", "💰", 770, 2.2)}
        {fila("Mandó sus mensajes", "💬", 930, 3.3)}
        {fila("Visitó clientes", "🚶", 1090, 4.4)}
        <div style={{ position: "absolute", left: 140, width: 800, top: 1250, display: "flex", justifyContent: "center", opacity: ok, scale: 0.85 + ok * 0.15 }}>
          <div style={{ background: C.verde, color: C.blanco, borderRadius: 999, fontFamily: titulos, fontWeight: 800, fontSize: 64, letterSpacing: -1.5, padding: "10px 46px 18px", boxShadow: "0 18px 36px rgba(3,12,40,0.4)", whiteSpace: "nowrap" }}>Todo en orden ✅</div>
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1378, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 48, color: C.oro, opacity: inquieta }}>…o eso creía.</div>
      </AbsoluteFill>
    );
  } else if (t < T.app) {
    // REVELA: zoom al puntito del segundo 1
    const fr = rel(T.revela);
    const zp = ease(fr, 8, 50, Easing.bezier(0.5, 0, 0.2, 1));
    const z = 1 + 7 * zp;
    const vuelta = ease(fr, 62, 74);
    const latido = 1 + Math.max(0, Math.sin(fr / 5)) * 0.04;
    const meses = Math.min(3, Math.round(ease(fr, 66, 90, Easing.out(Easing.cubic)) * 3));
    const nadie = ease(fr, 112, 124, Easing.out(Easing.back(1.6)));
    escena = (
      <AbsoluteFill>
        <AbsoluteFill style={{ transform: `translate(${(540 - DOT.x) * zp}px, ${(900 - DOT.y) * zp}px) scale(${z})`, transformOrigin: `${DOT.x}px ${DOT.y}px` }}>
          <Libreta brilla={ease(fr, 20, 50)} />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: "linear-gradient(170deg, #0B2A6F, #1D4ED8)", opacity: vuelta }} />
        <AbsoluteFill style={{ opacity: vuelta }}>
          <Chip texto="Ese puntito era…" top={215} desde={Math.round(2.0 * fps)} fondo={C.rojo} color={C.blanco} />
          <div style={{ position: "absolute", left: 140, width: 800, top: 380, display: "flex", justifyContent: "center" }}>
            <div style={{ background: C.blanco, borderRadius: 40, padding: "18px 44px 26px", display: "flex", alignItems: "center", gap: 26, boxShadow: "0 22px 44px rgba(3,12,40,0.45)", scale: latido }}>
              <div style={{ width: 52, height: 52, borderRadius: 999, background: C.rojo }} />
              <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: 96, letterSpacing: -3, color: C.tinta }}>Toño R.</div>
            </div>
          </div>
          <div style={{ position: "absolute", left: 140, width: 800, top: 640, textAlign: "center", fontFamily: titulos, fontWeight: 800, color: C.blanco, letterSpacing: -4, lineHeight: 1 }}>
            <div style={{ fontSize: 80 }}>llevaba</div>
            <div style={{ fontSize: 330, color: C.oro, lineHeight: 1 }}>{meses}</div>
            <div style={{ fontSize: 120, marginTop: -10 }}>
              <Rico t={meses === 1 ? "**mes**" : "**meses**"} />
            </div>
            <div style={{ fontSize: 80, marginTop: 8 }}>sin pagar</div>
          </div>
          <div style={{ position: "absolute", left: 140, width: 800, top: 1270, display: "flex", justifyContent: "center", opacity: nadie, scale: 0.8 + nadie * 0.2 }}>
            <div style={{ background: C.rojo, color: C.blanco, borderRadius: 999, fontFamily: titulos, fontWeight: 800, fontSize: 66, letterSpacing: -1.5, padding: "10px 46px 18px", whiteSpace: "nowrap" }}>Y nadie lo vio 👀</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  } else if (t < T.quiz) {
    // REMATE: en la libreta se esconde; en la app, no
    const fr = rel(T.app);
    const cambio = 2.6;
    const enApp = t >= T.app + cambio;
    const fa = rel(T.app + cambio);
    escena = (
      <AbsoluteFill>
        {!enApp ? (
          <>
            <Chip texto="En la libreta" top={200} fondo={C.ambar} color={C.blanco} desde={-10} />
            <div style={{ position: "absolute", left: 140, width: 800, top: 330, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 92, lineHeight: 1.04, letterSpacing: -3, color: C.blanco, whiteSpace: "nowrap", textShadow: "0 6px 28px rgba(5,20,60,0.45)" }}>
              <div>El moroso</div>
              <div>
                <Rico t="**se esconde**" /> 🙈
              </div>
            </div>
            <div style={{ position: "absolute", left: 140, width: 800, top: 760, height: 150, borderRadius: 30, background: "#FFF8E7", boxShadow: "0 24px 48px rgba(3,12,40,0.45)", opacity: ease(fr, 6, 16), scale: 0.9 + ease(fr, 6, 16) * 0.1 }}>
              <div style={{ position: "absolute", left: 40, top: 34, fontFamily: textos, fontWeight: 600, fontSize: 56, color: "#1E293B" }}>Toño R.</div>
              <div style={{ position: "absolute", left: 300, top: 70, width: 18, height: 18, borderRadius: 999, background: C.rojo }} />
            </div>
          </>
        ) : (
          <>
            <Chip texto="En Cartera Asesor" top={200} fondo={C.verde} color={C.blanco} desde={Math.round(cambio * fps)} />
            <div style={{ position: "absolute", left: 140, width: 800, top: 330, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: 92, lineHeight: 1.04, letterSpacing: -3, color: C.blanco, whiteSpace: "nowrap", textShadow: "0 6px 28px rgba(5,20,60,0.45)", opacity: ease(fa, 0, 8) }}>
              <div>Ese rojo</div>
              <div>
                <Rico t="**se ve**" /> al abrirla
              </div>
            </div>
            <Fila nombre="Doña Rosa" detalle="Cobro: 28 oct" estado="Al día" color={C.verde} top={720} en={cambio + 0.35} frame={frame} fps={fps} />
            <Fila nombre="Karen M." detalle="Cobro: 30 oct" estado="Por vencer" color={C.ambar} top={880} en={cambio + 0.8} frame={frame} fps={fps} />
            <Fila nombre="Toño R." detalle="Debe 3 meses" estado="Moroso" color={C.rojo} top={1040} en={cambio + 1.4} frame={frame} fps={fps} grande />
            <div style={{ position: "absolute", left: 140, width: 800, top: 1270, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 50, color: C.secundario, opacity: ease(fa, 70, 82) }}>Tu cartera, pintada sola 🟢🟡🔴</div>
          </>
        )}
      </AbsoluteFill>
    );
  } else if (t < T.cierre) {
    // INTERACTIVO 2: ¿lo viste? SÍ / NO
    const fr = rel(T.quiz);
    const vacia = 1 - Math.min(1, Math.max(0, (t - T.quiz - 1.0) / 1.6));
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
        <Burbuja left={140} top={610} width={800} desde={2} size={64}>
          <div>¿Lo viste en el</div>
          <div>
            <span style={{ color: C.rojo }}>segundo 1</span>? 🔴
          </div>
        </Burbuja>
        {resp("SÍ", C.azulCartera, 140, 5)}
        {resp("NO", C.azulNoche, 555, 8)}
        <div style={{ position: "absolute", left: 240, width: 600, top: 1150, height: 20, borderRadius: 999, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
          <div style={{ width: `${vacia * 100}%`, height: "100%", background: C.oro, borderRadius: 999 }} />
        </div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1215, textAlign: "center", fontFamily: textos, fontWeight: 800, fontSize: 48, color: C.secundario }}>Sí o no, en los comentarios</div>
        <div style={{ position: "absolute", left: 140, width: 800, top: 1300, textAlign: "center", fontSize: 80, translate: `0px ${bote}px` }}>👇</div>
      </AbsoluteFill>
    );
  } else {
    escena = <Cierre frase={["Mira otra vez 👀", "¿Ya lo viste?"]} grande />;
  }

  // ---------- efectos de sonido (pixabay primero) ----------
  const s: React.ReactNode[] = [];
  const add = (src: string, en: number, vol = 0.45, dur = 1.5) => s.push(<Sfx key={`${src}${en}`} src={src} en={en} vol={vol} dur={dur} />);
  // gancho
  add("pixabay/pop-a.mp3", 0, 0.55, 0.7);
  add("pixabay/whoosh-a.mp3", 0.02, 0.4, 0.7);
  add("pixabay/pop-b.mp3", 0.7, 0.35, 1);
  add("kenney/question_001.ogg", 1.8, 0.45, 1);
  add("pixabay/pop-burbuja.mp3", 3.3, 0.4, 1);
  for (let n = 0; n < 3; n++) {
    add("kenney/tick_001.ogg", 4.7 + n * 0.7, 1, 0.3);
    add("pixabay/clic-boton.mp3", 4.7 + n * 0.7, 1, 0.3);
  }
  add("pixabay/ding-exito.mp3", 6.7, 0.35, 1);
  // semana
  add("pixabay/whoosh-b.mp3", T.semana - 0.04, 0.32, 0.9);
  add("pixabay/pop-a.mp3", T.semana + 0.15, 0.4, 0.6);
  add("pixabay/caja-kaching.mp3", T.semana + 2.25, 0.35, 1.5);
  add("pixabay/mensaje-chat.mp3", T.semana + 3.35, 0.4, 1);
  add("pixabay/pop-b.mp3", T.semana + 4.45, 0.4, 0.8);
  add("pixabay/ding-exito.mp3", T.semana + 5.65, 0.4, 1.5);
  add("pixabay/subida-tension.mp3", T.semana + 6.0, 0.28, 1.7);
  // revela
  add("pixabay/whoosh-a.mp3", T.revela + 0.2, 0.45, 0.8);
  add("pixabay/subida-tension.mp3", T.revela + 0.3, 0.3, 1.8);
  add("kenney/impactPunch_medium_000.ogg", T.revela + 2.05, 0.6, 0.7);
  add("pixabay/buzzer-error.mp3", T.revela + 2.1, 0.35, 1.2);
  add("pixabay/pop-burbuja.mp3", T.revela + 2.5, 0.4, 1);
  add("pixabay/pop-a.mp3", T.revela + 3.0, 0.4, 0.6);
  add("kenney/impactBell_heavy_000.ogg", T.revela + 3.75, 0.45, 1.4);
  // app
  add("pixabay/whoosh-b.mp3", T.app - 0.04, 0.32, 0.9);
  add("pixabay/pop-a.mp3", T.app + 0.15, 0.4, 0.6);
  add("pixabay/disco-rayado.mp3", T.app + 1.8, 0.25, 1.2);
  add("pixabay/whoosh-a.mp3", T.app + 2.55, 0.4, 0.6);
  add("pixabay/ding-exito.mp3", T.app + 2.95, 0.45, 1.5);
  add("pixabay/pop-a.mp3", T.app + 3.4, 0.4, 0.6);
  add("pixabay/pop-b.mp3", T.app + 3.9, 0.4, 0.8);
  add("pixabay/notificacion-a.mp3", T.app + 4.0, 0.5, 1.3);
  // sí o no
  add("pixabay/whoosh-b.mp3", T.quiz - 0.04, 0.32, 0.9);
  add("pixabay/pop-burbuja.mp3", T.quiz + 0.15, 0.45, 1);
  add("pixabay/pop-a.mp3", T.quiz + 0.17, 0.4, 0.6);
  add("pixabay/pop-b.mp3", T.quiz + 0.27, 0.4, 0.8);
  // cierre
  add("pixabay/whoosh-b.mp3", T.cierre - 0.04, 0.35, 0.9);
  add("pixabay/tada.mp3", T.cierre + 0.25, 0.4, 1.2);
  add("pixabay/pop-burbuja.mp3", T.cierre + 1.0, 0.45, 1);

  // ---------- voz (Jorge HD) ----------
  const v = [
    <VozEn key="0" frase={f[0]} en={0} />,
    <VozEn key="1" frase={f[1]} en={4.55} />,
    <VozEn key="2" frase={f[2]} en={T.semana + 0.1} />,
    <VozEn key="3" frase={f[3]} en={T.revela + 0.1} />,
    <VozEn key="4" frase={f[4]} en={T.app + 0.1} />,
    <VozEn key="5" frase={f[5]} en={T.quiz + 0.1} />,
    <VozEn key="6" frase={f[6]} en={T.cierre + 0.2} />,
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
