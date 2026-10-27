// Vogue-style heading: leading words in capitals, last word in italics ("DEMO *Reel*").
export default function EditorialTitle({ text }) {
  const words = (text || '').trim().split(/\s+/);
  const last = words.pop();
  return (
    <>
      {words.length > 0 && <span className="editorial-caps">{words.join(' ')} </span>}
      <em>{last}</em>
    </>
  );
}
