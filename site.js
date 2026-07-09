/* ═══════════════════════════════════════════
   PERSONA — JavaScript compartido
   Idioma · Navegación · Reveal · Lightbox
   ═══════════════════════════════════════════ */

/* ── IDIOMA ── */
function setLang(l){
  document.body.classList.toggle('en', l === 'en');
  document.documentElement.lang = l;
  var bes = document.getElementById('bes');
  var ben = document.getElementById('ben');
  if(bes) bes.classList.toggle('on', l === 'es');
  if(ben) ben.classList.toggle('on', l === 'en');
  try { localStorage.setItem('persona-lang', l); } catch(e){}
}

/* Restaurar idioma guardado */
(function(){
  try {
    var saved = localStorage.getItem('persona-lang');
    if(saved === 'en') setLang('en');
  } catch(e){}
})();

/* ── NAVEGACIÓN MOBILE ── */
function toggleNav(){
  document.getElementById('nav-links').classList.toggle('open');
  document.getElementById('nav-burger').classList.toggle('open');
}

/* Cerrar menú al hacer click en un link */
document.querySelectorAll('.nav-links a').forEach(function(a){
  a.addEventListener('click', function(){
    document.getElementById('nav-links').classList.remove('open');
    document.getElementById('nav-burger').classList.remove('open');
  });
});

/* ── SCROLL REVEAL ── */
(function(){
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function(el){
    observer.observe(el);
  });
})();

/* ── LIGHTBOX ──
   Cada página define su propio objeto lbGalleries antes de cargar site.js,
   o las galerías se registran dinámicamente con data-gallery. */
var lbCurrent = { gallery: null, index: 0 };
var lbGalleries = window.lbGalleries || {};

function openLightbox(gallery, index){
  lbCurrent.gallery = gallery;
  lbCurrent.index = index;
  renderLightbox();
  var lb = document.getElementById('lightbox');
  if(lb){
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function renderLightbox(){
  var imgs = lbGalleries[lbCurrent.gallery];
  if(!imgs) return;
  var img = document.getElementById('lightbox-img');
  var counter = document.getElementById('lightbox-counter');
  if(img) img.src = imgs[lbCurrent.index];
  if(counter) counter.textContent = (lbCurrent.index + 1) + ' / ' + imgs.length;
}

function navLightbox(dir){
  var imgs = lbGalleries[lbCurrent.gallery];
  if(!imgs) return;
  lbCurrent.index = (lbCurrent.index + dir + imgs.length) % imgs.length;
  renderLightbox();
}

function closeLightbox(){
  var lb = document.getElementById('lightbox');
  if(lb){
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function closeLightboxOutside(e){
  if(e.target === document.getElementById('lightbox')) closeLightbox();
}

document.addEventListener('keydown', function(e){
  var lb = document.getElementById('lightbox');
  if(!lb || !lb.classList.contains('active')) return;
  if(e.key === 'ArrowLeft') navLightbox(-1);
  if(e.key === 'ArrowRight') navLightbox(1);
  if(e.key === 'Escape') closeLightbox();
});

/* ── GALERÍAS AUTOMÁTICAS DESDE CARPETAS ──
   El sitio detecta las imágenes listadas en contenido/galerias.txt
   Formato: nombre_galeria = ruta1.jpg, ruta2.jpg, ruta3.jpg
   Las páginas con <div data-auto-gallery="nombre"> se llenan solas. */
(function(){
  var autoGalleries = document.querySelectorAll('[data-auto-gallery]');
  if(autoGalleries.length === 0) return;

  fetch('contenido/galerias.txt')
    .then(function(r){ return r.text(); })
    .then(function(text){
      var galleries = {};
      text.split('\n').forEach(function(line){
        line = line.trim();
        if(!line || line.startsWith('#')) return;
        var eq = line.indexOf('=');
        if(eq === -1) return;
        var name = line.slice(0, eq).trim();
        var files = line.slice(eq + 1).split(',').map(function(f){ return f.trim(); }).filter(Boolean);
        galleries[name] = files;
      });

      autoGalleries.forEach(function(container){
        var name = container.getAttribute('data-auto-gallery');
        var files = galleries[name];
        if(!files || files.length === 0) return;

        lbGalleries[name] = files;
        container.innerHTML = '';
        files.forEach(function(src, i){
          var div = document.createElement('div');
          div.className = 'gitem' + (container.classList.contains('wide-items') ? ' wide' : '');
          div.onclick = function(){ openLightbox(name, i); };
          var img = document.createElement('img');
          img.src = src;
          img.loading = 'lazy';
          img.alt = name + ' — ' + (i + 1);
          div.appendChild(img);
          container.appendChild(div);
        });
      });
    })
    .catch(function(){ /* si no existe galerias.txt, las galerías estáticas siguen funcionando */ });
})();

/* ── TEXTOS DINÁMICOS DESDE contenido/textos.txt ──
   Los elementos con data-text="clave" cargan su contenido del archivo.
   Formato del archivo: clave = valor  */
(function(){
  var dynamicTexts = document.querySelectorAll('[data-text]');
  if(dynamicTexts.length === 0) return;

  fetch('contenido/textos.txt')
    .then(function(r){ return r.text(); })
    .then(function(text){
      var values = {};
      text.split('\n').forEach(function(line){
        line = line.trim();
        if(!line || line.startsWith('#')) return;
        var eq = line.indexOf('=');
        if(eq === -1) return;
        values[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
      });
      dynamicTexts.forEach(function(el){
        var key = el.getAttribute('data-text');
        if(values[key]) el.textContent = values[key];
      });
    })
    .catch(function(){ /* textos estáticos del HTML quedan como fallback */ });
})();
