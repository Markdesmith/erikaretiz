import { Link } from 'react-router-dom';

const titleCase = (t) => (t === t.toUpperCase()
  ? t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase())
  : t);

// Magazine cover-line title. Words wrapped in *asterisks* are set in italics
// ("ACTOR *Portfolio*"). Otherwise, with auto on: the part after a colon or dash
// ("WORTHY: *A Radical Self-Love Journal*"), else the last word of a multi-word label.
export function CoverTitle({ label, auto = true }) {
  const text = (label || '').trim();
  if (text.includes('*')) {
    return text.split(/(\*[^*]+\*)/).filter(Boolean).map((part, i) => (
      part.startsWith('*') ? <em key={i}>{part.slice(1, -1)}</em> : <span key={i}>{part}</span>
    ));
  }
  if (!auto) return <span>{text}</span>;
  const split = text.match(/^(.+?)(\s*[:\u2014\u2013]\s*|\s*-\s+|-)(\S.*)$/);
  if (split) {
    const sep = split[2].includes(':') ? ': ' : ' ';
    return <><span>{split[1]}{sep}</span><em>{titleCase(split[3])}</em></>;
  }
  const words = text.split(/\s+/);
  if (words.length < 2) return <span>{text}</span>;
  return <><span>{words.slice(0, -1).join(' ')} </span><em>{titleCase(words[words.length - 1])}</em></>;
}

export default function CoverLine({ label, url, subtitle, isInternal, className = 'cover-line', autoItalic = true }) {
  const content = (
    <>
      <strong className="cover-line__title"><CoverTitle label={label} auto={autoItalic} /></strong>
      {subtitle && <span className="cover-line__sub">{subtitle}</span>}
    </>
  );
  return isInternal
    ? <Link to={url} className={className}>{content}</Link>
    : <a href={url} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>;
}
