'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface ThumbItem {
  src?: string;
  width?: number;
  height?: number;
}

export interface VideoCardData {
  id: string;
  title: string;
  default_thumb?: { src?: string };
  thumbs?: ThumbItem[];
  length_min?: number | string;
  length_sec?: number | string;
  views?: string | number;
  embed?: string;
  keywords?: string;
  added?: string;
}

function formatDuration(lengthSec?: number | string, lengthMin?: number | string): string {
  const totalSecs = Number(lengthSec);
  if (!Number.isNaN(totalSecs) && totalSecs > 0) {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  if (typeof lengthMin === 'string' && lengthMin.includes(':')) {
    return lengthMin.trim();
  }

  const minsNum = Number(lengthMin);
  if (!Number.isNaN(minsNum) && minsNum > 0) {
    return `${Math.floor(minsNum)}:00`;
  }

  return '0:00';
}

function extractPreviewFrames(video: VideoCardData): {
  primary: string;
  fallback: string;
  frames: string[];
} {
  const baseSrc = video.default_thumb?.src?.trim() || '';
  let best = baseSrc;
  const frameSet = new Set<string>();

  if (Array.isArray(video.thumbs) && video.thumbs.length > 0) {
    const validThumbs = video.thumbs.filter((t) => Boolean(t?.src && t.src.startsWith('http')));
    const sorted = [...validThumbs].sort(
      (a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0)
    );
    if (sorted[0]?.src) best = sorted[0].src.trim();

    for (const t of validThumbs) {
      if (t.src) {
        const hiRes = t.src
          .trim()
          .replace(/\/(small|medium)\//gi, '/big/')
          .replace(/[_-](small|medium)(\.[a-z]+)$/gi, '_big$2');
        frameSet.add(hiRes);
      }
    }
  }

  const upgraded = best
    .replace(/\/(small|medium)\//gi, '/big/')
    .replace(/[_-](small|medium)(\.[a-z]+)$/gi, '_big$2')
    .replace(/(\d{3,4}x\d{3,4})/gi, '1920x1080');

  const primary = upgraded || baseSrc;
  const fallback = baseSrc || best;
  if (primary) frameSet.add(primary);

  return {
    primary,
    fallback,
    frames: Array.from(frameSet),
  };
}

export default function VideoCard({ video }: { video: VideoCardData }) {
  const { primary, fallback, frames } = useMemo(() => extractPreviewFrames(video), [video]);
  const [imgSrc, setImgSrc] = useState(primary);
  const [hidden, setHidden] = useState(!primary && !fallback);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setImgSrc(primary);
    setHidden(!primary && !fallback);
    setFrameIdx(0);
  }, [primary, fallback]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || frames.length <= 1 || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsPreviewing(true);
        } else {
          setIsPreviewing(false);
          setFrameIdx(0);
          setImgSrc(primary);
        }
      },
      {
        rootMargin: '-28% 0px -28% 0px',
        threshold: 0.55,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [frames.length, primary]);

  useEffect(() => {
    if (!isPreviewing || frames.length <= 1) return;

    const interval = setInterval(() => {
      setFrameIdx((prev) => {
        const next = (prev + 1) % frames.length;
        setImgSrc(frames[next]);
        return next;
      });
    }, 650);

    return () => clearInterval(interval);
  }, [isPreviewing, frames]);

  if (hidden || !imgSrc) return null;

  const durationText = formatDuration(video.length_sec, video.length_min);
  const progressPct = frames.length > 1 ? Math.round(((frameIdx + 1) / frames.length) * 100) : 0;

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => {
        if (frames.length > 1) setIsPreviewing(true);
      }}
      onMouseLeave={() => {
        setIsPreviewing(false);
        setFrameIdx(0);
        setImgSrc(primary);
      }}
      className="group bg-[#141414] rounded-2xl overflow-hidden border border-gray-800/80 hover:border-[#FF9900] transition duration-200 shadow-lg"
    >
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
              setHidden(true);
            }
          }}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isPreviewing ? 'scale-105' : 'group-hover:scale-105'
          }`}
        />

        <span className="absolute top-2 left-2 bg-black/85 text-[#FF9900] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#FF9900]/40">
          {isPreviewing && frames.length > 1 ? '▶ PREVIEW' : '4K / HD'}
        </span>

        <span className="absolute bottom-2 right-2 bg-black/90 text-white text-xs font-bold px-2 py-0.5 rounded-md">
          {durationText}
        </span>

        {isPreviewing && frames.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/70">
            <div
              className="h-full bg-[#FF9900] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
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
