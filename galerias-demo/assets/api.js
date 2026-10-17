// Datos de prueba para la demo (reemplaza a api.js). Usa las fotos de Sala de Espera
// que ya están publicadas en www.persona.cr. Contraseña de la demo: persona
// Portada en franja de cine: agregá ?portada=franja a la dirección.

const PASSWORD = 'persona';
const BASE = '../img/photo/teatro/sala-de-espera-teatro-2026-';

const FOTOS = [ // número, sección, ancho, alto, color de fondo (del contenido del sitio)
  [1, 'camerino', 1000, 667, '#2f2f2f'], [2, 'camerino', 1000, 667, '#393939'], [3, 'camerino', 667, 1000, '#444444'],
  [4, 'camerino', 1000, 667, '#474747'], [5, 'afiche', 800, 1000, '#4c4e54'], [6, 'afiche', 800, 1000, '#2b2d31'],
  [7, 'afiche', 800, 1000, '#2a2c30'], [8, 'afiche', 800, 1000, '#2c2f35'], [9, 'afiche', 800, 1000, '#232a33'],
  [10, 'funcion', 1000, 667, '#1d1c22'], [11, 'funcion', 667, 1000, '#2a2324'], [12, 'funcion', 1000, 667, '#211b1a'],
  [13, 'funcion', 1000, 667, '#121014'],
];

const src = (n, w) => `${BASE}${String(n).padStart(2, '0')}-${w}.webp`;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const franja = new URLSearchParams(location.search).get('portada') === 'franja';
let unlocked = false;
try { unlocked = sessionStorage.getItem('demo:unlocked') === '1'; } catch { /* modo privado */ }

export const api = {
  async meta() {
    return {
      title: 'Maracuyá',
      subtitle: 'La sala de espera',
      eventDate: '2026-09-08',
      coverStyle: franja ? 'band' : 'full',
      focal: franja ? [0.5, 0.3] : [0.5, 0.22],
      lang: 'es',
      studio: 'PERSONA',
      unlocked,
      cover: { w: 800, h: 1000, color: '#232a33', md: src(9, 1280), web: src(9, 2048) },
    };
  },
  async unlock(slug, password) {
    await pause(400);
    if (password !== PASSWORD) {
      const err = new Error('wrong');
      err.status = 401;
      throw err;
    }
    try { sessionStorage.setItem('demo:unlocked', '1'); } catch { /* modo privado */ }
    return { ok: true };
  },
  async photos() {
    return {
      sets: [
        { id: 'camerino', title: 'Camerino' },
        { id: 'afiche', title: 'Afiche' },
        { id: 'funcion', title: 'Función' },
      ],
      photos: FOTOS.map(([n, set, w, h, c]) => ({
        id: `demo${String(n).padStart(2, '0')}`,
        set,
        name: `PERSONA_${1040 + n}.jpg`,
        w,
        h,
        c,
        sm: src(n, 640),
        md: src(n, 1280),
        web: src(n, 2048),
      })),
      favoritesEnabled: true,
      downloads: { enabled: true, sizes: ['original', 'web'], pin: false },
    };
  },
  track() {},
};
