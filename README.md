# personα — Sitio web oficial

Sitio web de **Jose Pablo García** · Cineasta, fotógrafo y narrador visual · Costa Rica

🌐 **En vivo:** [nuevo.persona.cr](https://nuevo.persona.cr)

---

## 📂 Cómo está organizado

```
personaweb/
├── index.html          ← Home (NO TOCAR)
├── motion.html         ← Página Motion (NO TOCAR)
├── photo.html          ← Página Photo (NO TOCAR)
├── stage.html          ← Página Stage (NO TOCAR)
├── music.html          ← Página Music (NO TOCAR)
├── about.html          ← Página About (NO TOCAR)
├── contacto.html       ← Página Contacto (NO TOCAR)
├── styles.css          ← Estilos (NO TOCAR)
├── site.js             ← JavaScript (NO TOCAR)
│
├── contenido/          ← ✏️ ACÁ EDITÁS TEXTOS
│   ├── textos.txt      ← textos del sitio
│   └── galerias.txt    ← qué fotos aparecen y en qué orden
│
└── img/                ← 📷 ACÁ SUBÍS FOTOS
    ├── home/           ← video del hero (hero.mp4 + hero-poster.jpg)
    ├── motion/banner/  ← banner de Motion (banner.jpg)
    ├── photo/
    │   ├── banner/         ← banner de Photo (banner.jpg)
    │   ├── espectaculos/   ← fotos de conciertos y teatro
    │   ├── personas/       ← retratos y artistas
    │   └── conceptual/     ← serie Parallel Perceptions
    ├── stage/
    │   ├── banner/     ← banner de Stage (banner.jpg)
    │   ├── lwgy/       ← fotos de Lights Will Guide You
    │   └── matilda/    ← fotos de Matilda Jr.
    └── music/banner/   ← banner de Music (banner.jpg)
```

---

## ✏️ Cómo cambiar un TEXTO

1. Abrí la carpeta `contenido/` → click en `textos.txt`
2. Click en el ícono del **lápiz** (arriba a la derecha)
3. Editá lo que está **después del signo =**
4. Abajo, click en **"Commit changes"** → confirmá
5. En ~60 segundos el cambio está en vivo

## 📷 Cómo agregar una FOTO nueva

1. Andá a la carpeta correspondiente (ej. `img/photo/espectaculos/`)
2. Click **"Add file"** → **"Upload files"**
3. Arrastrá la foto
4. Click **"Commit changes"**
5. Abrí `contenido/galerias.txt` y agregá el nombre del archivo a la lista de esa galería
6. Listo — en ~60 segundos aparece en el sitio

## 🎬 Cómo cambiar el VIDEO del hero

1. Prepará el video: H.264, 1920×1080, **sin audio**, 15–30 segundos, máximo 25MB
2. Nombralo exactamente `hero.mp4`
3. Subilo a `img/home/` (reemplaza el anterior)
4. Opcionalmente subí también `hero-poster.jpg` (la imagen que se ve mientras carga)

---

## ⚠️ Reglas de oro

- **Nunca edités** los archivos `.html`, `.css` o `.js` — si algo necesita cambiar ahí, pedíselo a Claude
- **Los nombres de archivo** de fotos: usá minúsculas, sin espacios, sin tildes (`01.jpg`, `jacob-collier.jpg` ✓ · `Foto Enero.JPG` ✗)
- **Formato de fotos:** JPG, máximo ~2500px de ancho para que el sitio cargue rápido
