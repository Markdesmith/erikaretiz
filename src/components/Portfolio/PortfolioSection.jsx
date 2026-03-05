import DemoReel from './DemoReel';
import PhotoGallery from './PhotoGallery';

export default function PortfolioSection({ item }) {
  if (!item.visible) return null;

  const renderContent = () => {
    switch (item.type) {
      case 'video':
        return <DemoReel url={item.content} />;
      case 'photos':
        return <PhotoGallery photos={JSON.parse(item.content || '[]')} />;
      case 'contact':
        return (
          <p className="portfolio-contact">
            Contact: <a href={`mailto:${item.content}`}>{item.content}</a>
          </p>
        );
      case 'text':
        return <div className="portfolio-text" dangerouslySetInnerHTML={{ __html: item.content }} />;
      default:
        return <p>{item.content}</p>;
    }
  };

  return (
    <div className="portfolio-section">
      {item.sectionName && <h2 className="portfolio-section__title">{item.sectionName}</h2>}
      {renderContent()}
    </div>
  );
}
