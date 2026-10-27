// Client-side image processing for the gallery editor: resizing uploads,
// rotate / straighten / crop, and colour adjustments applied pixel by pixel
// so the result looks identical in every browser.

export const MASTER_SIZE = 2400;
export const THUMB_SIZE = 640;

export const DEFAULT_ADJUST = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, fade: 0 };

export const PRESETS = [
  { id: 'original', name: 'Original', adjust: {} },
  { id: 'bw', name: 'Black & White', adjust: { saturation: -100, contrast: 10 } },
  { id: 'noir', name: 'Noir', adjust: { saturation: -100, contrast: 35, brightness: -5 } },
  { id: 'warm', name: 'Warm', adjust: { warmth: 25, saturation: 10 } },
  { id: 'cool', name: 'Cool', adjust: { warmth: -25, saturation: -5 } },
  { id: 'matte', name: 'Matte', adjust: { contrast: -15, fade: 35, saturation: -10 } },
  { id: 'film', name: 'Film', adjust: { contrast: 10, saturation: -15, warmth: 12, fade: 20 } },
];

export const DEFAULT_EDIT = {
  rotate: 0, // quarter turns, 0-3
  straighten: 0, // degrees, -15..15
  flip: false,
  aspect: 'original',
  crop: null, // { x, y, w, h } as fractions of the rotated image
  preset: 'original',
  ...DEFAULT_ADJUST,
};

export const ASPECTS = [
  { id: 'original', name: 'Original', ratio: null },
  { id: 'free', name: 'Free', ratio: null },
  { id: '4:5', name: '4:5', ratio: 4 / 5 },
  { id: '3:4', name: '3:4', ratio: 3 / 4 },
  { id: '2:3', name: '2:3', ratio: 2 / 3 },
  { id: '1:1', name: 'Square', ratio: 1 },
  { id: '16:9', name: '16:9', ratio: 16 / 9 },
];

export function isEdited(edit) {
  if (!edit) return false;
  return Object.keys(DEFAULT_EDIT).some((k) => JSON.stringify(edit[k]) !== JSON.stringify(DEFAULT_EDIT[k]));
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function fit(w, h, max) {
  const s = Math.min(1, max / Math.max(w, h));
  return [Math.round(w * s), Math.round(h * s)];
}

export async function decodeFile(file) {
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

// Loads a remote image through fetch so the canvas stays readable (needs CORS on the bucket).
export async function loadImage(url) {
  let res;
  try {
    res = await fetch(url, { mode: 'cors', cache: 'no-store' });
  } catch {
    throw new Error('This photo can’t be opened for editing yet (storage CORS isn’t set up). Try again after the next deploy.');
  }
  if (!res.ok) throw new Error(`Couldn’t load photo (${res.status})`);
  return createImageBitmap(await res.blob());
}

export function scaledCanvas(source, max) {
  const [w, h] = fit(source.width, source.height, max);
  const c = canvas(w, h);
  c.getContext('2d').drawImage(source, 0, 0, w, h);
  return c;
}

export function toBlob(c, quality = 0.88) {
  return new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Image export failed'))), 'image/jpeg', quality);
  });
}

// Resize an upload into a web-sized master and a thumbnail.
export async function prepareUpload(file) {
  const bitmap = await decodeFile(file);
  const master = scaledCanvas(bitmap, MASTER_SIZE);
  const thumb = scaledCanvas(bitmap, THUMB_SIZE);
  const result = {
    master: await toBlob(master, 0.88),
    thumb: await toBlob(thumb, 0.82),
    width: master.width,
    height: master.height,
  };
  bitmap.close?.();
  return result;
}

// Rotation (quarter turns + straighten, auto-zoomed so no empty corners) and flip.
export function rotatedCanvas(source, edit) {
  const quarter = ((edit.rotate % 4) + 4) % 4;
  const swap = quarter % 2 === 1;
  const W = swap ? source.height : source.width;
  const H = swap ? source.width : source.height;
  const theta = ((edit.straighten || 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(theta));
  const sin = Math.abs(Math.sin(theta));
  const cover = Math.max((W * cos + H * sin) / W, (W * sin + H * cos) / H);
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(W / 2, H / 2);
  ctx.rotate(quarter * (Math.PI / 2) + theta);
  ctx.scale(cover * (edit.flip ? -1 : 1), cover);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return c;
}

export function defaultCrop(width, height, aspectId) {
  const ratio = ASPECTS.find((a) => a.id === aspectId)?.ratio;
  if (!ratio) return { x: 0, y: 0, w: 1, h: 1 };
  const imgRatio = width / height;
  if (ratio > imgRatio) {
    const h = imgRatio / ratio;
    return { x: 0, y: (1 - h) / 2, w: 1, h };
  }
  const w = ratio / imgRatio;
  return { x: (1 - w) / 2, y: 0, w, h: 1 };
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

export function applyAdjustments(c, adjust) {
  const { brightness = 0, contrast = 0, saturation = 0, warmth = 0, fade = 0 } = adjust;
  if (!brightness && !contrast && !saturation && !warmth && !fade) return c;
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const b = 1 + brightness / 100;
  const k = 1 + contrast / 100;
  const s = 1 + saturation / 100;
  const warm = warmth * 0.35;
  const lift = fade * 0.4;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] * b;
    let g = d[i + 1] * b;
    let bl = d[i + 2] * b;
    r = (r - 128) * k + 128;
    g = (g - 128) * k + 128;
    bl = (bl - 128) * k + 128;
    r += warm;
    bl -= warm;
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    r = gray + (r - gray) * s;
    g = gray + (g - gray) * s;
    bl = gray + (bl - gray) * s;
    if (lift) {
      r += lift * (1 - r / 255);
      g += lift * (1 - g / 255);
      bl += lift * (1 - bl / 255);
    }
    d[i] = clamp255(r);
    d[i + 1] = clamp255(g);
    d[i + 2] = clamp255(bl);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Full pipeline: rotate -> crop -> resize -> adjust.
export function renderEdit(source, edit, maxSize = MASTER_SIZE) {
  const rotated = rotatedCanvas(source, edit);
  const crop = edit.crop || defaultCrop(rotated.width, rotated.height, edit.aspect);
  const sx = crop.x * rotated.width;
  const sy = crop.y * rotated.height;
  const sw = crop.w * rotated.width;
  const sh = crop.h * rotated.height;
  const [w, h] = fit(sw, sh, maxSize);
  const out = canvas(w, h);
  const ctx = out.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(rotated, sx, sy, sw, sh, 0, 0, w, h);
  return applyAdjustments(out, edit);
}
