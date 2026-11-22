'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '../../VideoCard';
import JuicyBanner from '../../JuicyBanner';
import {
  recordWatchedVideo,
  getTopPreferences,
  saveVideoRelatedSnapshot,
  getVideoRelatedSnapshot,
} from '../../lib/userPrefs';

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
  'video', 'videos', 'full', 'new', 'best', 'xxx', 'porn', 'sex', 'hd', '1080p',
  '720p', '4k', 'mp4', 'watch', 'online', 'scene', 'clip', 'part',
]);

const FALLBACK_TOPICS = [
  'desi bhabhi',
  'indian aunty',
  'milf',
  'asian',
  'amateur',
  'big tits',
  'latina',
  'teen',
  'pov',
  'homemade',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function extractUniqueRelatedQuery(v: WatchVideo | null, videoId: string): string {
  const candidates: string[] = [];

  if (v?.title) {
    const titleWords = v.title
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()));
    candidates.push(...titleWords);
  }

  if (v?.keywords) {
    const tagWords = v.keywords
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t.toLowerCase()));
    candidates.push(...tagWords);
  }

  const uniqueTerms: string[] = [];
  const seen = new Set<string>();
  for (const term of candidates) {
    const low = term.toLowerCase();
    if (!seen.has(low)) {
      seen.add(low);
      uniqueTerms.push(term);
    }
  }

  if (uniqueTerms.length >= 2) {
    return `${uniqueTerms[0]} ${uniqueTerms[1]}`;
  }
  if (uniqueTerms.length === 1) {
    return uniqueTerms[0];
  }

  const idx = hashString(videoId) % FALLBACK_TOPICS.length;
  return FALLBACK_TOPICS[idx];
}

function getGlobalShownIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem('hubtube_shown_related_ids');
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function addGlobalShownIds(ids: string[]): void {
  if (typeof window === 'undefined' || ids.length === 0) return;
  try {
    const current = Array.from(getGlobalShownIds());
    const merged = Array.from(new Set([...ids, ...current])).slice(0, 300);
    sessionStorage.setItem('hubtube_shown_related_ids', JSON.stringify(merged));
  } catch {
    // Ignore storage errors
  }
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
  const [forYouVideos, setForYouVideos] = useState<WatchVideo[]>([]);
  const [loadingRelated, setLoadingRelated] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showVideoSub, setShowVideoSub] = useState<boolean>(false);
  const [relatedPage, setRelatedPage] = useState<number>(1);
  const [extraPages, setExtraPages] = useState<number>(0);

  const relatedRef = useRef<WatchVideo[]>([]);
  relatedRef.current = related;

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [searchInput, setSearchInput] = useState<string>('');
  const [hints, setHints] = useState<SearchHint[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [activeHintIdx, setActiveHintIdx] = useState<number>(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    const el = playerContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const fetchBatch = useCallback(async (query: string, pageNum: number, perPage = 40): Promise<WatchVideo[]> => {
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&page=${pageNum}&per_page=${perPage}&order=top-rated`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data as WatchVideo[];
      }
    } catch {
      // Fallback below
    }

    try {
      const directRes = await fetch(
        `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${pageNum}&order=top-rated&format=json`,
        { cache: 'no-store' }
      );
      if (directRes.ok) {
        const directData = await directRes.json();
        if (Array.isArray(directData.videos)) return directData.videos as WatchVideo[];
      }
    } catch {
      // Return empty array if both fail
    }

    return [];
  }, []);

  const loadSimilarVideos = useCallback(
    async (targetVideo: WatchVideo | null, pageNum: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingRelated(true);
      }

      if (!append && pageNum === 1) {
        const savedSnapshot = getVideoRelatedSnapshot(id);
        if (savedSnapshot && savedSnapshot.length > 0) {
          setRelated(savedSnapshot);
          setMoreVideos([]);
          setExtraPages(0);
          setLoadingRelated(false);
          return;
        }
      }

      const query = extractUniqueRelatedQuery(targetVideo, id);
      const idOffset = (hashString(id) % 8) + 1;
      const effectiveApiPage = pageNum === 1 ? idOffset : idOffset + pageNum - 1;

      const fetched = await fetchBatch(query, effectiveApiPage, 40);
      const previouslyShown = getGlobalShownIds();

      const freshMatches = fetched.filter((v) => v.id && v.id !== id && !previouslyShown.has(v.id));
      const olderMatches = fetched.filter((v) => v.id && v.id !== id && previouslyShown.has(v.id));
      let combined = [...freshMatches, ...olderMatches];

      if (combined.length < 15) {
        const prefs = getTopPreferences(5);
        const pool = prefs.length > 0 ? [...prefs, ...FALLBACK_TOPICS] : FALLBACK_TOPICS;
        const fallbackQuery = pool[(hashString(id) + pageNum) % pool.length];
        const fallbackBatch = await fetchBatch(fallbackQuery, (pageNum % 15) + 1, 30);
        combined = [...combined, ...fallbackBatch.filter((v) => v.id && v.id !== id)];
      }

      if (append) {
        setMoreVideos((prev) => {
          const seen = new Set<string>([
            id,
            ...relatedRef.current.map((r) => r.id),
            ...prev.map((p) => p.id),
          ]);
          const uniqueNew: WatchVideo[] = [];
          for (const v of combined) {
            if (!seen.has(v.id)) {
              seen.add(v.id);
              uniqueNew.push(v);
            }
          }
          addGlobalShownIds(uniqueNew.map((v) => v.id));
          return [...prev, ...uniqueNew.slice(0, 25)];
        });
      } else {
        const seen = new Set<string>([id]);
        const uniqueRelated: WatchVideo[] = [];
        for (const v of combined) {
          if (!seen.has(v.id)) {
            seen.add(v.id);
            uniqueRelated.push(v);
          }
        }
        const finalSlice = uniqueRelated.slice(0, 25);
        setRelated(finalSlice);
        setMoreVideos([]);
        setExtraPages(0);
        if (pageNum === 1 && finalSlice.length > 0) {
          saveVideoRelatedSnapshot(id, finalSlice);
          addGlobalShownIds(finalSlice.map((v) => v.id));
        }
      }

      setLoadingRelated(false);
      setLoadingMore(false);
    },
    [id, fetchBatch]
  );

  useEffect(() => {
    let active = true;
    window.scrollTo(0, 0);
    setRelatedPage(1);
    setMoreVideos([]);
    setExtraPages(0);

    const handleLoadedVideo = (v: WatchVideo | null) => {
      if (!active) return;
      if (v) {
        setVideo(v);
        if (v.title) {
          document.title = `${v.title} | HubTube - XVideos3 HD`;
        }
        recordWatchedVideo(v);
      }
      loadSimilarVideos(v, 1, false);

      const prefs = getTopPreferences(4);
      const prefQuery = prefs[hashString(id) % Math.max(1, prefs.length)] || 'desi bhabhi';
      fetchBatch(prefQuery, (hashString(id) % 10) + 1, 15).then((list) => {
        if (!active) return;
        setForYouVideos(list.filter((item) => item.id && item.id !== id).slice(0, 10));
      });
    };

    const loadVideoMetadata = async () => {
      if (initialVideo && initialVideo.id === id) {
        handleLoadedVideo(initialVideo);
        return;
      }

      try {
        const apiRes = await fetch(`/api/video/${encodeURIComponent(id)}`);
        if (apiRes.ok) {
          const data: WatchVideo | null = await apiRes.json();
          if (data && data.id) {
            handleLoadedVideo(data);
            return;
          }
        }
      } catch {
        // Fallback to direct Eporner video lookup below
      }

      try {
        const directRes = await fetch(
          `https://www.eporner.com/api/v2/video/id/${encodeURIComponent(id)}/?format=json`
        );
        if (directRes.ok) {
          const directData: WatchVideo = await directRes.json();
          if (directData && directData.id) {
            handleLoadedVideo(directData);
            return;
          }
        }
      } catch {
        // Handle null below
      }

      handleLoadedVideo(null);
    };

    loadVideoMetadata();

    return () => {
      active = false;
    };
  }, [id, initialVideo, loadSimilarVideos, fetchBatch]);

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
          cache: 'no-store',
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

          {/* Search Bar: Hints ONLY appear when typing */}
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

          <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter shrink-0">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </Link>
        </div>
      </header>

      {/* SIDEBAR */}
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
        <div
          ref={playerContainerRef}
          className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden"
        >
          <iframe
            src={`https://www.eporner.com/embed/${id}/`}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />

          {/* Top bar mask */}
          <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black via-black/95 to-transparent flex items-center justify-between px-4 z-20 pointer-events-auto">
            <div className="flex items-center gap-0.5 text-lg font-black select-none">
              <span className="text-[#FF9900]">H</span>
              <span className="text-white">UB</span>
              <span className="text-[#FF9900]">T</span>
              <span className="text-white">UBE</span>
              <span className="ml-2 text-[10px] font-bold bg-[#FF9900] text-black px-2 py-0.5 rounded-full">
                HD
              </span>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-xs font-bold bg-[#222]/90 hover:bg-[#FF9900] hover:text-black text-white px-3 py-1 rounded-full transition"
            >
              {isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen'}
            </button>
          </div>

          {/* Bottom-right corner mask */}
          <div className="absolute bottom-11 right-3 bg-black/95 px-3 py-1 rounded-lg flex items-center gap-0.5 text-base font-black z-20 select-none">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </div>
        </div>

        <JuicyBanner />

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
<JuicyBanner adzone={1133788} width={308} height={286} />

        {/* Similar Videos Matched Specifically to This Video */}
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
<JuicyBanner adzone={1133788} width={308} height={286} />
        {/* More Videos + Prev/Next Controls */}
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
<JuicyBanner adzone={1133788} width={308} height={286} />
        {/* Personalized Recommendations Based on User Preferences */}
        {forYouVideos.length > 0 && (
          <section className="mt-14 pt-8 border-t border-gray-800">
            <h2 className="text-[#FF9900] text-2xl font-bold mb-6">
              Picked For You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {forYouVideos.map((v) => (
                <Link key={`pref-${v.id}`} href={`/watch/${v.id}`} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
