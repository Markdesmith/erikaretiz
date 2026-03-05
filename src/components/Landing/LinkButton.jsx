import { Link } from 'react-router-dom';

export default function LinkButton({ label, url, icon, isBookMe, isInternal }) {
  const className = `link-button ${isBookMe ? 'link-button--book' : ''}`;

  if (isInternal) {
    return (
      <Link to={url} className={className}>
        {icon && <span className="link-button__icon">{icon}</span>}
        <span className="link-button__label">{label}</span>
      </Link>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {icon && <span className="link-button__icon">{icon}</span>}
      <span className="link-button__label">{label}</span>
    </a>
  );
}
