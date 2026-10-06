import { Easing, interpolate } from "remotion";

// Entrada suave (ease-out) entre dos cuadros, de 0 a 1
export const ease = (
  frame: number,
  from: number,
  to: number,
  curve: (t: number) => number = Easing.bezier(0.16, 1, 0.3, 1),
) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: curve,
  });

// Sube de valor con un conteo rapido
export const contar = (frame: number, from: number, to: number, final: number) =>
  Math.round(ease(frame, from, to, Easing.out(Easing.cubic)) * final);
