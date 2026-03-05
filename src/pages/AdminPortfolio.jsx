import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { usePortfolio } from '../firebase/hooks';
import AdminNav from '../components/Admin/AdminNav';
import PortfolioItemEditor from '../components/Admin/PortfolioItemEditor';
import SortableItem from '../components/Admin/SortableItem';
import Loading from '../components/shared/Loading';
import './AdminPortfolio.css';

export default function AdminPortfolio() {
  const { items, loading, addItem, updateItem, deleteItem, reorderItems } = usePortfolio();

  if (loading) return <Loading />;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);
      reorderItems(newOrder.map((i) => i.id));
    }
  };

  const handleAdd = (type) => {
    addItem({
      sectionName: 'New Section',
      type,
      content: type === 'photos' ? '[]' : '',
      visible: true,
    });
  };

  return (
    <div className="admin-page">
      <AdminNav />
      <div className="admin-page__content">
        <h1 className="admin-page__title">Actor Portfolio</h1>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id}>
                {({ dragHandleProps }) => (
                  <PortfolioItemEditor
                    item={item}
                    onUpdate={(data) => updateItem(item.id, data)}
                    onDelete={() => deleteItem(item.id)}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>

        <div className="admin-add-buttons">
          <button className="btn btn--primary" onClick={() => handleAdd('video')}>+ Video</button>
          <button className="btn btn--primary" onClick={() => handleAdd('photos')}>+ Photos</button>
          <button className="btn btn--primary" onClick={() => handleAdd('contact')}>+ Contact</button>
          <button className="btn btn--primary" onClick={() => handleAdd('text')}>+ Text</button>
        </div>
      </div>
    </div>
  );
}
