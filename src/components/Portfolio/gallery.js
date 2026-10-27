// Photo gallery data stored as JSON in a portfolio item's `content`.
// Older galleries were a plain array of image URLs; parseGallery upgrades them on read.

export const DEFAULT_SETTINGS = { layout: 'editorial', bwHover: true, captions: true };

function stableId(url) {
  let h = 0;
  for (let i = 0; i < url.length; i += 1) h = (h * 31 + url.charCodeAt(i)) | 0;
  return `p${(h >>> 0).toString(36)}`;
}

export function newId(prefix = 'p') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function toPhoto(p) {
  if (typeof p === 'string') p = { url: p };
  return {
    id: p.id || stableId(p.url || ''),
    url: p.url || '',
    thumb: p.thumb || '',
    original: p.original || p.url || '',
    originalThumb: p.originalThumb ?? p.thumb ?? '',
    edit: p.edit || null,
    caption: p.caption || '',
    alt: p.alt || '',
    categories: p.categories || [],
    featured: Boolean(p.featured),
    hidden: Boolean(p.hidden),
    width: p.width || null,
    height: p.height || null,
  };
}

export function parseGallery(content) {
  let data;
  try {
    data = JSON.parse(content || '[]');
  } catch {
    data = [];
  }
  if (Array.isArray(data)) data = { photos: data };
  return {
    version: 2,
    photos: (data.photos || []).filter(Boolean).map(toPhoto),
    categories: data.categories || [],
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
  };
}

export const serializeGallery = (gallery) => JSON.stringify({ ...gallery, version: 2 });

export const visiblePhotos = (gallery) => gallery.photos.filter((p) => !p.hidden && p.url);

export const thumbOf = (photo) => photo.thumb || photo.url;
