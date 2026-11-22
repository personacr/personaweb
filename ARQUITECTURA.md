# ARQUITECTURA · persona (www.persona.cr)

Manual técnico del sitio. Describe solo lo que existe hoy.
Las decisiones de marca, el tono y quién es el dueño están en `CLAUDE.md`. Si algo choca con lo que pide Jose Pablo, manda él.

---

## 1. Qué es y cómo se publica

- Sitio estático bilingüe: español en la raíz y en inglés en `/en/`. Sin frameworks ni librerías.
- Se publica con **GitHub Pages desde la rama `main`** en `https://www.persona.cr` (archivo `CNAME`, `.nojekyll`).
- **Todo lo que llega a `main` queda publicado en 1–3 minutos.** No hay paso intermedio.
- Proyectos hermanos en otros repositorios: la Bio (`personabio`, bio.persona.cr, publicada por Hostinger desde su `main`) y las galerías de clientes (`persona-galerias`, privado).

### El camino de un cambio

```
Pages CMS (o un commit)  →  contenido/*.yml en main
      ↓  GitHub Actions: .github/workflows/construir.yml
   1. herramientas/fotos.py      convierte las fotos recién subidas
   2. herramientas/construir.py  arma todas las páginas .html
   3. commit «Arma páginas desde el contenido»  →  GitHub Pages publica
```

La acción solo corre en `main` y cuando cambia algo en `contenido/`, `plantillas/`, `herramientas/`, `img/subidas/`, `styles.css` o `site.js`.

### Vista previa antes de publicar

Nada se sube a `main` sin que Jose Pablo apruebe la vista previa.

```
git checkout -B vista-previa <rama-de-trabajo>
VISTA=1 python3 herramientas/construir.py     # enlaces con index.html para raw.githack
git add -A && git commit -m "Vista previa" && git push -f origin vista-previa
# link: https://raw.githack.com/personacr/personaweb/<SHA>/index.html
```

La rama `vista-previa` **nunca se mezcla con `main`**. Los cambios se trabajan en otra rama (ej. `ajustes-nov`) y esa es la que pasa a `main` al aprobarse.

---

## 2. Estructura

```
contenido/            LO QUE SE EDITA (Pages CMS escribe aquí)
  sitio.yml           textos generales, mosaico del inicio, servicios, sobre mí, reconocimientos, clientes
  motion.yml          filmografía, reels y bitácora en video
  stage.yml           obras escénicas
  photo/*.yml         un archivo por capítulo de Photo
  miniaturas.yml      miniaturas de Vimeo/YouTube (no se edita en Pages CMS)
plantillas/           moldes HTML (Jinja2): base, macros, home, photo, capitulo, motion, stage, about, contacto
herramientas/
  construir.py        el armador
  fotos.py            convierte fotos subidas
  og.py               imágenes para compartir en WhatsApp/Facebook (se corre a mano)
styles.css  site.js   todo el diseño y el comportamiento
img/                  fotos ya livianas (3 tamaños WebP por foto)
  subidas/            donde caen los originales subidos desde Pages CMS
.pages.yml            configuración de Pages CMS
index.html, photo/, motion/, stage/, sobre-mi/, contacto/, en/   PÁGINAS GENERADAS
```

**Nunca edites a mano un `index.html` generado:** el armador lo vuelve a escribir. Se cambia el contenido o la plantilla.

---

## 3. Fotos

- Cada foto existe en tres tamaños WebP: `nombre-640.webp`, `-1280.webp` y `-2048.webp`.
- En los `.yml` se escribe la ruta de **640** (`…-640.webp`) para que Pages CMS muestre la miniatura. El armador le quita el tamaño y usa los tres.
- Una foto nueva (`.jpg`, `.png`…) subida desde Pages CMS la procesa `fotos.py`: crea los tres tamaños, cambia la ruta en el `.yml` y borra el original.
- **Los originales nunca se guardan en el repositorio** (es público).
- **Mosaico del inicio** (`mosaico` en sitio.yml): se escribe como `capítulo:número` (ej. `en-vivo:5` = quinta foto de En vivo).
  **Ojo:** si se agregan, quitan o reordenan fotos de un capítulo, hay que revisar estos números.

---

## 4. Pages CMS

Se usa en app.pagescms.org sobre la rama `main`.

| Sección | Archivo | Qué se edita |
|---|---|---|
| Photo · capítulos | `contenido/photo/*.yml` | orden, títulos, portada, fotos, premios por grupo, notas por grupo |
| Motion | `contenido/motion.yml` | filmografía, reels, bitácora |
| Stage | `contenido/stage.yml` | obras: rol, sinopsis, ficha técnica, fotos, videos, enlaces, banda sonora |
| Textos generales | `contenido/sitio.yml` | frase, mosaico, servicios, bio, disciplinas, reconocimientos, clientes, contacto |

### Dos reglas que no se rompen

1. **Todo campo del contenido tiene que estar en `.pages.yml`.** Pages CMS borra al guardar los campos que no conoce.
2. **Un campo vacío nunca debe detener el armado.** Pages CMS también borra los campos vacíos al guardar. Por eso `construir.py` rellena con valores seguros:
   - fotos sin grupo, descripción o crédito;
   - proyectos de Motion y Stage sin año, rol, sinopsis, videos o enlaces;
   - fichas técnicas incompletas (una línea de crédito sin nombre no se muestra);
   - notas de grupo sin texto en inglés.

   Las plantillas envuelven en `{% if %}` todo lo opcional.

Si agregás un campo: ponelo en `.pages.yml` con `label` (y `description` si hace falta) en español sencillo, dale un valor por defecto en `construir.py` o envolvelo en `{% if %}`, y probá el armado con ese campo borrado.

### Datos que se escriben una sola vez

- **Reconocimientos** (Textos generales): se ven en Sobre mí. Si su campo «Obra» es igual al título de un proyecto de Motion (ej. `Dele Viaje`), también aparecen en la ficha de ese proyecto.
- **Notas por grupo** (en cada capítulo, campo `grupos`): una línea que sale debajo del nombre de un grupo de fotos. Se busca por el nombre del grupo en español. Hoy se usa en Marcas para Hyatt Place Cariari Convention Center (obra comisionada) y Grupo del Este.
- **Premios por grupo** (campo `premios` del capítulo): el sello y el texto junto al nombre de un grupo. Hoy: Parallel Perceptions en Arte (nominación FAPA).

---

## 5. Qué hay en cada sección (estado actual)

- **Inicio:** foto principal, mosaico de fotos, tres bandas (Motion, Photo, Stage), servicios, cierre con contacto y clientes al final.
- **Photo:** capítulos en este orden: En vivo, Movimiento, Teatro, Retrato, Arte, Bitácora y Marcas. En vivo va primero a propósito.
  Cada capítulo es un mosaico parejo (sin foto grande de apertura). Al tocar una foto se abre la galería ampliada.
  Marcas incluye Hyatt Place Cariari Convention Center (obra comisionada para el hotel) y Grupo del Este.
- **Motion:** cuadrícula de proyectos. Al tocar uno se abre su ficha («sala de proyección») con videos, datos, sinopsis, reconocimientos y banda sonora. En Dele Viaje el tráiler de la temporada 2 va primero. Debajo van Reels y Bitácora.
- **Stage:** tres tarjetas (Still Standing, Lights Will Guide You, Matilda Jr.). Al tocar una se abre su ficha con fotos, videos, **ficha técnica** (tipo de montaje, sala, funciones, créditos, rol), sinopsis y enlaces.
- **Sobre mí:** retrato, bio, líneas por disciplina, reconocimientos, proyectos y clientes.

---

## 6. Reglas visuales (sistema «Sala oscura»)

No cambiar sin permiso de Jose Pablo.

1. **Colores:**
   - negro `#000`;
   - hueso `#F4F2ED`;
   - niebla `#7A7875` / `#A8A5A0`;
   - azul `#4FB3E8`, que funciona como «luz»: última letra de los títulos, lo activo y el foco.
2. **Tipografías:** Zodiak 300 (títulos) y Switzer (texto), de Fontshare.
3. **Wordmark:** `person` + «a» latina itálica azul. No se usa la α griega.
4. **Esquinas rectas** en fotos, botones, fichas y barra de capítulos.
5. **Sin botones flotantes** que sigan el scroll.
6. **Selector de idioma:** dos cuadritos (ES / EN). El activo va relleno en hueso con letra negra; el otro, solo con borde.
7. **Fotos:** sin texto encima, sin bordes, en su formato original y con 3–4 px entre ellas.
8. **Títulos de sección** en minúscula, con la última letra en itálica azul (macro `L()`).
9. **Clientes** siempre al final del inicio.
10. **Textos:** directos, con datos, nada poético. Todo texto visible en español e inglés.

Si cambiás piezas de `styles.css`, avisá: `persona-galerias` usa una copia del sistema.

---

## 7. Antes de dar un cambio por terminado

- `python3 herramientas/construir.py` corre sin errores.
- Probar el armado con los campos nuevos borrados.
- Revisar en computadora y en celular.
- Cada campo nuevo está en `.pages.yml`.
- Si toca algo compartido con la Bio (proyectos, textos, logo), preguntar si va también allá.
- Vista previa en `vista-previa` y aprobación de Jose Pablo **antes** de tocar `main`.
- Repositorio público: nunca subir contraseñas, cotizaciones, galerías privadas ni originales.
