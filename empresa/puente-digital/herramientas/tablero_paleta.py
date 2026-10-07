#!/usr/bin/env python3
"""Lamina de paleta y tipografias de NeuroProyectos IA (PNG)."""
import os, sys, base64
sys.path.insert(0, os.path.dirname(__file__))
import hacer_logos as H
from playwright.sync_api import sync_playwright

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "paleta", "paleta-tipografias-propuesta.png"))
C = dict(grafito="#17212B", teal="#0A7C73", menta="#2DD4BF", niebla="#F3F5F7", gris="#5B6672", blanco="#FFFFFF")

def lum(h):
    r, g, b = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)
def cr(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + .05) / (lb + .05)

pares = [("Texto grafito sobre blanco", "grafito", "blanco"), ("Texto grafito sobre niebla", "grafito", "niebla"),
         ("Texto gris sobre blanco", "gris", "blanco"), ("Verde azulado sobre blanco", "teal", "blanco"),
         ("Blanco sobre verde azulado", "blanco", "teal"), ("Menta sobre grafito", "menta", "grafito")]
filas = "".join(f'<tr><td>{n}</td><td class="n">{cr(C[a],C[b]):.1f} : 1</td><td class="ok">{"Cumple" if cr(C[a],C[b])>=4.5 else "Solo títulos"}</td></tr>' for n, a, b in pares)

def img(s, w):
    return f'<img src="data:image/svg+xml;base64,{base64.b64encode(s.encode()).decode()}" style="width:{w}px;display:block">'

sw = [("Grafito", C["grafito"], "Textos, fondos oscuros, logo", "#fff"), ("Verde azulado", C["teal"], "Color de marca, botones, enlaces", "#fff"),
      ("Menta", C["menta"], "Detalles y brillos, solo sobre fondo oscuro", C["grafito"]),
      ("Niebla", C["niebla"], "Fondo claro de páginas", C["grafito"]), ("Gris pizarra", C["gris"], "Texto secundario, descriptor", "#fff"),
      ("Blanco", C["blanco"], "Fondos y texto sobre oscuro", C["grafito"])]
sw_html = "".join(f'<div class="sw" style="background:{h};color:{t};{"border:1px solid #DDE2E7;" if h in (C["blanco"],C["niebla"]) else ""}"><b>{n}</b><span>{h}</span><em>{u}</em></div>' for n, h, u, t in sw)

html = f'''<!doctype html><meta charset="utf-8"><style>
*{{box-sizing:border-box}} body{{margin:0;background:{C["niebla"]};font-family:Inter,sans-serif;color:{C["grafito"]}}}
.wrap{{width:1400px;padding:36px 40px 44px}} h1{{font-size:30px;margin:0 0 4px;font-weight:800;letter-spacing:-.5px}}
.sub{{margin:0 0 22px;color:{C["gris"]};font-size:16px}} h2{{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:{C["gris"]};margin:26px 0 10px}}
.sws{{display:flex;gap:12px}} .sw{{flex:1;border-radius:14px;padding:16px;height:150px;display:flex;flex-direction:column;justify-content:flex-end}}
.sw b{{font-size:18px}} .sw span{{font-size:14px;opacity:.9;font-variant-numeric:tabular-nums}} .sw em{{font-style:normal;font-size:12.5px;opacity:.85;margin-top:6px;line-height:1.3}}
.bar{{display:flex;height:34px;border-radius:10px;overflow:hidden;border:1px solid #DDE2E7}}
.two{{display:flex;gap:18px}} .card{{background:#fff;border:1px solid #DDE2E7;border-radius:16px;padding:22px 24px;flex:1}}
.card.dk{{background:{C["grafito"]};border-color:{C["grafito"]};color:#fff}}
table{{width:100%;border-collapse:collapse;font-size:14px}} td{{padding:7px 4px;border-bottom:1px solid #E7EBEF}} .n{{font-variant-numeric:tabular-nums;font-weight:700}} .ok{{color:{C["teal"]};font-weight:700;text-align:right}}
.tag{{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 9px;border-radius:99px;background:{C["teal"]};color:#fff;margin-left:8px;vertical-align:middle}}
.t1{{font-weight:800;font-size:38px;line-height:1.08;letter-spacing:-1px;margin:6px 0 10px}} .t2{{font-weight:600;font-size:20px;margin:0 0 10px;color:{C["teal"]}}}
.p{{font-size:16px;line-height:1.5;margin:0 0 6px}} .lora{{font-family:Lora,serif;font-style:italic;font-size:22px;color:{C["gris"]}}}
.o2 .t1{{font-family:Poppins,sans-serif;font-weight:700;letter-spacing:-.5px;font-size:36px}} .o2 .t2{{font-family:Poppins,sans-serif;font-weight:600}}
.small{{font-size:13px;color:{C["gris"]}}}
</style><div class="wrap"><h1>NeuroProyectos IA · colores y tipografías</h1>
<p class="sub">Propuesta para aprobar. Son los mismos colores del logo A · Nodo, ya con contraste revisado.</p>
<h2>Paleta</h2><div class="sws">{sw_html}</div>
<h2>Cuánto de cada color</h2><div class="bar"><div style="flex:55;background:{C["niebla"]}"></div><div style="flex:20;background:#fff"></div><div style="flex:15;background:{C["grafito"]}"></div><div style="flex:8;background:{C["teal"]}"></div><div style="flex:2;background:{C["menta"]}"></div></div>
<p class="small" style="margin-top:8px">Casi todo claro y limpio · grafito para textos y secciones oscuras · verde azulado solo para lo que importa · menta apenas un brillo.</p>
<div class="two" style="margin-top:6px">
<div class="card"><h2 style="margin-top:0">Contraste (se necesita 4,5 : 1 para texto)</h2><table>{filas}</table>
<p class="small" style="margin-top:10px">Rojo, ámbar y verde de estados («moroso», «por vencer», «al día») quedan reservados para las apps, igual que en Cartera Asesor. Nunca el azul de Cartera Asesor en esta marca.</p></div>
<div class="card dk" style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:22px">{img(H.lockup("A","oscuro"),430)}<div style="background:#fff;border-radius:14px;padding:14px 20px">{img(H.lockup("A","color"),360)}</div></div></div>
<h2>Tipografías (gratis, Google Fonts, licencia libre para uso comercial)</h2>
<div class="two">
<div class="card"><div class="small"><b>Opción 1 · Inter</b> en todo <span class="tag">Recomendada</span></div>
<div class="t1">Tecnología inteligente para tu negocio</div><div class="t2">Software con IA que sí se entiende</div>
<p class="p">Creamos herramientas que trabajan por ti: ordenan tus clientes, te avisan a tiempo y se explican solas. Sin tecnicismos y sin promesas mágicas.</p>
<div class="lora" style="font-family:Inter;font-style:normal;font-size:15px">Títulos: Inter ExtraBold · Subtítulos: Inter SemiBold · Textos: Inter Regular</div></div>
<div class="card o2"><div class="small"><b>Opción 2 · Poppins</b> para títulos + <b>Inter</b> para textos</div>
<div class="t1">Tecnología inteligente para tu negocio</div><div class="t2">Software con IA que sí se entiende</div>
<p class="p">Creamos herramientas que trabajan por ti: ordenan tus clientes, te avisan a tiempo y se explican solas. Sin tecnicismos y sin promesas mágicas.</p>
<div class="small">Más redonda y amable, pero el logo está dibujado con Inter y se vería un poco distinto.</div></div></div>
<p class="small" style="margin-top:14px">Para citas y frases destacadas, opcional: <span class="lora">«Ideas que piensan contigo»</span> en Lora Cursiva.</p>
</div>'''
p = os.path.join(os.path.dirname(OUT), "_p.html"); open(p, "w").write(html)
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg = b.new_page(viewport={"width": 1480, "height": 900}, device_scale_factor=1.5)
    pg.goto("file://" + p); pg.wait_for_timeout(500); pg.screenshot(path=OUT, full_page=True); b.close()
os.remove(p); print(OUT); [print(n, round(cr(C[a], C[b]), 1)) for n, a, b in pares]
