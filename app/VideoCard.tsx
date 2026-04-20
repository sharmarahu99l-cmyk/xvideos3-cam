'use client';

import Image from 'next/image';

export default function VideoCard({ video }: { video: any }) {
  // Safe duration calculation - no more NaN
  const totalSeconds = 
    (Number(video.length_min) || 0) * 60 + 
    (Number(video.length_sec) || 0);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let duration = '';

  if (hours > 0) {
    duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <div 
      className="cursor-pointer group" 
      onClick={() => window.location.href = `/watch/${video.id}`}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <Image 
          src={video.default_thumb.src} 
          alt={video.title} 
          width={320} 
          height={180} 
          className="w-full aspect-video object-cover group-hover:scale-105 transition"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded">
          {duration}
        </div>
      </div>
      <p className="text-sm mt-3 line-clamp-2 px-1">{video.title}</p>
    </div>
  );
}