import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio, useSiteConfig } from '../firebase/hooks';
import PortfolioSection from '../components/Portfolio/PortfolioSection';
import { sectionId } from '../components/Portfolio/sectionId';
import EditorialTitle from '../components/shared/EditorialTitle';
import Loading from '../components/shared/Loading';
import './Actress.css';

const COVER_LINES = {
  video: 'Her work on screen & stage',
  photos: 'The headshot portfolio, in light & shadow',
  contact: 'Casting & bookings, inside',
};

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) return <Loading />;

  const name = config?.title || 'Erika Retiz';
  const visible = items.filter((item) => item.visible);
  const reel = visible.find((item) => item.type === 'video');
  const contact = visible.find((item) => item.type === 'contact');
  const coverPhoto = parsePhotos(visible.find((item) => item.type === 'photos'))[0];
  const coverLines = visible.filter((item) => item.sectionName).slice(0, 4);

  return (
    <div className="actress">
      <nav className={`actress__nav ${scrolled ? 'actress__nav--solid' : ''}`}>
        <Link to="/" className="actress__brand">
          <span aria-hidden="true">←</span> {name}
        </Link>
        <div className="actress__nav-links">
          {visible.filter((item) => item.sectionName && item !== contact).map((item) => (
            <a key={item.id} href={`#${sectionId(item)}`}>{item.sectionName}</a>
          ))}
          {contact && <a href={`#${sectionId(contact)}`} className="actress__nav-cta">Contact</a>}
        </div>
      </nav>

      <header className="cover">
        {coverPhoto && <img className="cover__photo" src={coverPhoto} alt={`${name} portrait`} />}
        <div className="cover__meta eyebrow">
          <span>Actor Portfolio</span>
          <span>Vol. 01 — {new Date().getFullYear()}</span>
        </div>
        <h1 className="cover__masthead fade-in-up">{name}</h1>

        {coverLines.length > 0 && (
          <ul className="cover__lines fade-in-up" style={{ animationDelay: '0.2s' }}>
            {coverLines.map((item) => (
              <li key={item.id}>
                <a href={`#${sectionId(item)}`}>
                  <strong><EditorialTitle text={item.sectionName} /></strong>
                  {COVER_LINES[item.type] && <span>{COVER_LINES[item.type]}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="cover__side fade-in-up" style={{ animationDelay: '0.35s' }}>
          {config?.actingQuote && (
            <>
              <p className="eyebrow">The issue</p>
              <p className="cover__quote">“{config.actingQuote}”</p>
            </>
          )}
          <div className="cover__actions">
            {reel && (
              <a href={`#${sectionId(reel)}`} className="actress__btn actress__btn--solid">
                <span className="actress__play" aria-hidden="true">▶</span> Watch reel
              </a>
            )}
            {contact && <a href={`#${sectionId(contact)}`} className="actress__btn">Casting</a>}
          </div>
        </div>
      </header>

      <main>
        {visible.map((item, i) => (
          <PortfolioSection key={item.id} item={item} index={i + 1} />
        ))}
      </main>

      <footer className="actress__footer">
        <span>© {new Date().getFullYear()} {name}</span>
        <Link to="/">Home →</Link>
      </footer>
    </div>
  );
}
