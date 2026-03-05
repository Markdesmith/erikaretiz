import { useSiteConfig, useSections } from '../firebase/hooks';
import LinkButton from '../components/Landing/LinkButton';
import Loading from '../components/shared/Loading';
import './Home.css';

export default function Home() {
  const { config, loading: configLoading } = useSiteConfig();
  const { sections, loading: sectionsLoading } = useSections();

  if (configLoading || sectionsLoading) return <Loading />;

  return (
    <div className="home" style={{ backgroundImage: `url(${config?.bgImage || '/assets/images/bg.jpg'})` }}>
      <div className="home__overlay">
        <div className="home__content">
          <h1 className="home__title fade-in-up">{config?.title || 'Erika Retiz'}</h1>
          <p className="home__subtitle fade-in-up" style={{ animationDelay: '0.1s' }}>
            {config?.subtitle || 'Artist & Holistic Therapist'}
          </p>

          <div className="home__links">
            {sections.map((section, si) => {
              const visibleLinks = section.links?.filter(Boolean) || [];
              if (visibleLinks.length === 0) return null;

              return (
                <div key={section.id} className="home__section fade-in-up" style={{ animationDelay: `${0.2 + si * 0.1}s` }}>
                  {section.name && <h2 className="home__section-title">{section.name}</h2>}
                  {visibleLinks
                    .sort((a, b) => a.order - b.order)
                    .map((link, li) => (
                      <LinkButton key={li} {...link} />
                    ))}
                </div>
              );
            })}
          </div>

          {config?.tagline && (
            <p className="home__tagline fade-in-up" style={{ animationDelay: '0.6s' }}>
              {config.tagline}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
