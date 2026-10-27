import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import LinkEditor from './LinkEditor';
import SortableItem from './SortableItem';

const withOrder = (links) => links.map((link, order) => ({ ...link, order }));

export default function SectionEditor({ section, otherSections = [], onUpdate, onDelete, onMoveLink, dragHandleProps }) {
  const [sectionName, setSectionName] = useState(section.name || '');
  const [editingName, setEditingName] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const links = [...(section.links || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const ids = links.map((_, i) => `${section.id}-${i}`);
  const saveLinks = (next) => onUpdate({ links: withOrder(next) });

  const updateLink = (index, updatedLink) => saveLinks(links.map((l, i) => (i === index ? updatedLink : l)));
  const deleteLink = (index) => {
    if (window.confirm(`Delete “${links[index].label}”?`)) saveLinks(links.filter((_, i) => i !== index));
  };
  const moveLink = (from, to) => {
    if (to < 0 || to >= links.length) return;
    saveLinks(arrayMove(links, from, to));
  };
  const addLink = () => saveLinks([...links, { label: 'New Link', url: '#', icon: '' }]);

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) moveLink(ids.indexOf(active.id), ids.indexOf(over.id));
  };

  const saveName = () => {
    onUpdate({ name: sectionName });
    setEditingName(false);
  };

  return (
    <div className="section-editor">
      <div className="section-editor__header">
        <span className="section-editor__drag" title="Drag to move this section" {...dragHandleProps}>&#x2807;</span>
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="section-editor__links">
            {links.map((link, i) => (
              <SortableItem key={ids[i]} id={ids[i]}>
                {({ dragHandleProps: linkHandleProps }) => (
                  <LinkEditor
                    link={link}
                    dragHandleProps={linkHandleProps}
                    isFirst={i === 0}
                    isLast={i === links.length - 1}
                    onMoveUp={() => moveLink(i, i - 1)}
                    onMoveDown={() => moveLink(i, i + 1)}
                    otherSections={otherSections}
                    onMoveToSection={(targetId) => onMoveLink(i, targetId)}
                    onSave={(updated) => updateLink(i, updated)}
                    onDelete={() => deleteLink(i)}
                  />
                )}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button className="btn btn--add" onClick={addLink}>+ Add Link</button>
    </div>
  );
}
