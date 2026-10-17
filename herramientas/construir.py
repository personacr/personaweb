"""Arma todas las páginas del sitio a partir de contenido/*.yml y plantillas/*.html.

Uso:  python3 herramientas/construir.py
GitHub lo corre solo cada vez que cambia el contenido (ver .github/workflows/construir.yml).
No hace falta editar este archivo para cambiar textos o fotos: eso vive en contenido/.
"""
import datetime, glob, json, os, re
import yaml
from jinja2 import Environment, FileSystemLoader

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
leer = lambda p: yaml.safe_load(open(p, encoding='utf-8'))

site = leer('contenido/sitio.yml')
motion = leer('contenido/motion.yml')
stage = leer('contenido/stage.yml')

thumbs = {str(k): v for k, v in (leer('contenido/miniaturas.yml') or {}).items()}
capitulos = sorted((leer(p) for p in glob.glob('contenido/photo/*.yml')), key=lambda c: c['orden'])
from PIL import Image
for c in capitulos:
    for i, f in enumerate(c['fotos']):
        f['i'] = i
    port = [f for f in c['fotos'] if f['archivo'] == c['portada']]
    c['muestra'] = (port + [f for f in c['fotos'] if f['archivo'] != c['portada']])[:7]
POR_SLUG = {c['slug']: c for c in capitulos}

for cl in site.get('clientes', []):  # tamaño por «peso visual»: los logos anchos van más bajos, los compactos o finos más altos
    if cl['logo'].endswith('.svg'):
        m = re.search(r'viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"', open(cl['logo'], encoding='utf-8').read())
        w, h = (float(m.group(1)), float(m.group(2))) if m else (2, 1); tinta = 0.3
    else:
        im = Image.open(cl['logo']).convert('RGBA'); w, h = im.size
        tinta = sum(im.getchannel('A').resize((64, 64)).tobytes()) / (255 * 64 * 64)
    r = w / h
    alto = (2172 / (r * max(tinta, 0.08) ** 0.5)) ** 0.5
    alto = max(22, min(70, alto, 150 / r))
    cl['alto'] = round(alto)

def medir(base):
    im = Image.open(base + '-640.webp').convert('RGB')
    return dict(w=im.width, h=im.height, color='#%02x%02x%02x' % im.resize((1, 1), Image.BOX).getpixel((0, 0)))

IG = {os.path.basename(p)[:-5] for p in glob.glob('img/motion/ig/*.webp')}
HERO_VIDEO = os.path.exists('img/home/hero.mp4')

def puertas(lang):
    a = T[lang]['areas']  # íconos por disciplina, los mismos de la Bio
    return [dict(k='motion', n='01', icono='▭', area=a[0], img='img/motion/banner/banner.webp', pos='50% 50%'),
            dict(k='photo', n='02', icono='◎', area=a[1], img='img/photo/movimiento/movimiento-2019-10-2048.webp', pos='50% 58%'),
            dict(k='stage', n='03', icono='⌒', area=a[2], img='img/stage/banner/banner.webp', pos='50% 50%')]

def mosaico(lang):
    out = []
    for ref in site.get('mosaico', []):
        slug, orden = str(ref).split(':')
        c = POR_SLUG[slug]; f = c['fotos'][int(orden) - 1]
        out.append(dict(f=f, slug=c['slug'] if lang == 'es' else c['slug_en'], titulo=c['titulo_' + lang]))
    return out

def stills(lang):
    out = []
    for p in stage['proyectos']:
        for j, base in enumerate(p['fotos']):
            d = medir(base); d.update(archivo=base, formato='par', credito=p['titulo'] + ' · ' + str(p['anio']),
                                      pie_es=p['titulo'], pie_en=p['titulo'], label=p['titulo'] if j == 0 else '')
            out.append(d)
    return out

# ── textos de interfaz ──────────────────────────────────────────────
T = {
 'es': dict(
  nav=[('motion','Motion'),('photo','Photo'),('stage','Stage'),('sobre-mi','Sobre mí'),('contacto','Contacto')],
  contact_slug='contacto', menu='Menú', write='Escribime', photo='Foto ampliada', close='Cerrar', prev='Anterior', next='Siguiente',
  explore='Ver trabajo', all_photo='Ver todas las fotos', projects='proyectos', awards='reconocimientos', clients='clientes', clients_sub='Con quienes he trabajado',
  offer='servicios', offer_sub='Para artistas, productoras, festivales y marcas.', quote='Cotizar', form='Formulario', see_ig='Ver en Instagram', enter='Entrar', photos='fotos', chapters='Capítulos', next_chapter='Siguiente capítulo', quote_project='Cotizar tu proyecto',
  photo_eyebrow='Fotografía', photo_lead='Música en vivo, danza, teatro, retrato, arte, viajes y marcas.',
  motion_eyebrow='Cine & video', motion_lead='Series, películas, cortos, videoclips y reels.',
  year='Año', type='Formato', role='Rol', play='Reproducir', soundtrack='Banda sonora',
  reels_lead='Festivales, escuelas y marcas', fieldnotes='Bitácora', fieldnotes_lead='Viajes, conciertos y dron',
  stage_eyebrow='Artes escénicas', stage_lead='Dirección escénica y artística.',
  stage_photos='en escena', stage_photos_sub='Fotos de las producciones',
  about_title='sobre mí', contact_title='contacto', contact_lead='Contame de tu proyecto: gira, concierto, obra, película o marca.',
  email='Correo', f_name='Nombre', f_type='Tipo de proyecto', f_msg='Mensaje', f_send='Enviar mensaje',
  f_types=['Música en vivo / gira','Cine o video','Contenido para redes','Teatro o danza','Marca o evento','Otro'],
  areas=['Cine & video', 'Fotografía', 'Artes escénicas'], n_projects='proyectos', n_chapters='capítulos', n_productions='producciones'),
 'en': dict(
  nav=[('motion','Motion'),('photo','Photo'),('stage','Stage'),('about','About'),('contact','Contact')],
  contact_slug='contact', menu='Menu', write='Get in touch', photo='Enlarged photo', close='Close', prev='Previous', next='Next',
  explore='See work', all_photo='See all photos', projects='projects', awards='recognition', clients='clients', clients_sub='People I have worked with',
  offer='services', offer_sub='For artists, production companies, festivals and brands.', quote='Get a quote', form='Contact form', see_ig='Watch on Instagram', enter='Enter', photos='photos', chapters='Chapters', next_chapter='Next chapter', quote_project='Quote your project',
  photo_eyebrow='Photography', photo_lead='Live music, dance, theatre, portrait, fine art, travel and brands.',
  motion_eyebrow='Film & video', motion_lead='Series, films, shorts, music videos and reels.',
  year='Year', type='Format', role='Role', play='Play', soundtrack='Soundtrack',
  reels_lead='Festivals, schools and brands', fieldnotes='Field notes', fieldnotes_lead='Travel, concerts and drone',
  stage_eyebrow='Performing arts', stage_lead='Stage and artistic direction.',
  stage_photos='on stage', stage_photos_sub='Production photos',
  about_title='about', contact_title='contact', contact_lead='Tell me about your project: tour, concert, play, film or brand.',
  email='Email', f_name='Name', f_type='Project type', f_msg='Message', f_send='Send message',
  f_types=['Live music / tour','Film or video','Social media content','Theatre or dance','Brand or event','Other'],
  areas=['Film & video', 'Photography', 'Performing arts'], n_projects='projects', n_chapters='chapters', n_productions='productions'),
}
ES2EN = {c['slug']: c['slug_en'] for c in capitulos}
def en_path(p):
    p = p.replace('sobre-mi/', 'about/').replace('contacto/', 'contact/')
    m = re.match(r'photo/([^/]+)/', p)
    return f"photo/{ES2EN.get(m.group(1), m.group(1))}/" if m else p

env = Environment(loader=FileSystemLoader('plantillas'), autoescape=True, trim_blocks=True, lstrip_blocks=True)
env.filters['en_path'] = en_path

PERSON = {'@type': 'Person', '@id': site['url'] + '/#jpg', 'name': site['nombre'], 'alternateName': site['nombre_alterno'],
          'jobTitle': 'Cineasta, fotógrafo y director escénico', 'nationality': 'Costa Rica', 'image': site['url'] + '/img/about/jose-pablo-garcia-1280.webp',
          'knowsAbout': ['Fotografía de conciertos', 'Fotografía de danza', 'Fotografía de teatro', 'Dirección de fotografía', 'Videoclips', 'Dirección escénica'],
          'sameAs': [site['instagram'], site['vimeo'], site['linkedin'], site['bio']], 'brand': {'@id': site['url'] + '/#persona'},
          'award': [r['texto_en'] for r in site.get('reconocimientos', [])]}
ORG = {'@type': 'ProfessionalService', '@id': site['url'] + '/#persona', 'name': 'PERSONA', 'founder': {'@id': site['url'] + '/#jpg'},
       'url': site['url'] + '/', 'areaServed': ['Costa Rica', 'Centroamérica'], 'email': site['email']}

paginas = []
# Qué tipo de proyecto llega elegido al tocar «Escribime» desde cada página (posición en f_types)
TIPO = {'motion/': 1, 'stage/': 3, 'photo/en-vivo/': 0, 'photo/movimiento/': 3, 'photo/teatro/': 3, 'photo/marcas/': 4}
VISTA = os.environ.get('VISTA') == '1'
def pagina(plantilla, ruta_es, ruta_en, lang, seccion, titulo, desc, extra=None, schema=None, og=None):
    ruta = ruta_es if lang == 'es' else ruta_en
    prof = ruta.count('/')
    ctx = dict(site=site, t=T[lang], lang=lang, R='../' * prof, P='' if lang == 'es' else 'en/', thumbs=thumbs, ig=IG, hero_video=HERO_VIDEO, year=datetime.date.today().year,
               m=motion, s=stage, capitulos=capitulos,
               page=dict(title=titulo, description=desc, path=ruta, path_es=ruta_es, path_en=ruta_en, section=seccion, og=og, tipo=TIPO.get(ruta_es),
                         schema={'@context': 'https://schema.org', '@graph': [PERSON, ORG] + (schema or [])}))
    ctx.update(extra or {})
    os.makedirs(ruta or '.', exist_ok=True)
    html = env.get_template(plantilla).render(**ctx)
    if VISTA:  # vista previa en raw.githack: los enlaces a carpetas necesitan «index.html» explícito
        html = re.sub(r'href="((?:\.\./)*(?:[\w-]+/)*)(\?[^"#]*)?"', lambda m: f'href="{m.group(1)}index.html{m.group(2) or ""}"', html)
    open(os.path.join(ruta, 'index.html'), 'w', encoding='utf-8').write(html)
    paginas.append(ruta)

N = site['nombre']
for lang in ('es', 'en'):
    es = lang == 'es'
    pagina('home.html', '', 'en/', lang, '',
           f"{N} · PERSONA — " + ('Cineasta y fotógrafo, Costa Rica' if es else 'Filmmaker & Photographer'),
           'Cineasta, fotógrafo y director escénico costarricense. Fotografía de conciertos, danza y teatro; videoclips, cortos y dirección escénica. Narrador visual.' if es else
           'Costa Rican filmmaker, photographer and stage director. Concert, dance and theatre photography; music videos, short films and stage direction. Visual storyteller.',
           extra=dict(mosaico=mosaico(lang), puertas=puertas(lang)))
    pagina('photo.html', 'photo/', 'en/photo/', lang, 'photo',
           f"{'Fotografía de conciertos, danza y teatro' if es else 'Concert, Dance & Theatre Photography'} · {N}",
           ('Fotografía de música en vivo, danza, teatro, retrato, arte, viajes y marcas. Por ' if es else 'Live music, dance, theatre, portrait, fine art, travel and brand photography. By ') + N + ' (PERSONA), Costa Rica.')
    for i, c in enumerate(capitulos):
        sig = capitulos[(i + 1) % len(capitulos)]
        filas, actual = [], None
        for f in c['fotos']:
            g = f['grupo_' + lang] or ''
            if actual and actual['formato'] == 'par' and f['formato'] == 'par' and len(actual['fotos']) == 1 and not (g and g != actual['g']):
                actual['fotos'].append(f); continue
            actual = dict(formato=f['formato'], fotos=[f], g=g, grupo=g if (not filas or filas[-1]['g'] != g) else '',
                          vertical=f['h'] > f['w'], sizes='(max-width:700px) 50vw, 720px' if f['formato'] == 'par' else ('560px' if f['formato'] == 'detalle' else '(max-width:1440px) 100vw, 1360px'))
            filas.append(actual)
        for fl in filas:  # un "par" que quedó solo se muestra como detalle
            if fl['formato'] == 'par' and len(fl['fotos']) == 1: fl['formato'] = 'detalle'; fl['sizes'] = '560px'
        tit = c['titulo_' + lang]
        imgs = [{'@type': 'ImageObject', 'contentUrl': f"{site['url']}/{f['archivo']}-1280.webp", 'name': f"{f['pie_' + lang]}" + (f" — {f['credito']}" if f['credito'] else ''),
                 'creator': {'@id': site['url'] + '/#jpg'}, 'creditText': f'{N} / PERSONA', 'copyrightNotice': f'© {N}'} for f in c['fotos']]
        pagina('capitulo.html', f"photo/{c['slug']}/", f"en/photo/{c['slug_en']}/", lang, 'photo',
               f"{tit} · {'Fotografía' if es else 'Photography'} · {N} | PERSONA",
               f"{tit}: {c['intro_' + lang]} " + (f'Fotografía de {N} (PERSONA), Costa Rica.' if es else f'Photography by {N} (PERSONA), Costa Rica.'),
               extra=dict(c=c, rows=filas, siguiente=sig), og=c['portada'] + '-1280.webp',
               schema=[{'@type': 'ImageGallery', 'name': tit, 'description': c['intro_' + lang], 'hasPart': imgs}])
    pagina('motion.html', 'motion/', 'en/motion/', lang, 'motion',
           f"{'Cine y video: series, cortos y videoclips' if es else 'Film & Video: series, shorts and music videos'} · {N}",
           'Dirección, fotografía y edición: Abril (segunda unidad), Dele Viaje, Lorem Ipsum, Preludio, Moment y videoclips. Desde Costa Rica.' if es else
           'Direction, cinematography and editing: Abril (second unit), Dele Viaje, Lorem Ipsum, Preludio, Moment and music videos. From Costa Rica.',
           schema=[{'@type': 'CreativeWork', 'name': p['titulo'], 'dateCreated': str(p['anio']), 'contributor': {'@id': site['url'] + '/#jpg'},
                    'description': p['rol_' + lang]} for p in motion['proyectos']])
    pagina('stage.html', 'stage/', 'en/stage/', lang, 'stage',
           f"{'Dirección escénica' if es else 'Stage Direction'} · Still Standing, Lights Will Guide You · {N}",
           'Dirección escénica y artística: Still Standing (2026), Lights Will Guide You (2023–2024) y Matilda Jr. (2025).' if es else
           'Stage and artistic direction: Still Standing (2026), Lights Will Guide You (2023–2024) and Matilda Jr. (2025).',
           extra=dict(stills=stills(lang)))
    pagina('about.html', 'sobre-mi/', 'en/about/', lang, 'sobre-mi' if es else 'about',
           f"{N}, {'cineasta y fotógrafo · Sobre mí' if es else 'filmmaker & photographer · About'} | PERSONA", site['bio_corta_' + lang])
    pagina('contacto.html', 'contacto/', 'en/contact/', lang, 'contacto' if es else 'contact',
           f"{'Contacto y cotizaciones' if es else 'Contact & quotes'} · {N} | PERSONA",
           'Foto y video para conciertos, giras, teatro, danza y marcas. Escribime por WhatsApp o correo.' if es else
           'Photo and video for concerts, tours, theatre, dance and brands. Reach me on WhatsApp or email.')

for viejo, nuevo in (('music/', 'motion/'), ('en/music/', 'en/motion/')):
    os.makedirs(viejo, exist_ok=True)
    open(viejo + 'index.html', 'w').write(env.get_template('redirect.html').render(lang='es', to='../' * viejo.count('/') + nuevo))

hoy = datetime.date.today().isoformat()
open('sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ''.join(f"  <url><loc>{site['url']}/{p}</loc><lastmod>{hoy}</lastmod></url>\n" for p in paginas) + '</urlset>\n')
open('robots.txt', 'w').write(f"User-agent: *\nAllow: /\nSitemap: {site['url']}/sitemap.xml\n")
print(f'Listo: {len(paginas)} páginas.')
