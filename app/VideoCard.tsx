import React from 'react';

type Video = {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min?: number | string;
  length_sec?: number | string;
  embed: string;
  views?: string;
};

export default function VideoCard({ video }: { video: Video }) {
  const highResThumb = video.default_thumb?.src?.replace('/240.jpg', '/1080.jpg') || video.default_thumb?.src || '';

  // Super safe duration calculation (fixes NaN)
  let totalSeconds = 0;
  const min = Number(video.length_min) || 0;
  const sec = Number(video.length_sec) || 0;
  totalSeconds = min * 60 + sec;

  // If still zero, try fallback (some APIs use different field names)
  if (totalSeconds === 0 && (video as any).duration) {
    totalSeconds = parseInt((video as any).duration) || 0;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const duration = hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` 
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="cursor-pointer group">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
        <img
          src={highResThumb}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
          {duration}
        </div>
      </div>
      <p className="text-sm mt-3 line-clamp-2 text-white group-hover:text-[#FF9900]">
        {video.title}
      </p>
    </div>
  );
}