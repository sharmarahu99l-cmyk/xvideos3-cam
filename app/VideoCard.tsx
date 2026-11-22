'use client';

import { useState, useEffect } from 'react';

interface ThumbItem {
  src: string;
  width?: number;
  height?: number;
}

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    default_thumb?: { src?: string };
    thumbs?: ThumbItem[];
    length_min?: number;
    length_sec?: number;
    views?: string | number;
  };
}

function getMaxQualityThumb(video: VideoCardProps['video']): {
  primary: string;
  fallback: string;
} {
  const baseSrc = video.default_thumb?.src?.trim() || '';
  let bestSrc = baseSrc;

  if (Array.isArray(video.thumbs) && video.thumbs.length > 0) {
    const sorted = [...video.thumbs]
      .filter((t) => Boolean(t?.src))
      .sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));

    if (sorted[0]?.src) {
      bestSrc = sorted[0].src.trim();
    }
  }

  const upgraded = bestSrc
    .replace(/\/(small|medium)\//gi, '/big/')
    .replace(/[_-](small|medium)(\.[a-z]+)$/gi, '_big$2')
    .replace(/(\d{3,4}x\d{3,4})/gi, '1920x1080');

  return {
    primary: upgraded || baseSrc,
    fallback: baseSrc || bestSrc,
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const { primary, fallback } = getMaxQualityThumb(video);
  const [imgSrc, setImgSrc] = useState<string>(primary);
  const [broken, setBroken] = useState<boolean>(!primary && !fallback);

  useEffect(() => {
    setImgSrc(primary);
    setBroken(!primary && !fallback);
  }, [primary, fallback]);

  if (broken || !imgSrc) return null;

  const mins = video.length_min || 0;
  const secs = String(video.length_sec || 0).padStart(2, '0');

  return (
    <article className="group bg-[#141414] rounded-2xl overflow-hidden border border-gray-800/80 hover:border-[#FF9900] transition duration-200 shadow-lg">
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        <img
          src={imgSrc}
          alt={video.title}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (fallback && imgSrc !== fallback) {
              setImgSrc(fallback);
            } else {
              setBroken(true);
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <span className="absolute top-2 left-2 bg-black/85 text-[#FF9900] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#FF9900]/40">
          4K / HD
        </span>

        <span className="absolute bottom-2 right-2 bg-black/90 text-white text-xs font-bold px-2 py-0.5 rounded-md">
          {mins}:{secs}
        </span>
      </div>

      <div className="p-3">
        <h3 className="text-white text-sm font-bold line-clamp-2 group-hover:text-[#FF9900] transition leading-snug">
          {video.title}
        </h3>
        {video.views !== undefined && video.views !== '' && (
          <p className="text-xs text-gray-400 mt-1.5">👁️ {video.views} views</p>
        )}
      </div>
    </article>
  );
}