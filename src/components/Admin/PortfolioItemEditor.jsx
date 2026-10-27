import { useState } from 'react';
import GalleryManager from './GalleryManager';

export default function PortfolioItemEditor({ item, onUpdate, onDelete, onUseAsCover, dragHandleProps }) {
  const [editing, setEditing] = useState(item.type === 'photos');
  const [form, setForm] = useState(item);

  const isGallery = form.type === 'photos' && item.type === 'photos';

  // Galleries save themselves as you work, so never overwrite their content from this form.
  const save = () => {
    const fields = { sectionName: form.sectionName, type: form.type };
    onUpdate(isGallery ? fields : { ...fields, content: form.content });
    if (!isGallery) setEditing(false);
  };

  return (
    <div className="portfolio-editor">
      <div className="portfolio-editor__header">
        <span className="section-editor__drag" {...dragHandleProps}>&#x2807;</span>
        <h3>{item.sectionName || 'Untitled'}</h3>
        <span className="portfolio-editor__type">{item.type}</span>
        <label className="portfolio-editor__toggle">
          <input
            type="checkbox"
            checked={item.visible}
            onChange={(e) => onUpdate({ visible: e.target.checked })}
          />
          Visible
        </label>
        <button className="btn btn--sm" onClick={() => setEditing(!editing)}>
          {editing ? 'Close' : 'Edit'}
        </button>
        <button className="btn btn--sm btn--danger" onClick={() => {
          if (window.confirm('Delete this portfolio section?')) onDelete();
        }}>×</button>
      </div>

      {editing && (
        <div className="portfolio-editor__body">
          <label>Section Name</label>
          <input
            value={form.sectionName}
            onChange={(e) => setForm({ ...form, sectionName: e.target.value })}
          />

          <label>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="video">Video Embed</option>
            <option value="photos">Photo Gallery</option>
            <option value="contact">Contact Info</option>
            <option value="text">Text/HTML</option>
          </select>

          {isGallery && (form.sectionName !== item.sectionName) && (
            <button className="btn btn--save" onClick={save}>Save name</button>
          )}

          {form.type === 'photos' ? (
            <GalleryManager item={item} onUpdate={onUpdate} onUseAsCover={onUseAsCover} />
          ) : form.type === 'text' ? (
            <>
              <label>Content (HTML supported)</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
              />
            </>
          ) : (
            <>
              <label>{form.type === 'video' ? 'Embed URL' : 'Content'}</label>
              <input
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </>
          )}

          {!isGallery && <button className="btn btn--save" onClick={save}>Save Changes</button>}
        </div>
      )}
    </div>
  );
}
