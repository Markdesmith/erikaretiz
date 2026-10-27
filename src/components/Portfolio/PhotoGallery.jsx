import { useState, useEffect, useCallback } from 'react';

export default function PhotoGallery({ photos }) {
  const [selected, setSelected] = useState(null);
  const count = photos?.length || 0;

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

  if (count === 0) return null;

  return (
    <>
      <div className="photo-gallery">
        {photos.map((photo, i) => (
          <button key={i} type="button" className="photo-gallery__item" onClick={() => setSelected(i)}>
            <img src={photo} alt={`Portfolio ${i + 1}`} loading="lazy" />
            <span className="photo-gallery__caption">Look {String(i + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>

      {selected != null && (
        <div className="photo-lightbox" role="dialog" aria-modal="true" onClick={close}>
          <img src={photos[selected]} alt={`Portfolio ${selected + 1}`} onClick={(e) => e.stopPropagation()} />
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
