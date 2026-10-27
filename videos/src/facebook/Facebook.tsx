import type React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { C, textos, titulos } from "../brand";

// Imagenes fijas para Facebook (1080x1350, 4:5). Datos inventados. Marca: .claude/skills/marca-cartera-asesor
const caveat = loadCaveat("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily;

export const FB_W = 1080;
export const FB_H = 1350;

const FONDO = `radial-gradient(900px 500px at 50% -5%, rgba(26,163,245,0.45), rgba(26,163,245,0) 70%), linear-gradient(170deg, ${C.azulNoche}, ${C.azulCartera})`;

const Marco: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: FONDO, fontFamily: textos, color: C.blanco }}>{children}</AbsoluteFill>
);

const Oro: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: C.oro }}>{children}</span>;

const Titular: React.FC<{ children: React.ReactNode; size?: number; top?: number }> = ({ children, size = 104, top = 90 }) => (
  <div style={{ position: "absolute", left: 80, right: 80, top, textAlign: "center", fontFamily: titulos, fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: -2 }}>{children}</div>
);

const Pie: React.FC<{ y: number; texto: string }> = ({ y, texto }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
    <Img src={staticFile("logo.png")} style={{ width: 64, height: 64, borderRadius: 16, boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }} />
    <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: 40, letterSpacing: -1 }}>{texto}</div>
  </div>
);

// Recorte de una captura de la app (1080x1920) dentro de una tarjeta
const Recorte: React.FC<{ src: string; ancho: number; y0: number; alto: number; style?: React.CSSProperties }> = ({ src, ancho, y0, alto, style }) => {
  const k = ancho / 1080;
  return (
    <div style={{ width: ancho, height: alto * k, overflow: "hidden", borderRadius: 28, position: "relative", boxShadow: "0 18px 40px rgba(5,20,60,0.45)", background: "#fff", ...style }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: -y0 * k, width: ancho }} />
    </div>
  );
};

// ------------------------------------------------------------------ FB1 · gancho de dolor
const Libreta: React.FC = () => {
  const renglones = [
    { t: "Don Raúl... ¿pagó?", tachado: true, rojo: false },
    { t: "Marta ¿¿2 meses??", tachado: false, rojo: true },
    { t: "Pedro (¿o Pablo?)", tachado: false, rojo: false },
    { t: "Lupe: ¿día 15 o 30?", tachado: true, rojo: false },
    { t: "¿Quién me debe?!", tachado: false, rojo: true },
  ];
  return (
    <div style={{ width: 470, height: 640, background: "#FFF6D6", borderRadius: 18, transform: "rotate(-3deg)", position: "relative", boxShadow: "0 18px 40px rgba(5,20,60,0.5)", overflow: "hidden", color: "#27324a" }}>
      {Array.from({ length: 11 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 100 + i * 52, height: 2, background: "rgba(80,120,200,0.25)" }} />
      ))}
      <div style={{ position: "absolute", left: 58, top: 0, bottom: 0, width: 3, background: "#E57373" }} />
      {renglones.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 76, right: 14, top: 48 + i * 104, fontFamily: caveat, fontWeight: 700, fontSize: 52, color: r.rojo ? C.rojo : "#27324a", textDecoration: r.tachado ? "line-through" : "none", textDecorationThickness: 5, transform: `rotate(${i % 2 ? 2 : -1.5}deg)`, whiteSpace: "nowrap" }}>{r.t}</div>
      ))}
      <div style={{ position: "absolute", right: 26, bottom: 34, width: 120, height: 120, borderRadius: "50%", border: "10px solid rgba(150,90,40,0.28)" }} />
    </div>
  );
};

export const FB1: React.FC = () => (
  <Marco>
    <Titular size={112} top={88}>¿Cuántos clientes te <Oro>deben</Oro> este mes?</Titular>
    <div style={{ position: "absolute", top: 470, left: 50, width: 470, textAlign: "center", fontWeight: 800, fontSize: 40, color: C.secundario }}>Libreta y memoria</div>
    <div style={{ position: "absolute", top: 470, left: 560, width: 470, textAlign: "center", fontWeight: 800, fontSize: 40 }}>Con Cartera Asesor</div>
    <div style={{ position: "absolute", top: 540, left: 50 }}><Libreta /></div>
    <div style={{ position: "absolute", top: 550, left: 560, width: 470, height: 620, borderRadius: 46, background: "#0a1633", padding: 10, boxShadow: "0 22px 50px rgba(5,20,60,0.55)" }}>
      <Recorte src="capturas/sem-inicio.png" ancho={450} y0={0} alto={1440} style={{ borderRadius: 38, boxShadow: "none" }} />
    </div>
    <Pie y={1235} texto="carteraasesor.com · Beta gratuita" />
  </Marco>
);

// ------------------------------------------------------------------ FB2 · semaforo
const Fila: React.FC<{ color: string; etiqueta: string; src: string; y0: number; top: number }> = ({ color, etiqueta, src, y0, top }) => (
  <div style={{ position: "absolute", top, left: 40, right: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 28 }}>
    <div style={{ width: 150, flexShrink: 0, textAlign: "center" }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", background: color, margin: "0 auto", boxShadow: "0 0 0 8px rgba(255,255,255,0.22)" }} />
      <div style={{ marginTop: 12, fontWeight: 800, fontSize: 34, lineHeight: 1.1 }}>{etiqueta}</div>
    </div>
    <Recorte src={src} ancho={700} y0={y0} alto={435} style={{ flex: "none" }} />
  </div>
);

export const FB2: React.FC = () => (
  <Marco>
    <Titular size={76} top={60}>Quién está <Oro>al día</Oro>,<br />quién vence,<br />quién debe</Titular>
    <Fila color={C.verde} etiqueta="Al día" src="capturas/sem-lista-verde.png" y0={200} top={330} />
    <Fila color={C.ambar} etiqueta="Por vencer" src="capturas/sem-lista-amarillo.png" y0={712} top={640} />
    <Fila color={C.rojo} etiqueta="Moroso" src="capturas/sem-lista-rojo.png" y0={200} top={950} />
    <Pie y={1270} texto="carteraasesor.com · Beta gratuita" />
  </Marco>
);

// ------------------------------------------------------------------ FB3 · recordatorio en 1 toque
export const FB3: React.FC = () => (
  <Marco>
    <Titular size={88} top={60}>Avisa a tu cliente<br /><Oro>antes</Oro> de que venza,<br />en 1 toque</Titular>
    <div style={{ position: "absolute", top: 365, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Recorte src="capturas/sem-lista-amarillo.png" ancho={700} y0={712} alto={420} />
    </div>
    <div style={{ position: "absolute", top: 685, left: 0, right: 0, textAlign: "center", fontSize: 64, fontWeight: 800, lineHeight: 1, color: C.oro }}>↓</div>
    <div style={{ position: "absolute", top: 765, left: 120, right: 120, borderRadius: 32, background: "#EFE7DD", padding: "26px 26px 30px", boxShadow: "0 18px 40px rgba(5,20,60,0.45)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, color: "#0F172A" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.verde, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28 }}>M</div>
        <div style={{ fontWeight: 800, fontSize: 32 }}>Mario <span style={{ fontWeight: 600, color: "#5b6577", fontSize: 26 }}>· WhatsApp</span></div>
      </div>
      <div style={{ marginLeft: 40, background: "#D9FDD3", color: "#0F172A", borderRadius: "26px 26px 6px 26px", padding: "22px 26px", fontSize: 36, lineHeight: 1.3, fontWeight: 600 }}>
        Hola Mario, te recuerdo que hoy vence tu pago. ¿Te comparto los datos para pagar? ¡Gracias!
        <div style={{ textAlign: "right", fontSize: 24, color: "#5b6577", marginTop: 6 }}>10:42 ✓✓</div>
      </div>
    </div>
    <div style={{ position: "absolute", top: 1140, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
      <Img src={staticFile("presentadora/cara/c01.jpg")} style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 30%", border: `5px solid ${C.blanco}`, boxShadow: "0 8px 20px rgba(0,0,0,0.35)" }} />
      <div>
        <div style={{ fontFamily: titulos, fontWeight: 800, fontSize: 40 }}>Te lo muestra Citlali</div>
        <div style={{ fontWeight: 600, fontSize: 28, color: C.secundario }}>presentadora creada con IA</div>
      </div>
    </div>
    <Pie y={1270} texto="carteraasesor.com · Beta gratuita" />
  </Marco>
);

// ------------------------------------------------------------------ FB4 · regalo util
const MENSAJES = [
  { cuando: "Antes de vencer", texto: "Hola, Laura. Te recuerdo que tu pago vence el viernes. ¿Te comparto los datos para pagar?" },
  { cuando: "El día del pago", texto: "Buen día, Laura. Hoy es la fecha de tu pago. Cualquier duda, aquí estoy. ¡Gracias!" },
  { cuando: "Un día después", texto: "Hola, Laura. Se me pasó confirmar tu pago de ayer. ¿Ya lo hiciste? Si no, dime y lo vemos." },
  { cuando: "Si pasaron varios días", texto: "Laura, quiero ayudarte a ponerte al corriente. ¿Qué día te acomoda pagar esta semana?" },
];

export const FB4: React.FC = () => (
  <Marco>
    <Titular size={78} top={64}>4 mensajes de cobro que no suenan a <Oro>regaño</Oro></Titular>
    {MENSAJES.map((m, i) => (
      <div key={i} style={{ position: "absolute", left: 70, right: 70, top: 305 + i * 225, height: 205, background: C.blanco, color: C.tinta, borderRadius: 28, padding: "20px 30px 0 118px", boxShadow: "0 14px 32px rgba(5,20,60,0.35)" }}>
        <div style={{ position: "absolute", left: 28, top: 32, width: 62, height: 62, borderRadius: "50%", background: C.azulCartera, color: "#fff", fontFamily: titulos, fontWeight: 800, fontSize: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
        <div style={{ fontWeight: 800, fontSize: 26, color: C.azulCartera, textTransform: "uppercase", letterSpacing: 1 }}>{m.cuando}</div>
        <div style={{ fontWeight: 600, fontSize: 34, lineHeight: 1.25, marginTop: 6 }}>{m.texto}</div>
      </div>
    ))}
    <div style={{ position: "absolute", left: 0, right: 0, top: 1210, textAlign: "center", fontSize: 32, fontWeight: 600, color: C.secundario }}>Guárdala y cambia el nombre por el de tu cliente</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1270, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
      <Img src={staticFile("logo.png")} style={{ width: 44, height: 44, borderRadius: 11 }} />
      <div style={{ fontWeight: 600, fontSize: 30 }}>Hecho con Cartera Asesor · carteraasesor.com</div>
    </div>
  </Marco>
);
