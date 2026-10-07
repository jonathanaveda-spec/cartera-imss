#!/usr/bin/env python3
"""Tablero visual de la marca NeuroProyectos IA -> empresa/puente-digital/tablero.png"""
import os, sys, base64
sys.path.insert(0, os.path.dirname(__file__))
import hacer_logos as H
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CARTERA = "file://" + os.path.join(ROOT, "plataforma", "icons", "icon-512.png")
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tablero.png"))
G, T, M, N, P, W = "#17212B", "#0A7C73", "#2DD4BF", "#F3F5F7", "#5B6672", "#FFFFFF"

def img(s, w, extra=""):
    return f'<img src="data:image/svg+xml;base64,{base64.b64encode(s.encode()).decode()}" style="width:{w}px;display:block;{extra}">'
sym = lambda m: H.wrap(100, 100, H.symbol_svg("A", m), "s")
tile = H.icon_tile("A"); lk = lambda m: H.lockup("A", m)

sw = [("Grafito", G, "Textos y fondos oscuros", W), ("Verde azulado", T, "Color de marca", W), ("Menta", M, "Brillo, solo en oscuro", G),
      ("Niebla", N, "Fondo claro", G), ("Gris pizarra", P, "Texto secundario", W), ("Blanco", W, "Fondos", G)]
sws = "".join(f'<div class="sw" style="background:{h};color:{t};{"border:1px solid #DDE2E7;" if h in (W,N) else ""}"><b>{n}</b><span>{h}</span><em>{u}</em></div>' for n, h, u, t in sw)

html = f'''<!doctype html><meta charset="utf-8"><style>
*{{box-sizing:border-box}} body{{margin:0;background:{N};font-family:Inter,sans-serif;color:{G}}}
.wrap{{width:1500px;padding:0 0 40px}} .hero{{background:{G};color:#fff;padding:54px 60px;display:flex;justify-content:space-between;align-items:center}}
.hero .l{{font-size:34px;font-weight:800;letter-spacing:-.8px;line-height:1.1;max-width:520px}} .hero .l span{{color:{M}}}
.hero .s{{margin-top:12px;font-size:17px;color:#9AA7B4;font-weight:600}}
.body{{padding:0 60px}} h2{{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:{P};margin:34px 0 12px}}
.sws{{display:flex;gap:12px}} .sw{{flex:1;border-radius:14px;padding:14px;height:124px;display:flex;flex-direction:column;justify-content:flex-end}}
.sw b{{font-size:16px}} .sw span{{font-size:13px;opacity:.9}} .sw em{{font-style:normal;font-size:12px;opacity:.85;margin-top:4px}}
.row{{display:flex;gap:14px}} .c{{flex:1;border:1px solid #DDE2E7;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;padding:26px 14px;min-height:130px}}
.c.dk{{background:{G};border-color:{G}}} .c.te{{background:{T};border-color:{T}}} .c.ni{{background:{N}}}
.cap{{font-size:12px;color:{P};margin-top:6px;text-align:center}}
.t1{{font-weight:800;font-size:36px;letter-spacing:-1px;line-height:1.1}} .t2{{font-weight:600;font-size:18px;color:{T};margin:6px 0 8px}} .t3{{font-size:15px;line-height:1.5;max-width:520px}}
.say{{flex:1;border-radius:14px;padding:16px 18px;font-size:15px;line-height:1.4}} .si{{background:#fff;border:1px solid #DDE2E7}} .si b{{color:{T}}}
.no{{background:#fff;border:1px solid #E9C9C4}} .no b{{color:#B42318}}
.dn{{flex:1}} .dn .c{{min-height:110px}} .x{{font-size:13px;font-weight:700;color:#B42318;margin-top:6px;text-align:center}}
.fam{{display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #DDE2E7;border-radius:14px;padding:18px 22px}}
.fam .tx{{font-size:13px;color:{P}}} .fam .tx b{{color:{G};font-size:16px;display:block}}
</style><div class="wrap">
<div class="hero"><div><div class="l">Tecnología inteligente <br>para tu <span>negocio</span></div><div class="s">Software con IA que sí se entiende.</div></div>{img(lk("oscuro"),520)}</div>
<div class="body">
<h2>Paleta</h2><div class="sws">{sws}</div>
<h2>Tipografía · Inter (Google Fonts, gratis para uso comercial)</h2>
<div class="row"><div class="c" style="flex:2;justify-content:flex-start;padding:26px 32px"><div><div class="t1">Hecho para tu negocio</div><div class="t2">Inter SemiBold · subtítulos</div><div class="t3">Inter Regular para los textos largos: claro, directo y sin tecnicismos. Títulos en Inter ExtraBold con letras un poco juntas (−1 a −2 %).</div></div></div></div>
<h2>Logo en cada fondo</h2>
<div class="row"><div><div class="c">{img(lk("color"),300)}</div><div class="cap">Fondo blanco</div></div><div><div class="c ni">{img(lk("color"),300)}</div><div class="cap">Fondo niebla</div></div>
<div><div class="c dk">{img(lk("oscuro"),300)}</div><div class="cap">Fondo grafito</div></div><div><div class="c te">{img(lk("blanco"),300)}</div><div class="cap">Sobre verde azulado (todo blanco)</div></div></div>
<div class="row" style="margin-top:14px;align-items:flex-start">
<div><div class="c" style="min-height:0;padding:16px 20px">{img(lk("negro"),250)}</div><div class="cap">Solo negro</div></div>
<div><div class="c dk" style="min-height:0;padding:16px 20px">{img(lk("blanco"),250)}</div><div class="cap">Solo blanco</div></div>
<div><div style="display:flex;gap:18px;align-items:flex-end;background:#fff;border:1px solid #DDE2E7;border-radius:14px;padding:16px 22px">{img(tile,96)}{img(tile,48)}{img(tile,24)}{img(sym("color"),48)}</div><div class="cap">Ícono 512 · 48 px · 24 px (mínimo) · símbolo solo. Con menos de 240 px de ancho se usa solo el símbolo.</div></div></div>
<h2>Qué no hacer</h2>
<div class="row"><div class="dn"><div class="c">{img(sym("color"),84,"transform:scaleX(1.6)")}</div><div class="x">✕ No estirar ni deformar</div></div>
<div class="dn"><div class="c">{img(sym("color"),84,"filter:hue-rotate(150deg) saturate(1.8)")}</div><div class="x">✕ No cambiar los colores</div></div>
<div class="dn"><div class="c" style="background:{T}">{img(lk("color"),240)}</div><div class="x">✕ No poner el logo de color sobre verde</div></div>
<div class="dn"><div class="c" style="background:#2563EB">{img(lk("blanco"),240)}</div><div class="x">✕ No usar el azul de Cartera Asesor</div></div></div>
<h2>Voz · de tú, claro y honesto</h2>
<div class="row"><div class="say si"><b>Sí:</b> «Te avisa quién debe pagar hoy.»<br><b>Sí:</b> «Herramientas que trabajan por ti.»<br><b>Sí:</b> «La IA ayuda; tú decides.»</div>
<div class="say no"><b>No:</b> «Revolucionamos tu gestión con machine learning.»<br><b>No:</b> «La mejor IA del mundo.»<br><b>No:</b> «Gana más dinero garantizado.»</div></div>
<h2>Junto a Cartera Asesor</h2>
<div class="fam"><img src="{CARTERA}" style="width:76px;border-radius:17px"><div class="tx"><b>Cartera Asesor</b>La marca que ven los clientes. Se queda con su azul y su dorado.</div>
<div style="flex:1"></div><div style="display:flex;align-items:center;gap:12px"><div class="tx" style="text-align:right">Un producto de</div>{img(lk("color"),230)}</div></div>
</div></div>'''
p = os.path.join(os.path.dirname(OUT), "_t.html"); open(p, "w").write(html)
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1500, "height": 900}, device_scale_factor=1.5)
    pg.goto("file://" + p); pg.wait_for_timeout(500); pg.screenshot(path=OUT, full_page=True); b.close()
os.remove(p); print(OUT)
