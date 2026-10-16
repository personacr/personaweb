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
music = leer('contenido/music.yml')
thumbs = {str(k): v for k, v in (leer('contenido/miniaturas.yml') or {}).items()}
capitulos = sorted((leer(p) for p in glob.glob('contenido/photo/*.yml')), key=lambda c: c['orden'])
for c in capitulos:
    for i, f in enumerate(c['fotos']):
        f['i'] = i

# ── textos de interfaz ──────────────────────────────────────────────
T = {
 'es': dict(
  nav=[('motion','Motion'),('photo','Photo'),('stage','Stage'),('music','Music'),('sobre-mi','Sobre mí'),('contacto','Contacto')],
  contact_slug='contacto', menu='Menú', write='Escribime', photo='Foto ampliada', close='Cerrar', prev='Anterior', next='Siguiente',
  see_reel='Ver trabajo en video', explore='Explorar', selected='trabajo', selected_sub='Selección', doors='disciplinas',
  credits='créditos', credits_sub='Con quienes he trabajado', offer='servicios', quote='Cotizar', form='Formulario',
  photos='fotos', chapter='Capítulo', next_chapter='Siguiente capítulo', quote_project='Cotizar tu proyecto',
  photo_eyebrow='Fotografía · seis capítulos', photo_lead='Música en vivo, danza, teatro, retrato, arte y viaje. Cada capítulo se lee como una historia.',
  motion_eyebrow='Cine & video', motion_lead='Dirección, fotografía y edición: series, cortos, videoclips y reels.',
  filmography='Filmografía', see='Ver', year='Año', type='Formato', role='Rol', about_it='Sobre la obra', play='Reproducir',
  reels_lead='Reels verticales para festivales, escuelas y marcas.', fieldnotes='Bitácora', fieldnotes_lead='Lo que filmo cuando nadie me contrata.',
  stage_eyebrow='Artes escénicas', stage_lead='Dirección escénica y artística: espectáculos inmersivos, musicales y teatro.',
  music_eyebrow='Bandas sonoras', music_lead='Música original para series y espectáculos.',
  about_title='sobre mí', contact_title='contacto', contact_lead='Contame de tu proyecto: gira, concierto, obra, película o marca.',
  email='Correo', f_name='Nombre', f_type='Tipo de proyecto', f_msg='Mensaje', f_send='Enviar mensaje',
  f_types=['Música en vivo / gira','Cine o video','Teatro o danza','Marca o evento','Otro'],
  doors_list=[('motion','motion','img/motion/banner/banner.jpg','Cine & video'),('photo','photo','img/photo/en-vivo/jacob-collier-en-vivo-2025-04-1280.webp','Fotografía'),
              ('stage','stage','img/stage/still-standing/still-standing-2026-02-1280.webp','Artes escénicas'),('music','music','img/photo/en-vivo/jacob-collier-en-vivo-2025-13-1280.webp','Bandas sonoras')]),
 'en': dict(
  nav=[('motion','Motion'),('photo','Photo'),('stage','Stage'),('music','Music'),('about','About'),('contact','Contact')],
  contact_slug='contact', menu='Menu', write='Get in touch', photo='Enlarged photo', close='Close', prev='Previous', next='Next',
  see_reel='Watch film work', explore='Explore', selected='work', selected_sub='Selected', doors='disciplines',
  credits='credits', credits_sub='People I have worked with', offer='services', quote='Get a quote', form='Contact form',
  photos='photos', chapter='Chapter', next_chapter='Next chapter', quote_project='Quote your project',
  photo_eyebrow='Photography · six chapters', photo_lead='Live music, dance, theatre, portrait, fine art and travel. Each chapter reads like a story.',
  motion_eyebrow='Film & video', motion_lead='Direction, cinematography and editing: series, shorts, music videos and reels.',
  filmography='Filmography', see='See', year='Year', type='Format', role='Role', about_it='About', play='Play',
  reels_lead='Vertical reels for festivals, schools and brands.', fieldnotes='Field notes', fieldnotes_lead='What I film when nobody is hiring.',
  stage_eyebrow='Performing arts', stage_lead='Stage and artistic direction: immersive shows, musicals and theatre.',
  music_eyebrow='Soundtracks', music_lead='Original music for series and shows.',
  about_title='about', contact_title='contact', contact_lead='Tell me about your project: tour, concert, play, film or brand.',
  email='Email', f_name='Name', f_type='Project type', f_msg='Message', f_send='Send message',
  f_types=['Live music / tour','Film or video','Theatre or dance','Brand or event','Other'],
  doors_list=[('motion','motion','img/motion/banner/banner.jpg','Film & video'),('photo','photo','img/photo/en-vivo/jacob-collier-en-vivo-2025-04-1280.webp','Photography'),
              ('stage','stage','img/stage/still-standing/still-standing-2026-02-1280.webp','Performing arts'),('music','music','img/photo/en-vivo/jacob-collier-en-vivo-2025-13-1280.webp','Soundtracks')]),
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
          'sameAs': [site['instagram'], site['vimeo'], site['linkedin'], site['bio']], 'brand': {'@id': site['url'] + '/#persona'}}
ORG = {'@type': 'ProfessionalService', '@id': site['url'] + '/#persona', 'name': 'PERSONA', 'founder': {'@id': site['url'] + '/#jpg'},
       'url': site['url'] + '/', 'areaServed': ['Costa Rica', 'Centroamérica'], 'email': site['email']}

paginas = []
def pagina(plantilla, ruta_es, ruta_en, lang, seccion, titulo, desc, extra=None, schema=None, og=None):
    ruta = ruta_es if lang == 'es' else ruta_en
    prof = ruta.count('/')
    ctx = dict(site=site, t=T[lang], lang=lang, R='../' * prof, P='' if lang == 'es' else 'en/', thumbs=thumbs, year=datetime.date.today().year,
               m=motion, s=stage, mu=music, capitulos=capitulos,
               page=dict(title=titulo, description=desc, path=ruta, path_es=ruta_es, path_en=ruta_en, section=seccion, og=og,
                         schema={'@context': 'https://schema.org', '@graph': [PERSON, ORG] + (schema or [])}))
    ctx.update(extra or {})
    os.makedirs(ruta or '.', exist_ok=True)
    open(os.path.join(ruta, 'index.html'), 'w', encoding='utf-8').write(env.get_template(plantilla).render(**ctx))
    paginas.append(ruta)

N = site['nombre']
for lang in ('es', 'en'):
    es = lang == 'es'
    pagina('home.html', '', 'en/', lang, '',
           f"{N} · PERSONA — " + ('Cineasta y fotógrafo, Costa Rica' if es else 'Filmmaker & Photographer'),
           'Narrador visual costarricense. Fotografía de conciertos, danza y teatro; videoclips, cortos y dirección escénica. Disponible para giras y festivales.' if es else
           'Costa Rican visual storyteller. Concert, dance and theatre photography; music videos, short films and stage direction. Available for tours and festivals.')
    pagina('photo.html', 'photo/', 'en/photo/', lang, 'photo',
           f"{'Fotografía de conciertos, danza y teatro' if es else 'Concert, Dance & Theatre Photography'} · {N}",
           ('Seis capítulos de fotografía: música en vivo, danza, teatro, retrato, arte y viaje. Por ' if es else 'Six photography chapters: live music, dance, theatre, portrait, fine art and travel. By ') + N + ' (PERSONA), Costa Rica.')
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
               f"{tit} · {'Fotografía' if es else 'Photography'} · {N} | PERSONA", c['intro_' + lang],
               extra=dict(c=c, rows=filas, siguiente=sig), og=c['portada'] + '-1280.webp',
               schema=[{'@type': 'ImageGallery', 'name': tit, 'description': c['intro_' + lang], 'hasPart': imgs}])
    pagina('motion.html', 'motion/', 'en/motion/', lang, 'motion',
           f"{'Cine y video: series, cortos y videoclips' if es else 'Film & Video: series, shorts and music videos'} · {N}",
           'Dirección, fotografía y edición: ABRIL (segunda unidad), Dele Viaje, Lorem Ipsum, Preludio, Moment y videoclips. Desde Costa Rica.' if es else
           'Direction, cinematography and editing: ABRIL (second unit), Dele Viaje, Lorem Ipsum, Preludio, Moment and music videos. From Costa Rica.',
           schema=[{'@type': 'CreativeWork', 'name': p['titulo'], 'dateCreated': str(p['anio']), 'contributor': {'@id': site['url'] + '/#jpg'},
                    'description': p['rol_' + lang]} for p in motion['proyectos']])
    pagina('stage.html', 'stage/', 'en/stage/', lang, 'stage',
           f"{'Dirección escénica' if es else 'Stage Direction'} · Still Standing, Lights Will Guide You · {N}",
           'Dirección escénica y artística: Still Standing (2026), Lights Will Guide You (2023–2024) y Matilda Jr. (2025).' if es else
           'Stage and artistic direction: Still Standing (2026), Lights Will Guide You (2023–2024) and Matilda Jr. (2025).')
    pagina('music.html', 'music/', 'en/music/', lang, 'music',
           f"{'Bandas sonoras' if es else 'Soundtracks'} · {N} | PERSONA",
           'Música original: Lights Will Guide You y las bandas sonoras de Dele Viaje.' if es else 'Original music: Lights Will Guide You and the Dele Viaje soundtracks.')
    pagina('about.html', 'sobre-mi/', 'en/about/', lang, 'sobre-mi' if es else 'about',
           f"{N}, {'narrador visual · Sobre mí' if es else 'visual storyteller · About'} | PERSONA", site['bio_corta_' + lang])
    pagina('contacto.html', 'contacto/', 'en/contact/', lang, 'contacto' if es else 'contact',
           f"{'Contacto y cotizaciones' if es else 'Contact & quotes'} · {N} | PERSONA",
           'Foto y video para conciertos, giras, teatro, danza y marcas. Escribime por WhatsApp o correo.' if es else
           'Photo and video for concerts, tours, theatre, dance and brands. Reach me on WhatsApp or email.')

hoy = datetime.date.today().isoformat()
open('sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ''.join(f"  <url><loc>{site['url']}/{p}</loc><lastmod>{hoy}</lastmod></url>\n" for p in paginas) + '</urlset>\n')
open('robots.txt', 'w').write(f"User-agent: *\nAllow: /\nSitemap: {site['url']}/sitemap.xml\n")
print(f'Listo: {len(paginas)} páginas.')
