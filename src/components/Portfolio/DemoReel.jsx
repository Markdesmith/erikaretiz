function toEmbedUrl(url) {
  if (!url) return '';
  // Already an embed URL
  if (url.includes('/embed/')) return url;
  let videoId = null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v') || parsed.pathname.split('/').pop();
    }
  } catch {
    return url;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

export default function DemoReel({ url }) {
  return (
    <div className="demo-reel">
      <div className="demo-reel__wrapper">
        <iframe
          src={toEmbedUrl(url)}
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
