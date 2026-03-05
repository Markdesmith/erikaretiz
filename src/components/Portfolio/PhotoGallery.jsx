import { useState } from 'react';

export default function PhotoGallery({ photos }) {
  const [selected, setSelected] = useState(null);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="photo-gallery">
        {photos.map((photo, i) => (
          <div key={i} className="photo-gallery__item" onClick={() => setSelected(photo)}>
            <img src={photo} alt={`Portfolio ${i + 1}`} loading="lazy" />
          </div>
        ))}
      </div>

      {selected && (
        <div className="photo-lightbox" onClick={() => setSelected(null)}>
          <img src={selected} alt="Full size" />
          <button className="photo-lightbox__close" onClick={() => setSelected(null)}>×</button>
        </div>
      )}
    </>
  );
}
