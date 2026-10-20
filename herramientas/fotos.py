"""Prepara las fotos que se suben desde Pages CMS.

Cuando en un capítulo (contenido/photo/*.yml) o en Stage aparece una foto recién subida
(una ruta que termina en .jpg / .jpeg / .png / .webp, normalmente dentro de img/subidas/),
este script:
  1. crea las tres versiones livianas (640, 1280 y 2048 px, WebP) en la carpeta del capítulo,
  2. escribe en el .yml la ruta de la versión de 640 px, el ancho, el alto y el color promedio,
  3. borra el archivo original subido, para que el repositorio no crezca.
GitHub lo corre solo antes de armar las páginas.
"""
import glob, os, re, unicodedata
import yaml
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
EXT = ('.jpg', '.jpeg', '.png', '.webp')

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-') or 'foto'

def subida(v):  # foto nueva = imagen que todavía no es una versión liviana «-640/-1280/-2048.webp»
    return isinstance(v, str) and v.lower().endswith(EXT) and not re.search(r'-(640|1280|2048)\.webp$', v)

def procesar(ruta, destino_dir, nombre):
    ruta = ruta.lstrip('/')
    im = ImageOps.exif_transpose(Image.open(ruta)).convert('RGB')
    os.makedirs(destino_dir, exist_ok=True)
    base = os.path.join(destino_dir, nombre)
    n = 1
    while os.path.exists(base + '-640.webp'):
        n += 1; base = os.path.join(destino_dir, f'{nombre}-{n}')
    ex = Image.Exif(); ex[0x013B] = 'Jose Pablo García'; ex[0x8298] = '© Jose Pablo García · PERSONA'
    for w in (640, 1280, 2048):
        t = im.copy(); t.thumbnail((w, w), Image.LANCZOS)
        t.save(f'{base}-{w}.webp', 'WEBP', quality=80 if w < 2048 else 74, method=5, exif=ex.tobytes())
    color = '#%02x%02x%02x' % im.resize((1, 1), Image.BOX).getpixel((0, 0))
    os.remove(ruta)  # el original pesado no se queda en el repo
    return base + '-640.webp', im.width, im.height, color

def guardar(path, data, cabecera):
    open(path, 'w', encoding='utf-8').write(cabecera + yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=200))

cambios = 0
for path in glob.glob('contenido/photo/*.yml'):
    texto = open(path, encoding='utf-8').read()
    cab = ''.join(l + '\n' for l in texto.splitlines() if l.startswith('#'))
    c = yaml.safe_load(texto); tocado = False
    for i, f in enumerate(c.get('fotos', [])):
        if subida(f.get('archivo')):
            nombre = f"{slug(f.get('credito', '').split('·')[0]) if f.get('credito') else c['slug']}-{c['slug']}-{i + 1:02d}"
            f['archivo'], f['w'], f['h'], f['color'] = procesar(f['archivo'], f"img/photo/{c['slug']}", nombre)
            f.setdefault('formato', 'par'); tocado = True
    if subida(c.get('portada')):
        c['portada'] = procesar(c['portada'], f"img/photo/{c['slug']}", f"{c['slug']}-portada")[0]; tocado = True
    if tocado:
        guardar(path, c, cab); cambios += 1

path = 'contenido/stage.yml'
texto = open(path, encoding='utf-8').read(); s = yaml.safe_load(texto); tocado = False
for p in s['proyectos']:
    for j, ruta in enumerate(p.get('fotos', [])):
        if subida(ruta):
            p['fotos'][j] = procesar(ruta, f"img/stage/{p['slug']}", f"{p['slug']}-{j + 1:02d}")[0]; tocado = True
if tocado:
    guardar(path, s, ''.join(l + '\n' for l in texto.splitlines() if l.startswith('#'))); cambios += 1

path = 'contenido/motion.yml'
texto = open(path, encoding='utf-8').read(); m = yaml.safe_load(texto); tocado = False
for p in m['proyectos']:
    if subida(p.get('portada')):
        p['portada'] = procesar(p['portada'], f"img/motion/{p['slug']}", f"{p['slug']}-portada")[0]; tocado = True
if tocado:
    guardar(path, m, ''.join(l + '\n' for l in texto.splitlines() if l.startswith('#'))); cambios += 1

print(f'Fotos: {cambios} archivo(s) de contenido actualizados.')
