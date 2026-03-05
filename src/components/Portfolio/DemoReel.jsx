export default function DemoReel({ url }) {
  return (
    <div className="demo-reel">
      <div className="demo-reel__wrapper">
        <iframe
          src={url}
          title="Demo Reel"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}
