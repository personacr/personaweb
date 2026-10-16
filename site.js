/* PERSONA — menú, foco al entrar, galería, sala de proyección, videos que cargan al tocar. Sin librerías. */
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var track = function (n, p) { try { window.gtag && gtag('event', n, p || {}); } catch (e) {} };

  /* Menú: se oscurece al bajar; en el teléfono abre a pantalla completa */
  var nav = $('.nav'), b = $('#burger'), links = $('#nav-links');
  var solid = function () { nav.classList.toggle('solid', scrollY > 40 || !$('.hero')); };
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

  /* Foco que se ajusta cuando la imagen entra en cuadro (una sola vez) */
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

  /* Galería ampliada */
  var lb = $('#lb'), li = $('#lb-img'), lc = $('#lb-c'), figs = [], cur = 0;
  function show(i) {
    cur = (i + figs.length) % figs.length;
    var f = figs[cur], img = $('img', f);
    li.style.animation = 'none'; void li.offsetWidth; li.style.animation = '';
    li.src = f.dataset.full; li.alt = img.alt; lc.textContent = (cur + 1) + ' / ' + figs.length;
  }
  $$('figure.it[data-full]').forEach(function (f) {
    var open = function () {
      figs = $$('figure.it[data-full]', f.closest('.jg')); show(figs.indexOf(f));
      lb.showModal(); track('photo_open', { src: f.dataset.full });
    };
    f.addEventListener('click', open);
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  if (lb) {
    $('#lb-x').addEventListener('click', function () { lb.close(); });
    $('#lb-p').addEventListener('click', function () { show(cur - 1); });
    $('#lb-n').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (x0 === null) return; var d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 40) show(cur + (d < 0 ? 1 : -1)); x0 = null; });
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
  if (form) form.addEventListener('submit', function () { track('contact_form_submit'); });
})();
