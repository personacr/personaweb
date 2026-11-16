# ARQUITECTURA · persona (www.persona.cr)

Manual para quien edite este proyecto, sea una persona u otro modelo de IA.
Leé también `CLAUDE.md` (dueño, tono y decisiones de marca). Si algo de aquí choca con lo que pide Jose Pablo, manda él.

---

## 1. Qué es y cómo se publica

- Sitio estático bilingüe (español en la raíz, inglés en `/en/`). Sin librerías ni frameworks.
- Se publica con **GitHub Pages desde la rama `main`** en `https://www.persona.cr` (archivo `CNAME`).
- **Todo lo que llega a `main` queda publicado en 1–3 minutos.** No hay paso intermedio.
- Proyectos hermanos, en otros repositorios: la Bio (`personabio`, bio.persona.cr) y las galerías de clientes (`persona-galerias`, privado).

### El camino de un cambio

```
Pages CMS (o un commit)  →  contenido/*.yml en main
        ↓  GitHub Actions: .github/workflows/construir.yml
   1. herramientas/fotos.py      achica las fotos nuevas y borra los originales
   2. herramientas/construir.py  arma todas las páginas .html
   3. commit «Arma páginas desde el contenido»  →  GitHub Pages publica
```

### Ramas

| Rama | Para qué | ¿Se publica? |
|---|---|---|
| `main` | El sitio en vivo | Sí, sola |
| cualquier otra (ej. `mejoras-nov`) | Trabajo en curso | No. Corre `comprobar.yml`, que solo revisa que arme |
| `vista-previa` | Páginas ya armadas para revisar en raw.githack.com | No. **Nunca se mezcla con `main`** |

### Vista previa antes de publicar

```
git checkout -B vista-previa <rama-de-trabajo>
VISTA=1 python3 herramientas/construir.py     # enlaces con index.html, para raw.githack
git add -A && git commit -m "Vista previa" && git push -f origin vista-previa
# link: https://raw.githack.com/personacr/personaweb/<SHA>/index.html
```

`VISTA=1` además usa, si existen, los archivos de prueba de la carpeta `vista/` (un reel y un audio de muestra).
Esa carpeta solo vive en la rama `vista-previa`.

---

## 2. Estructura

```
contenido/            LO QUE SE EDITA (Pages CMS escribe aquí)
  sitio.yml           textos generales, reel, manifiesto, mosaico, servicios, reconocimientos, clientes
  motion.yml          filmografía, reels, bitácora en video
  stage.yml           obras (programas de mano)
  photo/*.yml         un archivo por capítulo de Photo
  miniaturas.yml      miniaturas automáticas de Vimeo/YouTube (no está en Pages CMS)
plantillas/           moldes HTML (Jinja2): base, macros, home, photo, capitulo, motion, stage, about, contacto
herramientas/
  construir.py        el armador
  fotos.py            procesa fotos subidas
  probar.py           prueba que el armador no se caiga con campos vacíos
  og.py               imágenes para compartir (WhatsApp/Facebook); se corre a mano
styles.css  site.js   todo el diseño y el comportamiento (un archivo cada uno)
img/                  fotos ya livianas (3 tamaños WebP por foto)
  subidas/            donde caen los originales subidos desde Pages CMS (se vacía sola)
medios/video|audio/   reel del inicio y música de Stage (se usan tal como se suben)
.pages.yml            configuración de Pages CMS
index.html, photo/, motion/, stage/, sobre-mi/, contacto/, en/…   PÁGINAS GENERADAS
```

**Nunca edites a mano un `index.html`:** el armador lo vuelve a escribir. Se cambia el contenido o la plantilla.

---

## 3. Las dos reglas técnicas que no se rompen

### 3.1 El armado nunca falla por un campo vacío

Pages CMS **borra los campos vacíos** al guardar y **borra los campos que no conoce**. Por eso:

- Todo lo que se lee de `contenido/` pasa por `caja()` en `construir.py`: un campo que falta vale `''`, nunca da error.
- Un texto en inglés vacío usa el español.
- Lo que no se puede mostrar se **descarta con un aviso** (`⚠` en el registro de Actions) y el sitio se arma igual:
  foto sin archivo, video sin código, crédito sin nombre, capítulo sin fotos, servicio sin título.
- Las plantillas usan `{% if %}` alrededor de todo lo opcional.
- Lo único que detiene el armado **a propósito** es un `.yml` con la sintaxis rota: así el sitio publicado queda como estaba.

Si agregás un campo nuevo:

1. Agregalo en `.pages.yml` con `label` y `description` en español sencillo.
2. Usalo en la plantilla dentro de un `{% if %}`, o dale un valor por defecto en `construir.py`.
3. Corré `python3 herramientas/probar.py`. Tiene que decir que todas las pruebas pasaron.

### 3.2 Todo campo del contenido está en `.pages.yml`

Si un campo existe en un `.yml` pero no en `.pages.yml`, se pierde la próxima vez que Jose Pablo guarde desde Pages CMS.

---

## 4. Pages CMS

Se usa en app.pagescms.org, sobre la rama `main`. Secciones:

| Sección | Archivo | Qué se edita |
|---|---|---|
| Photo · capítulos | `contenido/photo/*.yml` | orden, títulos, portada, fotos, grupos con nota y premio |
| Motion | `contenido/motion.yml` | filmografía (y cuál va destacada), reels, bitácora |
| Stage · programas de mano | `contenido/stage.yml` | obras: sala, funciones, créditos, música, fotos, videos |
| Textos generales | `contenido/sitio.yml` | reel del inicio, manifiesto, mosaico, servicios, sobre mí, reconocimientos, clientes |

### Cómo se guardan las imágenes

- En los `.yml` cada foto se escribe con la ruta de su versión de 640 px (`…-640.webp`) para que Pages CMS muestre la miniatura. El armador le quita el tamaño y usa los tres (`-640`, `-1280`, `-2048`).
- Una foto nueva se sube a `img/subidas/`. `fotos.py` crea los tres tamaños en la carpeta que le toca, reescribe la ruta y borra el original.
- Los sellos de premios y los logos de clientes se usan tal cual (no se achican).

### Datos que se escriben una sola vez

- **Premios:** viven en Textos generales → Reconocimientos. Motion los toma de ahí cuando el campo «Obra» coincide con el título del proyecto. No se copian a mano.
- **Número romano de cada capítulo (I, II…):** se calcula con el «Orden».
- **Mosaico del inicio:** es una lista de fotos que ya están en algún capítulo; el enlace «Capítulo →» se arma solo.

### Piezas que se activan desde Pages CMS

- **Reel del inicio** (Textos generales → Inicio · Reel): video MP4 mudo en loop, foto de portada, y código del reel completo para el botón «Ver reel». Sin video se ve la foto. Sin código, el botón abre el mismo video con sonido.
- **Manifiesto** (Textos generales): casilla «Mostrar el manifiesto en el inicio».
- **Proyecto destacado** (Motion): casilla por proyecto.
- **Foto grande** (Photo → cada foto → Tamaño): `grande` la pone a todo el ancho. Si ninguna está marcada, la primera abre el capítulo.
- **Música de una obra** (Stage): archivo MP3, o si no hay, el primer disco de Spotify de la obra.

---

## 5. Reglas visuales (sistema «Sala oscura»)

No cambiar sin permiso explícito de Jose Pablo.

1. **Las fotos se ven a su brillo real.** Nada de filtros, velos, grano ni oscurecer al 60 %. Solo se oscurece **detrás del texto** con un degradado local (`::after` / `::before` en `.hero`, `.cover`, `.room`, `.work`, `.video`).
2. **Esquinas rectas en todo:** fotos, botones, campos, reproductor. No hay `border-radius` en `styles.css`.
3. **Sin botones flotantes** que persigan el scroll ni tapen contenido.
4. **Etiquetas en mayúscula: mínimo 12 px** y poco espacio entre letras (`--lab`, `--lab-ls`). Nada de 10 px.
5. **Colores:** negro `#000`, hueso `#F4F2ED`, niebla `#7A7875` / `#A8A5A0`, azul `#4FB3E8`. El azul es «luz»: última letra de los títulos, lo activo, el foco.
6. **Tipografías:** Zodiak 300 (títulos, manifiesto) y Switzer (texto). No usar otras.
7. **Títulos de sección** en minúscula con la última letra en itálica azul (macro `L()`).
8. **Las fotos no llevan texto encima** y van en su formato original, sin recortar. Los capítulos alternan mosaico y fotos grandes; en celular va **una foto por fila**.
9. **El manifiesto aparece una sola vez** en todo el sitio (inicio).
10. **Textos directos, con datos:** qué es, dónde, cuándo, con quién. Nada poético ni adornado.
11. **Clientes** siempre al final del inicio.
12. Todo texto visible va en español e inglés.

Si cambiás tokens o piezas de `styles.css`, avisá que `persona-galerias` usa una copia (`public/assets/gallery.css`).

---

## 6. Antes de dar un cambio por terminado

- `python3 herramientas/construir.py` sin errores y sin avisos inesperados.
- `python3 herramientas/probar.py` → todas las pruebas pasan.
- Revisar en computadora y en celular (390 px): inicio, un capítulo, Motion, Stage.
- Que cada campo nuevo esté en `.pages.yml`.
- Vista previa en la rama `vista-previa` y aprobación de Jose Pablo **antes** de tocar `main`.
- Repositorio público: nunca subir contraseñas, cotizaciones, galerías privadas ni originales.
