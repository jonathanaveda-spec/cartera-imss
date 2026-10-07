import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, textos } from "../brand";
import { ease } from "../anim";
import { esMensaje } from "./linea";
import type { ItemChat, ItemResuelto, Mensaje } from "./linea";

// Chat de WhatsApp animado (tema oscuro): burbujas que entran, «escribiendo…», horas y palomitas.
// Todo con nombres inventados. Mide 800 px de ancho, centrado en x = 540.
const WA = {
  fondo: "#0B141A",
  barra: "#1F2C34",
  recibido: "#202C33",
  enviado: "#005C4B",
  texto: "#E9EDEF",
  hora: "rgba(233,237,239,0.62)",
  palomitas: "#53BDEB",
};

const Palomitas: React.FC<{ leido?: boolean }> = ({ leido }) => (
  <span style={{ color: leido ? WA.palomitas : WA.hora, fontWeight: 800, letterSpacing: -4, marginLeft: 8 }}>✓✓</span>
);

const Burbuja: React.FC<{ m: Mensaje; p: number }> = ({ m, p }) => {
  const mia = m.de === "asesor";
  return (
    <div style={{ display: "flex", justifyContent: mia ? "flex-end" : "flex-start", opacity: p, translate: `0px ${(1 - p) * 26}px`, scale: 0.88 + p * 0.12, transformOrigin: mia ? "100% 100%" : "0% 100%" }}>
      <div
        style={{
          maxWidth: 640,
          background: m.color ?? (mia ? WA.enviado : WA.recibido),
          color: m.color ? C.blanco : WA.texto,
          padding: "16px 24px 12px",
          borderRadius: 30,
          borderTopRightRadius: mia ? 8 : 30,
          borderTopLeftRadius: mia ? 30 : 8,
          fontFamily: textos,
          fontWeight: 600,
          fontSize: m.grande ? 56 : 54,
          lineHeight: 1.22,
          boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
        }}
      >
        {m.texto}
        <div style={{ textAlign: "right", fontSize: 30, fontWeight: 600, color: WA.hora, marginTop: 4 }}>
          {m.hora}
          {mia ? <Palomitas leido={m.leido} /> : null}
        </div>
      </div>
    </div>
  );
};

const Puntos: React.FC<{ de: "cliente" | "asesor"; p: number }> = ({ de, p }) => {
  const frame = useCurrentFrame();
  const mia = de === "asesor";
  return (
    <div style={{ display: "flex", justifyContent: mia ? "flex-end" : "flex-start", opacity: p, translate: `0px ${(1 - p) * 20}px` }}>
      <div style={{ background: mia ? WA.enviado : WA.recibido, borderRadius: 30, padding: "26px 34px", display: "flex", gap: 12, boxShadow: "0 6px 14px rgba(0,0,0,0.25)" }}>
        {[0, 1, 2].map((i) => {
          const o = interpolate(Math.sin(frame / 4 - i * 1.1), [-1, 1], [0.3, 1]);
          return <div key={i} style={{ width: 18, height: 18, borderRadius: 999, background: WA.texto, opacity: o, translate: `0px ${-(o - 0.3) * 8}px` }} />;
        })}
      </div>
    </div>
  );
};

export const Chat: React.FC<{
  contacto: { nombre: string; iniciales: string };
  items: ItemChat[];
  tiempos: ItemResuelto[];
  top?: number;
  alto?: number;
}> = ({ contacto, items, tiempos, top = 300, alto = 920 }) => {
  const frame = useCurrentFrame();
  const entra = ease(frame, 0, 14);
  // «escribiendo…» de la contraparte en la cabecera
  const escribiendoCliente = items.some((it, i) => !esMensaje(it) && it.escribiendo === "cliente" && frame >= tiempos[i].ini && frame < tiempos[i].fin);
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        top,
        width: 800,
        height: alto,
        borderRadius: 52,
        overflow: "hidden",
        background: WA.fondo,
        boxShadow: "0 40px 80px rgba(3,12,40,0.5), 0 0 0 3px rgba(255,255,255,0.14)",
        opacity: 0.4 + entra * 0.6,
        translate: `0px ${(1 - entra) * 80}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Cabecera */}
      <div style={{ flex: "none", height: 140, background: WA.barra, display: "flex", alignItems: "center", gap: 22, padding: "0 30px" }}>
        <div style={{ width: 84, height: 84, borderRadius: 999, background: C.celeste, color: C.blanco, fontFamily: textos, fontWeight: 800, fontSize: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {contacto.iniciales}
        </div>
        <div>
          <div style={{ fontFamily: textos, fontWeight: 800, fontSize: 42, color: WA.texto }}>{contacto.nombre}</div>
          <div style={{ fontFamily: textos, fontWeight: 600, fontSize: 30, color: escribiendoCliente ? "#25D366" : WA.hora }}>{escribiendoCliente ? "escribiendo…" : "en línea"}</div>
        </div>
      </div>
      {/* Mensajes (se acomodan hacia abajo, como en el teléfono) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 18, padding: "24px 26px 28px" }}>
        {items.map((it, i) => {
          const t = tiempos[i];
          if (frame < t.ini) return null;
          if (!esMensaje(it)) {
            if (frame >= t.fin) return null;
            return <Puntos key={i} de={it.escribiendo} p={ease(frame, t.ini, t.ini + 8)} />;
          }
          return <Burbuja key={i} m={it} p={ease(frame, t.ini, t.ini + 9)} />;
        })}
      </div>
      {/* Barra para escribir */}
      <div style={{ flex: "none", height: 120, background: WA.barra, display: "flex", alignItems: "center", padding: "0 26px" }}>
        <div style={{ flex: 1, height: 74, borderRadius: 999, background: WA.recibido, display: "flex", alignItems: "center", padding: "0 30px", fontFamily: textos, fontWeight: 600, fontSize: 34, color: WA.hora }}>
          Mensaje
        </div>
      </div>
    </div>
  );
};
