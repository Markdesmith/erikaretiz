import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSiteConfig, useSections } from '../firebase/hooks';
import AdminNav from '../components/Admin/AdminNav';
import SectionEditor from '../components/Admin/SectionEditor';
import SortableItem from '../components/Admin/SortableItem';
import Loading from '../components/shared/Loading';
import './AdminLinks.css';

export default function AdminLinks() {
  const { config, loading: configLoading, updateConfig } = useSiteConfig();
  const { sections, loading: sectionsLoading, addSection, updateSection, deleteSection, reorderSections } = useSections();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [configEditing, setConfigEditing] = useState(false);

  if (configLoading || sectionsLoading) return <Loading />;

  const startEditConfig = () => {
    setTitle(config?.title || '');
    setSubtitle(config?.subtitle || '');
    setTagline(config?.tagline || '');
    setConfigEditing(true);
  };

  const saveConfig = async () => {
    await updateConfig({ title, subtitle, tagline });
    setConfigEditing(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      reorderSections(newOrder.map((s) => s.id));
    }
  };

  return (
    <div className="admin-page">
      <AdminNav />
      <div className="admin-page__content">
        <h1 className="admin-page__title">Landing Page Links</h1>

        {/* Site Config */}
        <div className="admin-card">
          <h2>Site Settings</h2>
          {configEditing ? (
            <div className="admin-card__form">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
              <label>Subtitle</label>
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              <label>Tagline</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              <div className="admin-card__actions">
                <button className="btn btn--save" onClick={saveConfig}>Save</button>
                <button className="btn btn--cancel" onClick={() => setConfigEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="admin-card__preview">
              <p><strong>Title:</strong> {config?.title}</p>
              <p><strong>Subtitle:</strong> {config?.subtitle}</p>
              <p><strong>Tagline:</strong> {config?.tagline}</p>
              <button className="btn" onClick={startEditConfig}>Edit</button>
            </div>
          )}
        </div>

        {/* Sections */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableItem key={section.id} id={section.id}>
                {({ dragHandleProps }) => (
                  <SectionEditor
                    section={section}
                    onUpdate={(data) => updateSection(section.id, data)}
                    onDelete={() => {
                      if (window.confirm('Delete this section and all its links?')) {
                        deleteSection(section.id);
                      }
                    }}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>

        <button className="btn btn--primary btn--full" onClick={() => addSection({ name: '', links: [] })}>
          + Add Section
        </button>
      </div>
    </div>
  );
}
