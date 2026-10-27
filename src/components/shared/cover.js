// Settings for the actor-page cover, stored in siteConfig.cover and edited in the admin.
export const DEFAULT_COVER = {
  photo: '', // empty = first headshot
  focusX: 50,
  focusY: 50,
  zoom: 100,
  mobileFocusX: 50,
  mobileFocusY: 50,
  mobileZoom: 100,
  blackAndWhite: true,
  brightness: 110,
  shade: 100,
  masthead: '', // empty = site title
  kickerLeft: 'Actor Portfolio',
  kickerRight: 'Vol. 01 — {year}',
  showCoverLines: true,
  credit: '', // e.g. photographer, shown small along the edge
};

export function resolveCover(config) {
  return { ...DEFAULT_COVER, ...(config?.cover || {}) };
}

export function withYear(text) {
  return (text || '').replace('{year}', new Date().getFullYear());
}

// CSS custom properties consumed by .cover in Actress.css and by the admin preview.
export function coverVars(cover) {
  return {
    '--cover-x': `${cover.focusX}%`,
    '--cover-y': `${cover.focusY}%`,
    '--cover-zoom': cover.zoom / 100,
    '--cover-mx': `${cover.mobileFocusX}%`,
    '--cover-my': `${cover.mobileFocusY}%`,
    '--cover-mzoom': cover.mobileZoom / 100,
    '--cover-gray': cover.blackAndWhite ? 1 : 0,
    '--cover-bright': cover.brightness / 100,
    '--cover-shade': cover.shade / 100,
  };
}
