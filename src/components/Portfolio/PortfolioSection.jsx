import DemoReel from './DemoReel';
import PhotoGallery from './PhotoGallery';
import EditorialTitle from '../shared/EditorialTitle';
import { sectionId } from './sectionId';

export default function PortfolioSection({ item, index }) {
  if (!item.visible) return null;

  const page = index != null && <span className="portfolio-section__page eyebrow">p. {String(index).padStart(2, '0')}</span>;

  if (item.type === 'contact') {
    return (
      <section id={sectionId(item)} className="portfolio-section portfolio-section--contact">
        <p className="eyebrow">{item.sectionName || 'Casting & bookings'}</p>
        <h2 className="portfolio-contact__title"><EditorialTitle text="Let’s talk" /></h2>
        <a className="portfolio-contact__email" href={`mailto:${item.content}`}>{item.content}</a>
        <a className="actress__btn actress__btn--solid" href={`mailto:${item.content}`}>Send an email ↗</a>
      </section>
    );
  }

  const renderContent = () => {
    switch (item.type) {
      case 'video':
        return <DemoReel url={item.content} />;
      case 'photos':
        return <PhotoGallery photos={JSON.parse(item.content || '[]')} />;
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
          <div className="portfolio-section__head">
            <h2 className="portfolio-section__title"><EditorialTitle text={item.sectionName} /></h2>
            {page}
          </div>
        )}
        {renderContent()}
      </div>
    </section>
  );
}
