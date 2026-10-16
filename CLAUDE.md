# CLAUDE.md — persona · Sitio web portafolio (personaweb)

Memoria del proyecto. Leelo completo antes de cambiar algo.

## Dueño
- **Jose Pablo García** (Jose SIN tilde en todo lo visible; «José Pablo García» solo como nombre alterno en el código). Cineasta, fotógrafo, director escénico y creador de contenido. **20+ años** de trayectoria. Marca **PERSONA**.
- Está aprendiendo: hablale en español sencillo (voseo costarricense), sin jerga. Antes de un cambio grande, resumí y pedí confirmación. Al terminar, 2–3 líneas de qué cambió.
- Sus fuertes: cine, fotografía, contenido para redes, artes escénicas. **No se presenta como músico** (produce bandas sonoras para sus proyectos y canta en sus shows).

## Cómo funciona (desde oct 2026)
- Publica en **GitHub Pages** desde `main` (personacr.github.io/personaweb; luego nuevo.persona.cr → persona.cr). `.nojekyll` activo.
- **Contenido** en `contenido/*.yml` (editable con Pages CMS, ver `.pages.yml`). **Moldes** en `plantillas/*.html` (Jinja2). **Armador**: `python3 herramientas/construir.py` genera todas las páginas ES (raíz) y EN (`/en/`), `sitemap.xml` y `robots.txt`. GitHub Actions (`.github/workflows/construir.yml`) lo corre solo al cambiar contenido.
- **Nunca edites a mano** los `index.html` generados: editá contenido o plantillas y volvé a correr el armador.
- **Originales nunca entran al repo** (.gitignore). Respaldo de originales: `~/Documents/RESPALDO_CONTENIDO_SITIO_PERSONA/SITIOWEB_PERSONA_GITHUB/`.

## Sistema de diseño «Sala oscura» (no cambiar sin permiso)
- Negro #000 · hueso #F4F2ED · niebla #7A7875 / #A8A5A0 · azul #4FB3E8 (solo como «luz»: última letra, activo, foco).
- **Tipografías: Zodiak 300 (títulos) + Switzer (texto)**, de Fontshare. Elegidas para no parecerse a sitios genéricos: NO usar Fraunces, Plus Jakarta, Inter, Instrument Serif, Playfair, Space Grotesk, DM Sans, Satoshi.
- **Wordmark:** `person<span class="l">a</span>` — «a» latina itálica azul. **Ya no se usa la α griega** (se parecía a Sony α).
- Títulos en minúsculas con la última letra itálica azul. Fotos sin borde, esquinas rectas, formato original. Portadas panorámicas 2,39:1.

## Fotos
- Cada foto en 3 tamaños WebP: `nombre-640.webp`, `-1280.webp`, `-2048.webp`. En los .yml se escribe la ruta SIN sufijo.
- Nombres: `artista-capitulo-año-orden`. Formatos de fila: `completa`, `par`, `detalle`.
- Pendiente: originales de Stage (hoy vienen de la Bio, cuadradas), video `img/home/hero.mp4`.

## Integraciones
- GA4 `G-TY6Y414RXR` en todas las páginas · Formspree `mojoqqqn` · WhatsApp 50688433789 · IG @persona.cr · Vimeo personacr · josepablo@persona.cr.

## Reglas de oro
- Repo público: nada de contraseñas, cotizaciones, galerías privadas ni originales.
- Si un cambio toca contenido compartido con la Bio (proyectos, logo, textos), preguntá si va también en la Bio.
- Commits en español y claros.
