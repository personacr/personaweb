/* PERSONA — menú, foco al entrar, galería, sala de proyección, videos que cargan al tocar. Sin librerías. */
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var track = function (n, p) { try { window.gtag && gtag('event', n, p || {}); } catch (e) {} };

  /* Menú: se oscurece al bajar; en el teléfono abre a pantalla completa */
  var nav = $('.nav'), b = $('#burger'), links = $('#nav-links');
  /* Se oscurece al bajar; se esconde al bajar y vuelve al subir (más pantalla para las fotos) */
  var lastY = scrollY, root = document.documentElement;
  var solid = function () {
    var y = scrollY, menu = links && links.classList.contains('open');
    nav.classList.toggle('solid', y > 40 || !$('.hero, .cover'));
    var hide = !menu && y > 160 && y > lastY + 4;
    if (hide || y < lastY - 4 || y < 160) { nav.classList.toggle('hide', hide); root.classList.toggle('nav-hidden', hide); }
    lastY = y;
  };
  root.style.setProperty('--navh', nav.offsetHeight + 'px');
  solid(); addEventListener('scroll', solid, { passive: true });
  if (b) b.addEventListener('click', function () {
    var open = links.classList.toggle('open'); b.classList.toggle('open', open);
    b.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
  });

  /* Video del inicio: solo si existe y si la persona no pidió menos movimiento */
  var hv = $('.hero video');
  if (hv && !calm) fetch(hv.dataset.src, { method: 'HEAD' }).then(function (r) {
    if (r.ok) { hv.src = hv.dataset.src; hv.play && hv.play().catch(function () {}); }
  }).catch(function () {});

  /* Las fotos del mosaico aparecen con un fundido cuando terminan de cargar (nunca de golpe) */
  $$('.jg .it img').forEach(function (im) {
    var ok = function () { im.classList.add('ok'); };
    if (im.complete && im.naturalWidth) ok(); else { im.addEventListener('load', ok, { once: true }); im.addEventListener('error', ok, { once: true }); }
  });

  /* Fundido suave cuando cada pieza entra en cuadro (una sola vez) */
  var rv = $$('.rv');
  if (calm || !('IntersectionObserver' in window)) rv.forEach(function (e) { e.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    rv.forEach(function (e) { io.observe(e); });
  }

  /* Mosaico parejo: reparte las fotos en filas completas de alto parecido (--row en styles.css),
     sin dejar una última fila coja. Respeta el orden. Sin JS queda el mosaico de respaldo en CSS. */
  function partir(r, k) {           // divide la lista r en k filas con sumas lo más parejas posible
    var n = r.length, P = [0], i, j, x, ideal, cost = [], cut = [];
    for (i = 0; i < n; i++) P.push(P[i] + r[i]);
    ideal = P[n] / k;
    for (j = 0; j <= k; j++) { cost.push([]); cut.push([]); for (i = 0; i <= n; i++) cost[j].push(Infinity); }
    cost[0][0] = 0;
    for (j = 1; j <= k; j++) for (i = j; i <= n; i++) for (x = j - 1; x < i; x++) {
      var c = cost[j - 1][x] + Math.pow(P[i] - P[x] - ideal, 2);
      if (c < cost[j][i]) { cost[j][i] = c; cut[j][i] = x; }
    }
    var filas = [], end = n;
    for (j = k; j > 0; j--) { var st = cut[j][end]; filas.unshift([st, end]); end = st; }
    return filas;
  }
  function justify(g) {
    var W = g.clientWidth; if (!W) return;
    var cs = getComputedStyle(g), gap = parseFloat(cs.columnGap) || 0;
    var T = parseFloat(cs.getPropertyValue('--row')) || 220, grupos = [[]];
    $$(':scope > *', g).forEach(function (it) {
      if (it.classList.contains('it')) { it._r = parseFloat(it.style.getPropertyValue('--r')) || 1; grupos[grupos.length - 1].push(it); }
      else grupos.push([]);
    });
    grupos.forEach(function (its) {
      if (!its.length) return;
      var r = its.map(function (it) { return it._r; }), total = r.reduce(function (a, b) { return a + b; }, 0);
      var k = Math.min(its.length, Math.max(1, Math.round((total * T + gap * its.length) / W)));
      partir(r, k).forEach(function (f) {
        var row = its.slice(f[0], f[1]), sum = r.slice(f[0], f[1]).reduce(function (a, b) { return a + b; }, 0);
        var avail = W - gap * (row.length - 1), h = Math.min(avail / sum, T * 1.45), used = 0;
        var full = avail / sum <= T * 1.45;
        row.forEach(function (it, q) {
          var w = (full && q === row.length - 1) ? avail - used - 0.5 : Math.floor(it._r * h);
          used += w; it.style.flex = 'none'; it.style.width = w + 'px'; it.style.height = Math.round(h) + 'px';
        });
      });
    });
    g.classList.add('justified');
  }
  var grids = $$('.jg');
  grids.forEach(justify);
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (es) { es.forEach(function (e) { if (e.target._w !== e.contentRect.width) { e.target._w = e.contentRect.width; justify(e.target); } }); });
    grids.forEach(function (g) { ro.observe(g); });
  }

  /* Galería ampliada: fundido entre fotos, la siguiente ya cargada, deslizar para pasar o bajar para cerrar */
  var lb = $('#lb'), li = $('#lb-img'), lc = $('#lb-c'), lch = $('#lb-ch'), figs = [], cur = 0, cache = {};
  function pre(i) { var f = figs[(i + figs.length) % figs.length]; if (f && !cache[f.dataset.full]) { cache[f.dataset.full] = new Image(); cache[f.dataset.full].src = f.dataset.full; } }
  function show(i) {
    cur = (i + figs.length) % figs.length;
    var f = figs[cur], img = $('img', f), src = f.dataset.full;
    li.classList.add('out');
    var swap = function () {
      li.src = src; li.alt = img.alt;
      var done = function () { li.classList.remove('out'); };
      if (li.complete) requestAnimationFrame(done); else li.onload = done;
    };
    setTimeout(swap, li.getAttribute('src') ? 160 : 0);
    lc.textContent = figs.length > 1 ? (cur + 1) + ' / ' + figs.length : '';
    if (f.dataset.ch) { lch.hidden = false; lch.href = f.dataset.ch; lch.textContent = f.dataset.chl + ' →'; } else lch.hidden = true;
    pre(cur + 1); pre(cur - 1);
  }
  $$('figure.it[data-full]').forEach(function (f) {
    var open = function () {
      figs = $$('figure.it[data-full]', f.closest('.jg')); li.removeAttribute('src'); show(figs.indexOf(f));
      lb.showModal(); document.body.style.overflow = 'hidden'; track('photo_open', { src: f.dataset.full });
    };
    f.addEventListener('click', open);
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  if (lb) {
    lb.addEventListener('close', function () { document.body.style.overflow = ''; });
    $('#lb-x').addEventListener('click', function () { lb.close(); });
    $('#lb-p').addEventListener('click', function () { show(cur - 1); });
    $('#lb-n').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    var x0 = null, y0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
      else if (dy > 80) lb.close();
      x0 = y0 = null;
    });
  }

  /* Videos: se ve la imagen; el reproductor carga solo al tocar */
  function play(v) {
    var p = v.dataset.p, id = v.dataset.id, src;
    if (p === 'vimeo') src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&title=0&byline=0&portrait=0&dnt=1';
    else src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    var f = document.createElement('iframe');
    f.src = src; f.title = v.getAttribute('aria-label'); f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; f.allowFullscreen = true;
    v.appendChild(f); v.style.cursor = 'default'; track('video_play', { platform: p, id: id });
  }
  document.addEventListener('click', function (e) {
    var v = e.target.closest('button.video');
    if (v && !$('iframe', v)) play(v);
  });

  /* Sala de proyección: abre la ficha; al cerrar, se detiene todo */
  $$('dialog.cinema').forEach(function (d) { d._html = d.innerHTML; });
  function openWork(id) {
    var d = document.getElementById(id); if (!d) return;
    d.innerHTML = d._html;
    $$('iframe[data-src]', d).forEach(function (f) { f.src = f.dataset.src; });
    d.showModal(); d.scrollTop = 0;
    var first = $('button.video', d); if (first && !calm) play(first);
    history.replaceState(null, '', '#' + id.replace('ver-', ''));
    track('section_open', { section: id });
  }
  $$('[data-open]').forEach(function (btn) { btn.addEventListener('click', function () { openWork(btn.dataset.open); }); });
  $$('dialog.cinema').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target === d) d.close(); });
    d.addEventListener('close', function () { d.innerHTML = d._html; history.replaceState(null, '', location.pathname); });
  });
  if (location.hash && document.getElementById('ver-' + location.hash.slice(1))) openWork('ver-' + location.hash.slice(1));

  /* Botón flotante «Escribime» */
  var fc = $('.float-cta');
  if (fc) addEventListener('scroll', function () { fc.classList.toggle('on', scrollY > innerHeight * 1.2); }, { passive: true });

  /* Eventos (mismos que la Bio) */
  $$('a[href^="http"]').forEach(function (a) { if (a.host !== location.host) a.addEventListener('click', function () { track('outbound_click', { url: a.href }); }); });
  var form = $('#contact-form');
  var tipo = new URLSearchParams(location.search).get('tipo'), sel = $('#f-type');
  if (sel && tipo && sel.options[+tipo]) sel.selectedIndex = +tipo;
  if (form) form.addEventListener('submit', function () { track('contact_form_submit'); });
})();
