import type React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { Background } from "../components/Background";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";
import { Rico } from "../texto";
import { aCuadros, cargarVoz, COLCHON, RETRASO_VOZ, Voz } from "../voz";
import type { VozFrase } from "../voz";

// ---------------------------------------------------------------------------------------------
// Plantilla T (tarjeta): titular + 1 a 6 líneas que entran una por una + llamado final con logo.
// Se llena desde videos/tarjetas/<id>.json. Los **asteriscos** marcan la palabra en oro.
//   { "id": "t01-5-senales",
//     "titular": ["5 señales de", "que tu **cartera**", "necesita orden"],
//     "lineas": ["No sabes quién te debe **hoy**", ...], "numerar": true,
//     "llamado": ["¿Cuántas", "te **pasan**? 👇"],
//     "voz": "t01-5-senales",            // opcional: id de public/voz/<id>/ (una frase por tramo)
//     "seg": [2, 2, 2, 2, 2, 2, 3] }     // sin voz: segundos de cada tramo (titular, cada línea, llamado)
// Con voz, las frases del MP3 van en este orden: titular, línea 1..N, llamado.
// ---------------------------------------------------------------------------------------------
export type TarjetaProps = {
  id: string;
  titular: string[];
  lineas: string[];
  numerar?: boolean;
  llamado: string[];
  voz?: string;
  seg?: number[];
  guias: boolean;
  frases?: VozFrase[]; // las llena calculateMetadata
};

const PAD_FINAL = 0.9;

// Duración en cuadros de cada tramo: titular, cada línea y llamado.
export const tramosTarjeta = (p: TarjetaProps): number[] => {
  const n = p.lineas.length + 2;
  return Array.from({ length: n }, (_, i) => {
    if (p.frases) return aCuadros(p.frases[i].seg + (i === n - 1 ? PAD_FINAL : COLCHON)) + (i === 1 ? 10 : 0); // la 1.ª línea llega 10 cuadros después (el titular termina de subir)
    return aCuadros(p.seg?.[i] ?? (i === n - 1 ? 3 : 2));
  });
};

export const calcularTarjeta: CalculateMetadataFunction<TarjetaProps> = async ({ props }) => {
  let frases: VozFrase[] | undefined;
  if (props.voz) {
    frases = await cargarVoz(props.voz);
    if (frases.length !== props.lineas.length + 2) {
      throw new Error(
        `La voz «${props.voz}» tiene ${frases.length} frases y la tarjeta necesita ${props.lineas.length + 2} (titular + líneas + llamado).`,
      );
    }
  }
  const p = { ...props, frases };
  return { durationInFrames: tramosTarjeta(p).reduce((a, b) => a + b, 0), props: p };
};

const inicios = (d: number[]) => d.map((_, i) => d.slice(0, i).reduce((a, b) => a + b, 0));

export const Tarjeta: React.FC<TarjetaProps> = (props) => {
  const frame = useCurrentFrame();
  const { lineas, titular, llamado, numerar, frases } = props;
  const dur = tramosTarjeta(props);
  const ini = inicios(dur);
  const iCall = lineas.length + 1;

  // Titular: arranca grande al centro y se hace chico arriba cuando entra la primera línea.
  const sube = ease(frame, ini[1], ini[1] + 16, Easing.bezier(0.45, 0, 0.2, 1));
  const aparece = 0.5 + ease(frame, 0, 10) * 0.5; // ya se lee desde el primer cuadro
  // Todo el contenido se va antes del llamado final
  const sale = 1 - ease(frame, ini[iCall] - 8, ini[iCall] + 4);

  return (
    <AbsoluteFill>
      <Background guias={props.guias} />

      {/* Titular */}
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: interpolate(sube, [0, 1], [600, 190]),
          transformOrigin: "50% 0%",
          scale: interpolate(sube, [0, 1], [1, 0.6]),
          opacity: aparece * sale,
          textAlign: "center",
          fontFamily: titulos,
          fontWeight: 800,
          fontSize: 112,
          lineHeight: 1.04,
          letterSpacing: -2.5,
          color: C.blanco,
          textShadow: "0 6px 28px rgba(5,20,60,0.45)",
          whiteSpace: "nowrap",
        }}
      >
        {titular.map((l, i) => {
          const p = 0.45 + ease(frame, i * 3, i * 3 + 10) * 0.55;
          return (
            <div key={i} style={{ translate: `0px ${(1 - p) * 40}px`, opacity: p }}>
              <Rico t={l} />
            </div>
          );
        })}
      </div>

      {/* Líneas: entran una por una y se quedan */}
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 440,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          opacity: sale,
        }}
      >
        {lineas.map((l, i) => {
          const t0 = ini[i + 1];
          // la primera línea espera a que el titular termine de subir; las demás entran enseguida
          const espera = i === 0 ? 14 : 3;
          const p = ease(frame, t0 + espera, t0 + espera + 14);
          const activa = frame >= t0 && frame < t0 + dur[i + 1];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                padding: "22px 30px 24px 24px",
                borderRadius: 40,
                background: activa ? "rgba(255,255,255,0.2)" : "rgba(11,42,111,0.62)",
                border: `3px solid ${activa ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)"}`,
                boxShadow: "0 18px 36px rgba(3,12,40,0.28)",
                opacity: p,
                translate: `0px ${(1 - p) * 70}px`,
                scale: 0.96 + p * 0.04,
              }}
            >
              {numerar ? (
                <div
                  style={{
                    flex: "none",
                    width: 76,
                    height: 76,
                    borderRadius: 999,
                    background: C.blanco,
                    color: C.azulNoche,
                    fontFamily: titulos,
                    fontWeight: 800,
                    fontSize: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </div>
              ) : null}
              <div
                style={{
                  fontFamily: textos,
                  fontWeight: 800,
                  fontSize: 48,
                  lineHeight: 1.18,
                  letterSpacing: -0.5,
                  color: C.blanco,
                }}
              >
                <Rico t={l} />
              </div>
            </div>
          );
        })}
      </div>

      <Llamado frame={frame - ini[iCall]} lineas={llamado} />

      {/* Voz: una frase por tramo */}
      {frases ? frases.map((f, i) => <Voz key={i} frase={f} desde={ini[i] + (i === 1 ? 14 : RETRASO_VOZ)} />) : null}
    </AbsoluteFill>
  );
};

// Llamado final: logo, pregunta/invitación y el botón verde.
const Llamado: React.FC<{ frame: number; lineas: string[] }> = ({ frame, lineas }) => {
  if (frame < -2) return null;
  const logo = ease(frame, 0, 16, Easing.out(Easing.back(1.2)));
  const q = (i: number) => ease(frame, 8 + i * 6, 22 + i * 6);
  const boton = ease(frame, 34, 48, Easing.out(Easing.back(1.3)));
  const resto = ease(frame, 44, 58);
  const latido = 1 + (Math.sin(Math.max(0, frame - 55) / 6) * 0.5 + 0.5) * 0.03;
  const caja = { position: "absolute" as const, left: 140, width: 800 };
  return (
    <AbsoluteFill>
      <div style={{ ...caja, top: 230, display: "flex", justifyContent: "center", scale: 0.6 + logo * 0.4, opacity: logo }}>
        <Img src={staticFile("logo.png")} style={{ width: 200, height: 200, borderRadius: 48, boxShadow: "0 28px 56px rgba(3,12,40,0.5)" }} />
      </div>
      <div
        style={{
          ...caja,
          top: 470,
          textAlign: "center",
          fontFamily: titulos,
          fontWeight: 800,
          fontSize: 70,
          letterSpacing: -1.5,
          color: C.blanco,
          opacity: ease(frame, 4, 18),
        }}
      >
        Cartera Asesor
      </div>
      <div
        style={{
          ...caja,
          top: 620,
          textAlign: "center",
          fontFamily: titulos,
          fontWeight: 800,
          fontSize: 124,
          lineHeight: 1.04,
          letterSpacing: -3,
          color: C.blanco,
          textShadow: "0 6px 28px rgba(5,20,60,0.45)",
          whiteSpace: "nowrap",
        }}
      >
        {lineas.map((l, i) => (
          <div key={i} style={{ opacity: q(i), translate: `0px ${(1 - q(i)) * 50}px` }}>
            <Rico t={l} />
          </div>
        ))}
      </div>
      <div style={{ ...caja, top: 1010, display: "flex", justifyContent: "center", opacity: boton, scale: (0.85 + boton * 0.15) * latido }}>
        <div
          style={{
            background: C.verde,
            color: C.blanco,
            fontFamily: titulos,
            fontWeight: 800,
            fontSize: 62,
            letterSpacing: -1,
            padding: "28px 42px 32px",
            borderRadius: 999,
            boxShadow: "0 22px 44px rgba(3,12,40,0.45)",
            border: "6px solid rgba(255,255,255,0.35)",
          }}
        >
          carteraasesor.com
        </div>
      </div>
      <div
        style={{
          ...caja,
          top: 1190,
          textAlign: "center",
          fontFamily: textos,
          fontWeight: 800,
          fontSize: 46,
          lineHeight: 1.3,
          color: C.secundario,
          opacity: resto,
          translate: `0px ${(1 - resto) * 30}px`,
        }}
      >
        Pruébala <span style={{ color: C.oro }}>gratis</span> en la beta
      </div>
    </AbsoluteFill>
  );
};
