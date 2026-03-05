import { useState } from 'react';
import LinkEditor from './LinkEditor';

export default function SectionEditor({ section, onUpdate, onDelete, dragHandleProps }) {
  const [sectionName, setSectionName] = useState(section.name || '');
  const [editingName, setEditingName] = useState(false);

  const updateLink = (index, updatedLink) => {
    const links = [...(section.links || [])];
    links[index] = updatedLink;
    onUpdate({ links });
  };

  const deleteLink = (index) => {
    const links = (section.links || []).filter((_, i) => i !== index);
    onUpdate({ links });
  };

  const addLink = () => {
    const links = [...(section.links || []), { label: 'New Link', url: '#', icon: '', order: section.links?.length || 0 }];
    onUpdate({ links });
  };

  const saveName = () => {
    onUpdate({ name: sectionName });
    setEditingName(false);
  };

  return (
    <div className="section-editor">
      <div className="section-editor__header">
        <span className="section-editor__drag" {...dragHandleProps}>&#x2807;</span>
        {editingName ? (
          <div className="section-editor__name-edit">
            <input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="Section name (empty = no heading)"
            />
            <button className="btn btn--sm" onClick={saveName}>&#x2713;</button>
          </div>
        ) : (
          <h3 className="section-editor__name" onClick={() => setEditingName(true)}>
            {section.name || '(No heading)'}
          </h3>
        )}
        <button className="btn btn--sm btn--danger" onClick={onDelete}>Delete Section</button>
      </div>

      <div className="section-editor__links">
        {(section.links || [])
          .sort((a, b) => a.order - b.order)
          .map((link, i) => (
            <LinkEditor
              key={i}
              link={link}
              onSave={(updated) => updateLink(i, updated)}
              onDelete={() => deleteLink(i)}
            />
          ))}
      </div>

      <button className="btn btn--add" onClick={addLink}>+ Add Link</button>
    </div>
  );
}
