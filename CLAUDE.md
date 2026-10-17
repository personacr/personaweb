# CLAUDE.md — persona · Sitio web portafolio (personaweb)

Memoria del proyecto. Leelo completo antes de cambiar algo.

## Dueño
- **Jose Pablo García** (Jose SIN tilde en todo lo visible; «José Pablo García» solo como nombre alterno en el código). Cineasta, fotógrafo, director escénico y creador de contenido. **20+ años** de trayectoria. Marca **PERSONA**.
- Está aprendiendo: hablale en español sencillo (voseo costarricense), sin jerga. Antes de un cambio grande, resumí y pedí confirmación. Al terminar, 2–3 líneas de qué cambió.
- Sus fuertes: cine, fotografía, contenido para redes, artes escénicas. **No se presenta como músico** (produce bandas sonoras para sus proyectos y canta en sus shows).

## Cómo funciona (desde oct 2026)
- Publica en **GitHub Pages** desde `main` en **https://www.persona.cr** (archivo `CNAME`; DNS en Dominios.cr/NIC: 4 registros A a GitHub y CNAME www → personacr.github.io). `.nojekyll` activo.
- **Contenido** en `contenido/*.yml` (editable con Pages CMS, ver `.pages.yml`). **Moldes** en `plantillas/*.html` (Jinja2). **Armador**: `python3 herramientas/construir.py` genera todas las páginas ES (raíz) y EN (`/en/`), `sitemap.xml` y `robots.txt`. GitHub Actions (`.github/workflows/construir.yml`) lo corre solo al cambiar contenido.
- **Nunca edites a mano** los `index.html` generados: editá contenido o plantillas y volvé a correr el armador.
- **Originales nunca entran al repo** (.gitignore). Respaldo de originales: `~/Documents/RESPALDO_CONTENIDO_SITIO_PERSONA/SITIOWEB_PERSONA_GITHUB/`.

## Sistema de diseño «Sala oscura» (no cambiar sin permiso)
- Negro #000 · hueso #F4F2ED · niebla #7A7875 / #A8A5A0 · azul #4FB3E8 (solo como «luz»: última letra, activo, foco).
- **Tipografías: Zodiak 300 (títulos) + Switzer (texto)**, de Fontshare. Elegidas para no parecerse a sitios genéricos: NO usar Fraunces, Plus Jakarta, Inter, Instrument Serif, Playfair, Space Grotesk, DM Sans, Satoshi.
- **Wordmark:** `person<span class="l">a</span>` — «a» latina itálica azul. **Ya no se usa la α griega** (se parecía a Sony α).
- Espacio entre fotos mínimo (`--gap` 3–4 px) en todo el sitio. Sobre la frase principal va «Narrador visual» (campo `rol_es`).
- Títulos en minúsculas con la última letra itálica azul. Fotos sin borde, esquinas rectas, formato original. Portadas panorámicas 2,39:1.

## Tono de los textos
- Directo y sencillo. **Nada pretencioso ni «poético»** (José Pablo lo pidió explícitamente). Describir qué es, no adornarlo.
- **Las fotos no llevan textos encima** (ni al pasar el mouse ni en la galería ampliada). `pie_es`/`pie_en` existen solo como descripción para Google y lectores de pantalla: describí lo que se ve, sin notas internas.

## Portada (inicio), en este orden
1. Video/foto principal · 2. Mosaico de fotos sin título (`mosaico` en sitio.yml) · 3. Tres «salas»: bandas panorámicas numeradas con ícono (▭ ◎ ⌒, los de la Bio), sin cantidades · 4. Servicios (lista con foto) · 5. Frase de cierre + contacto · 6. **Clientes, siempre lo último** (logos sueltos, sin líneas de tabla; se llama «clientes», no «créditos»).

## Movimiento y navegación (oct 2026)
- Entre páginas: corte a negro (view transition de la raíz). **No usar `view-transition-name` en fotos** (causaba el salto de la portada).
- Portadas de capítulos, Photo, Motion y Stage: franjas negras que se abren + acercamiento lento (`.cover` + `.bars`), igual que el inicio.
- Menú: el vidrio va en `.nav::before` (si se pone `backdrop-filter` en `.nav`, el menú del celular queda encerrado). Se esconde al bajar.
- Inicio: las fotos del mosaico abren la galería ampliada con enlace «Capítulo →» (no navegan).
- Capítulos: barra de capítulos fija al bajar; ya no hay «Siguiente capítulo».
- «Escribime» lleva `?tipo=N` según la página y el formulario llega con ese tipo elegido (`TIPO` en construir.py).
- Logos de clientes: se recortan sin bordes vacíos y el armador calcula el alto por peso visual (`alto`).
- Premios: `premios` en el .yml del capítulo (sello junto al nombre del grupo) y `reconocimientos` en sitio.yml (Sobre mí + dato `award` para Google).

## Fotos
- Cada foto en 3 tamaños WebP: `nombre-640.webp`, `-1280.webp`, `-2048.webp`. En los .yml se escribe la ruta SIN sufijo.
- Nombres: `artista-capitulo-año-orden`. El mosaico arma filas parejas solo (site.js · `justify`); el alto de fila se cambia con `--row` en styles.css.
- **Reels de Instagram:** no se incrusta el reproductor de Instagram. Se usa una portada propia `img/motion/ig/<código>.webp` (540 px de ancho) y el botón abre el reel en Instagram.
- Pendiente: originales de Stage (hoy vienen de la Bio, cuadradas), video `img/home/hero.mp4` (si existe, el inicio lo usa solo; si no, muestra la foto `img/home/hero-*.webp`).
- Vista previa antes de publicar: `VISTA=1 python3 herramientas/construir.py` arma enlaces con `index.html` para que funcionen en raw.githack.com; subir a la rama `vista-previa`, nunca a `main`.

## Integraciones
- GA4 `G-TY6Y414RXR` en todas las páginas · Formspree `mojoqqqn` · WhatsApp 50688433789 · IG @persona.cr · Vimeo personacr · josepablo@persona.cr.

## Reglas de oro
- Repo público: nada de contraseñas, cotizaciones, galerías privadas ni originales.
- Si un cambio toca contenido compartido con la Bio (proyectos, logo, textos), preguntá si va también en la Bio.
- Commits en español y claros.

## Vista al compartir (WhatsApp, Facebook)
- Cada página tiene su imagen 1200×630 en `img/og/<página>-v2.jpg` (foto + wordmark + nombre). Se generan con `python3 herramientas/og.py CARPETA_FUENTES [ruta-a-personabio]`.
- WhatsApp guarda la imagen vieja: si cambiás las imágenes, subí la versión (`V` en og.py y `OG` en construir.py) para que cambie el nombre del archivo. Facebook se refresca en developers.facebook.com/tools/debug.
