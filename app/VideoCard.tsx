export default function VideoCard({ video }: { video: any }) {
  const highResThumb = video.default_thumb?.src?.replace('/240.jpg', '/1080.jpg') || video.default_thumb?.src;

  const duration = `${video.length_min}:${String(video.length_sec).padStart(2, '0')}`;

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