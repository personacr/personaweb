// Editor de diseño de una galería: opciones con esquema + vista previa en vivo.
// Lo usan el panel (pestaña «Diseño») y la demo de raw.githack.com.
// La galería corre dentro de un iframe (?preview=1) y recibe el diseño por postMessage.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// Esquemas de cada opción (como los del panel de Pixieset, en el estilo del sitio).
const PH = (x, y, w, h) => `<rect class="ph" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const TX = (x, y, w) => `<rect class="tx" x="${x}" y="${y}" width="${w}" height="2.4" rx="1.2"/>`;
const ICONS = {
  rows: PH(2, 3, 16, 12) + PH(20, 3, 8, 12) + PH(30, 3, 16, 12) + PH(2, 17, 9, 12) + PH(13, 17, 20, 12) + PH(35, 17, 11, 12),
  columns: PH(2, 3, 13, 16) + PH(2, 21, 13, 8) + PH(17, 3, 14, 8) + PH(17, 13, 14, 16) + PH(33, 3, 13, 19) + PH(33, 24, 13, 5),
  contact: [2, 14, 26, 38].map((x) => PH(x, 3, 9, 12) + PH(x, 17, 9, 12)).join(''),
  single: PH(11, 2, 26, 17) + PH(15, 21, 18, 9),
  full: PH(0, 0, 48, 32) + TX(4, 22, 18) + TX(4, 26, 10),
  center: PH(0, 0, 48, 32) + TX(14, 14, 20) + TX(18, 18, 12),
  band: PH(0, 6, 48, 16) + TX(4, 25, 18) + TX(4, 29, 10),
  split: PH(0, 0, 24, 32) + TX(28, 14, 16) + TX(28, 18, 10),
  frame: PH(5, 5, 38, 22) + TX(9, 19, 16) + TX(9, 23, 9),
  titles: TX(13, 14, 22) + TX(18, 18, 12),
  shade0: PH(0, 0, 48, 32), shade1: PH(0, 0, 48, 32), shade2: PH(0, 0, 48, 32),
};
const DESIGN_OPTIONS = {
  cover: {
    title: 'Portada',
    items: [['full', 'Completa'], ['center', 'Centrada'], ['band', 'Franja 2,39:1'], ['split', 'Dividida'], ['frame', 'Marco'], ['titles', 'Créditos']],
    hints: {
      full: 'La foto llena la pantalla y el título va abajo a la izquierda.',
      center: 'La foto llena la pantalla y el título va al centro.',
      band: 'La foto en franja de cine 2,39:1, con el título debajo.',
      split: 'Mitad foto, mitad negro con el título. En el celular, la foto va arriba.',
      frame: 'La foto con un borde negro alrededor, como una pantalla en la sala.',
      titles: 'Solo el título sobre negro, como el inicio de una película. Sin foto.',
    },
  },
  shade: {
    title: 'Oscurecer la portada',
    items: [[0, 'Poco'], [1, 'Normal'], [2, 'Más']],
    hint: 'Más oscuro ayuda a leer el título cuando la foto es clara.',
  },
  grid: {
    title: 'Mosaico',
    items: [['rows', 'Filas parejas'], ['columns', 'Columnas'], ['contact', 'Hoja de contactos'], ['single', 'Una por una']],
    hints: {
      rows: 'Filas del mismo alto, como en el sitio. Lucen más las fotos horizontales.',
      columns: 'Columnas con cada foto entera. Lucen más las verticales, como los retratos.',
      contact: 'Todas del mismo tamaño, recortadas solo en la miniatura. Al abrirlas se ven completas.',
      single: 'Una foto grande después de otra. Para galerías cortas.',
    },
  },
  size: { title: 'Tamaño de las fotos', items: [['normal', 'Normal'], ['large', 'Grande']], hint: 'Grande muestra menos fotos por fila y más grandes.' },
  gap: { title: 'Espacio entre fotos', items: [['fine', 'Fino'], ['wide', 'Amplio']], hint: 'Fino es el espacio del sitio (3–4 px).' },
};

export function mountDesignEditor(box, { design, src, onSave, onDefault, onDirty = () => {}, note = 'Vista previa en vivo. El cliente ve los cambios solo cuando tocás «Guardar diseño».' }) {
  let saved = JSON.stringify(design);
  const d = { ...design };
  let device = innerWidth < 700 ? 'phone' : 'desktop';
  let screen = 'cover';

  const icon = (k, v) => (k === 'size' || k === 'gap' ? '' : `<svg viewBox="0 0 48 32" aria-hidden="true">${ICONS[k === 'shade' ? `shade${v}` : v] || ''}</svg>`);
  const group = (k) => {
    const o = DESIGN_OPTIONS[k];
    return `<div class="dz-group" data-group="${k}">
      <h3>${o.title}</h3>
      <div class="dz-opts${k === 'size' || k === 'gap' ? ' text' : ''}">${o.items.map(([v, label]) => `
        <button class="dz-opt${k === 'shade' ? ` shade-${v}` : ''}" type="button" data-k="${k}" data-v="${v}" aria-pressed="${String(d[k]) === String(v)}">${icon(k, v)}<span>${label}</span></button>`).join('')}</div>
      <p class="dz-hint" data-hint="${k}"></p>
    </div>`;
  };

  box.innerHTML = `
    <div class="design">
      <div class="dz-controls">
        ${['cover', 'shade', 'grid', 'size', 'gap'].map(group).join('')}
        <div class="dz-group form">
          <label>Mensaje de bienvenida (opcional)
            <textarea name="welcome_es" rows="4" maxlength="800" placeholder="Gracias por confiar en mí. Las fotos en alta están listas para imprimir.">${esc(d.welcome_es)}</textarea></label>
          <label>En inglés (opcional)
            <textarea name="welcome_en" rows="3" maxlength="800" placeholder="Thank you…">${esc(d.welcome_en)}</textarea>
            <span class="hint">Aparece arriba de las fotos, después de la contraseña. Para separar párrafos, dejá una línea en blanco.</span></label>
        </div>
        <div class="dz-save">
          <div class="row"><button class="btn blue" type="button" id="dz-save">Guardar diseño</button>
            <button class="btn" type="button" id="dz-default">Usar en galerías nuevas</button></div>
          <p class="msg-ok" id="dz-msg" role="status"></p>
        </div>
      </div>
      <div class="dz-preview">
        <div class="dz-bar">
          <div class="row"><button class="chip" type="button" data-device="desktop">Computadora</button><button class="chip" type="button" data-device="phone">Celular</button></div>
          <div class="row"><button class="chip" type="button" data-screen="cover">Portada</button><button class="chip" type="button" data-screen="gallery">Fotos</button></div>
        </div>
        <div class="dz-stage" id="dz-stage"><div class="dz-device" id="dz-device">
          <iframe id="dz-frame" title="Vista previa de la galería" src="${esc(src)}"></iframe>
        </div></div>
        <p class="dz-hint">${esc(note)}</p>
      </div>
    </div>`;

  const frame = $('#dz-frame');
  const stage = $('#dz-stage');
  const dev = $('#dz-device');
  const msg = $('#dz-msg');
  const send = (data) => frame.contentWindow?.postMessage(data, location.origin);
  const sendDesign = () => send({ type: 'pg:design', design: d });

  const paint = () => {
    $$('.dz-opt', box).forEach((b) => b.setAttribute('aria-pressed', String(String(d[b.dataset.k]) === b.dataset.v)));
    $$('[data-hint]', box).forEach((p) => {
      const o = DESIGN_OPTIONS[p.dataset.hint];
      p.textContent = o.hints ? o.hints[d[p.dataset.hint]] : o.hint;
    });
    $$('[data-device]', box).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.device === device)));
    $$('[data-screen]', box).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.screen === screen)));
    const unsaved = JSON.stringify(d) !== saved;
    onDirty(unsaved);
    $('#dz-save').classList.toggle('pending', unsaved);
    if (unsaved) { msg.className = 'msg-ok muted'; msg.textContent = 'Hay cambios sin guardar.'; }
    else if (msg.textContent === 'Hay cambios sin guardar.') msg.textContent = '';
  };

  // La vista previa se dibuja a tamaño real (1280 px o 390 px) y se achica para caber.
  const fit = () => {
    const size = device === 'desktop' ? { w: 1280, h: 800 } : { w: 390, h: 760 };
    const wide = matchMedia('(min-width:1100px)').matches;
    const room = stage.clientWidth - 28;
    // En el celular la vista previa queda arriba, fija, y ocupa menos de la mitad de la pantalla.
    const maxH = wide ? innerHeight - 190 : innerHeight * 0.4;
    const scale = Math.min(1, room / size.w, maxH / size.h);
    // En el celular la vista previa se queda fija debajo de la barra del panel y las pestañas.
    const top = ($('.top')?.offsetHeight || 0) + ($('.tabs')?.offsetHeight || 0);
    box.style.setProperty('--dz-top', `${top}px`);
    frame.style.width = `${size.w}px`;
    frame.style.height = `${size.h}px`;
    frame.style.transform = `scale(${scale})`;
    dev.style.width = `${Math.floor(size.w * scale)}px`;
    dev.style.height = `${Math.floor(size.h * scale)}px`;
  };
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);

  const onMessage = (e) => {
    if (!document.body.contains(frame)) return removeEventListener('message', onMessage);
    if (e.origin !== location.origin || e.source !== frame.contentWindow || e.data?.type !== 'pg:ready') return;
    sendDesign();
    if (screen === 'gallery') send({ type: 'pg:screen', screen });
  };
  addEventListener('message', onMessage);

  box.addEventListener('click', async (e) => {
    const opt = e.target.closest('.dz-opt');
    const devB = e.target.closest('[data-device]');
    const scrB = e.target.closest('[data-screen]');
    if (opt) {
      const k = opt.dataset.k;
      d[k] = k === 'shade' ? Number(opt.dataset.v) : opt.dataset.v;
      if (k === 'cover' || k === 'shade') { screen = 'cover'; send({ type: 'pg:screen', screen }); }
      if (k === 'grid' || k === 'size' || k === 'gap') { screen = 'gallery'; send({ type: 'pg:screen', screen }); }
      sendDesign();
      paint();
    } else if (devB) {
      device = devB.dataset.device;
      fit();
      paint();
    } else if (scrB) {
      screen = scrB.dataset.screen;
      send({ type: 'pg:screen', screen });
      paint();
    }
  });

  let typing = 0;
  box.addEventListener('input', (e) => {
    if (!['welcome_es', 'welcome_en'].includes(e.target.name)) return;
    d[e.target.name] = e.target.value;
    clearTimeout(typing);
    typing = setTimeout(() => {
      if (screen !== 'gallery') { screen = 'gallery'; send({ type: 'pg:screen', screen }); }
      sendDesign();
      paint();
    }, 350);
  });

  $('#dz-save').addEventListener('click', async () => {
    try {
      const text = await onSave({ ...d });
      saved = JSON.stringify(d);
      paint();
      msg.className = 'msg-ok';
      msg.textContent = text;
    } catch (x) {
      msg.className = 'msg-err';
      msg.textContent = x.message;
    }
  });
  $('#dz-default').addEventListener('click', async () => {
    try {
      const text = await onDefault({ ...d });
      msg.className = 'msg-ok';
      msg.textContent = text;
    } catch (x) {
      msg.className = 'msg-err';
      msg.textContent = x.message;
    }
  });

  paint();
}
