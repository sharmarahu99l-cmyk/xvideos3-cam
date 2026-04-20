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

  const totalSeconds = (Number(video.length_min) || 0) * 60 + (Number(video.length_sec) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const duration = hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` 
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="cursor-pointer group relative">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
        
        <img
          src={highResThumb}
          alt={video.title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-125"
          loading="lazy"
        />

        {/* Hover overlay - feels like video preview is playing */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

        {/* Orange HD Tag */}
        <div className="absolute top-2 right-2 bg-[#FF9900] text-black text-[10px] font-bold px-2 py-0.5 rounded z-20">
          HD
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono z-20">
          {duration}
        </div>

        {/* Subtle play animation (feels like preview) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="w-16 h-16 border-4 border-white/40 rounded-full animate-[pulse_1.5s_infinite]"></div>
        </div>
      </div>

      <p className="text-sm mt-3 line-clamp-2 text-white group-hover:text-[#FF9900]">
        {video.title}
      </p>
    </div>
  );
}