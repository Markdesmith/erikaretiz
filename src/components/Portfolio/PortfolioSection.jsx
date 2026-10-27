import DemoReel from './DemoReel';
import PhotoGallery from './PhotoGallery';
import { parseGallery } from './gallery';
import EditorialTitle from '../shared/EditorialTitle';
import { sectionId } from './sectionId';

function PageTurn({ next }) {
  const page = (n) => `p. ${String(n).padStart(2, '0')}`;
  if (!next) {
    return (
      <nav className="page-turn page-turn--end" aria-label="Back to top">
        <a href="#cover"><span className="eyebrow">The end</span><span className="page-turn__title">Back to the <em>cover</em> ↑</span></a>
      </nav>
    );
  }
  return (
    <nav className="page-turn" aria-label="Next section">
      <a href={`#${next.id}`}>
        <span className="eyebrow">Continued on {page(next.index)}</span>
        <span className="page-turn__title"><EditorialTitle text={next.name || 'Next'} /> <span className="page-turn__arrow">→</span></span>
      </a>
    </nav>
  );
}

export default function PortfolioSection({ item, index, next }) {
  if (!item.visible) return null;

  const page = index != null && <span className="portfolio-section__page eyebrow">p. {String(index).padStart(2, '0')}</span>;

  if (item.type === 'contact') {
    return (
      <section id={sectionId(item)} className="portfolio-section portfolio-section--contact">
        <p className="eyebrow">{item.sectionName || 'Casting & bookings'}</p>
        <h2 className="portfolio-contact__title"><EditorialTitle text="Let’s talk" /></h2>
        <a className="portfolio-contact__email" href={`mailto:${item.content}`}>{item.content}</a>
        <a className="actress__btn actress__btn--solid" href={`mailto:${item.content}`}>Send an email ↗</a>
        <PageTurn next={next} />
      </section>
    );
  }

  const renderContent = () => {
    switch (item.type) {
      case 'video':
        return <DemoReel url={item.content} />;
      case 'photos':
        return <PhotoGallery gallery={parseGallery(item.content)} />;
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
        <PageTurn next={next} />
      </div>
    </section>
  );
}
