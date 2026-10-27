import { Link } from 'react-router-dom';

export default function LinkButton({ label, url, isBookMe, isInternal, index }) {
  const className = `link-button ${isBookMe ? 'link-button--book' : ''}`;
  const content = (
    <>
      {index != null && <span className="link-button__index">{String(index).padStart(2, '0')}</span>}
      <span className="link-button__label">{label}</span>
      <span className="link-button__arrow" aria-hidden="true">{isInternal ? '→' : '↗'}</span>
    </>
  );

  if (isInternal) {
    return <Link to={url} className={className}>{content}</Link>;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  );
}
