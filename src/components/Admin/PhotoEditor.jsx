import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadBlob, deleteFiles } from '../../firebase/hooks';
import {
  ASPECTS, DEFAULT_ADJUST, DEFAULT_EDIT, MASTER_SIZE, PRESETS, THUMB_SIZE,
  defaultCrop, isEdited, loadImage, renderEdit, rotatedCanvas, scaledCanvas, toBlob,
} from '../../lib/images';

const PREVIEW_SIZE = 1100;
const MIN_CROP = 0.06;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const SLIDERS = [
  ['brightness', 'Brightness'],
  ['contrast', 'Contrast'],
  ['saturation', 'Saturation'],
  ['warmth', 'Warmth'],
  ['fade', 'Fade'],
];

export default function PhotoEditor({ photo, categories, galleryPath, onSave, onClose, onDelete, onUseAsCover }) {
  const [edit, setEdit] = useState({ ...DEFAULT_EDIT, ...(photo.edit || {}) });
  const [details, setDetails] = useState({
    caption: photo.caption, alt: photo.alt, categories: photo.categories, featured: photo.featured, hidden: photo.hidden,
  });
  const [tab, setTab] = useState('crop');
  const [source, setSource] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadImage(photo.original || photo.url)
      .then((bitmap) => !cancelled && setSource(bitmap))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [photo.original, photo.url]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, saving]);

  const preview = useMemo(() => (source ? scaledCanvas(source, PREVIEW_SIZE) : null), [source]);
  const { rotate, straighten, flip } = edit;
  const rotated = useMemo(
    () => (preview ? rotatedCanvas(preview, { rotate, straighten, flip }) : null),
    [preview, rotate, straighten, flip],
  );
  const crop = rotated ? edit.crop || defaultCrop(rotated.width, rotated.height, edit.aspect) : null;
  const [cx, cy, cw, ch] = crop ? [crop.x, crop.y, crop.w, crop.h] : [0, 0, 1, 1];
  const ratio = ASPECTS.find((a) => a.id === edit.aspect)?.ratio
    ?? (edit.aspect === 'original' && rotated ? rotated.width / rotated.height : null);

  // Small previews for each filter preset, based on the current crop.
  const presetThumbs = useMemo(() => {
    if (!rotated) return {};
    const small = renderEdit(rotated, { ...DEFAULT_EDIT, crop: { x: cx, y: cy, w: cw, h: ch } }, 220);
    return Object.fromEntries(PRESETS.map((p) => [
      p.id,
      renderEdit(small, { ...DEFAULT_EDIT, ...DEFAULT_ADJUST, ...p.adjust }, 220).toDataURL('image/jpeg', 0.7),
    ]));
  }, [rotated, cx, cy, cw, ch]);

  // Draw: the whole rotated photo while cropping, the finished result otherwise.
  useEffect(() => {
    if (!rotated || !canvasRef.current) return undefined;
    const frame = requestAnimationFrame(() => {
      const out = tab === 'crop' ? rotated : renderEdit(preview, { ...edit, crop }, PREVIEW_SIZE);
      const c = canvasRef.current;
      if (!c) return;
      c.width = out.width;
      c.height = out.height;
      c.getContext('2d').drawImage(out, 0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [tab, rotated, preview, edit, crop]);

  const set = (patch) => setEdit((e) => ({ ...e, ...patch }));
  const setRotation = (patch) => set({ ...patch, crop: null });

  const choosePreset = (preset) => set({ preset: preset.id, ...DEFAULT_ADJUST, ...preset.adjust });

  const startDrag = (mode) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    drag.current = { mode, rect, x: e.clientX, y: e.clientY, crop0: crop };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / d.rect.width;
    const dy = (e.clientY - d.y) / d.rect.height;
    const { x: x0, y: y0, w: w0, h: h0 } = d.crop0;
    if (d.mode === 'move') {
      set({ crop: { x: clamp(x0 + dx, 0, 1 - w0), y: clamp(y0 + dy, 0, 1 - h0), w: w0, h: h0 } });
      return;
    }
    const west = d.mode.includes('w');
    const north = d.mode.includes('n');
    const ax = west ? x0 + w0 : x0;
    const ay = north ? y0 + h0 : y0;
    const maxW = west ? ax : 1 - ax;
    const maxH = north ? ay : 1 - ay;
    let w = clamp(west ? w0 - dx : w0 + dx, MIN_CROP, maxW);
    let h;
    if (ratio) {
      const k = rotated.width / (rotated.height * ratio);
      h = w * k;
      if (h > maxH) { h = maxH; w = h / k; }
      if (h < MIN_CROP) { h = MIN_CROP; w = h / k; }
    } else {
      h = clamp(north ? h0 - dy : h0 + dy, MIN_CROP, maxH);
    }
    set({ crop: { x: west ? ax - w : ax, y: north ? ay - h : ay, w, h } });
  };

  const endDrag = () => { drag.current = null; };

  const toggleCategory = (id) => setDetails((d) => ({
    ...d,
    categories: d.categories.includes(id) ? d.categories.filter((c) => c !== id) : [...d.categories, id],
  }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const nextEdit = isEdited(edit) ? { ...edit, crop: edit.crop || null } : null;
      const editChanged = JSON.stringify(nextEdit) !== JSON.stringify(photo.edit && isEdited(photo.edit) ? photo.edit : null);
      let updated = { ...photo, ...details };
      if (editChanged) {
        const oldEditFiles = [photo.url, photo.thumb].filter((u) => u && u !== photo.original && u !== photo.originalThumb);
        if (nextEdit) {
          const full = renderEdit(source, nextEdit, MASTER_SIZE);
          const stamp = Date.now();
          const [url, thumb] = await Promise.all([
            uploadBlob(`${galleryPath}/${photo.id}/edit-${stamp}.jpg`, await toBlob(full, 0.88)),
            uploadBlob(`${galleryPath}/${photo.id}/edit-${stamp}-thumb.jpg`, await toBlob(scaledCanvas(full, THUMB_SIZE), 0.82)),
          ]);
          updated = { ...updated, url, thumb, edit: nextEdit, width: full.width, height: full.height };
        } else {
          updated = { ...updated, url: photo.original, thumb: photo.originalThumb, edit: null };
        }
        await onSave(updated);
        deleteFiles(oldEditFiles);
      } else {
        await onSave(updated);
      }
      onClose();
    } catch (err) {
      setError('Couldn’t save: ' + err.message);
      setSaving(false);
    }
  };

  const edited = isEdited(edit);
  const editChanged = JSON.stringify(edited ? edit : null) !== JSON.stringify(photo.edit && isEdited(photo.edit) ? { ...DEFAULT_EDIT, ...photo.edit } : null);

  return (
    <div className="photo-editor" role="dialog" aria-modal="true" aria-label="Edit photo">
      <div className="photo-editor__stage" onPointerMove={onDragMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        {!source && !error && <div className="photo-editor__loading">Loading photo…</div>}
        {error && !source && <div className="photo-editor__error">{error}</div>}
        <div className="photo-editor__canvas" style={{ display: source ? 'block' : 'none' }}>
          <canvas ref={canvasRef} />
          {tab === 'crop' && crop && (
            <div
              className="photo-editor__crop"
              style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }}
              onPointerDown={startDrag('move')}
            >
              <span className="photo-editor__grid" />
              {['nw', 'ne', 'sw', 'se'].map((m) => (
                <span key={m} className={`photo-editor__handle photo-editor__handle--${m}`} onPointerDown={startDrag(m)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="photo-editor__panel">
        <div className="photo-editor__tabs" role="tablist">
          {[['crop', 'Crop'], ['adjust', 'Filters'], ['details', 'Details']].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id}
              className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        <div className="photo-editor__body">
          {tab === 'crop' && (
            <>
              <h4>Shape</h4>
              <div className="photo-editor__chips">
                {ASPECTS.map((a) => (
                  <button key={a.id} type="button" className={edit.aspect === a.id ? 'is-active' : ''}
                    onClick={() => set({ aspect: a.id, crop: null })}>{a.name}</button>
                ))}
              </div>
              <p className="photo-editor__hint">Drag the box to move it, drag a corner to resize.</p>
              <h4>Rotate</h4>
              <div className="photo-editor__chips">
                <button type="button" onClick={() => setRotation({ rotate: (edit.rotate + 3) % 4 })}>⟲ Left</button>
                <button type="button" onClick={() => setRotation({ rotate: (edit.rotate + 1) % 4 })}>⟳ Right</button>
                <button type="button" className={edit.flip ? 'is-active' : ''} onClick={() => setRotation({ flip: !edit.flip })}>⇋ Flip</button>
              </div>
              <label className="photo-editor__slider">
                <span>Straighten <b>{edit.straighten}°</b></span>
                <input type="range" min={-15} max={15} step={0.5} value={edit.straighten}
                  onChange={(e) => setRotation({ straighten: Number(e.target.value) })} />
              </label>
              <button type="button" className="btn btn--sm"
                onClick={() => set({ rotate: 0, straighten: 0, flip: false, aspect: 'original', crop: null })}>Reset crop</button>
            </>
          )}

          {tab === 'adjust' && (
            <>
              <h4>Filters</h4>
              <div className="photo-editor__presets">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" className={edit.preset === p.id ? 'is-active' : ''} onClick={() => choosePreset(p)}>
                    {presetThumbs[p.id] ? <img src={presetThumbs[p.id]} alt="" /> : <span className="photo-editor__preset-blank" />}
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
              <h4>Fine-tune</h4>
              {SLIDERS.map(([key, label]) => (
                <label key={key} className="photo-editor__slider">
                  <span>{label} <b>{edit[key] > 0 ? '+' : ''}{edit[key]}</b></span>
                  <input type="range" min={key === 'fade' ? 0 : -100} max={100} value={edit[key]}
                    onChange={(e) => set({ [key]: Number(e.target.value) })}
                    onDoubleClick={() => set({ [key]: 0 })} />
                </label>
              ))}
              <p className="photo-editor__hint">Double-click a slider to reset it.</p>
            </>
          )}

          {tab === 'details' && (
            <div className="photo-editor__details">
              <label>Caption <small>(shown in the full-screen viewer)</small></label>
              <input value={details.caption} placeholder="e.g. Dramatic — 2026"
                onChange={(e) => setDetails({ ...details, caption: e.target.value })} />
              <label>Description <small>(for screen readers &amp; Google)</small></label>
              <input value={details.alt} placeholder="e.g. Erika Retiz in a black turtleneck"
                onChange={(e) => setDetails({ ...details, alt: e.target.value })} />
              {categories.length > 0 && (
                <>
                  <label>Categories</label>
                  <div className="photo-editor__chips">
                    {categories.map((c) => (
                      <button key={c.id} type="button" className={details.categories.includes(c.id) ? 'is-active' : ''}
                        onClick={() => toggleCategory(c.id)}>{c.name}</button>
                    ))}
                  </div>
                </>
              )}
              <label className="photo-editor__check">
                <input type="checkbox" checked={details.featured} onChange={(e) => setDetails({ ...details, featured: e.target.checked })} />
                ★ Feature — show as a big tile
              </label>
              <label className="photo-editor__check">
                <input type="checkbox" checked={details.hidden} onChange={(e) => setDetails({ ...details, hidden: e.target.checked })} />
                Hide from the website
              </label>
              <div className="photo-editor__chips">
                <button type="button" onClick={() => onUseAsCover(photo.url)}>Use as page cover</button>
                <button type="button" className="is-danger" onClick={onDelete}>Delete photo</button>
              </div>
            </div>
          )}
        </div>

        {error && source && <p className="photo-editor__error">{error}</p>}
        <div className="photo-editor__actions">
          {(edited || photo.edit) && (
            <button type="button" className="btn btn--sm" disabled={saving}
              onClick={() => setEdit({ ...DEFAULT_EDIT })}>Revert to original</button>
          )}
          <span className="photo-editor__spacer" />
          <button type="button" className="btn btn--cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn--save" onClick={save} disabled={saving || (!source && editChanged)}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </aside>
    </div>
  );
}
