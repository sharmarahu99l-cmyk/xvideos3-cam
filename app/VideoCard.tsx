import React, { useState } from 'react';

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
  const [isHovered, setIsHovered] = useState(false);

  const highResThumb = video.default_thumb?.src?.replace('/240.jpg', '/1080.jpg') || video.default_thumb?.src || '';

  const totalSeconds = (Number(video.length_min) || 0) * 60 + (Number(video.length_sec) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const duration = hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` 
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div 
      className="cursor-pointer group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
        
        {/* Thumbnail when not hovered */}
        {!isHovered && (
          <img
            src={highResThumb}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}

        {/* True auto-play preview - NO play button */}
        {isHovered && (
          <iframe
            src={`${video.embed}?autoplay=1&muted=1&loop=1&playsinline=1&controls=0&modestbranding=1&fs=0&rel=0&showinfo=0&iv_load_policy=3`}
            className="w-full h-full"
            allow="autoplay; muted; loop"
            allowFullScreen
            style={{ border: 'none' }}
          />
        )}

        {/* Orange HD Tag */}
        <div className="absolute top-2 right-2 bg-[#FF9900] text-black text-[10px] font-bold px-2 py-0.5 rounded z-20">
          HD
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono z-20">
          {duration}
        </div>
      </div>

      <p className="text-sm mt-3 line-clamp-2 text-white group-hover:text-[#FF9900]">
        {video.title}
      </p>
    </div>
  );
}