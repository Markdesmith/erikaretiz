import { useSiteConfig, useSections } from '../firebase/hooks';
import CoverLine from '../components/Landing/CoverLine';
import Loading from '../components/shared/Loading';
import './Home.css';

const byOrder = (links) => (links || []).filter(Boolean).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export default function Home() {
  const { config, loading: configLoading } = useSiteConfig();
  const { sections, loading: sectionsLoading } = useSections();

  if (configLoading || sectionsLoading) return <Loading />;

  const all = sections.flatMap((s) => byOrder(s.links).map((link) => ({ ...link, section: s })));
  const bookMe = all.filter((l) => l.isBookMe);
  // Unnamed sections are the main cover lines; named ones ("Supporting") become side stories.
  const main = all.filter((l) => !l.isBookMe && !l.section.name);
  const extras = sections
    .filter((s) => s.name)
    .map((s) => ({ ...s, links: byOrder(s.links).filter((l) => !l.isBookMe) }))
    .filter((s) => s.links.length > 0);
  const photo = config?.bgImage || '/assets/images/bg.jpg';

  return (
    <div className="home" style={{ '--home-photo': `url(${photo})` }}>
      <div className="home__photo" aria-hidden="true" />
      <div className="home__page">
        <div className="home__meta eyebrow">
          <span>{config?.subtitle || 'Artist & Holistic Therapist'}</span>
          <span>Vol. 01 — {new Date().getFullYear()}</span>
        </div>
        <h1 className="home__title fade-in-up">{config?.title || 'Erika Retiz'}</h1>

        <nav className="home__lines fade-in-up" style={{ animationDelay: '0.15s' }} aria-label="Links">
          {main.map((link, i) => <CoverLine key={i} {...link} />)}

          {extras.map((s) => (
            <div key={s.id} className="home__extra">
              <h2 className="eyebrow">{s.name.replace(/:$/, '')}</h2>
              {s.links.map((link, i) => (
                <CoverLine key={i} {...link} className="cover-line cover-line--small" autoItalic={false} />
              ))}
            </div>
          ))}
        </nav>

        {config?.tagline && (
          <p className="home__quote fade-in-up" style={{ animationDelay: '0.3s' }}>“{config.tagline}”</p>
        )}

        <div className="home__footer">
          <span className="home__site eyebrow">erikaretiz.com</span>
          {bookMe.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="home__book">
              {link.label.replace(/\*/g, '')} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
