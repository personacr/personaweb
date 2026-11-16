"""Arma todas las páginas del sitio a partir de contenido/*.yml y plantillas/*.html.

Uso:  python3 herramientas/construir.py
GitHub lo corre solo cada vez que cambia el contenido (ver .github/workflows/construir.yml).
No hace falta editar este archivo para cambiar textos o fotos: eso vive en contenido/.

REGLA DE ORO DE ESTE ARCHIVO: un campo vacío o que falte NUNCA debe detener el armado.
Pages CMS borra los campos vacíos al guardar, así que todo lo que se lee de contenido/ pasa
por `caja()` (un campo que falta vale '') y por las funciones `norm_*`, que rellenan valores
seguros y descartan con un aviso lo que no se puede mostrar (una foto sin archivo, un video sin código).
Lo único que detiene el armado a propósito es un .yml con la sintaxis rota: así el sitio publicado
se queda como estaba en vez de publicarse a medias.  Prueba: python3 herramientas/probar.py
"""
import datetime, glob, json, os, re, sys, unicodedata
import yaml
from jinja2 import Environment, FileSystemLoader, ChainableUndefined
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
CONT = os.environ.get('PERSONA_CONTENIDO', 'contenido')   # de dónde se lee (probar.py usa copias)
SALIDA = os.environ.get('PERSONA_SALIDA', '.')            # dónde se escriben las páginas
VISTA = os.environ.get('VISTA') == '1'                    # vista previa en raw.githack.com
GALERIAS = 'https://galerias.persona.cr'                  # galerías privadas de clientes (proyecto aparte)
OG = 'v2'                                                 # versión de las imágenes para compartir (herramientas/og.py)

avisos = []
def aviso(m):
    avisos.append(m); print('  ⚠ ' + m)

# ── lectura segura ──────────────────────────────────────────────────
class Caja(dict):
    """Diccionario donde un campo que falta vale '' (nunca da error)."""
    def __missing__(self, k): return ''

def _base(v):  # en los .yml las fotos van como «…-640.webp» (para que Pages CMS las muestre); el sitio usa la ruta sin tamaño
    return re.sub(r'-(640|1280|2048)\.webp$', '', v).lstrip('/')

def caja(v):
    if isinstance(v, dict):
        d = Caja({str(k): caja(x) for k, x in v.items()})
        for k in list(d):  # inglés vacío = se usa el español (nunca queda un hueco en /en/)
            if k.endswith('_es') and not d.get(k[:-3] + '_en'): d[k[:-3] + '_en'] = d[k]
        return d
    if isinstance(v, list): return [caja(x) for x in v if x is not None and x != '']
    if v is None: return ''
    if isinstance(v, str): return _base(v.strip())
    return v

def leer(nombre):
    ruta = os.path.join(CONT, nombre)
    if not os.path.exists(ruta):
        aviso(f'No existe {ruta}: se arma sin ese contenido.'); return Caja()
    d = caja(yaml.safe_load(open(ruta, encoding='utf-8')))   # sintaxis rota → se detiene a propósito
    return d if isinstance(d, dict) else Caja()

def lista(v): return v if isinstance(v, list) else []
def dicts(v): return [x for x in lista(v) if isinstance(x, dict)]
def si(v, defecto=False):  # casillas de Pages CMS: true/false, o vacío = valor por defecto
    if isinstance(v, bool): return v
    if v == '': return defecto
    return str(v).strip().lower() in ('true', 'si', 'sí', '1', 'yes')
def clave(s):  # para comparar nombres sin importar mayúsculas, tildes ni espacios
    s = unicodedata.normalize('NFKD', str(s)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')
def romano(n):
    out = ''
    for v, s in ((10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')):
        while n >= v: out += s; n -= v
    return out
def existe(base): return bool(base) and os.path.exists(base + '-640.webp')
def medir(base):
    im = Image.open(base + '-640.webp').convert('RGB')
    return dict(w=im.width, h=im.height, color='#%02x%02x%02x' % im.resize((1, 1), Image.BOX).getpixel((0, 0)))

# ── textos generales ────────────────────────────────────────────────
site = leer('sitio.yml')
for k, v in dict(nombre='Jose Pablo García', url='https://www.persona.cr', frase_es='Cineasta, fotógrafo y director escénico.',
                 frase_en='Filmmaker, photographer and stage director.', lugar_es='Costa Rica', lugar_en='Costa Rica',
                 email='josepablo@persona.cr', whatsapp='50688433789', instagram='https://www.instagram.com/persona.cr',
                 vimeo='https://vimeo.com/personacr', linkedin='https://www.linkedin.com/in/josepablogarcia/',
                 bio='https://bio.persona.cr', formspree='https://formspree.io/f/mojoqqqn', ga4='G-TY6Y414RXR').items():
    if not site.get(k): site[k] = v
site['url'] = str(site['url']).rstrip('/')
site['nombre_alterno'] = [str(x) for x in lista(site['nombre_alterno'])]
site['servicios'] = [s for s in dicts(site['servicios']) if s['titulo_es']]
for s in site['servicios']:
    if not existe(s['imagen']):
        if s['imagen']: aviso(f"Servicio «{s['titulo_es']}»: no encuentro la foto {s['imagen']}.")
        s['imagen'] = ''
site['disciplinas'] = [d for d in dicts(site['disciplinas']) if d['texto_es']]
site['reconocimientos'] = [r for r in dicts(site['reconocimientos']) if r['titulo_es']]
for r in site['reconocimientos']:
    r['anio'] = str(r['anio'])
    if r['imagen'] and not os.path.exists(r['imagen']):   # sello: se acepta la ruta vieja sin tamaño
        r['imagen'] = next((r['imagen'] + s for s in ('-320.webp', '-160.webp') if os.path.exists(r['imagen'] + s)), '')
    r['ver_anio'] = bool(r['anio']) and r['anio'][:4] not in r['evento_es']   # si el evento ya trae el año, no se repite
site['clientes'] = [c for c in dicts(site['clientes']) if c['logo'] and os.path.exists(c['logo'])]
site['clientes_sin_logo'] = [str(x) for x in lista(site['clientes_sin_logo'])]
site['mostrar_manifiesto'] = si(site['mostrar_manifiesto'], True) and bool(site['manifiesto_es'])

for cl in site['clientes']:  # tamaño por «peso visual»: los logos anchos van más bajos, los compactos o finos más altos
    try:
        if cl['logo'].endswith('.svg'):
            m = re.search(r'viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"', open(cl['logo'], encoding='utf-8').read())
            w, h = (float(m.group(1)), float(m.group(2))) if m else (2, 1); tinta = 0.3
        else:
            im = Image.open(cl['logo']).convert('RGBA'); w, h = im.size
            tinta = sum(im.getchannel('A').resize((64, 64)).tobytes()) / (255 * 64 * 64)
        r = w / h
        cl['alto'] = round(max(22, min(82, (2172 / (r * max(tinta, 0.08) ** 0.5)) ** 0.5, 150 / r)))
    except Exception as e:
        aviso(f"Logo {cl['logo']}: no se pudo medir ({e})."); cl['alto'] = 40

# Reel del inicio: video mudo en loop + botón para verlo completo. Sin video queda la foto (placeholder).
reel = site['reel'] if isinstance(site['reel'], dict) else Caja()
reel['activo'] = si(reel['activo'], True)
if reel['video'] and not os.path.exists(reel['video']):
    aviso(f"Reel: no encuentro el video {reel['video']} (se muestra la foto)."); reel['video'] = ''
reel['poster_propio'] = existe(reel['poster']) and reel['poster'] != 'img/home/hero'
if not existe(reel['poster']): reel['poster'] = 'img/home/hero'
if reel['completo_plataforma'] not in ('vimeo', 'youtube'): reel['completo_plataforma'] = 'vimeo'
reel['completo_id'] = str(reel['completo_id']).strip()
if not reel['boton_es']: reel['boton_es'], reel['boton_en'] = 'Ver reel', (reel['boton_en'] or 'Watch reel')
if VISTA and reel['activo'] and not reel['video'] and os.path.exists('vista/reel-de-prueba.mp4'):
    reel['video'] = 'vista/reel-de-prueba.mp4'; reel['prueba'] = True   # solo en la vista previa
if not reel['activo']: reel['video'] = reel['completo_id'] = ''
reel['hay_completo'] = bool(reel['completo_id'] or reel['video'])
site['reel'] = reel

# ── videos (Motion, Stage) ──────────────────────────────────────────
thumbs = {str(k): v for k, v in leer('miniaturas.yml').items()}
IG = {os.path.basename(p)[:-5] for p in glob.glob('img/motion/ig/*.webp')}

def norm_videos(v, donde):
    out = []
    for x in dicts(v):
        x['id'] = str(x['id']).strip()
        if not x['id']:
            aviso(f'{donde}: hay un video sin código; se omite.'); continue
        if x['plataforma'] not in ('vimeo', 'youtube', 'instagram'): x['plataforma'] = 'vimeo'
        if x['formato'] not in ('horizontal', 'vertical'): x['formato'] = 'horizontal'
        if x['miniatura'] and not existe(x['miniatura']):
            aviso(f"{donde}: no encuentro la miniatura {x['miniatura']}."); x['miniatura'] = ''
        x['titulo'] = x['titulo'] or donde
        out.append(x)
    return out
def norm_spotify(v):
    out = []
    for b in dicts(v):
        b['id'] = str(b['id']).strip()
        if not b['id']: continue
        if b['tipo'] not in ('album', 'track', 'playlist'): b['tipo'] = 'album'
        out.append(b)
    return out
def norm_enlaces(v):
    out = []
    for e in dicts(v):
        if not e['url']: continue
        e['texto'] = e['texto'] or re.sub(r'^https?://(www\.)?', '', e['url']).rstrip('/')
        out.append(e)
    return out

motion = leer('motion.yml')
motion['proyectos'] = [p for p in dicts(motion['proyectos']) if p['titulo']]
for p in motion['proyectos']:
    p['slug'] = clave(p['slug'] or p['titulo']); p['anio'] = str(p['anio'])
    p['videos'] = norm_videos(p['videos'], p['titulo']); p['banda_sonora'] = norm_spotify(p['banda_sonora'])
    p['enlaces'] = norm_enlaces(p['enlaces']); p['destacado'] = si(p['destacado'])
    if p['portada'] and not existe(p['portada']):
        aviso(f"{p['titulo']}: no encuentro la portada {p['portada']}."); p['portada'] = ''
    p['premios'] = [r for r in site['reconocimientos'] if clave(r['obra']) == clave(p['titulo'])]   # una sola fuente: Textos generales
motion['reels'] = norm_videos(motion['reels'], 'Reels'); motion['bitacora'] = norm_videos(motion['bitacora'], 'Bitácora')
motion['destacados'] = [p for p in motion['proyectos'] if p['destacado'] and p['videos']]
motion['resto'] = [p for p in motion['proyectos'] if p not in motion['destacados']]

stage = leer('stage.yml')
stage['proyectos'] = [p for p in dicts(stage['proyectos']) if p['titulo']]
for i, p in enumerate(stage['proyectos']):
    p['slug'] = clave(p['slug'] or p['titulo']); p['anio'] = str(p['anio']); p['numero'] = romano(i + 1)
    fotos = []
    for base in lista(p['fotos']):
        if isinstance(base, str) and existe(base):
            d = Caja(medir(base)); d.update(archivo=base, pie_es=p['titulo'], pie_en=p['titulo']); fotos.append(d)
        elif base: aviso(f"{p['titulo']}: no encuentro la foto {base}; se omite.")
    p['fotos'] = fotos
    p['videos'] = norm_videos(p['videos'], p['titulo']); p['banda_sonora'] = norm_spotify(p['banda_sonora'])
    p['enlaces'] = norm_enlaces(p['enlaces'])
    p['creditos'] = [c for c in dicts(p['creditos']) if c['nombre']]
    if p['audio'] and not os.path.exists(p['audio']):
        aviso(f"{p['titulo']}: no encuentro el audio {p['audio']}."); p['audio'] = ''
    if VISTA and not p['audio'] and not p['banda_sonora'] and os.path.exists('vista/audio-de-prueba.mp3'):
        p['audio'] = 'vista/audio-de-prueba.mp3'; p['audio_titulo_es'] = 'Audio de prueba'; p['audio_titulo_en'] = 'Test audio'

# ── Photo: capítulos ────────────────────────────────────────────────
capitulos = []
for ruta in sorted(glob.glob(os.path.join(CONT, 'photo', '*.yml'))):
    c = leer(os.path.join('photo', os.path.basename(ruta)))
    c['slug'] = clave(c['slug'] or os.path.basename(ruta)[:-4]); c['slug_en'] = clave(c['slug_en'] or c['slug'])
    c['titulo_es'] = c['titulo_es'] or c['slug'].replace('-', ' ').capitalize(); c['titulo_en'] = c['titulo_en'] or c['titulo_es']
    try: c['orden'] = float(c['orden'])
    except (TypeError, ValueError): c['orden'] = 99
    fotos = []
    for f in dicts(c['fotos']):
        if not f['archivo']:
            aviso(f"{c['titulo_es']}: hay una foto sin archivo; se omite."); continue
        if not existe(f['archivo']):
            aviso(f"{c['titulo_es']}: no encuentro {f['archivo']}-640.webp; se omite."); continue
        try: f['w'], f['h'] = float(f['w']), float(f['h']); assert f['w'] > 0 and f['h'] > 0
        except Exception: f.update(medir(f['archivo']))
        if not re.match(r'^#[0-9a-fA-F]{6}$', str(f['color'])): f['color'] = medir(f['archivo'])['color']
        f['grande'] = f['formato'] == 'grande'; f['credito'] = str(f['credito'])
        fotos.append(f)
    if not fotos:
        aviso(f"Capítulo «{c['titulo_es']}» sin fotos: no se publica."); continue
    c['fotos'] = fotos
    for i, f in enumerate(fotos): f['i'] = i
    if not existe(c['portada']): c['portada'] = fotos[0]['archivo']
    port = [f for f in fotos if f['archivo'] == c['portada']]
    c['muestra'] = (port + [f for f in fotos if f['archivo'] != c['portada']])[:7]
    # notas y premios por grupo (se buscan por el nombre del grupo en español)
    c['_grupos'] = {clave(g['nombre']): g for g in dicts(c['grupos']) if g['nombre']}
    for pr in dicts(c['premios']):  # formato anterior
        g = c['_grupos'].setdefault(clave(pr['grupo']), Caja(nombre=pr['grupo']))
        g.update(premio_es=g['premio_es'] or pr['texto_es'], premio_en=g['premio_en'] or pr['texto_en'], premio_url=g['premio_url'] or pr['url'], premio_sello=g['premio_sello'] or pr['imagen'])
    for g in c['_grupos'].values():
        if g['premio_sello'] and not os.path.exists(g['premio_sello']):
            g['premio_sello'] = next((g['premio_sello'] + s for s in ('-320.webp', '-160.webp') if os.path.exists(g['premio_sello'] + s)), '')
    capitulos.append(c)
capitulos.sort(key=lambda c: (c['orden'], c['slug']))
for i, c in enumerate(capitulos): c['numero'] = romano(i + 1)
POR_SLUG = {c['slug']: c for c in capitulos}
POR_ARCHIVO = {f['archivo']: (c, f) for c in capitulos for f in c['fotos']}

def bloques(c, lang):
    """El recorrido del capítulo: títulos de grupo, fotos grandes (pausas) y mosaicos, en el orden de la lista.
    Si ninguna foto está marcada como «grande», la primera abre el capítulo a todo el ancho."""
    out, g_act, mos = [], None, None
    hay_grande = any(f['grande'] for f in c['fotos'])
    for i, f in enumerate(c['fotos']):
        if f['grupo_es'] and f['grupo_es'] != g_act:
            g_act = f['grupo_es']; info = c['_grupos'].get(clave(g_act), Caja())
            out.append(dict(tipo='grupo', titulo=f['grupo_' + lang], nota=info['nota_' + lang], premio=info['premio_' + lang],
                            premio_url=info['premio_url'], premio_sello=info['premio_sello'])); mos = None
        if f['grande'] or (i == 0 and not hay_grande):
            out.append(dict(tipo='pausa', f=f)); mos = None
        else:
            if mos is None: mos = dict(tipo='mosaico', fotos=[]); out.append(mos)
            mos['fotos'].append(f)
    return out

def puertas(lang):
    a = T[lang]['areas']  # íconos por disciplina, los mismos de la Bio
    return [dict(k='motion', n='01', icono='▭', area=a[0], img='img/motion/banner/banner.webp', pos='50% 50%'),
            dict(k='photo', n='02', icono='◎', area=a[1], img='img/photo/movimiento/movimiento-2019-10-2048.webp', pos='50% 58%'),
            dict(k='stage', n='03', icono='⌒', area=a[2], img='img/stage/banner/banner.webp', pos='50% 50%')]

def mosaico(lang):
    """Fotos del inicio. Cada entrada es la foto misma (ruta); también se acepta el formato viejo «capítulo:número»."""
    out = []
    for ref in lista(site['mosaico']):
        ref = str(ref); par = POR_ARCHIVO.get(_base(ref))
        if not par and re.match(r'^[\w-]+:\d+$', ref):
            slug, n = ref.split(':'); c = POR_SLUG.get(slug)
            if c and 0 < int(n) <= len(c['fotos']): par = (c, c['fotos'][int(n) - 1])
        if not par:
            aviso(f'Mosaico del inicio: «{ref}» no está en ningún capítulo; se omite.'); continue
        c, f = par
        out.append(dict(f=f, slug=c['slug'] if lang == 'es' else c['slug_en'], titulo=c['titulo_' + lang]))
    return out

# ── textos de interfaz ──────────────────────────────────────────────
T = {
 'es': dict(
  nav=[('motion','Motion'),('photo','Photo'),('stage','Stage'),('sobre-mi','Sobre mí'),('contacto','Contacto')],
  contact_slug='contacto', menu='Menú', write='Escribime', photo='Foto ampliada', close='Cerrar', prev='Anterior', next='Siguiente',
  explore='Ver trabajo', all_photo='Ver todas las fotos', projects='proyectos', awards='reconocimientos', clients='clientes', clients_sub='Con quienes he trabajado',
  offer='servicios', offer_sub='Para artistas, productoras, festivales y marcas.', quote='Cotizar', form='Formulario', see_ig='Ver en Instagram', enter='Entrar', photos='fotos', chapters='Capítulos', quote_project='Cotizar tu proyecto',
  photo_eyebrow='Fotografía', photo_lead='Arte, música en vivo, danza, teatro, retrato, viajes y marcas.',
  motion_eyebrow='Cine & video', motion_lead='Series, películas, cortos, videoclips y reels.',
  year='Año', type='Formato', role='Rol', play='Reproducir', pause='Pausar', soundtrack='Banda sonora', full_sheet='Ficha, tráileres y banda sonora', more_work='más trabajo',
  reels_lead='Festivales, escuelas y marcas', fieldnotes='Bitácora', fieldnotes_lead='Viajes, conciertos y dron',
  stage_eyebrow='Artes escénicas', stage_lead='Dirección escénica y artística.',
  programme='Programa', venue='Sala', dates='Funciones', my_role='Mi rol', links='Enlaces', music='Música del montaje', listen='Escuchar', video='Video',
  reel_pause='Pausar el reel', reel_play='Reproducir el reel',
  about_title='sobre mí', contact_title='contacto', contact_lead='Contame de tu proyecto: gira, concierto, obra, película o marca.',
  email='Correo', f_name='Nombre', f_type='Tipo de proyecto', f_msg='Mensaje', f_send='Enviar mensaje',
  f_types=['Música en vivo / gira','Cine o video','Contenido para redes','Teatro o danza','Marca o evento','Otro'],
  areas=['Cine & video', 'Fotografía', 'Artes escénicas'], galleries='Galerías de clientes'),
 'en': dict(
  nav=[('motion','Motion'),('photo','Photo'),('stage','Stage'),('about','About'),('contact','Contact')],
  contact_slug='contact', menu='Menu', write='Get in touch', photo='Enlarged photo', close='Close', prev='Previous', next='Next',
  explore='See work', all_photo='See all photos', projects='projects', awards='recognition', clients='clients', clients_sub='People I have worked with',
  offer='services', offer_sub='For artists, production companies, festivals and brands.', quote='Get a quote', form='Contact form', see_ig='Watch on Instagram', enter='Enter', photos='photos', chapters='Chapters', quote_project='Quote your project',
  photo_eyebrow='Photography', photo_lead='Fine art, live music, dance, theatre, portrait, travel and brands.',
  motion_eyebrow='Film & video', motion_lead='Series, films, shorts, music videos and reels.',
  year='Year', type='Format', role='Role', play='Play', pause='Pause', soundtrack='Soundtrack', full_sheet='Details, trailers and soundtrack', more_work='more work',
  reels_lead='Festivals, schools and brands', fieldnotes='Field notes', fieldnotes_lead='Travel, concerts and drone',
  stage_eyebrow='Performing arts', stage_lead='Stage and artistic direction.',
  programme='Programme', venue='Venue', dates='Performances', my_role='My role', links='Links', music='Music from the show', listen='Listen', video='Video',
  reel_pause='Pause the reel', reel_play='Play the reel',
  about_title='about', contact_title='contact', contact_lead='Tell me about your project: tour, concert, play, film or brand.',
  email='Email', f_name='Name', f_type='Project type', f_msg='Message', f_send='Send message',
  f_types=['Live music / tour','Film or video','Social media content','Theatre or dance','Brand or event','Other'],
  areas=['Film & video', 'Photography', 'Performing arts'], galleries='Client galleries'),
}
ES2EN = {c['slug']: c['slug_en'] for c in capitulos}
def en_path(p):
    p = str(p).replace('sobre-mi/', 'about/').replace('contacto/', 'contact/')
    m = re.match(r'photo/([^/]+)/', p)
    return f"photo/{ES2EN.get(m.group(1), m.group(1))}/" if m else p

env = Environment(loader=FileSystemLoader('plantillas'), autoescape=True, trim_blocks=True, lstrip_blocks=True, undefined=ChainableUndefined)
env.filters['en_path'] = en_path

PERSON = {'@type': 'Person', '@id': site['url'] + '/#jpg', 'name': site['nombre'], 'alternateName': site['nombre_alterno'],
          'jobTitle': 'Cineasta, fotógrafo y director escénico', 'nationality': 'Costa Rica', 'image': site['url'] + '/img/about/jose-pablo-garcia-1280.webp',
          'knowsAbout': ['Fotografía de conciertos', 'Fotografía de danza', 'Fotografía de teatro', 'Dirección de fotografía', 'Videoclips', 'Dirección escénica'],
          'sameAs': [x for x in (site['instagram'], site['vimeo'], site['linkedin'], site['bio']) if x], 'brand': {'@id': site['url'] + '/#persona'},
          'award': [', '.join(x for x in (r['titulo_en'], (r['evento_en'] + (' ' + r['anio'] if r['ver_anio'] else '')).strip()) if x) + (f" ({r['obra']})" if r['obra'] else '')
                    for r in site['reconocimientos']]}
ORG = {'@type': 'ProfessionalService', '@id': site['url'] + '/#persona', 'name': 'PERSONA', 'founder': {'@id': site['url'] + '/#jpg'},
       'url': site['url'] + '/', 'areaServed': ['Costa Rica', 'Centroamérica'], 'email': site['email']}

paginas = []
# Qué tipo de proyecto llega elegido al tocar «Escribime» desde cada página (posición en f_types)
TIPO = {'motion/': 1, 'stage/': 3, 'photo/en-vivo/': 0, 'photo/movimiento/': 3, 'photo/teatro/': 3, 'photo/marcas/': 4}
def escribir(ruta, texto):
    destino = os.path.join(SALIDA, ruta); os.makedirs(os.path.dirname(destino) or '.', exist_ok=True)
    open(destino, 'w', encoding='utf-8').write(texto)

def pagina(plantilla, ruta_es, ruta_en, lang, seccion, titulo, desc, extra=None, schema=None, og=None):
    ruta = ruta_es if lang == 'es' else ruta_en
    og = og or f"img/og/{seccion if seccion in ('photo', 'motion', 'stage') else 'home'}-{OG}.jpg"
    prof = ruta.count('/')
    ctx = dict(site=site, t=T[lang], lang=lang, galerias=GALERIAS, R='../' * prof, P='' if lang == 'es' else 'en/', thumbs=thumbs, ig=IG, year=datetime.date.today().year,
               m=motion, s=stage, capitulos=capitulos, reel=reel,
               page=dict(title=titulo, description=desc, path=ruta, path_es=ruta_es, path_en=ruta_en, section=seccion, og=og, tipo=TIPO.get(ruta_es),
                         schema={'@context': 'https://schema.org', '@graph': [PERSON, ORG] + (schema or [])}))
    ctx.update(extra or {})
    html = env.get_template(plantilla).render(**ctx)
    if VISTA:  # vista previa en raw.githack: los enlaces a carpetas necesitan «index.html» explícito
        html = re.sub(r'href="((?:\.\./)*(?:[\w-]+/)*)((?:\?[^"#]*)?(?:#[^"]*)?)"', lambda m: f'href="{m.group(1)}index.html{m.group(2)}"' if not (m.group(1) == '' and m.group(2).startswith('#')) else m.group(0), html)
    escribir(os.path.join(ruta, 'index.html'), html)
    paginas.append(ruta)

N = site['nombre']
for lang in ('es', 'en'):
    es = lang == 'es'
    pagina('home.html', '', 'en/', lang, '',
           f"{N} · PERSONA",
           'Cineasta, fotógrafo y director escénico en Costa Rica. Videoclips, cortos, fotografía de conciertos, danza y teatro.' if es else
           'Filmmaker, photographer and stage director in Costa Rica. Music videos, short films, concert, dance and theatre photography.',
           extra=dict(mosaico=mosaico(lang), puertas=puertas(lang)))
    pagina('photo.html', 'photo/', 'en/photo/', lang, 'photo',
           f"{'Fotografía de arte, conciertos, danza y teatro' if es else 'Fine Art, Concert, Dance & Theatre Photography'} · {N}",
           ('Fotografía de arte, música en vivo, danza, teatro, retrato, viajes y marcas. Por ' if es else 'Fine art, live music, dance, theatre, portrait, travel and brand photography. By ') + N + ' (PERSONA), Costa Rica.')
    for c in capitulos:
        tit = c['titulo_' + lang]
        imgs = [{'@type': 'ImageObject', 'contentUrl': f"{site['url']}/{f['archivo']}-1280.webp", 'name': (f['pie_' + lang] or tit) + (f" — {f['credito']}" if f['credito'] else ''),
                 'creator': {'@id': site['url'] + '/#jpg'}, 'creditText': f'{N} / PERSONA', 'copyrightNotice': f'© {N}'} for f in c['fotos']]
        pagina('capitulo.html', f"photo/{c['slug']}/", f"en/photo/{c['slug_en']}/", lang, 'photo',
               f"{tit} · {'Fotografía' if es else 'Photography'} · {N} | PERSONA",
               f"{tit}: {c['intro_' + lang]} ".replace(':  ', ' ') + (f'Fotografía de {N} (PERSONA), Costa Rica.' if es else f'Photography by {N} (PERSONA), Costa Rica.'),
               extra=dict(c=c, bloques=bloques(c, lang)), og=f"img/og/photo-{c['slug']}-{OG}.jpg" if os.path.exists(f"img/og/photo-{c['slug']}-{OG}.jpg") else None,
               schema=[{'@type': 'ImageGallery', 'name': tit, 'description': c['intro_' + lang], 'hasPart': imgs}])
    pagina('motion.html', 'motion/', 'en/motion/', lang, 'motion',
           f"{'Cine y video: series, cortos y videoclips' if es else 'Film & Video: series, shorts and music videos'} · {N}",
           'Dirección, fotografía y edición: Dele Viaje, Abril (segunda unidad), Lorem Ipsum, Preludio, Moment y videoclips. Desde Costa Rica.' if es else
           'Direction, cinematography and editing: Dele Viaje, Abril (second unit), Lorem Ipsum, Preludio, Moment and music videos. From Costa Rica.',
           schema=[{'@type': 'CreativeWork', 'name': p['titulo'], 'dateCreated': p['anio'], 'contributor': {'@id': site['url'] + '/#jpg'},
                    'description': p['rol_' + lang]} for p in motion['proyectos']])
    obras = ', '.join(f"{p['titulo']} ({p['anio']})" if p['anio'] else p['titulo'] for p in stage['proyectos'])
    pagina('stage.html', 'stage/', 'en/stage/', lang, 'stage',
           f"{'Dirección escénica' if es else 'Stage Direction'} · {' · '.join(p['titulo'] for p in stage['proyectos'][:2])} · {N}",
           (f'Dirección escénica y artística: {obras}.' if es else f'Stage and artistic direction: {obras}.'),
           schema=[{'@type': 'TheaterEvent' if p['sala'] else 'CreativeWork', 'name': p['titulo'], 'description': p['sinopsis_' + lang],
                    **({'location': {'@type': 'PerformingArtsTheater', 'name': p['sala']}} if p['sala'] else {}), 'contributor': {'@id': site['url'] + '/#jpg'}} for p in stage['proyectos']])
    pagina('about.html', 'sobre-mi/', 'en/about/', lang, 'sobre-mi' if es else 'about',
           f"{N}, {'cineasta y fotógrafo · Sobre mí' if es else 'filmmaker & photographer · About'} | PERSONA", site['bio_corta_' + lang] or site['frase_' + lang])
    pagina('contacto.html', 'contacto/', 'en/contact/', lang, 'contacto' if es else 'contact',
           f"{'Contacto y cotizaciones' if es else 'Contact & quotes'} · {N} | PERSONA",
           'Foto y video para conciertos, giras, teatro, danza y marcas. Escribime por WhatsApp o correo.' if es else
           'Photo and video for concerts, tours, theatre, dance and brands. Reach me on WhatsApp or email.')

for viejo, nuevo in (('music/', 'motion/'), ('en/music/', 'en/motion/')):
    escribir(viejo + 'index.html', env.get_template('redirect.html').render(lang='es', to='../' * viejo.count('/') + nuevo))

hoy = datetime.date.today().isoformat()
escribir('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ''.join(f"  <url><loc>{site['url']}/{p}</loc><lastmod>{hoy}</lastmod></url>\n" for p in paginas) + '</urlset>\n')
escribir('robots.txt', f"User-agent: *\nAllow: /\nSitemap: {site['url']}/sitemap.xml\n")
print(f'Listo: {len(paginas)} páginas' + (f' · {len(avisos)} aviso(s): revisalos arriba, el sitio se armó igual.' if avisos else '.'))
