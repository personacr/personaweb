// PERSONA · Galerías privadas — vista del cliente
// Portada → contraseña → galería (portada corta, secciones, mosaico) → foto ampliada.
// Mismo lenguaje visual que www.persona.cr. Sin librerías ni paso de compilación.

import { api } from './api.js';
import { t, getLang, setLang } from './i18n.js';

// Datos del estudio (cuando sea producto, vendrán de la base de datos).
const STUDIO = {
  owner: 'Jose Pablo García',
  website: 'https://www.persona.cr',
  whatsapp: '50688433789',
};

const app = document.getElementById('app');
const root = document.documentElement;
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
  sget(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch { /* modo privado */ } },
};

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Títulos como en el sitio: minúsculas, la última letra en itálica azul.
function L(word) {
  const chars = Array.from(String(word || '').toLowerCase().trim());
  if (!chars.length) return '';
  const last = chars.pop();
  return `${esc(chars.join(''))}<span class="l">${esc(last)}</span>`;
}

const WORDMARK = 'person<span class="l">a</span>';

const state = {
  slug: '',
  meta: null,
  data: null,
  screen: 'boot', // boot | cover | unlock | gallery | message
  message: '',
  view: 'all', // 'all' | id de set | 'fav'
  lastView: 'all',
  favs: new Set(),
  visitor: '',
  list: [],
  played: new Set(), // pantallas que ya hicieron su apertura
};

// La apertura (franjas que se abren, acercamiento lento) se ve una sola vez por pantalla.
function intro(key) {
  if (state.played.has(key) || calm()) return ' no-intro';
  state.played.add(key);
  return '';
}

/* ───────────── Inicio ───────────── */

async function boot() {
  state.slug = globalThis.PG_SLUG ?? (location.pathname.split('/').filter(Boolean)[0] || '');
  setLang(store.get('pg:lang') || ((navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es'));
  state.visitor = visitorId();

  app.addEventListener('click', onAppClick);
  addEventListener('scroll', onScroll, { passive: true });

  if (!state.slug) return renderMessage('home');

  try {
    state.meta = await api.meta(state.slug);
  } catch (err) {
    return renderMessage(err.status === 410 ? 'expired' : 'notFound');
  }

  if (!store.get('pg:lang')) setLang(state.meta.lang || 'es');
  document.title = `${state.meta.title} · ${t('private')} · PERSONA`;
  loadFavs();
  renderCover();
}

function visitorId() {
  let v = store.get('pg:visitor');
  if (!v || !/^[a-z0-9]{8,32}$/.test(v)) {
    v = Array.from(crypto.getRandomValues(new Uint8Array(14)), (b) => (b % 36).toString(36)).join('');
    store.set('pg:visitor', v);
  }
  return v;
}

// Corte a negro entre pantallas, como entre páginas del sitio.
function cut(render) {
  if (document.startViewTransition && !calm()) document.startViewTransition(render);
  else render();
}

/* ───────────── Piezas comunes ───────────── */

function navHTML() {
  return `
    <nav class="nav" aria-label="${t('menu')}">
      <div class="nav-inner">
        <a class="wordmark" href="${STUDIO.website}">${WORDMARK}</a>
        <div class="lang">
          ${getLang() === 'es'
            ? `<b>ES</b> · <button type="button" data-action="lang" lang="en">EN</button>`
            : `<button type="button" data-action="lang" lang="es">ES</button> · <b>EN</b>`}
        </div>
      </div>
    </nav>`;
}

function footerHTML() {
  return `
    <footer class="footer">
      <div class="footer-in">
        <a class="wordmark" href="${STUDIO.website}">${WORDMARK}</a>
        <p class="footer-meta">${esc(STUDIO.owner)} · Costa Rica · © ${new Date().getFullYear()} · <a href="${STUDIO.website}">persona.cr</a></p>
      </div>
    </footer>`;
}

function formatDate(iso, short = false) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  const date = new Date(+m[1], +m[2] - 1, +m[3]);
  return new Intl.DateTimeFormat(getLang() === 'en' ? 'en-US' : 'es-CR', {
    day: 'numeric',
    month: short ? 'short' : 'long',
    year: 'numeric',
  }).format(date);
}

function coverMedia(m, eager = true) {
  const color = COLOR_RE.test(m.cover?.color || '') ? m.cover.color : '#0b0b0c';
  const [fx, fy] = Array.isArray(m.focal) ? m.focal : [0.5, 0.5];
  const pos = `${(Number(fx) * 100).toFixed(1)}% ${(Number(fy) * 100).toFixed(1)}%`;
  const img = m.cover
    ? `<img src="${esc(m.cover.web)}"${m.cover.md && m.cover.md !== m.cover.web ? ` srcset="${esc(m.cover.md)} 960w, ${esc(m.cover.web)} 2048w" sizes="100vw"` : ''} alt="" ${eager ? 'fetchpriority="high"' : ''} decoding="async" style="object-position:${pos}">`
    : '';
  return `<div class="cover-media" style="background-color:${color}">${img}<div class="bars" aria-hidden="true"></div></div>`;
}

/* ───────────── Portada ───────────── */

function renderCover() {
  state.screen = 'cover';
  const m = state.meta;
  const style = m.coverStyle === 'band' ? 'band' : 'full';
  const date = formatDate(m.eventDate);
  app.innerHTML = `
    ${navHTML()}
    <header class="cover ${style}${intro('cover')}" aria-labelledby="g-title">
      ${coverMedia(m)}
      <div class="cover-t">
        <div>
          <p class="eyebrow"><i class="ico" aria-hidden="true">◎</i>${t('private')}${date ? ` · ${esc(date)}` : ''}</p>
          <h1 class="display" id="g-title">${L(m.title)}</h1>
          ${m.subtitle ? `<p class="lead">${esc(m.subtitle)}</p>` : ''}
        </div>
        <div class="btns"><button class="btn blue" type="button" data-action="enter">${t('viewGallery')}</button></div>
      </div>
    </header>`;
  setupNav();
}

/* ───────────── Contraseña ───────────── */

async function onEnter() {
  if (!state.meta.unlocked) return showUnlock();
  try {
    await openGallery();
  } catch {
    showUnlock('errGeneric');
  }
}

function showUnlock(errorKey = '') {
  state.screen = 'unlock';
  const cover = app.querySelector('.cover');
  if (!cover) return;
  cover.classList.add('is-unlock');
  cover.querySelector('.cover-t').innerHTML = `
    <form class="unlock" novalidate>
      <p class="eyebrow"><i class="ico" aria-hidden="true">◎</i>${t('private')}</p>
      <h1 class="display">${L(state.meta.title)}</h1>
      <label class="field" for="pg-pw">${t('password')}
        <span class="field-row">
          <input id="pg-pw" name="password" type="password" autocomplete="current-password"
                 autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="go" required>
          <button class="reveal" type="button" data-action="reveal" aria-controls="pg-pw">${t('show')}</button>
        </span>
      </label>
      <p class="err" id="pg-pw-error" role="alert">${errorKey ? t(errorKey) : ''}</p>
      <div class="btns">
        <button class="btn blue" type="submit">${t('enter')}</button>
        <button class="btn" type="button" data-action="back">${t('back')}</button>
      </div>
    </form>`;

  const form = cover.querySelector('.unlock');
  const input = form.password;
  form.addEventListener('submit', onUnlockSubmit);
  input.addEventListener('input', () => {
    form.querySelector('.err').textContent = '';
    input.removeAttribute('aria-invalid');
  });
  input.focus({ preventScroll: true });
}

async function onUnlockSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.password;
  const button = form.querySelector('[type="submit"]');
  const error = form.querySelector('.err');
  const row = form.querySelector('.field-row');

  const fail = (key) => {
    error.textContent = t(key);
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'pg-pw-error');
    button.disabled = false;
    button.textContent = t('enter');
    row.classList.remove('shake');
    void row.offsetWidth;
    row.classList.add('shake');
    input.focus();
  };

  // Se recortan espacios: al copiar desde WhatsApp a veces se cuela uno.
  const password = input.value.trim();
  if (!password) return fail('errEmpty');

  button.disabled = true;
  button.textContent = t('entering');
  try {
    await api.unlock(state.slug, password);
    state.meta.unlocked = true;
    await openGallery();
  } catch (err) {
    const key = { 401: 'errWrong', 429: 'errMany', 0: 'errNetwork' }[err.status] || 'errGeneric';
    if (state.screen === 'unlock') fail(key);
  }
}

function toggleReveal(button) {
  const input = document.getElementById('pg-pw');
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.textContent = t(show ? 'hide' : 'show');
  input.focus();
}

/* ───────────── Galería ───────────── */

async function openGallery() {
  if (!state.data) {
    try {
      state.data = await api.photos(state.slug);
    } catch (err) {
      if (err.status === 401) {
        state.meta.unlocked = false;
        renderCover();
        showUnlock();
        return;
      }
      throw err;
    }
  }
  const viewedKey = `pg:viewed:${state.slug}`;
  if (!store.sget(viewedKey)) {
    api.track(state.slug, { type: 'view', visitor: state.visitor });
    store.sset(viewedKey, '1');
  }
  cut(() => {
    renderGallery();
    window.scrollTo(0, 0);
  });
}

function renderGallery() {
  state.screen = 'gallery';
  const m = state.meta;
  const { sets, photos, favoritesEnabled } = state.data;
  if (!['all', 'fav'].includes(state.view) && !sets.some((s) => s.id === state.view)) state.view = 'all';
  const n = photos.length;
  const date = formatDate(m.eventDate, true);

  app.innerHTML = `
    ${navHTML()}
    <div class="gallery">
      <header class="cover short${intro('gallery')}" aria-labelledby="g-title">
        ${coverMedia(m)}
        <div class="cover-t">
          <div>
            <p class="eyebrow"><i class="ico" aria-hidden="true">◎</i>${t('private')} · ${n} ${n === 1 ? t('photo1') : t('photos')}${date ? ` · ${esc(date)}` : ''}</p>
            <h1 class="display" id="g-title">${L(m.title)}</h1>
          </div>
          ${m.subtitle ? `<p class="lead">${esc(m.subtitle)}</p>` : ''}
        </div>
      </header>
      <main class="wrap">
        <nav class="chapter-bar" aria-label="${t('sections')}">
          <div class="chapnav">
            ${sets.length > 1
              ? `<button class="chip" type="button" data-action="set" data-set="all">${t('all')}</button>
                 ${sets.map((s) => `<button class="chip" type="button" data-action="set" data-set="${esc(s.id)}">${esc(s.title)}</button>`).join('')}`
              : ''}
          </div>
          ${favoritesEnabled ? `<button class="chip fav-chip" type="button" data-action="favview" aria-pressed="false">${HEART}${t('favorites')}<b></b></button>` : ''}
        </nav>
        <p class="status" hidden></p>
        <div class="jg" id="grid"></div>
      </main>
      ${footerHTML()}
    </div>`;

  setupNav();
  updateBar();
  layoutGrid();
}

function currentList() {
  const photos = state.data.photos;
  if (state.view === 'fav') return photos.filter((p) => state.favs.has(p.id));
  if (state.view === 'all') return photos;
  return photos.filter((p) => p.set === state.view);
}

function layoutGrid() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  state.list = currentList();

  const status = app.querySelector('.status');
  if (state.view === 'fav') {
    const n = state.list.length;
    status.textContent = n ? (n === 1 ? t('favCountOne') : t('favCount', { n })) : t('favEmpty');
    status.hidden = false;
  } else {
    status.hidden = true;
  }

  // En «Todas», el nombre de cada sección separa sus fotos (como los grupos de un capítulo del sitio).
  const showLabels = state.view === 'all' && state.data.sets.length > 1;
  const titles = new Map(state.data.sets.map((s) => [s.id, s.title]));
  const frag = document.createDocumentFragment();
  let lastSet = null;
  state.list.forEach((photo, index) => {
    if (showLabels && photo.set !== lastSet) {
      const label = document.createElement('p');
      label.className = 'label';
      label.textContent = titles.get(photo.set) || '';
      frag.appendChild(label);
      lastSet = photo.set;
    }
    frag.appendChild(makeTile(photo, index));
  });
  grid.classList.remove('justified');
  grid.replaceChildren(frag);
  justify(grid);
  reveal(grid);
}

function makeTile(photo, index) {
  const r = photo.w / photo.h;
  const tile = document.createElement('figure');
  tile.className = 'it rv';
  tile.dataset.id = photo.id;
  tile._r = r;
  tile.style.setProperty('--r', r.toFixed(4));
  tile.style.setProperty('--d', `${((index % 4) * 0.07).toFixed(2)}s`);
  if (COLOR_RE.test(photo.c || '')) tile.style.backgroundColor = photo.c;

  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'it-open';
  open.dataset.action = 'open';
  open.dataset.index = String(index);
  open.setAttribute('aria-label', t('openPhoto', { n: index + 1 }));

  const img = document.createElement('img');
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  if (photo.md && photo.md !== photo.sm) {
    img.srcset = `${photo.sm} 480w, ${photo.md} 960w`;
    img.sizes = '(max-width:700px) 50vw, 25vw';
  }
  img.addEventListener('load', () => img.classList.add('ok'), { once: true });
  img.src = photo.sm;
  open.appendChild(img);
  tile.appendChild(open);

  if (state.data.favoritesEnabled) {
    const fav = document.createElement('button');
    fav.type = 'button';
    fav.className = 'it-fav';
    fav.dataset.action = 'fav';
    fav.dataset.id = photo.id;
    fav.innerHTML = HEART;
    setFavButton(fav, state.favs.has(photo.id));
    tile.appendChild(fav);
  }
  return tile;
}

/* Mosaico parejo (mismo método que site.js de persona.cr): reparte las fotos de cada
   grupo en filas completas de alto parecido (--row), sin dejar una última fila coja. */
function partir(r, k) {
  const n = r.length;
  const P = [0];
  for (let i = 0; i < n; i++) P.push(P[i] + r[i]);
  const ideal = P[n] / k;
  const cost = [];
  const cut = [];
  for (let j = 0; j <= k; j++) {
    cost.push(new Float64Array(n + 1).fill(Infinity));
    cut.push(new Int32Array(n + 1));
  }
  cost[0][0] = 0;
  for (let j = 1; j <= k; j++) {
    for (let i = j; i <= n; i++) {
      for (let x = j - 1; x < i; x++) {
        const c = cost[j - 1][x] + (P[i] - P[x] - ideal) ** 2;
        if (c < cost[j][i]) {
          cost[j][i] = c;
          cut[j][i] = x;
        }
      }
    }
  }
  const rows = [];
  let end = n;
  for (let j = k; j > 0; j--) {
    const start = cut[j][end];
    rows.unshift([start, end]);
    end = start;
  }
  return rows;
}

// Para galerías muy grandes: llena filas de izquierda a derecha (más rápido).
function partirRapido(r, target) {
  const rows = [];
  let start = 0;
  let sum = 0;
  r.forEach((v, i) => {
    sum += v;
    if (sum >= target) {
      rows.push([start, i + 1]);
      start = i + 1;
      sum = 0;
    }
  });
  if (start < r.length) rows.push([start, r.length]);
  return rows;
}

function justify(grid) {
  const W = grid.clientWidth;
  if (!W) return;
  grid._w = W;
  const cs = getComputedStyle(grid);
  const gap = parseFloat(cs.columnGap) || 0;
  const T = parseFloat(cs.getPropertyValue('--row')) || 220;
  const groups = [[]];
  for (const el of grid.children) {
    if (el.classList.contains('it')) groups[groups.length - 1].push(el);
    else groups.push([]);
  }
  for (const items of groups) {
    if (!items.length) continue;
    const r = items.map((it) => it._r);
    const total = r.reduce((a, b) => a + b, 0);
    const k = Math.min(items.length, Math.max(1, Math.round((total * T + gap * items.length) / W)));
    const rows = items.length > 300 ? partirRapido(r, W / T) : partir(r, k);
    for (const [a, b] of rows) {
      const row = items.slice(a, b);
      const sum = r.slice(a, b).reduce((x, y) => x + y, 0);
      const avail = W - gap * (row.length - 1);
      const full = avail / sum <= T * 1.45;
      const h = Math.min(avail / sum, T * 1.45);
      let used = 0;
      row.forEach((it, q) => {
        const w = full && q === row.length - 1 ? avail - used - 0.5 : Math.floor(it._r * h);
        used += w;
        it.style.width = `${w}px`;
        it.style.height = `${Math.round(h)}px`;
      });
    }
  }
  grid.classList.add('justified');
}

let revealer = null;
function reveal(grid) {
  const tiles = grid.querySelectorAll('.rv');
  if (calm() || !('IntersectionObserver' in window)) {
    tiles.forEach((el) => el.classList.add('in'));
    return;
  }
  revealer?.disconnect();
  revealer = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealer.unobserve(e.target);
      }
    }),
    { rootMargin: '0px 0px -6% 0px', threshold: 0.01 }
  );
  tiles.forEach((el) => revealer.observe(el));
}

const resizer = 'ResizeObserver' in window
  ? new ResizeObserver(() => {
      const grid = document.getElementById('grid');
      if (grid && grid.clientWidth !== grid._w) justify(grid);
    })
  : null;

function updateBar() {
  app.querySelectorAll('.chapnav [data-set]').forEach((b) => {
    b.setAttribute('aria-current', state.view !== 'fav' && b.dataset.set === state.view ? 'true' : 'false');
  });
  const favButton = app.querySelector('.fav-chip');
  if (!favButton) return;
  const n = favoriteCount();
  favButton.querySelector('b').textContent = n ? String(n) : '';
  favButton.classList.toggle('has-favs', n > 0);
  favButton.setAttribute('aria-pressed', state.view === 'fav' ? 'true' : 'false');
}

function setView(view) {
  if (view !== 'fav') state.lastView = view;
  state.view = view;
  updateBar();
  layoutGrid();
  const bar = app.querySelector('.chapter-bar');
  const top = bar ? bar.parentElement.offsetTop - 1 : 0;
  if (window.scrollY > top) window.scrollTo({ top, behavior: calm() ? 'auto' : 'smooth' });
}

/* ───────────── Menú que se oscurece y se esconde (como en el sitio) ───────────── */

let lastY = 0;
function setupNav() {
  const nav = app.querySelector('.nav');
  if (!nav) return;
  root.style.setProperty('--navh', `${nav.offsetHeight}px`);
  lastY = window.scrollY;
  onScroll();
  const grid = document.getElementById('grid');
  if (grid && resizer) resizer.observe(grid);
}

function onScroll() {
  const nav = app.querySelector('.nav');
  if (!nav) return;
  const y = window.scrollY;
  nav.classList.toggle('solid', y > 40 || !app.querySelector('.cover'));
  const hide = state.screen === 'gallery' && y > 160 && y > lastY + 4;
  if (hide || y < lastY - 4 || y < 160) {
    nav.classList.toggle('hide', hide);
    root.classList.toggle('nav-hidden', hide);
  }
  lastY = y;
}

/* ───────────── Favoritas ───────────── */

const favKey = () => `pg:fav:${state.slug}`;

function loadFavs() {
  try {
    state.favs = new Set(JSON.parse(store.get(favKey()) || '[]'));
  } catch {
    state.favs = new Set();
  }
}

function favoriteCount() {
  return state.data ? state.data.photos.reduce((n, p) => n + (state.favs.has(p.id) ? 1 : 0), 0) : 0;
}

function setFavButton(button, on) {
  button.setAttribute('aria-pressed', on ? 'true' : 'false');
  button.setAttribute('aria-label', t(on ? 'removeFav' : 'addFav'));
}

function toggleFav(id) {
  if (!id) return;
  const on = !state.favs.has(id);
  if (on) state.favs.add(id);
  else state.favs.delete(id);
  store.set(favKey(), JSON.stringify([...state.favs]));
  api.track(state.slug, { type: on ? 'favorite' : 'unfavorite', photoId: id, visitor: state.visitor });

  app.querySelectorAll(`.it[data-id="${CSS.escape(id)}"] .it-fav`).forEach((b) => setFavButton(b, on));
  updateBar();
  viewer.syncFav();
}

/* ───────────── Foto ampliada (misma galería ampliada del sitio) ───────────── */

const viewer = (() => {
  let lb, img, count, nameEl, favButton, prevButton, nextButton;
  let cur = -1;
  let swapTimer = 0;
  const cache = new Map();

  function build() {
    lb = document.createElement('dialog');
    lb.className = 'lb';
    lb.innerHTML = `
      <button class="x" type="button" data-v="close"></button>
      <button class="pv" type="button" data-v="prev">‹</button>
      <img alt="" draggable="false">
      <div class="lb-meta">
        <span class="lb-c" aria-live="polite"></span>
        <span class="lb-name"></span>
        <button class="lb-fav" type="button" data-v="fav">${HEART}<span class="lb-fav-t"></span></button>
      </div>
      <button class="nx" type="button" data-v="next">›</button>`;
    document.body.appendChild(lb);
    img = lb.querySelector('img');
    count = lb.querySelector('.lb-c');
    nameEl = lb.querySelector('.lb-name');
    favButton = lb.querySelector('.lb-fav');
    prevButton = lb.querySelector('[data-v="prev"]');
    nextButton = lb.querySelector('[data-v="next"]');

    lb.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (b) {
        ({ close: () => lb.close(), prev: () => show(cur - 1), next: () => show(cur + 1), fav: () => toggleFav(currentId()) })[b.dataset.v]();
      } else if (e.target === lb) {
        lb.close();
      }
    });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
      else if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey && state.data.favoritesEnabled) toggleFav(currentId());
    });
    lb.addEventListener('close', onClose);

    // Deslizar para pasar de foto; bajar para cerrar. El pellizco para acercar lo maneja el teléfono.
    let x0 = null;
    let y0 = null;
    lb.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || (window.visualViewport && window.visualViewport.scale > 1.05)) {
        x0 = null;
        return;
      }
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
      else if (dy > 80) lb.close();
      x0 = y0 = null;
    });
  }

  function labels() {
    lb.setAttribute('aria-label', t('viewer'));
    lb.querySelector('[data-v="close"]').textContent = `${t('close')} ✕`;
    prevButton.setAttribute('aria-label', t('prev'));
    nextButton.setAttribute('aria-label', t('next'));
    lb.querySelector('.lb-fav-t').textContent = t('favorite');
  }

  const currentId = () => (cur >= 0 ? state.list[cur]?.id : null);
  const isOpen = () => !!lb?.open;

  function preload(url) {
    if (!url || cache.has(url)) return;
    const im = new Image();
    im.decoding = 'async';
    im.src = url;
    cache.set(url, im);
  }

  function show(i) {
    if (!state.list.length) return;
    cur = (i + state.list.length) % state.list.length;
    const photo = state.list[cur];
    clearTimeout(swapTimer);
    img.classList.add('out');
    const swap = () => {
      // Primero la versión que ya está en caché (rápida); luego la grande, sin parpadeo.
      const big = cache.get(photo.web);
      img.src = big && big.complete ? photo.web : photo.md || photo.sm;
      const done = () => img.classList.remove('out');
      if (img.complete) requestAnimationFrame(done);
      else img.onload = done;
      if (!(big && big.complete)) {
        preload(photo.web);
        const im = cache.get(photo.web);
        im.addEventListener('load', () => {
          if (state.list[cur] === photo) img.src = photo.web;
        }, { once: true });
      }
    };
    if (img.getAttribute('src')) swapTimer = setTimeout(swap, 160);
    else swap();

    count.textContent = state.list.length > 1 ? `${cur + 1} / ${state.list.length}` : '';
    nameEl.textContent = (photo.name || '').replace(/\.[a-z0-9]+$/i, '');
    prevButton.hidden = nextButton.hidden = state.list.length < 2;
    syncFav();
    [cur + 1, cur - 1].forEach((j) => {
      const p = state.list[(j + state.list.length) % state.list.length];
      if (p) preload(p.web);
    });
  }

  function open(i) {
    if (!lb) build();
    labels();
    favButton.hidden = !state.data.favoritesEnabled;
    img.removeAttribute('src');
    show(i);
    lb.showModal();
    document.body.style.overflow = 'hidden';
    history.pushState({ pgViewer: true }, '');
  }

  function onClose() {
    document.body.style.overflow = '';
    const id = currentId();
    cur = -1;
    if (history.state && history.state.pgViewer) history.back();
    if (state.view === 'fav') {
      updateBar();
      layoutGrid();
    }
    const tile = id && app.querySelector(`.it[data-id="${CSS.escape(id)}"] .it-open`);
    if (tile) {
      tile.focus({ preventScroll: true });
      tile.scrollIntoView({ block: 'nearest' });
    }
  }

  function syncFav() {
    if (!isOpen() && cur < 0) return;
    if (favButton) setFavButton(favButton, state.favs.has(currentId()));
  }

  // El botón «atrás» del teléfono cierra la foto en lugar de salir de la galería.
  addEventListener('popstate', () => {
    if (isOpen()) lb.close();
  });

  return { open, isOpen, syncFav, relabel: () => lb && labels() };
})();

/* ───────────── Mensajes: inicio, enlace incompleto, galería cerrada ───────────── */

function renderMessage(kind) {
  state.screen = 'message';
  state.message = kind;
  document.title = kind === 'home' ? `${t('privatePlural')} · PERSONA` : `PERSONA`;
  app.innerHTML = `
    <div class="page">
      ${navHTML()}
      <main class="wrap msg">
        <div>
          <p class="eyebrow"><i class="ico" aria-hidden="true">◎</i>${kind === 'home' ? 'PERSONA' : t('privatePlural')}</p>
          <h1 class="display">${L(t(`${kind}Title`))}</h1>
        </div>
        <p class="lead">${t(`${kind}Body`)}</p>
        <div class="btns">
          <a class="btn blue" href="https://wa.me/${STUDIO.whatsapp}" rel="noopener">${t('write')}</a>
          <a class="btn" href="${STUDIO.website}">persona.cr</a>
        </div>
      </main>
      ${footerHTML()}
    </div>`;
  setupNav();
}

/* ───────────── Eventos ───────────── */

function toggleLang() {
  const next = getLang() === 'es' ? 'en' : 'es';
  setLang(next);
  store.set('pg:lang', next);
  if (state.screen === 'message') renderMessage(state.message);
  else if (state.screen === 'cover') renderCover();
  else if (state.screen === 'unlock') {
    renderCover();
    showUnlock();
  } else if (state.screen === 'gallery') {
    const y = window.scrollY;
    renderGallery();
    window.scrollTo(0, y);
    viewer.relabel();
  }
}

function onAppClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el || !app.contains(el)) return;
  switch (el.dataset.action) {
    case 'enter':
      onEnter();
      break;
    case 'back':
      renderCover();
      break;
    case 'lang':
      toggleLang();
      break;
    case 'reveal':
      toggleReveal(el);
      break;
    case 'set':
      setView(el.dataset.set);
      break;
    case 'favview':
      setView(state.view === 'fav' ? state.lastView : 'fav');
      break;
    case 'open':
      viewer.open(Number(el.dataset.index));
      break;
    case 'fav':
      toggleFav(el.dataset.id);
      if (state.view === 'fav') layoutGrid();
      break;
  }
}

boot();
