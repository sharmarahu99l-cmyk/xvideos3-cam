'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '../../VideoCard';
import JuicyBanner from '../../JuicyBanner';
import HubTubePlayer from './HubTubePlayer';
import {
  recordWatchedVideo,
  extractSmartTopics,
  rankAndBlendSimilarVideos,
  normalizeTitleKey,
} from '../../lib/userPrefs';
import { SEO_DESI_HUB_LINKS, toCategorySlug } from '../../lib/seoData';

export type WatchVideo = {
  id: string;
  title: string;
  default_thumb: { src: string };
  thumbs?: Array<{ src?: string; width?: number; height?: number }>;
  length_min: number | string;
  length_sec: number | string;
  embed?: string;
  views?: string | number;
  keywords?: string;
  added?: string;
};

type SearchHint = {
  label: string;
  type: 'category' | 'pornstar' | 'desi' | 'video';
};

const SIDEBAR_VIDEO_LINKS = [
  { icon: '📽️', label: '1080 HD PORN 1080P', slug: '1080p' },
  { icon: '🎬', label: '60FPS PORN', slug: '60-fps' },
  { icon: '4️⃣K', label: '4K PORN', slug: '4k' },
  { icon: '🔥', label: 'HD SEX', slug: 'hd-sex' },
  { icon: '⭐', label: 'TOP RATED', slug: 'top-rated' },
  { icon: '📹', label: 'AMATEUR', slug: 'amateur' },
  { icon: '👩', label: 'SOLO GIRLS', slug: 'solo' },
  { icon: '📡', label: 'ON-AIR', slug: 'live' },
  { icon: '🕶️', label: 'VR PORN', slug: 'vr-porn' },
  { icon: '📋', label: 'PLAYLISTS', slug: 'playlist' },
  { icon: '🎥', label: 'FREE PORN', slug: 'free-porn' },
];

const HINT_BADGE: Record<SearchHint['type'], { text: string; cls: string }> = {
  desi: { text: 'DESI', cls: 'bg-[#FF9900]/20 text-[#FF9900]' },
  category: { text: 'CAT', cls: 'bg-blue-500/20 text-blue-300' },
  pornstar: { text: 'STAR', cls: 'bg-pink-500/20 text-pink-300' },
  video: { text: 'VIDEO', cls: 'bg-neutral-700 text-neutral-300' },
};

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

function scrollTopNow() {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function validThumb(v: WatchVideo): boolean {
  const src = v?.default_thumb?.src?.trim() || '';
  return Boolean(v?.id && v?.title && src.startsWith('http'));
}

export default function WatchClient({
  id,
  initialVideo,
}: {
  id: string;
  initialVideo: WatchVideo | null;
}) {
  const router = useRouter();
  const [video, setVideo] = useState<WatchVideo | null>(initialVideo);
  const [related, setRelated] = useState<WatchVideo[]>([]);
  const [detectedTopics, setDetectedTopics] = useState<string[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>('ALL');
  const [loadingRelated, setLoadingRelated] = useState<boolean>(true);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showVideoSub, setShowVideoSub] = useState<boolean>(false);
  const [relatedPage, setRelatedPage] = useState<number>(1);

  const [searchInput, setSearchInput] = useState<string>('');
  const [hints, setHints] = useState<SearchHint[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [activeHintIdx, setActiveHintIdx] = useState<number>(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);

  const fetchBatch = useCallback(
    async (query: string, pageNum: number, perPage = 25, order = 'most-popular'): Promise<WatchVideo[]> => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&page=${pageNum}&per_page=${perPage}&order=${encodeURIComponent(order)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return (data as WatchVideo[]).filter(validThumb);
          }
        }
      } catch {}

      try {
        const direct = await fetch(
          `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${pageNum}&order=${encodeURIComponent(order)}&lq=0&thumbsize=big&format=json`
        );
        if (direct.ok) {
          const data = await direct.json();
          return Array.isArray(data.videos) ? (data.videos as WatchVideo[]).filter(validThumb) : [];
        }
      } catch {}

      return [];
    },
    []
  );

 const loadSmartSimilar = useCallback(
    async (
      targetVideo: WatchVideo | null,
      pageNum: number,
      topicFilter: string = 'ALL'
    ) => {
      setLoadingRelated(true);

      const ctx = extractSmartTopics(targetVideo?.title || id, targetVideo?.keywords || '');
      setDetectedTopics(ctx.topics);

      const excludeIds = new Set<string>([id]);
      const excludeTitles = new Set<string>(
        targetVideo?.title ? [normalizeTitleKey(targetVideo.title)] : []
      );

      if (topicFilter !== 'ALL') {
        // Fetch targeted results specifically for the clicked keyword using 2 different sort orders
        const [popularForTopic, topRatedForTopic] = await Promise.all([
          fetchBatch(topicFilter, pageNum, 20, 'most-popular'),
          fetchBatch(topicFilter, pageNum, 20, 'top-rated'),
        ]);
        const blended = rankAndBlendSimilarVideos(
          [popularForTopic, topRatedForTopic],
          [topicFilter],
          excludeIds,
          excludeTitles,
          25
        );
        setRelated(blended);
        setLoadingRelated(false);
        return;
      }

      // For ALL: fetch each distinct topic with varied sort orders & pages so every pill gives unique variety
      const topicsToQuery = ctx.topics.slice(0, 4);
      const sortModes = ['most-popular', 'top-rated', 'top-weekly', 'latest'];

      const batches = await Promise.all(
        topicsToQuery.map((topic, idx) =>
          fetchBatch(topic, pageNum + (idx % 2), 14, sortModes[idx % sortModes.length])
        )
      );

      const blended = rankAndBlendSimilarVideos(
        batches,
        topicsToQuery,
        excludeIds,
        excludeTitles,
        25
      );
      setRelated(blended);
      setLoadingRelated(false);
    },
    [id, fetchBatch]
  );

  useEffect(() => {
    let active = true;
    scrollTopNow();
    setRelatedPage(1);
    setActiveTopic('ALL');

    const handleLoaded = (v: WatchVideo | null) => {
      if (!active) return;
      if (v) {
        setVideo(v);
        if (v.title) {
          document.title = `${v.title} | HubTube - XVideos3 HD`;
        }
        recordWatchedVideo(v as any);
      }
      loadSmartSimilar(v, 1, 'ALL');
    };

    const initVideo = async () => {
      if (initialVideo && initialVideo.id === id) {
        handleLoaded(initialVideo);
        return;
      }

      try {
        const apiRes = await fetch(`/api/video/${encodeURIComponent(id)}`);
        if (apiRes.ok) {
          const data: WatchVideo | null = await apiRes.json();
          if (data && data.id) {
            handleLoaded(data);
            return;
          }
        }
      } catch {}

      try {
        const directRes = await fetch(
          `https://www.eporner.com/api/v2/video/id/?id=${encodeURIComponent(id)}&thumbsize=big&format=json`
        );
        if (directRes.ok) {
          const directData: WatchVideo = await directRes.json();
          if (directData && directData.id) {
            handleLoaded(directData);
            return;
          }
        }
      } catch {}

      handleLoaded(null);
    };

    initVideo();
    return () => {
      active = false;
    };
  }, [id, initialVideo, loadSmartSimilar]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!showHints || trimmed.length === 0) {
      setHints([]);
      setActiveHintIdx(-1);
      return;
    }

    const timer = setTimeout(async () => {
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      const controller = new AbortController();
      suggestAbortRef.current = controller;

      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data: { hints?: SearchHint[] } = await res.json();
        if (Array.isArray(data.hints)) setHints(data.hints);
      } catch {}
    }, 120);

    return () => clearTimeout(timer);
  }, [searchInput, showHints]);

  const closeSidebar = () => {
    setShowMenu(false);
    setShowVideoSub(false);
    scrollTopNow();
  };

  const goSearch = (term: string, hintType?: SearchHint['type']) => {
    setShowHints(false);
    scrollTopNow();
    const trimmed = term.trim();
    if (!trimmed) return;
    const slug = toCategorySlug(trimmed);
    if (hintType === 'pornstar' && slug) {
      router.push(`/pornstar/${slug}`);
      return;
    }
    if (slug && trimmed.split(/\s+/).length <= 4) {
      router.push(`/category/${slug}`);
    } else {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    goSearch(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showHints || hints.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveHintIdx((prev) => (prev + 1) % hints.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveHintIdx((prev) => (prev <= 0 ? hints.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeHintIdx >= 0 && hints[activeHintIdx]) {
      e.preventDefault();
      goSearch(hints[activeHintIdx].label);
    } else if (e.key === 'Escape') {
      setShowHints(false);
    }
  };

  const handleTopicSelect = (topic: string) => {
    setActiveTopic(topic);
    setRelatedPage(1);
    loadSmartSimilar(video, 1, topic);
  };

  const handleRelatedPageChange = (newPage: number) => {
    const safePage = Math.max(1, newPage);
    scrollTopNow();
    setRelatedPage(safePage);
    loadSmartSimilar(video, safePage, activeTopic);
  };

  const tagList = video?.keywords
    ? video.keywords.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 15)
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] px-4 py-3 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Menu"
            className="text-4xl text-[#FF9900] shrink-0"
          >
            ☰
          </button>

          <div ref={searchWrapRef} className="relative flex-1 max-w-xl">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                value={searchInput}
                onFocus={() => {
                  if (searchInput.trim().length > 0) setShowHints(true);
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  setShowHints(val.trim().length > 0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search desi videos, desi mms, bhabhi, pornstars..."
                autoComplete="off"
                className="w-full bg-[#222] border-2 border-[#FF9900] text-white pl-4 pr-12 py-2 rounded-full outline-none placeholder-gray-400 text-sm sm:text-base"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 bg-[#FF9900] text-black font-bold rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#ffaa33]"
              >
                🔍
              </button>
            </form>

            {showHints && searchInput.trim().length > 0 && hints.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#161616] border border-gray-700 rounded-2xl shadow-2xl z-[10001] max-h-[60vh] overflow-y-auto">
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#161616]">
                  <span>Suggestions ({hints.length})</span>
                  <button
                    type="button"
                    onClick={() => setShowHints(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                {hints.map((hint, idx) => {
                  const badge = HINT_BADGE[hint.type];
                  return (
                    <button
                      key={`${hint.type}-${hint.label}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        goSearch(hint.label);
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 border-b border-gray-800/60 transition ${
                        idx === activeHintIdx
                          ? 'bg-[#FF9900]/20 text-white'
                          : 'hover:bg-[#222] text-gray-200'
                      }`}
                    >
                      <span className="truncate text-sm md:text-base">{hint.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/reels"
            className="bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center gap-1 shrink-0 transition"
          >
            <span>▶</span>
            <span>REELS</span>
          </Link>

          <Link href="/" onClick={scrollTopNow} className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter shrink-0">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </Link>
        </div>
      </header>

      {showMenu && (
        <div className="fixed top-0 left-0 h-full w-72 bg-[#1a1a1a] shadow-2xl z-[9999] pt-16 overflow-y-auto border-r border-gray-800">
          <div className="flex justify-end px-6 pt-4 pb-2 border-b border-gray-700">
            <button
              onClick={closeSidebar}
              className="text-4xl leading-none text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <button
            onClick={() => setShowVideoSub(!showVideoSub)}
            className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left"
          >
            ▶ VIDEOS
          </button>

          {showVideoSub && (
            <div className="mt-2 px-6 space-y-3 pb-3">
              {SIDEBAR_VIDEO_LINKS.map((item) => (
                <Link
                  key={item.slug}
                  href={`/category/${item.slug}`}
                  onClick={closeSidebar}
                  className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black text-white transition"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          <Link href="/category/desi" onClick={closeSidebar} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">🔥 DESI VIDEOS</Link>
          <Link href="/reels" onClick={closeSidebar} className="px-6 py-4 text-[#FF9900] text-lg font-black flex items-center gap-3 border-b border-gray-700">🎬 REELS (SWIPE)</Link>
          <Link href="/category/viral-desi-mms" onClick={closeSidebar} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">⚡ VIRAL DESI MMS</Link>
          <Link href="/category/4k" onClick={closeSidebar} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">4K PORN</Link>
          <Link href="/category/best-videos" onClick={closeSidebar} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">BEST VIDEOS</Link>
          <Link href="/categories" onClick={closeSidebar} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ CATEGORIES</Link>
          <Link href="/pornstars" onClick={closeSidebar} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ PORNSTARS</Link>
          <Link href="/history" onClick={closeSidebar} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">🕒 WATCH HISTORY</Link>
          <Link href="/login" onClick={closeSidebar} className="px-6 py-4 text-white text-lg font-medium flex items-center gap-3 border-b border-gray-700 hover:text-[#FF9900]">🔑 SIGN IN</Link>
          <Link href="/signup" onClick={closeSidebar} className="px-6 py-4 text-[#FF9900] text-lg font-bold flex items-center gap-3 border-b border-gray-700">✨ SIGN UP</Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <HubTubePlayer
          id={id}
          title={video?.title}
          poster={video?.default_thumb?.src}
        />

        <JuicyBanner />

        <div className="mt-6 bg-[#111] p-6 rounded-2xl border border-gray-800">
          <h1 className="text-white text-2xl md:text-3xl font-black mb-2 leading-snug">
            {video?.title || 'HD Desi & Viral Video Stream'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
            {video?.views !== undefined && <span>👁️ {video.views} views</span>}
            {video && (
              <span>⏱️ {formatDuration(video.length_sec, video.length_min)}</span>
            )}
            <span className="text-[#FF9900] font-bold">HD • FREE STREAM</span>
          </div>

          <h2 className="text-[#FF9900] text-lg font-bold mb-2">Video Description</h2>
          <p className="text-gray-300 leading-relaxed">
            Watch {video?.title || 'this full HD video'} on HubTube (XVideos3.cam).<br />
            Free HD porn video streaming with fast HubTube quality, viral Desi MMS, and top pornstars.
          </p>

          {tagList.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Video Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tagList.map((tag) => {
                  const slug = toCategorySlug(tag);
                  if (!slug) return null;
                  return (
                    <Link
                      key={tag}
                      href={`/category/${slug}`}
                      onClick={scrollTopNow}
                      className="bg-[#222] hover:bg-[#FF9900] hover:text-black text-xs font-semibold px-3 py-1.5 rounded-full transition"
                    >
                      #{tag}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <JuicyBanner adzone={1133788} width={308} height={286} />

        <section id="similar-videos-section" className="mt-10">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-[#FF9900] text-xl md:text-2xl font-black">
              Similar Videos
            </h2>
          </div>

          {detectedTopics.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-3">
              <button
                type="button"
                onClick={() => handleTopicSelect('ALL')}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-bold shrink-0 transition border ${
                  activeTopic === 'ALL'
                    ? 'bg-[#FF9900] text-black border-[#FF9900]'
                    : 'bg-[#161616] text-gray-300 border-gray-800 hover:border-[#FF9900]'
                }`}
              >
                All Matched ({detectedTopics.join(' + ')})
              </button>
              {detectedTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicSelect(topic)}
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-bold shrink-0 transition border ${
                    activeTopic === topic
                      ? 'bg-[#FF9900] text-black border-[#FF9900]'
                      : 'bg-[#161616] text-gray-300 border-gray-800 hover:border-[#FF9900]'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}

          {loadingRelated ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-2xl aspect-video animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {related.slice(0, 15).map((v) => (
                  <Link key={v.id} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                    <VideoCard video={v} />
                  </Link>
                ))}
              </div>

              {related.length > 15 && (
                <>
                  <div className="my-8">
                    <JuicyBanner />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {related.slice(15).map((v) => (
                      <Link key={v.id} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                        <VideoCard video={v} />
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        <div className="mt-10 flex justify-center items-center gap-3">
          <button
            onClick={() => handleRelatedPageChange(relatedPage - 1)}
            disabled={relatedPage <= 1}
            className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] hover:text-black rounded-full font-bold disabled:opacity-40 transition"
          >
            ← Prev Page
          </button>
          <span className="px-4 py-2 bg-[#161616] rounded-full text-sm font-bold text-[#FF9900]">
            Page {relatedPage}
          </span>
          <button
            onClick={() => handleRelatedPageChange(relatedPage + 1)}
            className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] hover:text-black rounded-full font-bold transition"
          >
            Next Page →
          </button>
        </div>

        <div className="mt-10">
          <JuicyBanner adzone={1133788} width={308} height={286} />
        </div>

        {/* SEO Category Hub + Compliance Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800">
          <h2 className="text-lg font-black text-[#FF9900] mb-3">
            Popular Desi Videos, Viral MMS &amp; HD Categories
          </h2>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            HubTube (XVideos3.cam) indexes thousands of new Desi videos, viral Desi MMS, Indian bhabhi, aunty, Pakistani MMS, and 4K 60fps videos updated every hour.
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {SEO_DESI_HUB_LINKS.map((term) => (
              <Link
                key={term}
                href={`/category/${toCategorySlug(term)}`}
                onClick={scrollTopNow}
                className="text-xs bg-[#161616] hover:bg-[#FF9900] hover:text-black text-gray-300 px-3 py-1.5 rounded-full border border-gray-800 transition"
              >
                {term}
              </Link>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/terms" className="hover:text-[#FF9900] transition">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-[#FF9900] transition">
                Privacy Policy
              </Link>
              <Link href="/dmca" className="hover:text-[#FF9900] transition">
                DMCA / Takedown
              </Link>
              <Link href="/2257" className="hover:text-[#FF9900] transition">
                18 U.S.C. § 2257
              </Link>
              <Link href="/api/feed.xml" className="hover:text-[#FF9900] transition">
                MRSS Feed
              </Link>
            </div>
            <p className="text-gray-500">
              © {new Date().getFullYear()} XVideos3.cam (HubTube) • 18+ Adults Only • RTA-5042-1996-1400-1577-RTA
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}