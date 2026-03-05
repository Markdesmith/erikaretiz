import { useState } from 'react';

export default function LinkEditor({ link, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(link);

  const handleSave = () => {
    onSave(form);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="link-editor link-editor--editing">
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Label"
        />
        <input
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="URL"
        />
        <input
          value={form.icon || ''}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          placeholder="Emoji icon"
          style={{ width: '80px' }}
        />
        <label className="link-editor__checkbox">
          <input
            type="checkbox"
            checked={form.isInternal || false}
            onChange={(e) => setForm({ ...form, isInternal: e.target.checked })}
          />
          Internal link
        </label>
        <label className="link-editor__checkbox">
          <input
            type="checkbox"
            checked={form.isBookMe || false}
            onChange={(e) => setForm({ ...form, isBookMe: e.target.checked })}
          />
          Book Me style
        </label>
        <div className="link-editor__actions">
          <button className="btn btn--save" onClick={handleSave}>Save</button>
          <button className="btn btn--cancel" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="link-editor">
      <span className="link-editor__icon">{link.icon}</span>
      <span className="link-editor__label">{link.label}</span>
      <div className="link-editor__actions">
        <button className="btn btn--sm" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn btn--sm btn--danger" onClick={onDelete}>×</button>
      </div>
    </div>
  );
}
