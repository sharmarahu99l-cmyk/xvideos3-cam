'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '../../VideoCard';

export type WatchVideo = {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min: number;
  length_sec: number;
  embed: string;
  views?: string;
  keywords?: string;
  added?: string;
};

type SearchHint = {
  label: string;
  type: 'category' | 'pornstar' | 'desi' | 'video';
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'her', 'his', 'she',
  'him', 'you', 'your', 'are', 'was', 'were', 'has', 'have', 'hot', 'free',
  'video', 'videos', 'full', 'new', 'best', 'xxx', 'porn', 'sex',
]);

function extractRelatedQuery(v: WatchVideo | null): string {
  if (!v) return 'desi';
  if (v.keywords) {
    const tags = v.keywords
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t.toLowerCase()));
    if (tags.length > 0) return tags.slice(0, 2).join(' ');
  }
  if (v.title) {
    const words = v.title
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase()));
    if (words.length > 0) return words.slice(0, 3).join(' ');
  }
  return 'desi';
}

const HINT_BADGE: Record<SearchHint['type'], { text: string; cls: string }> = {
  desi: { text: 'DESI', cls: 'bg-[#FF9900]/20 text-[#FF9900]' },
  category: { text: 'CAT', cls: 'bg-blue-500/20 text-blue-300' },
  pornstar: { text: 'STAR', cls: 'bg-pink-500/20 text-pink-300' },
  video: { text: 'VIDEO', cls: 'bg-neutral-700 text-neutral-300' },
};

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
  const [moreVideos, setMoreVideos] = useState<WatchVideo[]>([]);
  const [loadingRelated, setLoadingRelated] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showVideoSub, setShowVideoSub] = useState<boolean>(false);
  const [relatedPage, setRelatedPage] = useState<number>(1);
  const [extraPages, setExtraPages] = useState<number>(0);

  // Instant search hints state
  const [searchInput, setSearchInput] = useState<string>('');
  const [hints, setHints] = useState<SearchHint[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [activeHintIdx, setActiveHintIdx] = useState<number>(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);

  const loadSimilarVideos = useCallback(
    async (targetVideo: WatchVideo | null, pageNum: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingRelated(true);
      }

      const query = extractRelatedQuery(targetVideo);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&page=${pageNum}&per_page=30`
        );
        const data: WatchVideo[] = res.ok ? await res.json() : [];
        const filtered = (Array.isArray(data) ? data : []).filter((v) => v.id !== id);

        if (append) {
          setMoreVideos((prev) => {
            const seen = new Set([...related.map((r) => r.id), ...prev.map((p) => p.id)]);
            const uniqueNew = filtered.filter((v) => !seen.has(v.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setRelated(filtered);
          setMoreVideos([]);
          setExtraPages(0);
        }
      } catch {
        // Keep current list on transient error
      } finally {
        setLoadingRelated(false);
        setLoadingMore(false);
      }
    },
    [id, related]
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    setRelatedPage(1);
    setMoreVideos([]);
    setExtraPages(0);

    if (initialVideo && initialVideo.id === id) {
      setVideo(initialVideo);
      document.title = `${initialVideo.title} | HubTube - XVideos3 HD`;
      loadSimilarVideos(initialVideo, 1, false);
      return;
    }

    fetch(`https://www.eporner.com/api/v2/video/id/${encodeURIComponent(id)}/?format=json`)
      .then((res) => res.json())
      .then((data: WatchVideo) => {
        setVideo(data);
        if (data?.title) {
          document.title = `${data.title} | HubTube - XVideos3 HD`;
        }
        loadSimilarVideos(data, 1, false);
      })
      .catch(() => {
        loadSimilarVideos(null, 1, false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, initialVideo]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unlimited hints from /api/suggest
  useEffect(() => {
    if (!showHints) return;
    setActiveHintIdx(-1);

    const timer = setTimeout(async () => {
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      const controller = new AbortController();
      suggestAbortRef.current = controller;

      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(searchInput)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data: { hints?: SearchHint[] } = await res.json();
        if (Array.isArray(data.hints)) setHints(data.hints);
      } catch {
        // Ignore abort
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [searchInput, showHints]);

  const handleSidebarClick = (term: string) => {
    router.push(`/?q=${encodeURIComponent(term)}`);
    setShowMenu(false);
    setShowVideoSub(false);
  };

  const goSearch = (term: string) => {
    setShowHints(false);
    if (term.trim()) {
      router.push(`/?q=${encodeURIComponent(term.trim())}`);
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

  const handleLoadMore = () => {
    const nextBatch = relatedPage + extraPages + 1;
    setExtraPages((prev) => prev + 1);
    loadSimilarVideos(video, nextBatch, true);
  };

  const handleRelatedPageChange = (newPage: number) => {
    const safePage = Math.max(1, newPage);
    setRelatedPage(safePage);
    loadSimilarVideos(video, safePage, false);
    const el = document.getElementById('similar-videos-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const tagList = video?.keywords
    ? video.keywords.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12)
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      {/* HEADER */}
      <header className="bg-[#111] px-4 py-3 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Menu"
            className="text-4xl text-[#FF9900] shrink-0"
          >
            ☰
          </button>

          {/* Instant Search with Unlimited Hints */}
          <div ref={searchWrapRef} className="relative flex-1 max-w-xl">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                value={searchInput}
                onFocus={() => setShowHints(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowHints(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search desi, bhabhi, pornstars, categories..."
                autoComplete="off"
                className="w-full bg-[#222] border-2 border-[#FF9900] text-white pl-5 pr-16 py-2.5 rounded-full outline-none placeholder-gray-400"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 bg-[#FF9900] text-black font-bold rounded-full w-9 h-9 flex items-center justify-center hover:bg-[#ffaa33]"
              >
                🔍
              </button>
            </form>

            {showHints && hints.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#161616] border border-gray-700 rounded-2xl shadow-2xl z-[10001] max-h-[60vh] overflow-y-auto">
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#161616]">
                  <span>{searchInput.trim() ? `Suggestions (${hints.length})` : 'Trending & Categories'}</span>
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

          <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter shrink-0">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </Link>
        </div>
      </header>

      {/* SIDEBAR - same as HomeClient */}
      {showMenu && (
        <div className="fixed top-0 left-0 h-full w-72 bg-[#1a1a1a] shadow-2xl z-[9999] pt-16 overflow-y-auto border-r border-gray-800">
          <div className="flex justify-end px-6 pt-4 pb-2 border-b border-gray-700">
            <button
              onClick={() => {
                setShowMenu(false);
                setShowVideoSub(false);
              }}
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
            <div className="mt-2 px-6 space-y-3">
              <button onClick={() => handleSidebarClick("1080p")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">📽️</span><span className="text-white">1080 HD PORN 1080P</span></button>
              <button onClick={() => handleSidebarClick("60fps")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">🎬</span><span className="text-white">60FPS PORN</span></button>
              <button onClick={() => handleSidebarClick("4k")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">4️⃣K</span><span className="text-white">4K PORN</span></button>
              <button onClick={() => handleSidebarClick("hd sex")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">🔥</span><span className="text-white">HD SEX</span></button>
              <button onClick={() => handleSidebarClick("top rated")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">⭐</span><span className="text-white">TOP RATED</span></button>
              <button onClick={() => handleSidebarClick("amateur")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">📹</span><span className="text-white">AMATEUR</span></button>
              <button onClick={() => handleSidebarClick("solo")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">👩</span><span className="text-white">SOLO GIRLS</span></button>
              <button onClick={() => handleSidebarClick("live")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">📡</span><span className="text-white">ON-AIR</span></button>
              <button onClick={() => handleSidebarClick("vr")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">🕶️</span><span className="text-white">VR PORN</span></button>
              <button onClick={() => handleSidebarClick("playlist")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">📋</span><span className="text-white">PLAYLISTS</span></button>
              <button onClick={() => handleSidebarClick("free porn")} className="flex items-center gap-3 bg-[#222] rounded-xl p-3 w-full text-left hover:bg-[#FF9900] hover:text-black"><span className="text-xl">🎥</span><span className="text-white">FREE PORN</span></button>
            </div>
          )}
          <button onClick={() => handleSidebarClick("desi")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">🔥 DESI VIDEOS</button>
          <button onClick={() => handleSidebarClick("4k")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">4K PORN</button>
          <button onClick={() => handleSidebarClick("best videos")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">BEST VIDEOS</button>
          <Link href="/categories" onClick={() => setShowMenu(false)} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ CATEGORIES</Link>
          <Link href="/pornstars" onClick={() => setShowMenu(false)} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ PORNSTARS</Link>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative">
          <iframe
            src={`https://www.eporner.com/embed/${id}/`}
            className="w-full aspect-video bg-black rounded-2xl"
            allowFullScreen
          />
          <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded-lg flex items-center gap-1 text-xl font-black z-10 pointer-events-none">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </div>
        </div>

        {/* Real Unique Video Title & Description */}
        {video && (
          <div className="mt-6 bg-[#111] p-6 rounded-2xl border border-gray-800">
            <h1 className="text-white text-2xl md:text-3xl font-black mb-2 leading-snug">
              {video.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
              {video.views && <span>👁️ {video.views} views</span>}
              <span>⏱️ {video.length_min || 0}:{String(video.length_sec || 0).padStart(2, '0')}</span>
              <span className="text-[#FF9900] font-bold">HD • FREE STREAM</span>
            </div>

            <h2 className="text-[#FF9900] text-lg font-bold mb-2">Video Description</h2>
            <p className="text-gray-300 leading-relaxed">
              Watch {video.title} full HD video on HubTube (XVideos3.cam).<br />
              Free HD porn video streaming with fast HubTube quality.
            </p>

            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tagList.map((tag) => (
                  <Link
                    key={tag}
                    href={`/?q=${encodeURIComponent(tag)}`}
                    className="bg-[#222] hover:bg-[#FF9900] hover:text-black text-xs font-semibold px-3 py-1.5 rounded-full transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Similar Videos Matched to Current Video */}
        <div id="similar-videos-section" className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#FF9900] text-2xl font-bold">
              Similar Videos You May Also Like
            </h2>
            <span className="text-sm text-gray-400">Page {relatedPage}</span>
          </div>

          {loadingRelated ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-2xl aspect-video animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {related.map((v) => (
                <Link key={v.id} href={`/watch/${v.id}`} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Loaded More Videos */}
        {moreVideos.length > 0 && (
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {moreVideos.map((v) => (
                <Link key={`more-${v.id}`} href={`/watch/${v.id}`} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* More Videos + Prev/Next Page Controls */}
        <div className="mt-10 flex flex-col items-center gap-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-[#FF9900] hover:bg-orange-500 text-black px-12 py-4 rounded-full font-black text-lg transition disabled:opacity-60 shadow-lg"
          >
            {loadingMore ? 'Loading More...' : 'MORE VIDEOS'}
          </button>

          <div className="flex items-center gap-3">
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
        </div>
      </div>
    </div>
  );
}
