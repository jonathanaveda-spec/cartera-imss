#!/usr/bin/env python3
"""Genera las piezas de NeuroProyectos IA: logos finales, Google Play y redes (PNG/SVG)."""
import os, re, sys, base64, io
sys.path.insert(0, os.path.dirname(__file__))
import hacer_logos as H
from PIL import Image
from playwright.sync_api import sync_playwright

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
G, T, M, N, GRAY_L = H.INK, H.TEAL, H.TEAL_LIGHT, "#F3F5F7", H.GRAY_LIGHT
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

def d(*p):
    path = os.path.join(BASE, *p); os.makedirs(os.path.dirname(path), exist_ok=True); return path
def b64(svg): return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()
def vb(svg):
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg); return float(m.group(1)), float(m.group(2))

# ---- variantes de logo ----
def lockup_sin_descriptor(mode):
    """Logo horizontal sin la linea chica (para firma, web y tamaños pequeños)."""
    p = H.palette(mode); sym = H.symbol_svg("A", mode); S, M_ = 76, 8
    a, w1 = H.text("xb", "NeuroProyectos", 46, S + 20, S / 2 + 0.727 * 46 / 2, p["txt"], -0.9)
    b, w2 = H.text("xb", "IA", 46, S + 20 + w1 + 15, S / 2 + 0.727 * 46 / 2, p["accT"], -0.9)
    W = S + 20 + w1 + 15 + w2
    inner = f'<g transform="scale({S/100})">{sym}</g>{a}{b}'
    return H.wrap(W + 2 * M_, S + 2 * M_, f'<g transform="translate({M_},{M_})">{inner}</g>', "NeuroProyectos IA")

def icono(redondeado=True, tam=512):
    s = H.SYMS["A"]("#FFFFFF", M); rx = 112 if redondeado else 0
    return H.wrap(tam, tam, f'<rect width="{tam}" height="{tam}" rx="{rx*tam/512:.0f}" fill="{G}"/>'
                  f'<g transform="translate({tam*0.207:.1f},{tam*0.207:.1f}) scale({tam*0.586/100:.4f})">{s}</g>', "NeuroProyectos IA - icono")

# ---- decorado plano de nodos ----
PTS = [(40, 70), (125, 150), (70, 245), (215, 95), (265, 205), (350, 125), (420, 230)]
EDG = [(0, 1), (1, 2), (1, 3), (3, 4), (4, 5), (3, 5), (5, 6), (4, 6)]
def red(w, h, flip=False, op=0.38):
    sx, sy = w / 460, h / 300
    pts = [((460 - x if flip else x) * sx, y * sy) for x, y in PTS]
    ln = "".join(f'<line x1="{pts[a][0]:.0f}" y1="{pts[a][1]:.0f}" x2="{pts[b][0]:.0f}" y2="{pts[b][1]:.0f}" stroke="{T}" stroke-width="{3*sx:.1f}" stroke-linecap="round" opacity="{op}"/>' for a, b in EDG)
    ci = "".join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{9*sx:.1f}" fill="{M}" opacity="{op+.1}"/>' for x, y in pts)
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position:absolute;top:0;{"right" if flip else "left"}:0">{ln}{ci}</svg>'

def lema(px, centrado=True, color="#fff"):
    al = "center" if centrado else "left"
    return (f'<div style="font-weight:800;font-size:{px}px;line-height:1.1;letter-spacing:-{px*0.02:.1f}px;color:{color};text-align:{al}">'
            f'Tecnología inteligente<br>para tu <span style="color:{M}">negocio</span></div>')

# ---- render ----
_pw = sync_playwright().start(); _br = _pw.chromium.launch(executable_path=CHROME)
def render(body, w, h, path, bg=None, sin_alfa=False):
    pg = _br.new_page(viewport={"width": int(w), "height": int(h)})
    pg.set_content(f'<html><body style="margin:0;width:{w}px;height:{h}px;position:relative;overflow:hidden;'
                   f'background:{bg or "transparent"};font-family:Inter,sans-serif">{body}</body></html>')
    pg.wait_for_timeout(250)
    raw = pg.screenshot(omit_background=(bg is None), clip={"x": 0, "y": 0, "width": w, "height": h}); pg.close()
    im = Image.open(io.BytesIO(raw)); im = im.convert("RGB") if sin_alfa else im.convert("RGBA")
    im.save(path, optimize=True); return path

def png_de_svg(svg, ancho, path):
    w, h = vb(svg); alto = round(ancho * h / w)
    return render(f'<img src="{b64(svg)}" style="width:{ancho}px;height:{alto}px;display:block">', ancho, alto, path)

def centrado(svg, ancho, y):   # logo centrado horizontalmente
    w, h = vb(svg); return f'<img src="{b64(svg)}" style="position:absolute;left:50%;top:{y}px;width:{ancho}px;height:{ancho*h/w:.0f}px;margin-left:-{ancho/2}px">'

def todo():
    # 1) logos finales
    F = lambda *p: d("logos", "final", *p)
    nombres = {"color": "color", "oscuro": "para-fondo-oscuro", "negro": "negro", "blanco": "blanco"}
    for m, n in nombres.items():
        s = H.lockup("A", m); open(F("svg", f"neuroproyectos-ia_{n}.svg"), "w").write(s); png_de_svg(s, 2400, F("png", f"neuroproyectos-ia_{n}.png"))
        s2 = lockup_sin_descriptor(m); open(F("svg", f"neuroproyectos-ia_{n}_sin-descriptor.svg"), "w").write(s2); png_de_svg(s2, 2000, F("png", f"neuroproyectos-ia_{n}_sin-descriptor.png"))
    for m in ["color", "negro", "blanco"]:
        s = H.wrap(100, 100, H.symbol_svg("A", m), "NeuroProyectos IA - simbolo"); open(F("svg", f"simbolo_{m}.svg"), "w").write(s); png_de_svg(s, 1024, F("png", f"simbolo_{m}.png"))
    open(F("svg", "icono-512.svg"), "w").write(icono(True)); png_de_svg(icono(True), 512, F("png", "icono-512.png"))
    open(F("svg", "icono-512-cuadrado.svg"), "w").write(icono(False)); png_de_svg(icono(False), 512, F("png", "icono-512-cuadrado.png"))
    # 2) Google Play
    P = lambda n: d("google-play", n)
    png_de_svg(icono(False), 512, P("icono-desarrollador-512.png"))
    lk = H.lockup("A", "oscuro")
    body = red(900, 2304) + red(900, 2304, True) + centrado(lk, 2100, 760) + \
        f'<div style="position:absolute;left:0;right:0;top:1480px;display:flex;justify-content:center">{lema(150)}</div>'
    render(body, 4096, 2304, P("encabezado-4096x2304.png"), bg=G, sin_alfa=True)
    # 3) Redes
    R = lambda n: d("redes", n)
    png_de_svg(icono(False, 1080), 1080, R("foto-de-perfil_linkedin-facebook-instagram_1080.png"))
    fb = red(400, 624) + red(400, 624, True) + centrado(lk, 800, 150) + \
        f'<div style="position:absolute;left:0;right:0;top:380px;display:flex;justify-content:center">{lema(50)}</div>'
    render(fb, 1640, 624, R("facebook-portada_1640x624.png"), bg=G, sin_alfa=True)
    li = red(400, 382) + red(400, 382, True) + \
        f'<img src="{b64(lk)}" style="position:absolute;left:560px;top:{(382-640*vb(lk)[1]/vb(lk)[0])/2:.0f}px;width:640px">' + \
        f'<div style="position:absolute;left:1290px;top:0;height:382px;display:flex;align-items:center">{lema(50, False)}</div>'
    render(li, 2256, 382, R("linkedin-portada-empresa_2256x382.png"), bg=G, sin_alfa=True)
    li2 = red(560, 792) + red(560, 792, True) + centrado(lk, 1000, 190) + \
        f'<div style="position:absolute;left:0;right:0;top:520px;display:flex;justify-content:center">{lema(66)}</div>'
    render(li2, 3168, 792, R("linkedin-portada-personal_3168x792.png"), bg=G, sin_alfa=True)
    # 4) imagen para compartir el enlace de la web (1200x630)
    render(red(330, 630) + red(330, 630, True) + centrado(lk, 760, 200) + f'<div style="position:absolute;left:0;right:0;top:400px;display:flex;justify-content:center">{lema(44)}</div>',
           1200, 630, d("web", "og-imagen.png"), bg=G, sin_alfa=True)
    # 5) archivos de la web
    open(d("web", "logo.svg"), "w").write(lockup_sin_descriptor("color")); open(d("web", "logo-oscuro.svg"), "w").write(lockup_sin_descriptor("oscuro"))
    open(d("web", "favicon.svg"), "w").write(icono(True))
    print("piezas listas")

if __name__ == "__main__":
    todo(); _br.close(); _pw.stop()
