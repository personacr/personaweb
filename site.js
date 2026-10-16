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

  /* Galería ampliada */
  var lb = $('#lb'), li = $('#lb-img'), lc = $('#lb-c'), figs = [], cur = 0;
  function show(i) {
    cur = (i + figs.length) % figs.length;
    var f = figs[cur], img = $('img', f);
    li.style.animation = 'none'; void li.offsetWidth; li.style.animation = '';
    li.src = f.dataset.full; li.alt = img.alt; lc.textContent = img.alt;
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
    if (p === 'instagram') { src = 'https://www.instagram.com/reel/' + id + '/embed/'; v.classList.add('playing'); }
    else if (p === 'vimeo') src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&title=0&byline=0&portrait=0&dnt=1';
    else src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    var f = document.createElement('iframe');
    f.src = src; f.title = v.getAttribute('aria-label'); f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; f.allowFullscreen = true;
    v.appendChild(f); v.style.cursor = 'default'; track('video_play', { platform: p, id: id });
  }
  document.addEventListener('click', function (e) {
    var v = e.target.closest('.video');
    if (v && !$('iframe', v)) play(v);
  });

  /* Sala de proyección: abre la ficha; al cerrar, se detiene todo */
  $$('dialog.cinema').forEach(function (d) { d._html = d.innerHTML; });
  function openWork(id) {
    var d = document.getElementById(id); if (!d) return;
    d.innerHTML = d._html;
    $$('iframe[data-src]', d).forEach(function (f) { f.src = f.dataset.src; });
    d.showModal(); d.scrollTop = 0;
    var first = $('.video', d); if (first && !calm && first.dataset.p !== 'instagram') play(first);
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
