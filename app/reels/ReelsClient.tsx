'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';

export interface ReelVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min?: number | string;
  length_sec?: number | string;
  views?: string | number;
  keywords?: string;
}

const FOR_YOU_KEY = '__for_you_desi_mms__';

const REEL_CATEGORIES = [
  { label: '🔥 For You (Desi MMS)', query: FOR_YOU_KEY },
  { label: 'Desi Bhabhi', query: 'desi bhabhi' },
  { label: 'Desi Aunty', query: 'desi aunty' },
  { label: 'Indian Homemade', query: 'indian homemade' },
  { label: 'Amateur', query: 'amateur' },
  { label: '4K HD', query: '4k' },
  { label: 'Big Tits', query: 'big tits' },
  { label: 'MILF', query: 'milf' },
  { label: 'Pornstars', query: 'pornstar' },
];

const LIKES_KEY = 'hubtube_reel_likes_v1';

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
  return 'HD';
}

function validThumb(v: ReelVideo): boolean {
  const src = v?.default_thumb?.src?.trim() || '';
  return Boolean(v?.id && v?.title && src.startsWith('http'));
}

async function fetchSingleOrder(
  query: string,
  pageNum: number,
  perPage: number,
  order: 'top-weekly' | 'latest' | 'most-popular'
): Promise<ReelVideo[]> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&page=${pageNum}&per_page=${perPage}&order=${order}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return (data as ReelVideo[]).filter(validThumb);
      }
    }
  } catch {}

  try {
    const direct = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${pageNum}&order=${order}&lq=0&thumbsize=big&format=json`,
      { cache: 'no-store' }
    );
    if (direct.ok) {
      const data = await direct.json();
      return Array.isArray(data.videos) ? (data.videos as ReelVideo[]).filter(validThumb) : [];
    }
  } catch {}

  return [];
}

async function fetchReelBatch(categoryQuery: string, pageNum: number): Promise<ReelVideo[]> {
  // For You = Auto-updating Desi MMS (top-weekly + latest + most-popular)
  if (categoryQuery === FOR_YOU_KEY) {
    const [weekly, latest, popular] = await Promise.all([
      fetchSingleOrder('desi mms', pageNum, 12, 'top-weekly'),
      fetchSingleOrder('desi mms', pageNum, 12, 'latest'),
      fetchSingleOrder('desi mms', pageNum, 12, 'most-popular'),
    ]);

    const merged: ReelVideo[] = [];
    const seen = new Set<string>();
    const maxLen = Math.max(weekly.length, latest.length, popular.length);

    for (let i = 0; i < maxLen; i++) {
      for (const item of [weekly[i], latest[i], popular[i]]) {
        if (item && !seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
    }
    return merged;
  }

  return fetchSingleOrder(categoryQuery, pageNum, 20, 'most-popular');
}

export default function ReelsClient({ initialVideos }: { initialVideos: ReelVideo[] }) {
  const [videos, setVideos] = useState<ReelVideo[]>(initialVideos.filter(validThumb));
  const [activeCategory, setActiveCategory] = useState<string>(FOR_YOU_KEY);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(initialVideos.length === 0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string>('');

  const feedRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const loadingMoreRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIKES_KEY);
      if (raw) setLikedIds(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (videos.length === 0) {
      setLoading(true);
      fetchReelBatch(activeCategory, 1).then((batch) => {
        setVideos(batch);
        setLoading(false);
      });
    }
  }, [activeCategory, videos.length]);

  // Mount only the active reel when scrolling into view
  useEffect(() => {
    const container = feedRef.current;
    if (!container || videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.7,
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [videos]);

  // Infinite scroll: auto-loads next batch of Desi MMS reels
  useEffect(() => {
    if (
      videos.length > 0 &&
      activeIndex >= videos.length - 3 &&
      !loadingMoreRef.current
    ) {
      loadingMoreRef.current = true;
      setLoadingMore(true);
      const nextPage = page + 1;

      fetchReelBatch(activeCategory, nextPage).then((more) => {
        setVideos((prev) => {
          const seen = new Set(prev.map((v) => v.id));
          const unique = more.filter((v) => !seen.has(v.id));
          return [...prev, ...unique];
        });
        setPage(nextPage);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      });
    }
  }, [activeIndex, videos.length, activeCategory, page]);

  const scrollToReel = useCallback(
    (targetIdx: number) => {
      const safe = Math.max(0, Math.min(videos.length - 1, targetIdx));
      const el = itemRefs.current[safe];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [videos.length]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToReel(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToReel(activeIndex - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, scrollToReel]);

  const handleCategoryChange = async (query: string) => {
    if (query === activeCategory) return;
    setActiveCategory(query);
    setLoading(true);
    setActiveIndex(0);
    setPage(1);
    const batch = await fetchReelBatch(query, 1);
    setVideos(batch);
    setLoading(false);
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const toggleLike = (videoId: string) => {
    setLikedIds((prev) => {
      const next = { ...prev, [videoId]: !prev[videoId] };
      try {
        localStorage.setItem(LIKES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleShare = async (video: ReelVideo) => {
    const url = `${window.location.origin}/reels?start=${encodeURIComponent(video.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast('Reel link copied!');
      setTimeout(() => setToast(''), 2000);
    } catch {}
  };

  return (
    <div className="relative h-[100dvh] w-full bg-black text-white overflow-hidden select-none">
      {/* Floating Top Bar + Category Switcher */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/85 via-black/45 to-transparent pt-3 pb-5 px-3 pointer-events-none">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-1.5 bg-black/60 hover:bg-[#FF9900] hover:text-black text-white px-3.5 py-1.5 rounded-full text-xs font-black border border-white/15 backdrop-blur-md transition shrink-0"
          >
            <span>←</span>
            <span>HOME</span>
          </Link>

          <div className="flex items-center gap-0.5 text-lg font-black tracking-tight drop-shadow">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">REELS</span>
          </div>

          <Link
            href="/history"
            className="bg-black/60 hover:bg-[#FF9900] hover:text-black text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/15 backdrop-blur-md transition shrink-0"
          >
            🕒 History
          </Link>
        </div>

        <div className="max-w-lg mx-auto mt-3 flex items-center gap-2 overflow-x-auto pointer-events-auto pb-1">
          {REEL_CATEGORIES.map((cat) => (
            <button
              key={cat.query}
              type="button"
              onClick={() => handleCategoryChange(cat.query)}
              className={`px-3.5 py-1 rounded-full text-xs font-bold shrink-0 backdrop-blur-md transition border cursor-pointer ${
                activeCategory === cat.query
                  ? 'bg-[#FF9900] text-black border-[#FF9900]'
                  : 'bg-black/55 text-gray-200 border-white/15 hover:border-[#FF9900]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {toast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-[#FF9900] text-black text-xs font-black px-4 py-2 rounded-full shadow-xl">
          {toast}
        </div>
      )}

      {/* Full-Screen 100dvh Vertical Reels Feed */}
      {loading ? (
        <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-3 bg-black">
          <div className="w-10 h-10 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400">Loading Desi MMS Reels...</p>
        </div>
      ) : (
        <div
          ref={feedRef}
          className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory"
        >
          {videos.map((v, idx) => {
            const isActive = idx === activeIndex;
            const isLiked = Boolean(likedIds[v.id]);
            const duration = formatDuration(v.length_sec, v.length_min);

            return (
              <section
                key={`${v.id}-${idx}`}
                data-index={idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center bg-black overflow-hidden"
              >
                {/* Full-Screen Vertical Reel Viewport */}
                <div className="relative h-[100dvh] w-full sm:max-w-[460px] bg-black overflow-hidden sm:border-x sm:border-white/10">
                  {/* Full-Bleed Thumbnail while scrolling */}
                  <img
                    src={v.default_thumb.src}
                    alt={v.title}
                    loading={idx <= 1 ? 'eager' : 'lazy'}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Full-Screen Reel Player: Top title cropped, Bottom Draggable Seek Bar 100% Visible */}
                  {isActive && (
                    <div className="absolute inset-0 bg-black z-10 overflow-hidden">
                      <iframe
                        key={`reel-frame-${v.id}`}
                        src={`https://www.eporner.com/embed/${encodeURIComponent(v.id)}/?autoplay=1&muted=1`}
                        className="w-full h-[calc(100%+56px)] -mt-[56px] border-0"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                      {/* Covers only "Hosted by EPORNER COM" at very bottom center without blocking the draggable seek bar above it */}
                      <div
                        aria-hidden="true"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-10 min-w-[170px] sm:min-w-[200px] px-3 bg-black flex items-center justify-center gap-0.5 z-20 pointer-events-auto"
                      >
                        <span className="text-xs font-black text-[#FF9900]">H</span>
                        <span className="text-xs font-black text-white">UB</span>
                        <span className="text-xs font-black text-[#FF9900]">REELS</span>
                      </div>
                    </div>
                  )}

                  {/* Subtle Top Gradient (leaves seek bar at bottom completely clear) */}
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-20" />

                  {/* Right-Side Instagram-Style Action Rail */}
                  <div className="absolute right-2.5 bottom-24 z-30 flex flex-col items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => toggleLike(v.id)}
                      aria-label="Like reel"
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                          isLiked
                            ? 'bg-red-500 border-red-400 text-white scale-110'
                            : 'bg-black/60 border-white/20 text-white group-hover:border-[#FF9900]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">
                        {isLiked ? 'Liked' : 'Like'}
                      </span>
                    </button>

                    <Link
                      href={`/watch/${v.id}`}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 group-hover:bg-[#FF9900] group-hover:text-black flex items-center justify-center backdrop-blur-md transition">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">Full</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleShare(v)}
                      aria-label="Share reel"
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 group-hover:border-[#FF9900] flex items-center justify-center backdrop-blur-md transition">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">Share</span>
                    </button>

                    <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
                      <button
                        type="button"
                        onClick={() => scrollToReel(idx - 1)}
                        disabled={idx === 0}
                        aria-label="Previous reel"
                        className="w-9 h-9 rounded-full bg-black/75 hover:bg-[#FF9900] hover:text-black border border-white/20 flex items-center justify-center disabled:opacity-30 transition cursor-pointer text-sm font-black"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToReel(idx + 1)}
                        aria-label="Next reel"
                        className="w-9 h-9 rounded-full bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black flex items-center justify-center shadow-lg transition cursor-pointer text-sm"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  {/* Floating Reel Title (Positioned above the seek bar so dragging works cleanly) */}
                  <div className="absolute bottom-16 left-3 right-16 z-30 pointer-events-none">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-[#FF9900] text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeCategory === FOR_YOU_KEY ? '🔥 DESI MMS' : 'HUBREELS'}
                      </span>
                      <span className="bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/15">
                        ⏱ {duration}
                      </span>
                      {v.views !== undefined && (
                        <span className="text-xs text-gray-200 font-semibold drop-shadow">
                          👁 {v.views}
                        </span>
                      )}
                    </div>

                    <h2 className="text-white text-sm font-bold line-clamp-2 drop-shadow-md leading-snug">
                      {v.title}
                    </h2>
                  </div>
                </div>
              </section>
            );
          })}

          {loadingMore && (
            <div className="h-24 flex items-center justify-center bg-black text-xs font-bold text-[#FF9900]">
              Loading more Desi MMS reels...
            </div>
          )}
        </div>
      )}
    </div>
  );
}