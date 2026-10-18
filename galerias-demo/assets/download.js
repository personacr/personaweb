// Descargas del cliente.
//   · Una foto: en el celular se ofrece «Guardar en Fotos» (menú de compartir); si no, baja el JPG.
//   · Varias (favoritas o una sección): en el celular, a Fotos de una vez si el teléfono lo permite;
//     si no, se arma un ZIP aquí mismo, en el navegador.
//   · Toda la galería: el ZIP que ya está listo en la nube (se armó al subir las fotos).

const base = (slug) => `/api/g/${encodeURIComponent(slug)}/dl`;
export const photoUrl = (slug, id, size, inline = false) => `${base(slug)}/photo/${id}?size=${size}${inline ? '&inline=1' : ''}`;
export const zipUrl = (slug, size) => `${base(slug)}/zip?size=${size}`;

const touch = () => matchMedia('(hover: none) and (pointer: coarse)').matches;
const SHARE_MAX = 30; // más fotos que esto al menú de compartir se vuelve incómodo: mejor ZIP

export function nameFor(photo, size) {
  return size === 'web' ? photo.name.replace(/(\.[^.]+)?$/, '-web.jpg') : photo.name;
}

// Descarga directa con un enlace (el navegador muestra su propio progreso).
export function saveLink(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function fetchBlob(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw Object.assign(new Error(`http_${res.status}`), { status: res.status });
  return res.blob();
}

// ¿Se puede mandar a Fotos con el menú de compartir?
function canShareFiles(n) {
  if (!touch() || !navigator.canShare || n > SHARE_MAX) return false;
  try {
    return navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/jpeg' })], 'x.jpg', { type: 'image/jpeg' })] });
  } catch {
    return false;
  }
}
export const shareAvailable = (n = 1) => canShareFiles(n);

// Guarda fotos. Devuelve 'shared' | 'zip' | 'file' | 'cancelled'.
export async function savePhotos({ slug, photos, size, zipName, onProgress }) {
  if (photos.length === 1 && !canShareFiles(1)) {
    saveLink(photoUrl(slug, photos[0].id, size));
    return 'file';
  }
  const files = [];
  for (let i = 0; i < photos.length; i++) {
    onProgress?.(i, photos.length);
    const p = photos[i];
    const blob = await fetchBlob(photoUrl(slug, p.id, size, true));
    files.push(new File([blob], nameFor(p, size), { type: 'image/jpeg' }));
  }
  onProgress?.(photos.length, photos.length);
  if (canShareFiles(files.length)) {
    try {
      await navigator.share({ files });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      // Si compartir falla, seguimos con el ZIP.
    }
  }
  if (files.length === 1) {
    saveBlob(files[0], files[0].name);
    return 'file';
  }
  saveBlob(await makeZip(files), zipName);
  return 'zip';
}

/* ZIP sencillo en memoria (sin compresión: los JPG no se achican). */
const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function makeZip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const used = new Set();
  for (const f of files) {
    let name = f.name;
    for (let k = 2; used.has(name); k++) name = f.name.replace(/(\.[^.]+)?$/, `-${k}$1`);
    used.add(name);
    const data = new Uint8Array(await f.arrayBuffer());
    const nb = enc.encode(name);
    const crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
    h.setUint16(26, nb.length, true);
    parts.push(h.buffer, nb, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, nb.length, true); c.setUint32(42, offset, true);
    central.push(c.buffer, nb);
    offset += 30 + nb.length + data.length;
  }
  const cdSize = central.reduce((n, x) => n + x.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}
