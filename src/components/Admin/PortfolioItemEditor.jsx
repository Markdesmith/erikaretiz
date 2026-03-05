import { useState } from 'react';
import { uploadPhoto } from '../../firebase/hooks';

export default function PortfolioItemEditor({ item, onUpdate, onDelete, dragHandleProps }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  const [uploading, setUploading] = useState(false);

  const save = () => {
    onUpdate(form);
    setEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const currentPhotos = JSON.parse(form.content || '[]');
      const urls = await Promise.all(files.map((f) => uploadPhoto(f)));
      const updated = { ...form, content: JSON.stringify([...currentPhotos, ...urls]) };
      setForm(updated);
      onUpdate(updated);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    const photos = JSON.parse(form.content || '[]');
    photos.splice(index, 1);
    const updated = { ...form, content: JSON.stringify(photos) };
    setForm(updated);
    onUpdate(updated);
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

          {form.type === 'photos' ? (
            <div className="portfolio-editor__photos">
              <div className="portfolio-editor__photo-grid">
                {JSON.parse(form.content || '[]').map((url, i) => (
                  <div key={i} className="portfolio-editor__photo-thumb">
                    <img src={url} alt="" />
                    <button onClick={() => removePhoto(i)}>×</button>
                  </div>
                ))}
              </div>
              <label className="btn btn--add">
                {uploading ? 'Uploading...' : '+ Upload Photos'}
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} hidden />
              </label>
            </div>
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

          <button className="btn btn--save" onClick={save}>Save Changes</button>
        </div>
      )}
    </div>
  );
}
