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

const FOR_YOU_KEY = '__for_you_desi__';

const REEL_CATEGORIES = [
  { label: '🔥 For You', query: FOR_YOU_KEY },
  { label: 'Viral MMS', query: 'viral desi' },
  { label: 'Bhabhi', query: 'desi bhabhi' },
  { label: 'Aunty', query: 'desi aunty' },
  { label: 'Amateur', query: 'amateur' },
  { label: '4K HD', query: '4k' },
  { label: 'Big Tits', query: 'big tits' },
  { label: 'MILF', query: 'milf' },
  { label: 'Pornstars', query: 'pornstar' },
];

const LIKES_KEY = 'hubtube_reel_likes_v1';

function parseViews(views?: string | number): number {
  if (typeof views === 'number') return views;
  if (typeof views === 'string') {
    const num = Number(views.replace(/[^0-9]/g, ''));
    return Number.isNaN(num) ? 0 : num;
  }
  return 0;
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
  order: 'top-weekly' | 'most-popular'
): Promise<ReelVideo[]> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&page=${pageNum}&per_page=${perPage}&order=${order}`
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
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${pageNum}&order=${order}&lq=0&thumbsize=big&format=json`
    );
    if (direct.ok) {
      const data = await direct.json();
      return Array.isArray(data.videos) ? (data.videos as ReelVideo[]).filter(validThumb) : [];
    }
  } catch {}

  return [];
}

async function fetchReelBatch(categoryQuery: string, pageNum: number): Promise<ReelVideo[]> {
  // For You = Trending Desi Videos (top-weekly + most-popular)
  if (categoryQuery === FOR_YOU_KEY) {
    const [trendingWeekly, mostPopular] = await Promise.all([
      fetchSingleOrder('desi', pageNum, 15, 'top-weekly'),
      fetchSingleOrder('desi', pageNum, 15, 'most-popular'),
    ]);

    const merged: ReelVideo[] = [];
    const seen = new Set<string>();
    const maxLen = Math.max(trendingWeekly.length, mostPopular.length);

    for (let i = 0; i < maxLen; i++) {
      for (const item of [trendingWeekly[i], mostPopular[i]]) {
        if (item && !seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
    }

    return merged.sort((a, b) => parseViews(b.views) - parseViews(a.views));
  }

  const list = await fetchSingleOrder(categoryQuery, pageNum, 20, 'most-popular');
  return list.sort((a, b) => parseViews(b.views) - parseViews(a.views));
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
      {/* Top Floating Header + Category Switcher */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 via-black/60 to-transparent pt-3 pb-4 px-3 pointer-events-none">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-1.5 bg-black/65 hover:bg-[#FF9900] hover:text-black text-white px-3.5 py-1.5 rounded-full text-xs font-black border border-white/15 backdrop-blur-md transition shrink-0"
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
            className="bg-black/65 hover:bg-[#FF9900] hover:text-black text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/15 backdrop-blur-md transition shrink-0"
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

      {/* Vertical Snap-Scrolling Feed */}
      {loading ? (
        <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-3 bg-black">
          <div className="w-10 h-10 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400">Loading Trending Desi Reels...</p>
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
                {/* Ambient Full-Screen Blurred Backdrop */}
                <img
                  src={v.default_thumb.src}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-35 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/25 to-black/90 pointer-events-none" />

                {/* Reel Column (Full width on mobile, phone-width on desktop) */}
                <div className="relative z-10 h-[100dvh] w-full sm:max-w-[460px] flex flex-col justify-between pt-28 pb-5 px-0 sm:px-2">
                  {/* Video Player with Full Draggable Timeline/Seek Bar Visible */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-full h-[64dvh] sm:h-[68dvh] bg-black sm:rounded-2xl overflow-hidden border-y sm:border border-white/15 shadow-2xl">
                      {isActive ? (
                        <iframe
                          key={`reel-frame-${v.id}`}
                          src={`https://www.eporner.com/embed/${encodeURIComponent(v.id)}/?autoplay=1&muted=1`}
                          className="w-full h-[calc(100%+56px)] -mt-[56px] border-0"
                          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <img
                          src={v.default_thumb.src}
                          alt={v.title}
                          loading={idx <= 1 ? 'eager' : 'lazy'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* Bottom Info Bar (Sits cleanly below the player so seek bar is never blocked) */}
                  <div className="px-4 pr-16 pt-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-[#FF9900] text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeCategory === FOR_YOU_KEY ? '🔥 TRENDING DESI' : 'HUBREELS'}
                      </span>
                      <span className="bg-black/75 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/15">
                        ⏱ {duration}
                      </span>
                      {v.views !== undefined && (
                        <span className="text-xs text-gray-200 font-semibold">
                          👁 {v.views}
                        </span>
                      )}
                    </div>

                    <h2 className="text-white text-sm sm:text-base font-bold line-clamp-2 leading-snug">
                      {v.title}
                    </h2>
                  </div>

                  {/* Right-Side Action Rail */}
                  <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-3.5">
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
                            : 'bg-black/65 border-white/20 text-white group-hover:border-[#FF9900]'
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
                      <div className="w-10 h-10 rounded-full bg-black/65 border border-white/20 group-hover:bg-[#FF9900] group-hover:text-black flex items-center justify-center backdrop-blur-md transition">
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
                      <div className="w-10 h-10 rounded-full bg-black/65 border border-white/20 group-hover:border-[#FF9900] flex items-center justify-center backdrop-blur-md transition">
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
                </div>
              </section>
            );
          })}

          {loadingMore && (
            <div className="h-24 flex items-center justify-center bg-black text-xs font-bold text-[#FF9900]">
              Loading more trending desi reels...
            </div>
          )}
        </div>
      )}
    </div>
  );
}