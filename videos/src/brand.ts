import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";

// Marca Cartera Asesor (ver .claude/skills/marca-cartera-asesor/SKILL.md)
export const C = {
  azulNoche: "#0B2A6F",
  azulCartera: "#1D4ED8",
  celeste: "#1AA3F5",
  oro: "#FFD166",
  verde: "#16A34A",
  ambar: "#D97706",
  rojo: "#DC2626",
  nube: "#F5F8FF",
  tinta: "#0F172A",
  blanco: "#FFFFFF",
  secundario: "#DBE8FF",
} as const;

export const titulos = loadBricolage("normal", {
  weights: ["800"],
  subsets: ["latin"],
}).fontFamily;

export const textos = loadJakarta("normal", {
  weights: ["400", "600", "800"],
  subsets: ["latin"],
}).fontFamily;

// Formato y zona segura de TikTok (1080x1920)
export const W = 1080;
export const H = 1920;
export const ZONA = { x0: 60, x1: 940, y0: 180, y1: 1440 };
// Centro horizontal de la zona segura
export const CX = (ZONA.x0 + ZONA.x1) / 2; // 500
