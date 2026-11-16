"""Prepara las fotos que se suben desde Pages CMS.

Cuando en el contenido aparece una foto recién subida (una ruta que termina en .jpg / .jpeg / .png / .webp
y que todavía no es una versión liviana «-640/-1280/-2048.webp»), este script:
  1. crea las tres versiones livianas (640, 1280 y 2048 px, WebP) en la carpeta que le toca,
  2. escribe en el .yml la ruta de la versión de 640 px (y en los capítulos, el ancho, el alto y el color),
  3. borra el archivo original subido, para que el repositorio no crezca.
GitHub lo corre solo antes de armar las páginas.

Dónde busca fotos nuevas:
  · contenido/photo/*.yml  → fotos[].archivo y portada            → img/photo/<capítulo>/
  · contenido/stage.yml    → proyectos[].fotos[]                  → img/stage/<obra>/
  · contenido/motion.yml   → portada y miniatura de cada video    → img/motion/cuadros/
  · contenido/sitio.yml    → reel.poster y servicios[].imagen     → img/home/ e img/servicios/
Videos (.mp4) y audios (.mp3) no se tocan: se usan tal como se suben.

Igual que el armador, NUNCA se detiene por un campo vacío: si una foto no se puede procesar, avisa y sigue.
"""
import glob, os, re, sys, unicodedata
import yaml
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
CONT = os.environ.get('PERSONA_CONTENIDO', 'contenido')
EXT = ('.jpg', '.jpeg', '.png', '.webp')

def slug(s):
    s = unicodedata.normalize('NFKD', str(s)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-') or 'foto'

def subida(v):  # foto nueva = imagen que todavía no es una versión liviana «-640/-1280/-2048.webp»
    return isinstance(v, str) and v.lower().endswith(EXT) and not re.search(r'-(640|1280|2048)\.webp$', v)

def procesar(ruta, destino_dir, nombre):
    """Devuelve (ruta de 640, ancho, alto, color) o None si la foto no se pudo leer."""
    ruta = ruta.lstrip('/')
    try:
        im = ImageOps.exif_transpose(Image.open(ruta)).convert('RGB')
    except Exception as e:
        print(f'  ⚠ No pude leer {ruta} ({e}); se deja como está.'); return None
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

def dicts(v): return [x for x in (v if isinstance(v, list) else []) if isinstance(x, dict)]

def abrir(path):
    texto = open(path, encoding='utf-8').read()
    cab = ''.join(l + '\n' for l in texto.splitlines() if l.startswith('#'))
    data = yaml.safe_load(texto)
    return (data if isinstance(data, dict) else {}), cab

def guardar(path, data, cabecera):
    open(path, 'w', encoding='utf-8').write(cabecera + yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=1000))

def campo(d, k, destino_dir, nombre):
    """Si d[k] es una foto recién subida, la procesa y deja en d[k] la ruta liviana. Devuelve el resultado o None."""
    if not subida(d.get(k)): return None
    r = procesar(d[k], destino_dir, nombre)
    if r: d[k] = r[0]
    return r

cambios = 0
def archivo(path, fn):
    """Aplica fn(data) a un .yml; si fn devuelve True, lo guarda. Un error en un archivo no detiene a los demás."""
    global cambios
    if not os.path.exists(path): return
    try:
        data, cab = abrir(path)
        if fn(data): guardar(path, data, cab); cambios += 1
    except Exception as e:
        print(f'  ⚠ {path}: no se pudo revisar ({e}). Se sigue con lo demás.')

def capitulo(c):
    tocado = False; s = slug(c.get('slug') or 'capitulo')
    for i, f in enumerate(dicts(c.get('fotos'))):
        nombre = f"{slug(str(f.get('credito') or '').split('·')[0]) if f.get('credito') else s}-{s}-{i + 1:02d}"
        r = campo(f, 'archivo', f'img/photo/{s}', nombre)
        if r: f['w'], f['h'], f['color'] = r[1], r[2], r[3]; f.setdefault('formato', 'normal'); tocado = True
    if campo(c, 'portada', f'img/photo/{s}', f'{s}-portada'): tocado = True
    return tocado

def escena(d):
    tocado = False
    for p in dicts(d.get('proyectos')):
        s = slug(p.get('slug') or p.get('titulo') or 'obra'); fotos = p.get('fotos') if isinstance(p.get('fotos'), list) else []
        for j, ruta in enumerate(fotos):
            if subida(ruta):
                r = procesar(ruta, f'img/stage/{s}', f'{s}-{j + 1:02d}')
                if r: fotos[j] = r[0]; tocado = True
        for j, v in enumerate(dicts(p.get('videos'))):
            if campo(v, 'miniatura', 'img/motion/cuadros', f"{s}-{slug(v.get('id') or j)}"): tocado = True
    return tocado

def cine(d):
    tocado = False
    for p in dicts(d.get('proyectos')):
        s = slug(p.get('slug') or p.get('titulo') or 'proyecto')
        if campo(p, 'portada', 'img/motion/cuadros', f'{s}-portada'): tocado = True
        for j, v in enumerate(dicts(p.get('videos'))):
            if campo(v, 'miniatura', 'img/motion/cuadros', f"{s}-{slug(v.get('id') or j)}"): tocado = True
    for k in ('reels', 'bitacora'):
        for j, v in enumerate(dicts(d.get(k))):
            if campo(v, 'miniatura', 'img/motion/cuadros', f"{k}-{slug(v.get('id') or j)}"): tocado = True
    return tocado

def sitio(d):
    tocado = False
    if isinstance(d.get('reel'), dict) and campo(d['reel'], 'poster', 'img/home', 'reel-portada'): tocado = True
    for j, s in enumerate(dicts(d.get('servicios'))):
        if campo(s, 'imagen', 'img/servicios', slug(s.get('titulo_es') or f'servicio-{j + 1}')): tocado = True
    return tocado

for path in sorted(glob.glob(os.path.join(CONT, 'photo', '*.yml'))): archivo(path, capitulo)
archivo(os.path.join(CONT, 'stage.yml'), escena)
archivo(os.path.join(CONT, 'motion.yml'), cine)
archivo(os.path.join(CONT, 'sitio.yml'), sitio)
print(f'Fotos: {cambios} archivo(s) de contenido actualizados.')
