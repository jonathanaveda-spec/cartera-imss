#!/usr/bin/env python3
"""Genera las 3 propuestas de logo de NeuroProyectos IA (SVG) y sus variantes.
Texto convertido a trazos con la tipografia Inter (Google Fonts, licencia OFL)."""
import os, sys, itertools
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = os.path.join(os.path.dirname(__file__), "..", "logos", "propuestas")
FONT_DIR = "/usr/share/fonts/opentype/inter/"
FONTS = {k: TTFont(FONT_DIR + f) for k, f in
         {"xb": "Inter-ExtraBold.otf", "b": "Inter-Bold.otf", "sb": "Inter-SemiBold.otf"}.items()}

INK, TEAL, TEAL_LIGHT, GRAY, GRAY_LIGHT = "#17212B", "#0A7C73", "#2DD4BF", "#5B6672", "#9AA7B4"
_ids = itertools.count(1)

def text(fontkey, s, size, x, y, fill, tracking=0.0):
    """Devuelve (svg, ancho). Texto como trazos."""
    f = FONTS[fontkey]; gs = f.getGlyphSet(); cmap = f.getBestCmap()
    sc = size / f["head"].unitsPerEm; cx = x; parts = []
    for ch in s:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs); gs[g].draw(TransformPen(pen, (sc, 0, 0, -sc, cx, y)))
        d = pen.getCommands()
        if d: parts.append(d)
        cx += gs[g].width * sc + tracking
    w = cx - x - tracking
    return f'<path d="{" ".join(parts)}" fill="{fill}"/>', w

def tw(fontkey, s, size, tracking=0.0):
    return text(fontkey, s, size, 0, 0, "#000", tracking)[1]

# ---------- simbolos (caja 100x100) ----------
def sym_A(ink, acc, **k):   # Nodo: una N hecha de lineas y nodos
    return (f'<path d="M24 26V74M76 26V74M24 26L76 74" stroke="{ink}" stroke-width="9" '
            f'stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
            "".join(f'<circle cx="{x}" cy="{y}" r="10.5" fill="{acc}"/>' for x, y in
                    [(24, 26), (24, 74), (76, 26), (76, 74)]))

def sym_B(ink, acc, **k):   # Codigo + chispa de IA
    return (f'<path d="M37 27L14 50L37 73M63 27L86 50L63 73" stroke="{ink}" stroke-width="9" '
            f'stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
            f'<path d="M50 27C52.5 41 59 47.5 73 50C59 52.5 52.5 59 50 73C47.5 59 41 52.5 27 50'
            f'C41 47.5 47.5 41 50 27Z" fill="{acc}"/>')

def sym_C(ink, acc, inner="#FFFFFF", cut=False, **k):   # Sello con neurona / arbol de proyecto
    shapes = lambda lc, nc, cc: (
        f'<path d="M50 56V24M50 56L27 76M50 56L73 76" stroke="{lc}" stroke-width="6.5" stroke-linecap="round" fill="none"/>'
        f'<circle cx="50" cy="56" r="10" fill="{cc}"/>' +
        "".join(f'<circle cx="{x}" cy="{y}" r="8" fill="{nc}"/>' for x, y in [(50, 22), (26, 77), (74, 77)]))
    if cut:
        i = next(_ids)
        return (f'<mask id="m{i}"><rect width="100" height="100" fill="#fff"/>{shapes("#000", "#000", "#000")}</mask>'
                f'<circle cx="50" cy="50" r="47" fill="{ink}" mask="url(#m{i})"/>')
    return f'<circle cx="50" cy="50" r="47" fill="{ink}"/>' + shapes(inner, acc, inner)

SYMS = {"A": sym_A, "B": sym_B, "C": sym_C}
NAMES = {"A": "Nodo", "B": "Codigo-chispa", "C": "Sello-neurona"}

# ---------- paletas de salida ----------
def palette(mode):
    if mode == "color":  return dict(ink=INK, acc=TEAL, txt=INK, accT=TEAL, sub=GRAY, inner="#FFFFFF", cut=False)
    if mode == "oscuro": return dict(ink="#FFFFFF", acc=TEAL_LIGHT, txt="#FFFFFF", accT=TEAL_LIGHT, sub=GRAY_LIGHT, inner=None, cut=True)
    if mode == "negro":  return dict(ink="#000000", acc="#000000", txt="#000000", accT="#000000", sub="#000000", inner="#FFFFFF", cut=False)
    if mode == "blanco": return dict(ink="#FFFFFF", acc="#FFFFFF", txt="#FFFFFF", accT="#FFFFFF", sub="#FFFFFF", inner=None, cut=True)

def symbol_svg(letter, mode):
    p = palette(mode); body = SYMS[letter](p["ink"], p["acc"], inner=p["inner"], cut=p["cut"])
    return body

def wrap(w, h, inner, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" width="{w:.0f}" height="{h:.0f}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{inner}</svg>')

DESC = "DESARROLLO DE SOFTWARE CON IA"
def lockup(letter, mode):
    p = palette(mode); sym = symbol_svg(letter, mode); M = 8
    if letter == "A":      # horizontal, una linea + descriptor
        S = 76; sub = text("sb", DESC, 10.2, 0, 0, p["sub"], 1.5)[1]
        n1 = tw("xb", "NeuroProyectos", 46, -0.9); n2 = tw("xb", " IA", 46, -0.9)
        cap = 0.727 * 46; top = (S - (cap + 18 + 7.4)) / 2; base = top + cap; x0 = S + 20
        a, w1 = text("xb", "NeuroProyectos", 46, x0, base, p["txt"], -0.9)
        b, w2 = text("xb", "IA", 46, x0 + w1 + 15, base, p["accT"], -0.9)
        d, _ = text("sb", DESC, 10.2, x0 + 2, base + 18 + 7.4, p["sub"], 1.5)
        W = x0 + max(w1 + 15 + w2, sub + 2)
        inner = f'<g transform="scale({S/100})">{sym}</g>{a}{b}{d}'
        return wrap(W + 2 * M, S + 2 * M, f'<g transform="translate({M},{M})">{inner}</g>', "NeuroProyectos IA")
    if letter == "B":      # apilado y centrado
        S = 104; w1 = tw("xb", "NeuroProyectos", 40, -0.8); w2 = tw("xb", "IA", 40, -0.8); gap = 12
        full = w1 + gap + w2; sub = tw("sb", DESC, 9.6, 1.5); W = max(full, sub, S)
        cap = 0.727 * 40; y1 = S + 22 + cap; y2 = y1 + 16 + 7
        a, _ = text("xb", "NeuroProyectos", 40, (W - full) / 2, y1, p["txt"], -0.8)
        b, _ = text("xb", "IA", 40, (W - full) / 2 + w1 + gap, y1, p["accT"], -0.8)
        d, _ = text("sb", DESC, 9.6, (W - sub) / 2, y2, p["sub"], 1.5)
        inner = f'<g transform="translate({(W-S)/2},0) scale({S/100})">{sym}</g>{a}{b}{d}'
        return wrap(W + 2 * M, y2 + 2 * M, f'<g transform="translate({M},{M})">{inner}</g>', "NeuroProyectos IA")
    if letter == "C":      # sello + dos lineas en mayusculas
        S = 82; l1 = tw("xb", "NEURO", 42, 2.2); l2a = tw("b", "PROYECTOS", 22.5, 3.4); l2b = tw("b", "IA", 22.5, 3.4)
        cap1, cap2 = 0.727 * 42, 0.727 * 22.5; top = (S - (cap1 + 13 + cap2)) / 2
        y1 = top + cap1; y2 = y1 + 13 + cap2; x0 = S + 20
        a, _ = text("xb", "NEURO", 42, x0, y1, p["txt"], 2.2)
        b, _ = text("b", "PROYECTOS", 22.5, x0 + 1, y2, p["txt"], 3.4)
        c, _ = text("b", "IA", 22.5, x0 + 1 + l2a + 12, y2, p["accT"], 3.4)
        W = x0 + max(l1, l2a + 12 + l2b)
        inner = f'<g transform="scale({S/100})">{sym}</g>{a}{b}{c}'
        return wrap(W + 2 * M, S + 2 * M, f'<g transform="translate({M},{M})">{inner}</g>', "NeuroProyectos IA")

def icon_tile(letter, mode="color"):
    """Icono cuadrado 512x512 (esquinas redondeadas) para app / redes."""
    if letter == "C":
        bg = TEAL
        s = sym_C(INK, TEAL_LIGHT, inner="#FFFFFF")
        inner_sym = f'<g transform="translate(96,96) scale(3.2)">{s}</g>'
    else:
        bg = INK
        s = SYMS[letter](palette("oscuro")["ink"], TEAL_LIGHT)
        inner_sym = f'<g transform="translate(106,106) scale(3.0)">{s}</g>'
    return wrap(512, 512, f'<rect width="512" height="512" rx="112" fill="{bg}"/>{inner_sym}', "NeuroProyectos IA - icono")

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for L in "ABC":
        pre = f"{L}-{NAMES[L]}"
        files = {f"{pre}_simbolo-color.svg": wrap(100, 100, symbol_svg(L, "color"), "NeuroProyectos IA - simbolo"),
                 f"{pre}_icono-512.svg": icon_tile(L)}
        for m in ["color", "oscuro", "negro", "blanco"]:
            files[f"{pre}_completo-{m}.svg"] = lockup(L, m)
        for n, c in files.items():
            open(os.path.join(OUT, n), "w").write(c)
    print("ok", len(os.listdir(OUT)), "archivos")
    # contraste del acento sobre blanco
    def lum(h):
        r, g, b = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
        f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
        return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)
    for nm, h in [("verde azulado s/ blanco", TEAL), ("grafito s/ blanco", INK)]:
        print(nm, round(1.05 / (lum(h) + .05), 1), ": 1")
    print("verde claro s/ grafito", round((lum(TEAL_LIGHT) + .05) / (lum(INK) + .05), 1), ": 1")
