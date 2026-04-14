'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Video = {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min: number;
  length_sec: number;
  embed: string;
  views?: string;
};

export default function VideoCard({ video }: { video: Video }) {
  const router = useRouter();
  const duration = `${video.length_min}:${video.length_sec.toString().padStart(2, '0')}`;

  return (
    <div 
      onClick={() => router.push(`/watch/${video.id}`)}
      className="bg-[#1a1a1a] rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.04] active:scale-95 transition-all duration-300 group border border-gray-800 hover:border-red-600 shadow-lg"
    >
      <div className="aspect-video relative overflow-hidden bg-black">
        <Image 
          src={video.default_thumb.src} 
          alt={video.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
        />
        <div className="absolute bottom-3 right-3 bg-black/90 text-white text-sm px-3 py-1 rounded font-mono font-bold shadow-md">
          {duration}
        </div>
        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-3 py-0.5 rounded font-bold shadow">
          HD
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-[15.5px] font-medium line-clamp-2 leading-tight mb-3 group-hover:text-red-500 transition-colors min-h-[44px]">
          {video.title}
        </p>
        <div className="flex justify-between text-xs text-gray-400">
          <span>HD</span>
          <span>{video.views || 'N/A'} views</span>
        </div>
      </div>
    </div>
  );
}