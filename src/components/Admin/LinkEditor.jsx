import { useState } from 'react';

export default function LinkEditor({
  link, onSave, onDelete, dragHandleProps, isFirst, isLast, onMoveUp, onMoveDown, otherSections = [], onMoveToSection,
}) {
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
      <span className="link-editor__drag" title="Drag to reorder" {...dragHandleProps}>&#x2807;</span>
      <span className="link-editor__icon">{link.icon}</span>
      <span className="link-editor__label">{link.label}</span>
      <div className="link-editor__actions">
        <button className="btn btn--sm" onClick={onMoveUp} disabled={isFirst} aria-label="Move up" title="Move up">↑</button>
        <button className="btn btn--sm" onClick={onMoveDown} disabled={isLast} aria-label="Move down" title="Move down">↓</button>
        {otherSections.length > 0 && (
          <select
            className="link-editor__move"
            value=""
            onChange={(e) => e.target.value && onMoveToSection(e.target.value)}
            aria-label="Move to another section"
          >
            <option value="">Move to…</option>
            {otherSections.map((s) => (
              <option key={s.id} value={s.id}>{s.name?.replace(/:$/, '') || '(No heading)'}</option>
            ))}
          </select>
        )}
        <button className="btn btn--sm" onClick={() => { setForm(link); setEditing(true); }}>Edit</button>
        <button className="btn btn--sm btn--danger" onClick={onDelete}>×</button>
      </div>
    </div>
  );
}
