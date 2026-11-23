'use client';

interface HubTubePlayerProps {
  id: string;
  title?: string;
  poster?: string;
}

export default function HubTubePlayer({ id, title }: HubTubePlayerProps) {
  const embedSrc = `https://www.eporner.com/embed/${encodeURIComponent(id)}/`;

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
      <iframe
        key={`main-embed-${id}`}
        src={embedSrc}
        title={title || 'HubTube Video Player'}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}