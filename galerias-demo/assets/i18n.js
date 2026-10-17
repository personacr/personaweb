// Textos de la interfaz. Mismo tono que persona.cr: directo, sencillo, voseo.

const DICT = {
  es: {
    other: 'en',
    menu: 'Menú',
    private: 'Galería privada',
    privatePlural: 'Galerías privadas',
    photos: 'fotos',
    photo1: 'foto',
    viewGallery: 'Ver galería',
    password: 'Contraseña',
    enter: 'Entrar',
    entering: 'Entrando…',
    back: 'Volver',
    show: 'Mostrar',
    hide: 'Ocultar',
    errEmpty: 'Escribí la contraseña.',
    errWrong: 'Esa contraseña no coincide. Revisá mayúsculas y minúsculas.',
    errMany: 'Demasiados intentos. Esperá unos minutos y volvé a probar.',
    errNetwork: 'Sin conexión. Revisá tu internet y volvé a probar.',
    errGeneric: 'No se pudo abrir la galería. Probá de nuevo en un momento.',
    sections: 'Secciones de la galería',
    all: 'Todas',
    favorites: 'Favoritas',
    favEmpty: 'Tocá el corazón de una foto para guardarla acá.',
    favCount: '{n} favoritas',
    favCountOne: '1 favorita',
    openPhoto: 'Abrir foto {n}',
    addFav: 'Agregar a favoritas',
    removeFav: 'Quitar de favoritas',
    favorite: 'Favorita',
    viewer: 'Foto ampliada',
    close: 'Cerrar',
    prev: 'Anterior',
    next: 'Siguiente',
    write: 'Escribime',
    notFoundTitle: 'galería no encontrada',
    notFoundBody: 'Revisá que el enlace esté completo: al copiarlo de WhatsApp a veces se corta.',
    expiredTitle: 'galería cerrada',
    expiredBody: 'El acceso a estas fotos venció. Escribime y la vuelvo a abrir.',
    homeTitle: 'galerías privadas',
    homeBody: 'Para ver tus fotos, abrí el enlace que te envié por WhatsApp o correo.',
  },
  en: {
    other: 'es',
    menu: 'Menu',
    private: 'Private gallery',
    privatePlural: 'Private galleries',
    photos: 'photos',
    photo1: 'photo',
    viewGallery: 'View gallery',
    password: 'Password',
    enter: 'Enter',
    entering: 'Opening…',
    back: 'Back',
    show: 'Show',
    hide: 'Hide',
    errEmpty: 'Type the password.',
    errWrong: "That password doesn't match. Check upper and lower case.",
    errMany: 'Too many attempts. Wait a few minutes and try again.',
    errNetwork: "You're offline. Check your connection and try again.",
    errGeneric: "The gallery couldn't open. Try again in a moment.",
    sections: 'Gallery sections',
    all: 'All',
    favorites: 'Favorites',
    favEmpty: 'Tap the heart on a photo to keep it here.',
    favCount: '{n} favorites',
    favCountOne: '1 favorite',
    openPhoto: 'Open photo {n}',
    addFav: 'Add to favorites',
    removeFav: 'Remove from favorites',
    favorite: 'Favorite',
    viewer: 'Enlarged photo',
    close: 'Close',
    prev: 'Previous',
    next: 'Next',
    write: 'Get in touch',
    notFoundTitle: 'gallery not found',
    notFoundBody: 'Check that the link is complete: links copied from WhatsApp sometimes get cut off.',
    expiredTitle: 'gallery closed',
    expiredBody: "Access to these photos has expired. Write to me and I'll reopen it.",
    homeTitle: 'private galleries',
    homeBody: 'To see your photos, open the link I sent you by WhatsApp or email.',
  },
};

let lang = 'es';

export function setLang(next) {
  lang = DICT[next] ? next : 'es';
  document.documentElement.lang = lang;
}

export function getLang() {
  return lang;
}

export function t(key, vars) {
  let s = DICT[lang]?.[key] ?? DICT.es[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
}
