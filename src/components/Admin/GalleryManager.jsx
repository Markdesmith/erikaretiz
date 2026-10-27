import { useEffect, useRef, useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { uploadBlob, deleteFiles } from '../../firebase/hooks';
import { prepareUpload } from '../../lib/images';
import { parseGallery, serializeGallery, newId, thumbOf } from '../Portfolio/gallery';
import PhotoEditor from './PhotoEditor';
import './GalleryManager.css';

const LAYOUTS = [
  ['editorial', 'Editorial — mixed sizes'],
  ['masonry', 'Masonry — whole photos, no cropping'],
  ['grid', 'Uniform grid'],
];

function Tile({ photo, index, selected, sortable, categories, onSelect, onEdit, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id, disabled: !sortable });
  const cats = categories.filter((c) => photo.categories.includes(c.id));
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : undefined }}
      className={`gallery-tile ${selected ? 'is-selected' : ''} ${photo.hidden ? 'is-hidden' : ''} ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="gallery-tile__image" {...(sortable ? { ...attributes, ...listeners } : {})} onDoubleClick={onEdit}>
        <img src={thumbOf(photo)} alt={photo.alt} loading="lazy" draggable="false" />
        <span className="gallery-tile__num">{index + 1}</span>
        <div className="gallery-tile__badges">
          {photo.featured && <span title="Featured">★</span>}
          {photo.edit && <span title="Edited">✎</span>}
          {photo.hidden && <span title="Hidden">Hidden</span>}
        </div>
        {cats.length > 0 && <div className="gallery-tile__cats">{cats.map((c) => c.name).join(' · ')}</div>}
      </div>
      <label className="gallery-tile__select" title="Select">
        <input type="checkbox" checked={selected} onChange={onSelect} />
      </label>
      <div className="gallery-tile__actions">
        <button type="button" onClick={onEdit}>Edit</button>
        <button type="button" onClick={() => onToggle('featured')} className={photo.featured ? 'is-on' : ''}
          title={photo.featured ? 'Unfeature' : 'Feature (big tile)'} aria-label="Feature">★</button>
        <button type="button" onClick={() => onToggle('hidden')} className={photo.hidden ? 'is-on' : ''}
          title={photo.hidden ? 'Show on website' : 'Hide from website'} aria-label="Hide">{photo.hidden ? '◌' : '◉'}</button>
        <button type="button" onClick={onDelete} className="is-danger" title="Delete" aria-label="Delete">×</button>
      </div>
    </div>
  );
}

export default function GalleryManager({ item, onUpdate, onUseAsCover }) {
  const gallery = parseGallery(item.content);
  // Latest gallery including our own writes that haven't come back from Firestore yet,
  // so back-to-back operations (e.g. several uploads) never work from stale data.
  const latest = useRef(gallery);
  useEffect(() => {
    latest.current = parseGallery(item.content);
  }, [item.content]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [upload, setUpload] = useState(null);
  const [dropping, setDropping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const galleryPath = `gallery/${item.id}`;

  const save = (next) => {
    latest.current = next;
    return onUpdate({ content: serializeGallery(next) });
  };
  const update = (fn) => save(fn(latest.current));
  const patchPhotos = (ids, patch) => update((g) => ({
    ...g,
    photos: g.photos.map((p) => (ids.includes(p.id) ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p)),
  }));

  const shown = gallery.photos.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'hidden') return p.hidden;
    if (filter === 'featured') return p.featured;
    return p.categories.includes(filter);
  });
  const sortable = filter === 'all';

  // Uploads -----------------------------------------------------------------
  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!files.length) return;
    const failed = [];
    for (let i = 0; i < files.length; i += 1) {
      setUpload({ done: i, total: files.length, name: files[i].name });
      try {
        const prepared = await prepareUpload(files[i]);
        const id = newId();
        const [url, thumb] = await Promise.all([
          uploadBlob(`${galleryPath}/${id}/original.jpg`, prepared.master),
          uploadBlob(`${galleryPath}/${id}/thumb.jpg`, prepared.thumb),
        ]);
        const photo = {
          id, url, thumb, original: url, originalThumb: thumb, edit: null, caption: '', alt: '',
          categories: filter !== 'all' && filter !== 'hidden' && filter !== 'featured' ? [filter] : [],
          featured: false, hidden: false, width: prepared.width, height: prepared.height,
        };
        await update((g) => ({ ...g, photos: [...g.photos, photo] }));
      } catch (err) {
        failed.push(`${files[i].name}: ${err.message}`);
      }
    }
    setUpload(null);
    if (failed.length) alert(`Some photos couldn’t be uploaded:\n${failed.join('\n')}\n\nTip: iPhone HEIC photos may need converting to JPG first.`);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDropping(false);
    handleFiles(e.dataTransfer.files);
  };

  // Photo actions -------------------------------------------------------------
  const removePhotos = (ids) => {
    const victims = latest.current.photos.filter((p) => ids.includes(p.id));
    if (!victims.length) return;
    if (!window.confirm(victims.length === 1 ? 'Delete this photo?' : `Delete ${victims.length} photos?`)) return;
    update((g) => ({ ...g, photos: g.photos.filter((p) => !ids.includes(p.id)) }));
    deleteFiles(victims.flatMap((p) => [p.url, p.thumb, p.original, p.originalThumb]));
    setSelected((s) => s.filter((id) => !ids.includes(id)));
    if (ids.includes(editingId)) setEditingId(null);
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    update((g) => {
      const from = g.photos.findIndex((p) => p.id === active.id);
      const to = g.photos.findIndex((p) => p.id === over.id);
      return { ...g, photos: arrayMove(g.photos, from, to) };
    });
  };

  const toggleSelect = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // Categories ----------------------------------------------------------------
  const addCategory = () => {
    const name = window.prompt('New category name (e.g. Dramatic, Commercial, Theatre):');
    if (!name?.trim()) return;
    const cat = { id: newId('c'), name: name.trim() };
    update((g) => ({ ...g, categories: [...g.categories, cat] }));
    setFilter(cat.id);
  };
  const renameCategory = (cat) => {
    const name = window.prompt('Rename category:', cat.name);
    if (!name?.trim()) return;
    update((g) => ({ ...g, categories: g.categories.map((c) => (c.id === cat.id ? { ...c, name: name.trim() } : c)) }));
  };
  const deleteCategory = (cat) => {
    if (!window.confirm(`Delete the category “${cat.name}”? The photos stay in the gallery.`)) return;
    update((g) => ({
      ...g,
      categories: g.categories.filter((c) => c.id !== cat.id),
      photos: g.photos.map((p) => ({ ...p, categories: p.categories.filter((c) => c !== cat.id) })),
    }));
    setFilter('all');
  };
  const moveCategory = (cat, dir) => update((g) => {
    const i = g.categories.findIndex((c) => c.id === cat.id);
    const j = i + dir;
    if (j < 0 || j >= g.categories.length) return g;
    return { ...g, categories: arrayMove(g.categories, i, j) };
  });

  const bulkCategory = (catId, add) => patchPhotos(selected, (p) => ({
    categories: add ? [...new Set([...p.categories, catId])] : p.categories.filter((c) => c !== catId),
  }));

  const activeCat = gallery.categories.find((c) => c.id === filter);
  const editingPhoto = gallery.photos.find((p) => p.id === editingId);
  const count = (fn) => gallery.photos.filter(fn).length;

  return (
    <div
      className={`gallery-manager ${dropping ? 'is-dropping' : ''}`}
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropping(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropping(false); }}
      onDrop={onDrop}
    >
      <div className="gallery-manager__toolbar">
        <label className="btn btn--save gallery-manager__upload">
          + Upload photos
          <input type="file" multiple accept="image/*" hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
        </label>
        <span className="gallery-manager__count">
          {gallery.photos.length} photos{count((p) => p.hidden) ? ` · ${count((p) => p.hidden)} hidden` : ''}
        </span>
        <button type="button" className="btn btn--sm" onClick={() => setShowSettings((v) => !v)}>
          ⚙ Gallery settings
        </button>
      </div>
      {upload && (
        <div className="gallery-manager__progress">
          <span style={{ width: `${(upload.done / upload.total) * 100}%` }} />
          <p>Uploading {upload.done + 1} of {upload.total} — {upload.name}</p>
        </div>
      )}
      <p className="gallery-manager__hint">Drag photos here to upload. Drag tiles to reorder. Double-click a photo to edit it.</p>

      {showSettings && (
        <div className="gallery-manager__settings">
          <label>Layout on the website
            <select value={gallery.settings.layout} onChange={(e) => update((g) => ({ ...g, settings: { ...g.settings, layout: e.target.value } }))}>
              {LAYOUTS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="gallery-manager__check">
            <input type="checkbox" checked={gallery.settings.bwHover}
              onChange={(e) => update((g) => ({ ...g, settings: { ...g.settings, bwHover: e.target.checked } }))} />
            Show photos in black &amp; white until hovered
          </label>
          <label className="gallery-manager__check">
            <input type="checkbox" checked={gallery.settings.captions}
              onChange={(e) => update((g) => ({ ...g, settings: { ...g.settings, captions: e.target.checked } }))} />
            Show captions
          </label>
        </div>
      )}

      <div className="gallery-manager__filters">
        {[['all', `All (${gallery.photos.length})`], ['featured', `★ Featured (${count((p) => p.featured)})`], ['hidden', `Hidden (${count((p) => p.hidden)})`]]
          .map(([id, label]) => (
            <button key={id} type="button" className={filter === id ? 'is-active' : ''} onClick={() => setFilter(id)}>{label}</button>
          ))}
        <span className="gallery-manager__divider" />
        {gallery.categories.map((c) => (
          <button key={c.id} type="button" className={`is-category ${filter === c.id ? 'is-active' : ''}`} onClick={() => setFilter(c.id)}>
            {c.name} ({count((p) => p.categories.includes(c.id))})
          </button>
        ))}
        <button type="button" className="gallery-manager__add-cat" onClick={addCategory}>+ Category</button>
      </div>

      {activeCat && (
        <div className="gallery-manager__cat-tools">
          <span>Category: <b>{activeCat.name}</b> — shown as a filter button on the website.</span>
          <button type="button" className="btn btn--sm" onClick={() => moveCategory(activeCat, -1)} aria-label="Move category left">←</button>
          <button type="button" className="btn btn--sm" onClick={() => moveCategory(activeCat, 1)} aria-label="Move category right">→</button>
          <button type="button" className="btn btn--sm" onClick={() => renameCategory(activeCat)}>Rename</button>
          <button type="button" className="btn btn--sm btn--danger" onClick={() => deleteCategory(activeCat)}>Delete category</button>
        </div>
      )}
      {!sortable && shown.length > 1 && <p className="gallery-manager__hint">To change the order, switch to “All”.</p>}

      {selected.length > 0 && (
        <div className="gallery-manager__bulk">
          <b>{selected.length} selected</b>
          {gallery.categories.length > 0 && (
            <select value="" onChange={(e) => { const [op, id] = e.target.value.split(':'); if (id) bulkCategory(id, op === 'add'); }}>
              <option value="">Category…</option>
              {gallery.categories.map((c) => <option key={`a${c.id}`} value={`add:${c.id}`}>Add to {c.name}</option>)}
              {gallery.categories.map((c) => <option key={`r${c.id}`} value={`remove:${c.id}`}>Remove from {c.name}</option>)}
            </select>
          )}
          <button type="button" className="btn btn--sm" onClick={() => patchPhotos(selected, { featured: true })}>★ Feature</button>
          <button type="button" className="btn btn--sm" onClick={() => patchPhotos(selected, { hidden: true })}>Hide</button>
          <button type="button" className="btn btn--sm" onClick={() => patchPhotos(selected, { hidden: false })}>Show</button>
          <button type="button" className="btn btn--sm btn--danger" onClick={() => removePhotos(selected)}>Delete</button>
          <button type="button" className="btn btn--sm btn--cancel" onClick={() => setSelected([])}>Clear</button>
          <button type="button" className="btn btn--sm" onClick={() => setSelected(shown.map((p) => p.id))}>Select all</button>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="gallery-manager__empty">
          {gallery.photos.length === 0 ? 'No photos yet — upload some or drop them here.' : 'No photos here yet. Select photos and use “Category…” to add them.'}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={shown.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="gallery-manager__grid">
              {shown.map((p) => (
                <Tile
                  key={p.id}
                  photo={p}
                  index={gallery.photos.indexOf(p)}
                  selected={selected.includes(p.id)}
                  sortable={sortable}
                  categories={gallery.categories}
                  onSelect={() => toggleSelect(p.id)}
                  onEdit={() => setEditingId(p.id)}
                  onToggle={(key) => patchPhotos([p.id], { [key]: !p[key] })}
                  onDelete={() => removePhotos([p.id])}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editingPhoto && (
        <PhotoEditor
          key={editingPhoto.id}
          photo={editingPhoto}
          categories={gallery.categories}
          galleryPath={galleryPath}
          onClose={() => setEditingId(null)}
          onSave={(updated) => update((g) => ({ ...g, photos: g.photos.map((p) => (p.id === updated.id ? updated : p)) }))}
          onDelete={() => removePhotos([editingPhoto.id])}
          onUseAsCover={(url) => { onUseAsCover(url); alert('Set as the actor page cover. Fine-tune it in the Cover editor above.'); }}
        />
      )}
    </div>
  );
}
