#!/usr/bin/env python3
"""Arma el tablero de comparacion de las 3 propuestas de logo (PNG)."""
import os, sys, base64
sys.path.insert(0, os.path.dirname(__file__))
import hacer_logos as H
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CARTERA = "file://" + os.path.join(ROOT, "plataforma", "icons", "icon-512.png")
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "logos", "propuestas-tablero.png"))
IDEAS = {"A": ("A · Nodo", "Una N hecha de puntos conectados: red neuronal y proyecto en equipo."),
         "B": ("B · Código y chispa", "Dos corchetes de código con la chispa de la IA al centro."),
         "C": ("C · Sello neurona", "Una neurona que también parece el árbol de un proyecto.")}

def img(svg_str, w=None, h=None):
    b = base64.b64encode(svg_str.encode()).decode()
    st = (f"width:{w}px;" if w else "") + (f"height:{h}px;" if h else "")
    return f'<img src="data:image/svg+xml;base64,{b}" style="{st}display:block">'

def col(L):
    tile = H.icon_tile(L)
    sym = lambda m: H.wrap(100, 100, H.symbol_svg(L, m), "s")
    t, d = IDEAS[L]
    return f'''<section>
<h2>{t}</h2><p class="idea">{d}</p>
<div class="card" style="padding:26px 22px">{img(H.lockup(L,"color"), w=380)}</div>
<div class="card dark" style="padding:26px 22px">{img(H.lockup(L,"oscuro"), w=380)}</div>
<div class="lab">Ícono de app: grande, 48 px y 24 px</div>
<div class="row">{img(tile,w=112)}{img(tile,w=48)}{img(tile,w=24)}</div>
<div class="lab">Símbolo solo en 48 px: color · negro · blanco</div>
<div class="row">
 <div class="mini">{img(sym("color"),w=48)}</div>
 <div class="mini">{img(sym("negro"),w=48)}</div>
 <div class="mini dk">{img(sym("blanco"),w=48)}</div></div>
<div class="lab">Logo completo en blanco y negro</div>
<div class="card" style="padding:14px 18px">{img(H.lockup(L,"negro"), w=300)}</div>
<div class="card dark" style="padding:14px 18px">{img(H.lockup(L,"blanco"), w=300)}</div>
<div class="lab">Junto a Cartera Asesor (misma pantalla del celular)</div>
<div class="row pair"><img src="{CARTERA}" style="width:84px;border-radius:19px">{img(tile,w=84)}</div>
</section>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
body{{margin:0;background:#F3F5F7;font-family:Inter,sans-serif;color:#17212B}}
.wrap{{width:1480px;padding:34px 40px 40px}}
h1{{font-size:30px;margin:0 0 4px;font-weight:800;letter-spacing:-.5px}}
.sub{{margin:0 0 24px;color:#5B6672;font-size:16px}}
.grid{{display:flex;gap:28px}} section{{flex:1}}
h2{{font-size:22px;margin:0 0 2px;font-weight:800}}
.idea{{margin:0 0 14px;color:#5B6672;font-size:14px;min-height:36px}}
.card{{background:#fff;border:1px solid #DDE2E7;border-radius:14px;margin-bottom:12px;display:flex;justify-content:center}}
.card.dark{{background:#17212B;border-color:#17212B}}
.lab{{font-size:12px;font-weight:700;color:#5B6672;text-transform:uppercase;letter-spacing:.8px;margin:14px 0 8px}}
.row{{display:flex;align-items:center;gap:16px}}
.mini{{background:#fff;border:1px solid #DDE2E7;border-radius:12px;padding:14px}}
.mini.dk{{background:#17212B;border-color:#17212B}}
.pair{{background:#fff;border:1px solid #DDE2E7;border-radius:14px;padding:16px;gap:20px}}
</style><div class="wrap"><h1>NeuroProyectos IA · 3 propuestas de logo</h1>
<p class="sub">Colores provisionales (grafito y verde azulado, distintos al azul de Cartera Asesor). La paleta final se decide en el siguiente paso.</p>
<div class="grid">{col("A")}{col("B")}{col("C")}</div></div>'''
p = os.path.join(os.path.dirname(OUT), "_tablero.html"); open(p, "w").write(html)
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1560, "height": 900}, device_scale_factor=1.5)
    pg.goto("file://" + p); pg.wait_for_timeout(500)
    pg.screenshot(path=OUT, full_page=True); b.close()
os.remove(p); print(OUT)
