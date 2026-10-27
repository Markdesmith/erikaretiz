import { Link } from 'react-router-dom';
import { usePortfolio, useSiteConfig } from '../firebase/hooks';
import PortfolioSection from '../components/Portfolio/PortfolioSection';
import { sectionId } from '../components/Portfolio/sectionId';
import Loading from '../components/shared/Loading';
import './Actress.css';

function parsePhotos(item) {
  try {
    return JSON.parse(item?.content || '[]');
  } catch {
    return [];
  }
}

export default function Actress() {
  const { config } = useSiteConfig();
  const { items, loading } = usePortfolio();

  if (loading) return <Loading />;

  const visible = items.filter((item) => item.visible);
  const reel = visible.find((item) => item.type === 'video');
  const contact = visible.find((item) => item.type === 'contact');
  const heroPhoto = parsePhotos(visible.find((item) => item.type === 'photos'))[0];
  const [firstName, ...restName] = (config?.title || 'Erika Retiz').split(' ');

  return (
    <div className="actress">
      <nav className="actress__nav">
        <Link to="/" className="actress__brand">
          <span aria-hidden="true">←</span> {config?.title || 'Erika Retiz'}
        </Link>
        <div className="actress__nav-links">
          {visible.filter((item) => item.sectionName && item !== contact).map((item) => (
            <a key={item.id} href={`#${sectionId(item)}`}>{item.sectionName}</a>
          ))}
          {contact && <a href={`#${sectionId(contact)}`} className="actress__nav-cta">Contact</a>}
        </div>
      </nav>

      <header className={`actress__hero ${heroPhoto ? '' : 'actress__hero--text'}`}>
        <div className="actress__hero-text">
          <p className="eyebrow fade-in-up">Actor Portfolio</p>
          <h1 className="actress__title fade-in-up" style={{ animationDelay: '0.1s' }}>
            {firstName} {restName.length > 0 && <em>{restName.join(' ')}</em>}
          </h1>
          <div className="actress__hero-actions fade-in-up" style={{ animationDelay: '0.25s' }}>
            {reel && (
              <a href={`#${sectionId(reel)}`} className="actress__btn actress__btn--solid">
                <span className="actress__play" aria-hidden="true">▶</span> Watch reel
              </a>
            )}
            {contact && (
              <a href={`#${sectionId(contact)}`} className="actress__btn">Casting inquiries</a>
            )}
          </div>
        </div>
        {heroPhoto && (
          <figure className="actress__hero-photo fade-in-up" style={{ animationDelay: '0.15s' }}>
            <img src={heroPhoto} alt={`${config?.title || 'Erika Retiz'} headshot`} />
          </figure>
        )}
      </header>

      <main className="actress__content">
        {visible.map((item, i) => (
          <PortfolioSection key={item.id} item={item} index={i + 1} />
        ))}
      </main>

      <footer className="actress__footer">
        <span>© {new Date().getFullYear()} {config?.title || 'Erika Retiz'}</span>
        <Link to="/">Home →</Link>
      </footer>
    </div>
  );
}
