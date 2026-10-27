import { useSiteConfig, useSections } from '../firebase/hooks';
import LinkButton from '../components/Landing/LinkButton';
import Loading from '../components/shared/Loading';
import './Home.css';

export default function Home() {
  const { config, loading: configLoading } = useSiteConfig();
  const { sections, loading: sectionsLoading } = useSections();

  if (configLoading || sectionsLoading) return <Loading />;

  const [firstName, ...restName] = (config?.title || 'Erika Retiz').split(' ');
  let linkIndex = 0;

  return (
    <div className="home" style={{ backgroundImage: `url(${config?.bgImage || '/assets/images/bg.jpg'})` }}>
      <div className="home__overlay">
        <div className="home__content">
          <p className="home__subtitle eyebrow fade-in-up">
            {config?.subtitle || 'Artist & Holistic Therapist'}
          </p>
          <h1 className="home__title fade-in-up" style={{ animationDelay: '0.1s' }}>
            {firstName} {restName.length > 0 && <em>{restName.join(' ')}</em>}
          </h1>

          <div className="home__links">
            {sections.map((section, si) => {
              const visibleLinks = section.links?.filter(Boolean) || [];
              if (visibleLinks.length === 0) return null;

              return (
                <div key={section.id} className="home__section fade-in-up" style={{ animationDelay: `${0.25 + si * 0.12}s` }}>
                  {section.name && <h2 className="home__section-title eyebrow">{section.name.replace(/:$/, '')}</h2>}
                  {visibleLinks
                    .sort((a, b) => a.order - b.order)
                    .map((link, li) => (
                      <LinkButton key={li} {...link} index={link.isBookMe ? null : ++linkIndex} />
                    ))}
                </div>
              );
            })}
          </div>

          {config?.tagline && (
            <p className="home__tagline fade-in-up" style={{ animationDelay: '0.7s' }}>
              {config.tagline}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
