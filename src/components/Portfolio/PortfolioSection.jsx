import DemoReel from './DemoReel';
import PhotoGallery from './PhotoGallery';
import { sectionId } from './sectionId';

export default function PortfolioSection({ item, index }) {
  if (!item.visible) return null;

  const renderContent = () => {
    switch (item.type) {
      case 'video':
        return <DemoReel url={item.content} />;
      case 'photos':
        return <PhotoGallery photos={JSON.parse(item.content || '[]')} />;
      case 'contact':
        return (
          <div className="portfolio-contact">
            <p className="portfolio-contact__lead">Let’s create <em>something true.</em></p>
            <a className="portfolio-contact__email" href={`mailto:${item.content}`}>{item.content}</a>
            <a className="actress__btn actress__btn--solid" href={`mailto:${item.content}`}>Send an email ↗</a>
          </div>
        );
      case 'text':
        return <div className="portfolio-text" dangerouslySetInnerHTML={{ __html: item.content }} />;
      default:
        return <p>{item.content}</p>;
    }
  };

  return (
    <section id={sectionId(item)} className={`portfolio-section portfolio-section--${item.type}`}>
      <div className="portfolio-section__inner">
        {item.sectionName && (
          <h2 className="portfolio-section__title">
            {index != null && <span className="portfolio-section__index">{String(index).padStart(2, '0')}</span>}
            {item.sectionName}
          </h2>
        )}
        {renderContent()}
      </div>
    </section>
  );
}
