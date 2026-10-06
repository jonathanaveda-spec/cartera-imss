import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from "remotion";
import { C, textos, titulos } from "../brand";
import { ease } from "../anim";

// Escena 7 (17.2-21 s): llamado a la accion. Logo + "Pruebala gratis en la beta" + sitio.
export const Llamado: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = ease(frame, 0, 16, Easing.out(Easing.back(1.2)));
  const nombre = ease(frame, 6, 20);
  const t1 = ease(frame, 12, 26);
  const t2 = ease(frame, 18, 32);
  const boton = ease(frame, 26, 40, Easing.out(Easing.back(1.3)));
  const resto = ease(frame, 38, 52);
  const latido = 1 + (Math.sin(Math.max(0, frame - 45) / 6) * 0.5 + 0.5) * 0.03;
  const subir = (p: number, d = 40) => `0px ${(1 - p) * d}px`;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 60,
          width: 880,
          top: 230,
          display: "flex",
          justifyContent: "center",
          scale: 0.6 + logo * 0.4,
          opacity: 0.6 + logo * 0.4,
        }}
      >
        <Img
          src={staticFile("logo.png")}
          style={{
            width: 240,
            height: 240,
            borderRadius: 56,
            boxShadow: "0 28px 56px rgba(3,12,40,0.5)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          width: 880,
          top: 500,
          textAlign: "center",
          fontFamily: titulos,
          fontWeight: 800,
          fontSize: 92,
          letterSpacing: -2,
          color: C.blanco,
          opacity: nombre,
          translate: subir(nombre),
        }}
      >
        Cartera Asesor
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          width: 880,
          top: 650,
          textAlign: "center",
          fontFamily: titulos,
          fontWeight: 800,
          fontSize: 112,
          lineHeight: 1.04,
          letterSpacing: -2.5,
          color: C.blanco,
          textShadow: "0 6px 28px rgba(5,20,60,0.45)",
        }}
      >
        <div style={{ opacity: t1, translate: subir(t1, 50) }}>
          Pruébala <span style={{ color: C.oro }}>gratis</span>
        </div>
        <div style={{ opacity: t2, translate: subir(t2, 50) }}>en la beta</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          width: 880,
          top: 985,
          display: "flex",
          justifyContent: "center",
          opacity: boton,
          scale: (0.85 + boton * 0.15) * latido,
        }}
      >
        <div
          style={{
            background: C.verde,
            color: C.blanco,
            fontFamily: titulos,
            fontWeight: 800,
            fontSize: 76,
            letterSpacing: -1,
            padding: "30px 56px 34px",
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
          position: "absolute",
          left: 60,
          width: 880,
          top: 1180,
          textAlign: "center",
          fontFamily: textos,
          fontWeight: 800,
          fontSize: 46,
          lineHeight: 1.3,
          color: C.secundario,
          opacity: resto,
          translate: subir(resto, 30),
        }}
      >
        Beta gratuita · hasta 100 clientes
        <div style={{ fontWeight: 600, fontSize: 42, marginTop: 14 }}>
          Tu cartera de clientes, organizada y al día
        </div>
      </div>
    </AbsoluteFill>
  );
};
