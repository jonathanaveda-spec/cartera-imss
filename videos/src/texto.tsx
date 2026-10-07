import type React from "react";
import { C } from "./brand";

// Texto con la palabra clave entre **dobles asteriscos** en oro: "Tu **cartera** necesita orden".
export const Rico: React.FC<{ t: string; color?: string }> = ({ t, color = C.oro }) => (
  <>
    {t.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") ? (
        <span key={i} style={{ color }}>
          {p.slice(2, -2)}
        </span>
      ) : (
        <span key={i}>{p}</span>
      ),
    )}
  </>
);

// El mismo formato **oro** convertido a las partes que usa <Caption>: [{t, oro}] por línea.
export const partes = (t: string): { t: string; oro?: boolean }[] =>
  t
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((p) => p !== "")
    .map((p) => (p.startsWith("**") ? { t: p.slice(2, -2), oro: true } : { t: p }));
