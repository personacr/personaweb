# CLAUDE.md — personα · Sitio web portafolio (personaweb)

Este archivo es la memoria del proyecto. Leelo completo antes de hacer cualquier cambio.

## Quién es el dueño

- **José Pablo García** — cineasta, fotógrafo y director escénico costarricense, 20+ años de trayectoria. Marca: **PERSONA** (se escribe `personα`).
- Está aprendiendo a usar GitHub y Claude Code. **Explicale todo en español sencillo (voseo costarricense), sin jerga técnica.**
- Antes de un cambio grande, resumí qué vas a hacer y pedí confirmación. Al terminar, decí en 2–3 líneas qué cambió y cómo verlo en vivo.

## Qué es este proyecto

- Sitio portafolio completo, en **HTML + CSS + JS puro**. Decisión tomada: **no WordPress, no Squarespace, no frameworks, no librerías externas.**
- Publicación: **GitHub Pages** (rama `main`, carpeta raíz). Dominio de trabajo: **nuevo.persona.cr**. Al final reemplazará a persona.cr.
- Debe sentirse **de la misma familia que la Bio** (bio.persona.cr), pero a escala de portafolio. Repo de referencia de la Bio: `personacr/persona-bio`.

## Estructura

```
index.html      → Home (HECHA: hero con video en loop + 4 "puertas" con banners)
motion.html     → por construir
photo.html      → por construir
stage.html      → por construir
music.html      → por construir
about.html      → por construir
contacto.html   → por construir
styles.css      → sistema de diseño compartido
site.js         → idioma, menú, reveal, lightbox, contenido dinámico
contenido/      → textos.txt y galerias.txt (José Pablo los edita)
img/            → fotos y videos organizados por sección
```

Orden de construcción acordado: **Motion → Photo → Stage → Music → About → Contacto**. Construí una página por vez y esperá aprobación antes de seguir.

## Sistema de diseño (NO cambiar sin permiso explícito)

Todo vive en `styles.css`. Usá siempre las variables, nunca colores sueltos.

| Token | Valor | Uso |
|---|---|---|
| `--black` | `#000000` | Fondo |
| `--bone` | `#F4F2ED` | Texto principal |
| `--fog` / `--mist` | `#7A7875` / `#A8A5A0` | Texto secundario |
| `--accent` | `#4FB3E8` | Acento azul |
| `--accent-d` | `#2E8FC0` | Hover |

- **Tipografía:** Fraunces (serif: wordmark, títulos, manifiesto) + Plus Jakarta Sans (texto, navegación, etiquetas).
- **Wordmark:** `person<span class="alpha">α</span>` — la α en itálica azul.
- **Títulos de sección/página:** Fraunces peso 200, minúsculas, última letra en itálica azul: `motio<span class="last">n</span>`.
- **Componentes disponibles en styles.css:** `.nav`, `.hero`, `.door`, `.page-head` (banner de página interna), `.section` + `.section-label`, `.gallery` (`g2`, `g3`, `.gitem`, `.gitem.wide`), `.vid-grid` / `.vid-wrap`, `.lightbox`, `.footer`, `.reveal`.
- Cada página interna reutiliza la misma navegación y footer de `index.html` (copialos idénticos; marcá el link activo con `class="active"`).

## Contenido editable (lo que toca José Pablo)

- **`contenido/textos.txt`** — formato `clave = valor`. Los elementos HTML con `data-text="clave"` se llenan solos desde aquí; el texto escrito en el HTML queda como respaldo.
- **`contenido/galerias.txt`** — formato `nombre = ruta1, ruta2, ruta3` (una línea). Un contenedor `<div class="gallery g3" data-auto-gallery="nombre">` se llena solo y queda conectado al lightbox.
- Cuando agregues textos o galerías nuevas, **agregalas a estos archivos** (con comentarios `#` claros) para que José Pablo pueda editarlas después sin tocar HTML.
- **Bilingüe siempre:** todo texto visible lleva `<span data-es>…</span><span data-en>…</span>`. Si falta el inglés, traducilo y avisale.

## Imágenes

José Pablo sube originales a **`nuevas/`**. Vos:

1. Procesalas con Python + Pillow:
   - **Fotos de galería:** máximo 2500 px de lado largo, JPEG calidad 82–85 (el grid las recorta con CSS; el lightbox las muestra completas).
   - **Banners:** 1400×350 px (proporción 16:4), JPEG calidad 87, guardados como `img/<seccion>/banner/banner.jpg`.
   - **Video del hero:** `img/home/hero.mp4` — H.264, 1920×1080, sin audio, 15–30 s, máx. 25 MB. Poster: `img/home/hero-poster.jpg`.
2. Nombres en minúsculas, sin espacios ni tildes, numerados: `01.jpg`, `02.jpg`…
3. Movelas a su carpeta en `img/`, actualizá `contenido/galerias.txt` y **borrá los originales de `nuevas/`**.
4. Ojo con el tamaño del repo: GitHub recomienda no pasar de ~1 GB en total. Avisá si una tanda de fotos es muy pesada.

## Contenido de marca (referencia)

- **Manifiesto:** "La magia de lo cotidiano y el poder del subconsciente para crear." / "The magic of everyday life and the power of the subconscious to create."
- **Rol:** Cineasta, fotógrafo & narrador visual / Filmmaker, photographer & visual storyteller.
- **Proyectos clave:** Dele Viaje (serie TV 2012 y 2017, director y guionista), A Ojos Cerrados (productor, 2010, dir. Hernán Jiménez), Lights Will Guide You (show inmersivo inspirado en Coldplay, co-director y vocalista), Matilda Jr. (dirección artística, 2025), Still Standing (stage, nuevo).
- Usá como fuente de verdad los textos de la Bio (`persona-bio/index.html`). Si falta información para una página (bio larga, créditos, años), **preguntá; no inventes datos.**

## Integraciones

- **Formspree:** `https://formspree.io/f/mojoqqqn`
- **Google Analytics 4:** `G-TY6Y414RXR` (agregar en todas las páginas, con los mismos eventos que la Bio).
- **WhatsApp:** `https://wa.me/50688433789` · **Instagram:** @persona.cr · **Vimeo:** vimeo.com/personacr · **Email:** josepablo@persona.cr

## Reglas de oro

- ❌ Este repo es público: nunca subir contraseñas, datos de clientes, cotizaciones (`/oferta/` vive solo en Hostinger) ni galerías privadas de clientes (van en un sistema aparte).
- ❌ No cambiar paleta, tipografías ni estructura sin permiso.
- ✅ Responsive hasta móvil, foco visible con teclado, respetar `prefers-reduced-motion`.
- ✅ Rutas relativas (`img/...`, `styles.css`) para que funcione en GitHub Pages y en el dominio final.
- ✅ Antes de terminar: revisá HTML válido, toggle ES/EN, menú móvil, lightbox y que los links de la navegación funcionen.
- ✅ Mensajes de commit en español y claros: `Construye página Motion`.
