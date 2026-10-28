import type React from "react";
import { C, titulos } from "../brand";

// Gancho disruptivo de S02 (0–1,5 s): animación PROPIA (no es un clip de nadie): un asesor con una pila de papeles pisa una
// cáscara de plátano, vuela por los aires y cae de espaldas. De cuerpo entero, centrado, con buena luz y se entiende SIN sonido.
// Golpe en el segundo 0,85 (T_IMPACTO). Todo se calcula con el tiempo `t` en segundos (sin estados).
export const T_IMPACTO = 0.85;
export const T_RESBALA = 0.45;

const lin = (t: number, p: [number, number][]) => {
  if (t <= p[0][0]) return p[0][1];
  for (let i = 0; i < p.length - 1; i++) {
    const [a, va] = p[i], [b, vb] = p[i + 1];
    if (t <= b) return va + ((t - a) / (b - a)) * (vb - va);
  }
  return p[p.length - 1][1];
};
const sm = (t: number, p: [number, number][]) => {
  if (t <= p[0][0]) return p[0][1];
  for (let i = 0; i < p.length - 1; i++) {
    const [a, va] = p[i], [b, vb] = p[i + 1];
    if (t <= b) { const u = (t - a) / (b - a); const e = u * u * (3 - 2 * u); return va + e * (vb - va); }
  }
  return p[p.length - 1][1];
};

const PAPELES = Array.from({ length: 11 }, (_, i) => ({
  vx: -380 + ((i * 137) % 760),
  vy: -720 - ((i * 53) % 340),
  x0: 610 + (i % 4) * 14,
  y0: 1010 + (i % 3) * 8,
  r0: (i * 47) % 90,
  spin: -420 + ((i * 211) % 840),
}));

const Estrella: React.FC<{ x: number; y: number; s: number; r: number }> = ({ x, y, s, r }) => (
  <polygon points="0,-1 0.29,-0.4 0.95,-0.31 0.47,0.15 0.59,0.81 0,0.5 -0.59,0.81 -0.47,0.15 -0.95,-0.31 -0.29,-0.4" fill={C.oro} stroke="#B45309" strokeWidth={0.07} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} />
);

export const CaidaGancho: React.FC<{ t: number }> = ({ t }) => {
  const rot = lin(t, [[0, 3], [0.4, 5], [0.5, -8], [0.7, -62], [T_IMPACTO, -97], [0.95, -84], [1.05, -91], [1.5, -90]]);
  const hx = lin(t, [[0, 400], [T_RESBALA, 540], [T_IMPACTO, 560], [1.05, 590], [1.5, 590]]);
  const hy = lin(t, [[0, 1150], [0.4, 1150], [0.5, 1115], [0.62, 1000], [0.74, 1140], [T_IMPACTO, 1352], [0.93, 1322], [1.02, 1352], [1.5, 1352]]);
  const camina = t < T_RESBALA;
  const sw = 30 * Math.sin(t * 15);
  const legA = camina ? sw : sm(t, [[T_RESBALA, sw], [0.6, -58], [T_IMPACTO, -38], [1.05, -6], [1.5, -6]]);
  const legB = camina ? -sw : sm(t, [[T_RESBALA, -sw], [0.6, -78], [T_IMPACTO, -48], [1.05, -10], [1.5, -10]]);
  const manoF = { x: sm(t, [[T_RESBALA, 75], [0.62, 112], [0.9, 95], [1.1, 120]]), y: sm(t, [[T_RESBALA, -130], [0.62, -410], [0.9, -380], [1.1, -300]]) };
  const manoT = { x: sm(t, [[T_RESBALA, -20], [0.62, -70], [0.9, -50], [1.1, -90]]), y: sm(t, [[T_RESBALA, -105], [0.62, -400], [0.9, -370], [1.1, -320]]) };
  const sorpresa = t >= T_RESBALA;
  const tiembla = t > T_IMPACTO && t < 1.2 ? Math.sin((t - T_IMPACTO) * 90) * 18 * (1 - (t - T_IMPACTO) / 0.35) : 0;
  const sombraW = lin(t, [[0, 220], [0.7, 200], [T_IMPACTO, 520], [1.5, 520]]);

  const brazo = (m: { x: number; y: number }, color: string) => (
    <g>
      <line x1={0} y1={-205} x2={m.x} y2={m.y} stroke={color} strokeWidth={42} strokeLinecap="round" />
      <circle cx={m.x} cy={m.y} r={27} fill="#F2C29B" />
    </g>
  );
  const pierna = (ang: number) => (
    <g transform={`rotate(${ang})`}>
      <line x1={0} y1={0} x2={0} y2={245} stroke="#1E293B" strokeWidth={64} strokeLinecap="round" />
      <ellipse cx={26} cy={268} rx={52} ry={24} fill="#0B1220" />
    </g>
  );

  const llevaPapeles = t < 0.5;
  const pasa = t > T_IMPACTO ? 1 : 0;
  const cabeza = (
    <g>
      <circle cx={6} cy={-298} r={66} fill="#F2C29B" />
      <path d="M -62 -300 A 68 68 0 0 1 76 -300 Q 44 -352 -62 -300 Z" fill="#1F2937" />
      {sorpresa ? (
        <>
          <circle cx={34} cy={-296} r={15} fill="#fff" stroke="#0F172A" strokeWidth={3} />
          <circle cx={36} cy={-296} r={6} fill="#0F172A" />
          <circle cx={-6} cy={-296} r={15} fill="#fff" stroke="#0F172A" strokeWidth={3} />
          <circle cx={-4} cy={-296} r={6} fill="#0F172A" />
          <ellipse cx={26} cy={-262} rx={14} ry={20 + 4 * pasa} fill="#7F1D1D" />
        </>
      ) : (
        <>
          <circle cx={34} cy={-298} r={7} fill="#0F172A" />
          <circle cx={-2} cy={-298} r={7} fill="#0F172A" />
          <path d="M 12 -266 Q 28 -256 42 -268" stroke="#7F1D1D" strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      )}
    </g>
  );

  const brillo = Math.max(0, 1 - (t - T_IMPACTO) / 0.25);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, translate: `${tiembla}px ${tiembla * 0.5}px` }}>
      <defs>
        <linearGradient id="pared" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F5F8FF" /><stop offset="1" stopColor="#DBE8FF" /></linearGradient>
        <linearGradient id="piso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E7C9A0" /><stop offset="1" stopColor="#D2AE80" /></linearGradient>
      </defs>
      <rect width={1080} height={1400} fill="url(#pared)" />
      <rect x={70} y={640} width={190} height={250} rx={12} fill="#fff" stroke="#9AA9C4" strokeWidth={8} />
      <rect x={96} y={668} width={138} height={90} fill="#BFD2EE" /><rect x={96} y={772} width={100} height={14} fill="#1D4ED8" /><rect x={96} y={800} width={138} height={14} fill="#9AA9C4" /><rect x={96} y={828} width={110} height={14} fill="#9AA9C4" />
      <rect x={880} y={1180} width={90} height={220} rx={10} fill="#8B5E3C" />
      <ellipse cx={925} cy={1150} rx={90} ry={70} fill="#2F855A" /><ellipse cx={890} cy={1100} rx={50} ry={60} fill="#38A169" /><ellipse cx={965} cy={1110} rx={46} ry={56} fill="#38A169" />
      <rect y={1395} width={1080} height={525} fill="url(#piso)" />
      <rect y={1380} width={1080} height={20} fill="#B8C7E6" />
      {[0, 1, 2, 3, 4, 5].map((i) => (<line key={i} x1={i * 220 - 100} y1={1400} x2={i * 260 - 300} y2={1920} stroke="#C29B6C" strokeWidth={4} />))}
      <g transform="translate(540 1400) scale(1.28) translate(-540 -1400)">
      <ellipse cx={hx} cy={1402} rx={sombraW / 2} ry={22} fill="#000" opacity={0.18} />
      {t < T_RESBALA + 0.25 ? (
        <g transform="translate(700 1388)">
          <path d="M -70 0 Q -40 -34 0 -22 Q 40 -34 70 0 Q 40 10 0 6 Q -40 10 -70 0 Z" fill="#FACC15" stroke="#A16207" strokeWidth={5} />
          <path d="M -70 0 Q -80 -14 -62 -26" stroke="#78350F" strokeWidth={9} fill="none" strokeLinecap="round" />
        </g>
      ) : null}
      <g transform={`translate(${hx} ${hy}) rotate(${rot})`}>
        {pierna(legB)}
        {brazo(manoT, "#1E3A8A")}
        <rect x={-58} y={-238} width={116} height={250} rx={44} fill="#1E3A8A" />
        <polygon points="-22,-236 22,-236 0,-150" fill="#fff" />
        <polygon points="0,-232 -13,-208 0,-130 13,-208" fill="#1AA3F5" />
        {cabeza}
        {pierna(legA)}
        {brazo(manoF, "#1E3A8A")}
        {llevaPapeles ? (
          <g transform={`translate(${manoF.x} ${manoF.y})`}>
            <rect x={-6} y={-70} width={126} height={82} rx={6} fill="#CBD5E1" />
            <rect x={-12} y={-76} width={126} height={82} rx={6} fill="#fff" stroke="#94A3B8" strokeWidth={3} />
            {[0, 1, 2].map((i) => (<line key={i} x1={6} y1={-56 + i * 22} x2={96} y2={-56 + i * 22} stroke="#94A3B8" strokeWidth={4} />))}
          </g>
        ) : null}
      </g>
      {t >= 0.5 ? PAPELES.map((p, i) => {
        const d = t - 0.5;
        let y = p.y0 + p.vy * d + 0.5 * 1900 * d * d;
        const suelo = y >= 1440;
        if (suelo) y = 1440 - (i % 3) * 6;
        const x = p.x0 + p.vx * Math.min(d, 1.0);
        const r = p.r0 + (suelo ? 0 : p.spin * d);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${suelo ? ((i * 31) % 40) - 20 : r})`}>
            <rect x={-42} y={-56} width={84} height={112} rx={4} fill="#fff" stroke="#94A3B8" strokeWidth={3} />
            <line x1={-26} y1={-30} x2={26} y2={-30} stroke="#94A3B8" strokeWidth={4} /><line x1={-26} y1={-10} x2={26} y2={-10} stroke="#94A3B8" strokeWidth={4} /><line x1={-26} y1={10} x2={8} y2={10} stroke="#94A3B8" strokeWidth={4} />
          </g>
        );
      }) : null}
      {t >= T_IMPACTO && t < T_IMPACTO + 0.3 ? (
        <g opacity={brillo} transform={`translate(${540 + (hx - 540) * 1.28} 1360)`}>
          {Array.from({ length: 12 }, (_, i) => (<line key={i} x1={0} y1={0} x2={Math.cos((i / 12) * 6.283) * (120 + (t - T_IMPACTO) * 900)} y2={Math.sin((i / 12) * 6.283) * (120 + (t - T_IMPACTO) * 900)} stroke={C.oro} strokeWidth={14} strokeLinecap="round" />))}
        </g>
      ) : null}
      {t >= T_IMPACTO ? (() => {
        const k = Math.min(1, (t - T_IMPACTO) / 0.12);
        const e = 1.25 - 0.25 * k;
        return (
          <text x={540} y={1180} textAnchor="middle" fontFamily={titulos} fontWeight={800} fontSize={190} letterSpacing={-4} fill={C.oro} stroke="#0B2A6F" strokeWidth={14} paintOrder="stroke" transform={`rotate(-6 540 1180) translate(540 1180) scale(${Math.max(0.01, e * k)}) translate(-540 -1180)`}>¡PUM!</text>
        );
      })() : null}
      </g>
      {t >= 1.0 ? [0, 1, 2].map((i) => {
        const a = t * 6 + (i * 6.283) / 3;
        return <Estrella key={i} x={540 + (hx - 540) * 1.28 - 420 + Math.cos(a) * 90} y={1275 + Math.sin(a) * 36} s={24} r={t * 120 + i * 40} />;
      }) : null}
    </svg>
  );
};
