import { Link } from 'react-router-dom';
import { usePortfolio, useSiteConfig } from '../firebase/hooks';
import PortfolioSection from '../components/Portfolio/PortfolioSection';
import Loading from '../components/shared/Loading';
import './Actress.css';

export default function Actress() {
  const { config } = useSiteConfig();
  const { items, loading } = usePortfolio();

  if (loading) return <Loading />;

  return (
    <div className="actress">
      <div className="actress__header">
        <Link to="/" className="actress__back">&larr; Back</Link>
        <h1 className="actress__title">{config?.title || 'Erika Retiz'}</h1>
        <h2 className="actress__page-title">ACTOR PORTFOLIO</h2>
      </div>

      <div className="actress__content">
        {items.map((item) => (
          <PortfolioSection key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
