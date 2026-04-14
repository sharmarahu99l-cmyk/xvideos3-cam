'use client';

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
  const duration = `${video.length_min}:${video.length_sec.toString().padStart(2, '0')}`;

  const openVideo = () => {
    // Pass the real title in the URL
    const encodedTitle = encodeURIComponent(video.title);
    window.open(`/watch/${video.id}?title=${encodedTitle}`, '_blank');
  };

  return (
    <div 
      onClick={openVideo}
      className="bg-[#1a1a1a] rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 group border border-gray-800 hover:border-red-600"
    >
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={video.default_thumb.src} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute bottom-3 right-3 bg-black/90 text-white text-sm px-3 py-1 rounded font-bold shadow">
          {duration}
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-[15px] font-medium line-clamp-2 leading-tight mb-3 group-hover:text-red-500 transition-colors">
          {video.title}
        </p>
        <div className="text-xs text-gray-400 flex justify-between">
          <span>HD</span>
          <span>{video.views || 'N/A'} views</span>
        </div>
      </div>
    </div>
  );
}