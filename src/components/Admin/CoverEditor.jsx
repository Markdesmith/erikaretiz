import { useRef, useState } from 'react';
import { uploadPhoto } from '../../firebase/hooks';
import { DEFAULT_COVER, resolveCover, withYear } from '../shared/cover';

function parsePhotos(item) {
  try {
    return JSON.parse(item?.content || '[]');
  } catch {
    return [];
  }
}

function Slider({ label, value, min, max, unit = '%', onChange }) {
  return (
    <label className="cover-editor__slider">
      <span>{label} <b>{value}{unit}</b></span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Preview({ kind, draft, photo, name }) {
  const phone = kind === 'phone';
  const x = phone ? draft.mobileFocusX : draft.focusX;
  const y = phone ? draft.mobileFocusY : draft.focusY;
  const zoom = (phone ? draft.mobileZoom : draft.zoom) / 100;
  return (
    <figure className={`cover-preview cover-preview--${kind}`}>
      <div className="cover-preview__frame">
        {photo && (
          <img
            src={photo}
            alt=""
            style={{
              objectPosition: `${x}% ${y}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${x}% ${y}%`,
              filter: `grayscale(${draft.blackAndWhite ? 1 : 0}) contrast(1.12) brightness(${draft.brightness / 100})`,
            }}
          />
        )}
        <div className="cover-preview__shade" style={{ opacity: draft.shade / 100 }} />
        <div className="cover-preview__meta">
          <span>{withYear(draft.kickerLeft)}</span>
          <span>{withYear(draft.kickerRight)}</span>
        </div>
        <div className="cover-preview__masthead">{draft.masthead || name}</div>
      </div>
      <figcaption>{phone ? 'Phone' : 'Laptop'}</figcaption>
    </figure>
  );
}

export default function CoverEditor({ config, items, onSave }) {
  const saved = resolveCover(config);
  const [draft, setDraft] = useState(saved);
  const [quote, setQuote] = useState(config?.actingQuote || '');
  const [device, setDevice] = useState('laptop');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const dragging = useRef(false);

  const name = config?.title || 'Erika Retiz';
  const allPhotos = items.filter((i) => i.type === 'photos').flatMap(parsePhotos);
  const photo = draft.photo || allPhotos[0];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || quote !== (config?.actingQuote || '');

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setStatus('');
  };

  const xKey = device === 'phone' ? 'mobileFocusX' : 'focusX';
  const yKey = device === 'phone' ? 'mobileFocusY' : 'focusY';
  const zoomKey = device === 'phone' ? 'mobileZoom' : 'zoom';

  const setFocusFromPointer = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clamp = (v) => Math.round(Math.min(100, Math.max(0, v)));
    set({
      [xKey]: clamp(((e.clientX - rect.left) / rect.width) * 100),
      [yKey]: clamp(((e.clientY - rect.top) / rect.height) * 100),
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      set({ photo: await uploadPhoto(file) });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  };

  const save = async () => {
    setStatus('Saving…');
    try {
      await onSave({ cover: draft, actingQuote: quote });
      setStatus('Saved ✓ — live on the site now');
    } catch (err) {
      setStatus('Couldn’t save: ' + err.message);
    }
  };

  return (
    <div className="admin-card cover-editor">
      <div className="cover-editor__head">
        <div>
          <h2>Cover</h2>
          <p className="cover-editor__hint">The first screen of the actor page. Changes preview instantly; press Save to publish.</p>
        </div>
        <a href="/actress" target="_blank" rel="noopener" className="btn btn--sm">View page ↗</a>
      </div>

      <div className="cover-editor__layout">
        <div className="cover-editor__controls">
          <section>
            <h3>Photo</h3>
            <div className="cover-editor__photos">
              {allPhotos.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  className={`cover-editor__thumb ${p === photo ? 'is-selected' : ''}`}
                  onClick={() => set({ photo: i === 0 ? '' : p })}
                  title={i === 0 ? 'First headshot (default)' : `Headshot ${i + 1}`}
                >
                  <img src={p} alt="" loading="lazy" />
                </button>
              ))}
              {draft.photo && !allPhotos.includes(draft.photo) && (
                <button type="button" className="cover-editor__thumb is-selected" title="Uploaded cover photo">
                  <img src={draft.photo} alt="" />
                </button>
              )}
              <label className="cover-editor__thumb cover-editor__upload">
                {uploading ? '…' : '+ Upload'}
                <input type="file" accept="image/*" onChange={handleUpload} hidden />
              </label>
            </div>
          </section>

          <section>
            <h3>Focus point</h3>
            <div className="cover-editor__tabs" role="tablist">
              {['laptop', 'phone'].map((d) => (
                <button key={d} type="button" role="tab" aria-selected={device === d}
                  className={device === d ? 'is-active' : ''} onClick={() => setDevice(d)}>
                  {d === 'laptop' ? 'Laptop & desktop' : 'Phone'}
                </button>
              ))}
            </div>
            <p className="cover-editor__hint">Click or drag on the photo to choose what stays in view on {device === 'phone' ? 'phones' : 'laptops'}.</p>
            {photo && (
              <div
                className="cover-editor__focus"
                onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); setFocusFromPointer(e); }}
                onPointerMove={(e) => dragging.current && setFocusFromPointer(e)}
                onPointerUp={() => { dragging.current = false; }}
              >
                <img src={photo} alt="" draggable="false" />
                <span className="cover-editor__dot" style={{ left: `${draft[xKey]}%`, top: `${draft[yKey]}%` }} />
              </div>
            )}
            <Slider label="Zoom" value={draft[zoomKey]} min={100} max={250} onChange={(v) => set({ [zoomKey]: v })} />
            {device === 'phone' && (
              <button type="button" className="btn btn--sm"
                onClick={() => set({ mobileFocusX: draft.focusX, mobileFocusY: draft.focusY, mobileZoom: draft.zoom })}>
                Copy from laptop
              </button>
            )}
          </section>

          <section>
            <h3>Look</h3>
            <label className="cover-editor__check">
              <input type="checkbox" checked={draft.blackAndWhite} onChange={(e) => set({ blackAndWhite: e.target.checked })} />
              Black &amp; white
            </label>
            <Slider label="Brightness" value={draft.brightness} min={60} max={150} onChange={(v) => set({ brightness: v })} />
            <Slider label="Shading behind text" value={draft.shade} min={0} max={100} onChange={(v) => set({ shade: v })} />
          </section>

          <section className="admin-card__form">
            <h3>Text</h3>
            <label>Big name</label>
            <input value={draft.masthead} placeholder={name} onChange={(e) => set({ masthead: e.target.value })} />
            <label>Top left</label>
            <input value={draft.kickerLeft} onChange={(e) => set({ kickerLeft: e.target.value })} />
            <label>Top right <small>({'{year}'} = current year)</small></label>
            <input value={draft.kickerRight} onChange={(e) => set({ kickerRight: e.target.value })} />
            <label>Quote (optional)</label>
            <input value={quote} placeholder="e.g. a line from a director or review" onChange={(e) => { setQuote(e.target.value); setStatus(''); }} />
            <label className="cover-editor__check">
              <input type="checkbox" checked={draft.showCoverLines} onChange={(e) => set({ showCoverLines: e.target.checked })} />
              Show section links on the cover
            </label>
          </section>
        </div>

        <div className="cover-editor__previews">
          <Preview kind="laptop" draft={draft} photo={photo} name={name} />
          <Preview kind="phone" draft={draft} photo={photo} name={name} />
        </div>
      </div>

      <div className="cover-editor__actions">
        <button className="btn btn--save" onClick={save} disabled={!dirty}>Save</button>
        <button className="btn btn--cancel" onClick={() => { setDraft(saved); setQuote(config?.actingQuote || ''); setStatus(''); }} disabled={!dirty}>
          Undo changes
        </button>
        <button className="btn btn--sm" onClick={() => set({ ...DEFAULT_COVER })}>Reset to defaults</button>
        {status && <span className="cover-editor__status">{status}</span>}
      </div>
    </div>
  );
}
