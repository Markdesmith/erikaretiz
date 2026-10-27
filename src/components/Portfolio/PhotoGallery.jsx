import { useState, useEffect, useCallback } from 'react';
import { visiblePhotos, thumbOf, creditsOf } from './gallery';

// Editorial layout: photos are laid out in groups whose widths always fill the
// 12-column grid exactly (two rows per group), so there are never gaps.
// c/r = desktop column/row span, m = big tile on phones.
const GROUP_A = [{ c: 5, r: 2, m: true }, { c: 4, r: 1 }, { c: 3, r: 1 }, { c: 7, r: 1 }];
const GROUP_B = [{ c: 4, r: 2 }, { c: 4, r: 2 }, { c: 4, r: 2 }];
const LEFTOVER = { 1: [{ c: 12, r: 2, m: true }], 2: [{ c: 6, r: 2 }, { c: 6, r: 2 }], 3: GROUP_B };

function planEditorial(photos) {
  const plan = [];
  let i = 0;
  let useA = true;
  while (i < photos.length) {
    if (photos[i].featured) {
      const followers = [];
      for (let j = i + 1; j < photos.length && followers.length < 2 && !photos[j].featured; j += 1) followers.push(j);
      if (followers.length === 0) plan.push({ c: 12, r: 2, m: true });
      else if (followers.length === 1) plan.push({ c: 8, r: 2, m: true }, { c: 4, r: 2 });
      else plan.push({ c: 8, r: 2, m: true }, { c: 4, r: 1 }, { c: 4, r: 1 });
      i += 1 + followers.length;
      continue;
    }
    let run = 0;
    while (i + run < photos.length && !photos[i + run].featured) run += 1;
    const group = useA ? GROUP_A : GROUP_B;
    const take = run >= group.length ? group : LEFTOVER[run] || GROUP_B.slice(0, run);
    plan.push(...take);
    i += take.length;
    useA = !useA;
  }
  // Phones use two columns: small tiles must come in pairs, so an odd one out goes full width.
  let smalls = 0;
  plan.forEach((tile, k) => {
    if (tile.m) {
      if (smalls % 2) plan[k - 1] = { ...plan[k - 1], m: true };
      smalls = 0;
    } else {
      smalls += 1;
    }
  });
  if (smalls % 2) plan[plan.length - 1] = { ...plan[plan.length - 1], m: true };
  return plan;
}

export default function PhotoGallery({ gallery }) {
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const { settings } = gallery;
  const photos = visiblePhotos(gallery);
  const usedCategories = gallery.categories.filter((c) => photos.some((p) => p.categories.includes(c.id)));
  const shown = category === 'all' ? photos : photos.filter((p) => p.categories.includes(category));
  const count = shown.length;
  const plan = gallery.settings.layout === 'editorial' ? planEditorial(shown) : [];

  const close = useCallback(() => setSelected(null), []);
  const step = useCallback((dir) => setSelected((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    if (selected == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selected, close, step]);

  if (photos.length === 0) return null;

  const current = selected != null ? shown[selected] : null;
  const classes = [
    'photo-gallery',
    `photo-gallery--${settings.layout}`,
    settings.bwHover ? '' : 'photo-gallery--color',
  ].join(' ');

  return (
    <>
      {usedCategories.length > 0 && (
        <div className="gallery-filters" role="tablist" aria-label="Filter photos">
          {[{ id: 'all', name: 'All' }, ...usedCategories].map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={category === c.id}
              className={category === c.id ? 'is-active' : ''} onClick={() => { setCategory(c.id); setSelected(null); }}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className={classes} key={category}>
        {shown.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            className={`photo-gallery__item ${photo.featured ? 'is-featured' : ''} ${plan[i]?.m ? 'is-big' : ''}`}
            style={plan[i] ? { '--c': plan[i].c, '--r': plan[i].r } : undefined}
            onClick={() => setSelected(i)}
            aria-label={photo.alt || photo.caption || `Open photo ${i + 1}`}
          >
            <img
              src={thumbOf(photo)}
              srcSet={photo.thumb ? `${photo.thumb} 640w, ${photo.url} 2400w` : undefined}
              sizes={photo.featured || (plan[i] && plan[i].c >= 6) ? '(max-width: 860px) 100vw, 66vw' : '(max-width: 860px) 50vw, 33vw'}
              alt={photo.alt || ''}
              loading="lazy"
              width={photo.width || undefined}
              height={photo.height || undefined}
            />
            {settings.captions && creditsOf(photo, settings)[0] && (
              <span className="photo-gallery__credit" aria-hidden="true">{creditsOf(photo, settings)[0][1]}</span>
            )}
            <span className="photo-gallery__caption">
              {settings.captions && photo.caption ? photo.caption : `Look ${String(i + 1).padStart(2, '0')}`}
            </span>
          </button>
        ))}
      </div>

      {current && (
        <div className="photo-lightbox" role="dialog" aria-modal="true" onClick={close}>
          <figure className="photo-lightbox__figure" onClick={(e) => e.stopPropagation()}>
            <img src={current.url} alt={current.alt || ''} />
            {settings.captions && (current.caption || creditsOf(current, settings).length > 0) && (
              <figcaption>
                {current.caption && <span className="photo-lightbox__caption">{current.caption}</span>}
                {creditsOf(current, settings).length > 0 && (
                  <span className="photo-lightbox__credits">
                    {creditsOf(current, settings).map(([role, name]) => (
                      <span key={role}>{role} <b>{name}</b></span>
                    ))}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
          <button type="button" className="photo-lightbox__close" onClick={close} aria-label="Close">×</button>
          {count > 1 && (
            <>
              <button type="button" className="photo-lightbox__nav photo-lightbox__nav--prev" aria-label="Previous photo"
                onClick={(e) => { e.stopPropagation(); step(-1); }}>←</button>
              <button type="button" className="photo-lightbox__nav photo-lightbox__nav--next" aria-label="Next photo"
                onClick={(e) => { e.stopPropagation(); step(1); }}>→</button>
            </>
          )}
          <span className="photo-lightbox__count">{String(selected + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
        </div>
      )}
    </>
  );
}
