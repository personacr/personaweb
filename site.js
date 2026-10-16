/* PERSONA — menú, aparición de fotos, galería ampliada, videos que cargan al tocar, formulario. Sin librerías. */
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var track = function (n, p) { try { window.gtag && gtag('event', n, p || {}); } catch (e) {} };

  /* Menú del teléfono */
  var b = $('#burger'), links = $('#nav-links');
  if (b) b.addEventListener('click', function () {
    var open = links.classList.toggle('open'); b.classList.toggle('open', open);
    b.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
  });

  /* Video del inicio: solo se descarga si existe y si la persona no pidió menos movimiento */
  var hv = $('.hero video');
  if (hv && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fetch(hv.dataset.src, { method: 'HEAD' }).then(function (r) {
      if (r.ok) { hv.src = hv.dataset.src; hv.play && hv.play().catch(function () {}); }
    }).catch(function () {});
  }

  /* Aparición tipo cortina, una sola vez */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('show'); e.target.classList.remove('wait'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) {
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('wait'); io.observe(el); }
    });
  }

  /* Galería ampliada (fotos de capítulos y de Stage) */
  var lb = $('#lb'), li = $('#lb-img'), lc = $('#lb-c'), figs = [], cur = 0, last;
  function group(f) { return $$('.ph', f.closest('main')); }
  function show(i) {
    cur = (i + figs.length) % figs.length;
    var img = $('img', figs[cur]);
    li.src = img.currentSrc ? img.currentSrc.replace(/-(640|1280)\.webp$/, '-2048.webp') : img.src;
    li.alt = img.alt; lc.textContent = img.alt;
  }
  function close() { lb.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); }
  $$('.ph').forEach(function (f) {
    f.tabIndex = 0;
    var open = function () { figs = group(f); last = f; show(figs.indexOf(f)); lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lb-x').focus(); };
    f.addEventListener('click', open);
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  if (lb) {
    $('#lb-x').addEventListener('click', close);
    $('#lb-p').addEventListener('click', function () { show(cur - 1); });
    $('#lb-n').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1);
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (x0 === null) return; var d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 40) show(cur + (d < 0 ? 1 : -1)); x0 = null; });
  }

  /* Videos: se ve la foto; el reproductor carga solo al tocar */
  $$('.video').forEach(function (v) {
    v.addEventListener('click', function () {
      var p = v.dataset.p, id = v.dataset.id, src;
      track('video_play', { platform: p, id: id });
      if (p === 'instagram') {
        var w = document.createElement('div'); w.className = 'ig-embed';
        w.innerHTML = '<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/reel/' + id + '/" data-instgrm-version="14" style="background:#000;border:0;margin:0;width:100%"></blockquote>';
        v.replaceWith(w);
        if (window.instgrm) instgrm.Embeds.process();
        else { var s = document.createElement('script'); s.async = true; s.src = 'https://www.instagram.com/embed.js'; document.body.appendChild(s); }
        return;
      }
      src = p === 'vimeo' ? 'https://player.vimeo.com/video/' + id + '?autoplay=1&title=0&byline=0&portrait=0&dnt=1'
                          : 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      var f = document.createElement('iframe');
      f.src = src; f.title = v.getAttribute('aria-label'); f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true;
      v.innerHTML = ''; v.appendChild(f); v.style.cursor = 'default';
    }, { once: true });
  });

  /* Botón flotante «Escribime» después de media página */
  var fc = $('.float-cta');
  if (fc) addEventListener('scroll', function () { fc.classList.toggle('on', scrollY > document.body.scrollHeight * 0.35); }, { passive: true });

  /* Clics hacia afuera y formulario (mismos eventos que la Bio) */
  $$('a[href^="http"]').forEach(function (a) { if (a.host !== location.host) a.addEventListener('click', function () { track('outbound_click', { url: a.href }); }); });
  var form = $('#contact-form');
  if (form) form.addEventListener('submit', function () { track('contact_form_submit'); });
})();
