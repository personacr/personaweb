"""Genera las imágenes para compartir (WhatsApp, Facebook…): 1200×630 JPEG.
Uso: python3 herramientas/og.py CARPETA_FUENTES   (woff2 de Zodiak y Switzer)
Cada página tiene su foto. Si cambiás una, subí la versión (V) para que WhatsApp la vuelva a pedir."""
import sys, os, glob, yaml, base64, pathlib
from playwright.sync_api import sync_playwright

V = 'v2'
F = sys.argv[1]
BIO = sys.argv[2] if len(sys.argv) > 2 else None
caps = sorted((yaml.safe_load(open(p, encoding='utf-8')) for p in glob.glob('contenido/photo/*.yml')), key=lambda c: c['orden'])

# clave: (imagen, posición, línea de abajo, modo)  modo «full» = foto a todo el ancho · «banda» = franja de cine
PIEZAS = {
    'home':   ('img/home/hero-2048.webp', '50% 45%', 'Motion · Photo · Stage', 'full'),
    'photo':  ('img/photo/movimiento/movimiento-2019-10-2048.webp', '50% 58%', 'Photo', 'full'),
    'motion': ('img/motion/banner/banner.webp', '50% 50%', 'Motion', 'banda'),
    'stage':  ('img/stage/banner/banner.webp', '50% 50%', 'Stage', 'banda'),
}
for c in caps:
    PIEZAS['photo-' + c['slug']] = (c['portada'] + '-2048.webp', '50% 40%', 'Photo · ' + c['titulo_es'], 'full')

def data(p):
    return 'data:image/webp;base64,' + base64.b64encode(open(p, 'rb').read()).decode()

def fuente(n):
    return 'data:font/woff2;base64,' + base64.b64encode(open(os.path.join(F, n), 'rb').read()).decode()

CSS = f"""
@font-face{{font-family:Z;src:url({fuente('Zodiak-300-normal.woff2')})}}
@font-face{{font-family:Z;font-style:italic;src:url({fuente('Zodiak-300-italic.woff2')})}}
@font-face{{font-family:S;font-weight:500;src:url({fuente('Switzer-500-normal.woff2')})}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1200px;height:630px;background:#000;overflow:hidden;position:relative;color:#F4F2ED}}
.ph{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.full::after{{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.82) 100%)}}
.banda .ph{{top:150px;height:330px;bottom:auto}}
.t{{position:absolute;left:64px;right:64px;bottom:50px;z-index:2;display:flex;justify-content:space-between;align-items:flex-end}}
.w{{font-family:Z;font-weight:300;font-size:96px;line-height:.9;letter-spacing:-.02em}}
.w i{{color:#4FB3E8}}
.n{{font-family:S;font-weight:500;font-size:22px;letter-spacing:.18em;text-transform:uppercase;text-align:right;line-height:1.5}}
.n b{{display:block;font-weight:500;color:#A8A5A0;letter-spacing:.14em}}
.banda .t{{bottom:40px}} .banda .w{{font-size:84px}}
"""

def html(img, pos, linea, modo):
    return (f"<html><head><style>{CSS}</style></head><body class='{modo}'><img class='ph' src='{data(img)}' style='object-position:{pos}'>"
            f"<div class='t'><div class='w'>person<i>a</i></div><div class='n'>Jose Pablo García<b>{linea}</b></div></div></body></html>")

def render(pg, destino, *args):
    pg.set_content(html(*args)); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(150)
    png = destino + '.png'; pg.screenshot(path=png)
    from PIL import Image
    Image.open(png).convert('RGB').save(destino, 'JPEG', quality=84, optimize=True, progressive=True); os.remove(png)

os.makedirs('img/og', exist_ok=True)
for viejo in glob.glob('img/og/*.jpg'): os.remove(viejo)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 630})
    for k, (img, pos, linea, modo) in PIEZAS.items():
        render(pg, f'img/og/{k}-{V}.jpg', img, pos, linea, modo)
    if BIO:  # la Bio usa la foto de Movimiento
        render(pg, os.path.join(BIO, f'img/og-image-{V}.jpg'), 'img/photo/movimiento/movimiento-2019-10-2048.webp', '50% 58%', 'Link in bio', 'full')
    b.close()
print('Listo:', len(PIEZAS), 'imágenes')
