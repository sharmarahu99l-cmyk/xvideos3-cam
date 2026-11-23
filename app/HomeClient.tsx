'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import VideoCard from './VideoCard';
import JuicyBanner from './JuicyBanner';
import {
  StoredVideo,
  trackUserInterest,
  getWatchHistory,
  normalizeTitleKey,
} from './lib/userPrefs';
import { SEO_DESI_HUB_LINKS, toCategorySlug } from './lib/seoData';

type Video = StoredVideo;

type SearchHint = {
  label: string;
  type: 'category' | 'pornstar' | 'desi' | 'video';
};

interface HomeClientProps {
  initialVideos?: Video[];
  initialQuery?: string;
  initialPage?: number;
}

const PER_PAGE = 30;
const MAX_PAGES = 200;

const INSTANT_DESI = [
  "Desi", "Desi Videos", "Desi Porn", "Desi Bhabhi", "Desi Aunty", "Desi MMS",
  "Desi Viral MMS", "Viral Desi Videos", "New Desi Videos", "Desi Sex",
  "Desi Chudai", "Desi Hardcore", "Desi Homemade", "Desi Couple", "Desi College Girl",
  "Desi Village Girl", "Desi Saree Sex", "Desi Salwar Suit", "Desi Hindi Audio",
  "Desi Punjabi", "Punjabi Kudi", "Pakistani MMS", "Pakistani Sex", "Indian Bhabhi",
  "Indian Aunty", "Indian MMS", "Indian Wife", "Indian Couple", "Indian Homemade",
  "Bhabhi Devar", "Hindi Audio Sex", "Tamil Desi", "Telugu Desi", "Bengali Bhabhi",
  "Marathi Bhabhi", "Gujarati Aunty", "Mallu Aunty", "Bhojpuri Desi", "Desi Stepmom",
  "Desi Suhag Raat", "Desi Leaked Scandal", "Desi Hidden Cam", "Desi Big Boobs", "Desi Big Ass",
];

const INSTANT_CATEGORIES = [
  "Japanese", "Anal", "HD Porn 1080p", "Teen", "VR Porn", "Asian", "Big Tits",
  "Shemale", "MILF", "Gay", "Ebony", "Homemade", "Indian", "Interracial",
  "Amateur", "Lesbian", "60 FPS", "Big Ass", "POV", "Mature", "Creampie",
  "Hentai", "BBW", "Hardcore", "Threesome", "Latina", "Big Dick", "Pornstar",
  "Double Penetration", "Vintage", "Group Sex", "Blowjob", "Cumshot",
  "Masturbation", "Students", "Blonde", "Petite", "Orgy", "Webcam", "Office",
  "BDSM", "Public", "Brunette", "Older Men", "Massage", "Lingerie", "Toys",
  "Hotel", "Fat", "Outdoor", "Squirt", "Fetish", "Redhead", "Housewives",
  "Sleep", "Small Tits", "Swinger", "Bukkake", "Uniform", "Striptease",
  "Bondage", "For Women", "Nurses", "Handjob", "Fisting", "HQ Porn",
  "Bisexual", "HD Sex", "Footjob", "ASMR", "Doctor",
];

const INSTANT_PORNSTARS = [
  "Angela White", "Riley Reid", "Violet Myers", "Dani Daniels", "Ava Addams",
  "Lana Rhoades", "Abella Danger", "Lauren Phillips", "Cory Chase", "Mia Khalifa",
  "Lena Paul", "Valentina Nappi", "Brandi Love", "Natasha Nice", "Adriana Chechik",
  "Savannah Bond", "Lisa Ann", "Manuel Ferrara", "Mia Malkova", "Alexis Fawx",
  "Sara Jay", "Yorgelis Carrillo", "Aidra Fox", "Blake Blossom", "Little Caprice",
  "Nicole Aniston", "Cherie DeVille", "Alexis Texas", "Melody Marks", "Kendra Lust",
  "Mandy Muse", "Lulu Chu", "Kenzie Reeves", "Jennifer White", "Abigaiil Morris",
  "Emily Willis", "Dee Williams", "Jane Wilde", "Alyx Star", "Maria Nagai",
  "Kelsi Monroe", "Alex Coal", "Lexi Luna", "Payton Preslee", "Syren De Mer",
  "Johnny Love", "Alexandra Cat", "Gabbie Carter", "Hazel Moore", "Skylar Vox",
  "Bridgette B", "Damion Dayski", "Jada Stevens", "Julia Ann", "Phoenix Marie",
  "Anissa Kate", "Johnny Sins", "Chanel Preston", "Alura Jenson", "Reagan Foxx",
  "Eliza Ibarra", "Ariella Ferrera", "Mick Blue",
];

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

function scrollTopNow() {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function validThumb(v: Video): boolean {
  const src = v?.default_thumb?.src?.trim() || '';
  return Boolean(v?.id && v?.title && src.startsWith('http'));
}

function getInstantLocalHints(query: string): SearchHint[] {
  const lowerQ = query.trim().toLowerCase();
  if (!lowerQ) return [];

  const seen = new Set<string>();
  const out: SearchHint[] = [];
  const addMatches = (list: string[], type: SearchHint['type']) => {
    list
      .filter((item) => item.toLowerCase().startsWith(lowerQ))
      .forEach((item) => {
        const k = item.toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          out.push({ label: item, type });
        }
      });
    list
      .filter((item) => !item.toLowerCase().startsWith(lowerQ) && item.toLowerCase().includes(lowerQ))
      .forEach((item) => {
        const k = item.toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          out.push({ label: item, type });
        }
      });
  };

  addMatches(INSTANT_DESI, 'desi');
  addMatches(INSTANT_CATEGORIES, 'category');
  addMatches(INSTANT_PORNSTARS, 'pornstar');
  return out;
}

function getPageWindow(current: number, maxPages: number = MAX_PAGES): number[] {
  const windowSize = 9;
  let start = Math.max(1, current - 4);
  const end = Math.min(maxPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages: number[] = [];
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }
  return pages;
}

async function fetchVideos(
  query: string,
  pageNum: number = 1,
  perPage: number = PER_PAGE,
  order: string = 'most-popular'
): Promise<Video[]> {
  const searchTerm = query.trim() || 'desi';
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(searchTerm)}&page=${pageNum}&per_page=${perPage}&order=${encodeURIComponent(order)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return (data as Video[]).filter(validThumb);
      }
    }
  } catch {}

  try {
    const direct = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=${perPage}&page=${pageNum}&order=${encodeURIComponent(order)}&lq=0&thumbsize=big&format=json`
    );
    if (direct.ok) {
      const data = await direct.json();
      return Array.isArray(data.videos) ? (data.videos as Video[]).filter(validThumb) : [];
    }
  } catch {}

  return [];
}

const HINT_BADGE: Record<SearchHint['type'], { text: string; cls: string }> = {
  desi: { text: 'DESI', cls: 'bg-[#FF9900]/20 text-[#FF9900]' },
  category: { text: 'CAT', cls: 'bg-blue-500/20 text-blue-300' },
  pornstar: { text: 'STAR', cls: 'bg-pink-500/20 text-pink-300' },
  video: { text: 'VIDEO', cls: 'bg-neutral-700 text-neutral-300' },
};

export default function HomeClient({
  initialVideos = [],
  initialQuery = '',
  initialPage = 1,
}: HomeClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const isCategoryRoute = pathname.startsWith('/category/');

  const urlQuery = searchParams?.get('q') ?? initialQuery;
  const urlPage = Math.min(MAX_PAGES, Math.max(1, Number(searchParams?.get('page')) || initialPage));

  // Show the full MMS Reels shelf ONLY on the main homepage (Page 1, no search/category filter)
  const isMainHomepage = !isCategoryRoute && !urlQuery.trim() && urlPage === 1;

  const validInitial = initialVideos.filter(validThumb);
  const hasSSRMatch =
    validInitial.length > 0 && urlQuery === initialQuery && urlPage === initialPage;

  const [videos, setVideos] = useState<Video[]>(hasSSRMatch ? validInitial : []);
  const [trendingReels, setTrendingReels] = useState<Video[]>([]);
  const [recentHistory, setRecentHistory] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(!hasSSRMatch);
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showVideoSub, setShowVideoSub] = useState<boolean>(false);
  const [page, setPage] = useState<number>(urlPage);

  const [hints, setHints] = useState<SearchHint[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [activeHintIdx, setActiveHintIdx] = useState<number>(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);

  // Load MMS Reels ONLY when on the main homepage
  useEffect(() => {
    if (!isMainHomepage) return;
    let active = true;

    const loadMmsReels = async () => {
      const [weekly, latest, popular] = await Promise.all([
        fetchVideos('mms', 1, 10, 'top-weekly'),
        fetchVideos('mms', 1, 10, 'latest'),
        fetchVideos('mms', 1, 10, 'most-popular'),
      ]);
      if (!active) return;

      const seen = new Set<string>();
      const merged: Video[] = [];
      const maxLen = Math.max(weekly.length, latest.length, popular.length);
      for (let i = 0; i < maxLen; i++) {
        for (const v of [weekly[i], latest[i], popular[i]]) {
          if (v && validThumb(v) && !seen.has(v.id)) {
            seen.add(v.id);
            merged.push(v);
          }
        }
      }
      setTrendingReels(merged.slice(0, 12));
    };

    loadMmsReels();
    return () => {
      active = false;
    };
  }, [isMainHomepage]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      scrollTopNow();
      setSearchQuery(urlQuery);
      setPage(urlPage);

      if (urlQuery.trim()) {
        trackUserInterest([urlQuery.trim()]);
        if (!isCategoryRoute) {
          document.title = `${urlQuery} Videos (Page ${urlPage}) | HubTube - XVideos3 HD`;
        }
      } else if (urlPage > 1 && !isCategoryRoute) {
        document.title = `Trending Desi Videos, Viral MMS & HD Porn - Page ${urlPage} | HubTube XVideos3`;
      } else if (!isCategoryRoute) {
        document.title = 'Desi Videos, Viral Desi MMS, Hindi Audio Bhabhi & Free HD Porn | HubTube XVideos3';
      }

      const history = getWatchHistory(5).filter(validThumb);
      setRecentHistory(history);

      const usingSSRMain =
        validInitial.length > 0 && urlQuery === initialQuery && urlPage === initialPage;

      if (!usingSSRMain) {
        setLoading(true);
      }

      const fetchedMain = usingSSRMain
        ? validInitial
        : await fetchVideos(urlQuery, urlPage, PER_PAGE, 'most-popular');

      if (!active) return;

      const seenIds = new Set<string>();
      const seenTitles = new Set<string>();
      const uniqueMain: Video[] = [];
      for (const v of fetchedMain) {
        const norm = normalizeTitleKey(v.title);
        if (validThumb(v) && !seenIds.has(v.id) && !seenTitles.has(norm)) {
          seenIds.add(v.id);
          seenTitles.add(norm);
          uniqueMain.push(v);
        }
      }

      setVideos(uniqueMain);
      setLoading(false);
    };

    run();
    return () => {
      active = false;
    };
  }, [urlQuery, urlPage, initialQuery, initialPage, isCategoryRoute]);

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
    const trimmed = searchQuery.trim();
    if (!showHints || trimmed.length === 0) {
      setHints([]);
      setActiveHintIdx(-1);
      return;
    }

    const local = getInstantLocalHints(trimmed);
    setHints(local);
    setActiveHintIdx(-1);

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
        if (Array.isArray(data.hints)) {
          setHints(data.hints);
        }
      } catch {}
    }, 140);

    return () => clearTimeout(timer);
  }, [searchQuery, showHints]);

  const navigateToSearch = (term: string, targetPage: number = 1) => {
    setShowHints(false);
    setShowMenu(false);
    scrollTopNow();
    const safePage = Math.min(MAX_PAGES, Math.max(1, targetPage));
    const trimmed = term.trim();

    if (!trimmed) {
      router.push(safePage > 1 ? `/?page=${safePage}` : '/', { scroll: true });
      return;
    }

    const slug = toCategorySlug(trimmed);
    if (slug && trimmed.split(/\s+/).length <= 4) {
      router.push(
        safePage > 1 ? `/category/${slug}?page=${safePage}` : `/category/${slug}`,
        { scroll: true }
      );
      return;
    }

    const params = new URLSearchParams();
    params.set('q', trimmed);
    if (safePage > 1) params.set('page', String(safePage));
    router.push(`/?${params.toString()}`, { scroll: true });
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    navigateToSearch(searchQuery, 1);
  };

  const handleHintSelect = (label: string) => {
    setSearchQuery(label);
    navigateToSearch(label, 1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showHints || hints.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveHintIdx((prev) => (prev + 1) % hints.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveHintIdx((prev) => (prev <= 0 ? hints.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeHintIdx >= 0 && hints[activeHintIdx]) {
        handleHintSelect(hints[activeHintIdx].label);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowHints(false);
    }
  };

  // Builds real crawlable <a href="..."> URLs for Googlebot, Bingbot & Yandex
  const getPageHref = (pageNum: number): string => {
    const safePage = Math.min(MAX_PAGES, Math.max(1, pageNum));
    if (isCategoryRoute) {
      return safePage > 1 ? `${pathname}?page=${safePage}` : pathname;
    }
    const trimmed = urlQuery.trim();
    if (!trimmed) {
      return safePage > 1 ? `/?page=${safePage}` : '/';
    }
    const params = new URLSearchParams();
    params.set('q', trimmed);
    if (safePage > 1) params.set('page', String(safePage));
    return `/?${params.toString()}`;
  };

  const closeSidebar = () => {
    setShowMenu(false);
    setShowVideoSub(false);
    scrollTopNow();
  };

  const pageWindow = getPageWindow(page, MAX_PAGES);
  const reelStripVideos = trendingReels.length > 0 ? trendingReels : videos.slice(0, 12);

  const renderPaginationBar = () => (
    <nav
      aria-label="Pagination"
      className="flex justify-center items-center gap-2 flex-wrap my-6"
    >
      {page > 1 ? (
        <Link
          href={getPageHref(page - 1)}
          onClick={scrollTopNow}
          className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold transition text-sm md:text-base"
        >
          ← Back
        </Link>
      ) : (
        <span className="px-4 py-2.5 bg-[#222] text-white rounded-full font-bold opacity-40 text-sm md:text-base">
          ← Back
        </span>
      )}

      {pageWindow[0] > 1 && (
        <>
          <Link
            href={getPageHref(1)}
            onClick={scrollTopNow}
            className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold transition text-sm md:text-base"
          >
            1
          </Link>
          {pageWindow[0] > 2 && <span className="px-1 text-gray-500 font-bold">…</span>}
        </>
      )}

      {pageWindow.map((p) => (
        <Link
          key={p}
          href={getPageHref(p)}
          onClick={scrollTopNow}
          aria-current={page === p ? 'page' : undefined}
          className={`px-4 py-2.5 rounded-full font-bold transition text-sm md:text-base ${
            page === p
              ? 'bg-[#FF9900] text-black shadow-md'
              : 'bg-[#222] hover:bg-[#FF9900] hover:text-black text-white'
          }`}
        >
          {p}
        </Link>
      ))}

      {pageWindow[pageWindow.length - 1] < MAX_PAGES && (
        <>
          {pageWindow[pageWindow.length - 1] < MAX_PAGES - 1 && (
            <span className="px-1 text-gray-500 font-bold">…</span>
          )}
          <Link
            href={getPageHref(MAX_PAGES)}
            onClick={scrollTopNow}
            className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold transition text-sm md:text-base"
          >
            {MAX_PAGES}
          </Link>
        </>
      )}

      {page < MAX_PAGES ? (
        <Link
          href={getPageHref(page + 1)}
          onClick={scrollTopNow}
          className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold transition text-sm md:text-base"
        >
          Next →
        </Link>
      ) : (
        <span className="px-4 py-2.5 bg-[#222] text-white rounded-full font-bold opacity-40 text-sm md:text-base">
          Next →
        </span>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] sticky top-0 z-50 p-3 border-b border-gray-800">
        <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
          <Link href="/" onClick={scrollTopNow} className="flex items-center gap-0.5 shrink-0">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#FF9900]">H</span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white">UB</span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#FF9900]">T</span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white">UBE</span>
          </Link>

          <div ref={searchWrapRef} className="relative flex-1 max-w-xl mx-1 sm:mx-2">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowHints(true);
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  setShowHints(val.trim().length > 0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search desi videos, bhabhi, pornstars..."
                autoComplete="off"
                className="w-full bg-[#222] border-2 border-[#FF9900] rounded-full pl-4 pr-14 sm:pr-20 py-2 text-sm sm:text-base focus:outline-none text-white placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setHints([]);
                    setShowHints(false);
                  }}
                  aria-label="Clear search"
                  className="absolute right-11 text-gray-400 hover:text-white px-1.5 text-base"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 bg-[#FF9900] text-black font-bold rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#ffaa33]"
              >
                🔍
              </button>
            </form>

            {showHints && searchQuery.trim().length > 0 && hints.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#161616] border border-gray-700 rounded-2xl shadow-2xl z-[10001] max-h-[65vh] overflow-y-auto">
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
                        handleHintSelect(hint.label);
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
            className="bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black text-xs md:text-sm px-3 py-2 rounded-full flex items-center gap-1 shrink-0 shadow-md transition"
          >
            <span>▶</span>
            <span>REELS</span>
          </Link>

          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Menu"
            className="text-3xl sm:text-4xl text-[#FF9900] px-1 shrink-0"
          >
            ☰
          </button>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-black text-[#FF9900] capitalize">
            {urlQuery
              ? `${urlQuery} Videos${page > 1 ? ` - Page ${page}` : ''}`
              : `Trending Desi Videos, Viral MMS & HD Porn${page > 1 ? ` - Page ${page}` : ''}`}
          </h1>
          {(urlQuery || isCategoryRoute || page > 1) && (
            <Link
              href="/"
              onClick={scrollTopNow}
              className="text-sm bg-[#222] hover:bg-[#FF9900] hover:text-black px-4 py-2 rounded-full font-semibold transition"
            >
              Reset Filter
            </Link>
          )}
        </div>

        {/* Top Banner Ad */}
        <JuicyBanner />

        {/* Homepage MMS Reels Shelf — Shown ONLY on the main homepage (Page 1) */}
        {isMainHomepage && reelStripVideos.length > 0 && (
          <section className="mt-6 mb-8 bg-[#121212] border border-gray-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#FF9900] text-black text-xs font-black px-2.5 py-1 rounded-full">
                  ▶ REELS
                </span>
                <h2 className="text-lg md:text-xl font-black text-white">
                  MMS Reels
                </h2>
              </div>
              <Link
                href="/reels"
                className="text-xs md:text-sm font-black text-[#FF9900] hover:underline"
              >
                Watch All Full Screen →
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {reelStripVideos.map((v) => (
                <Link
                  key={`reel-card-${v.id}`}
                  href={`/reels?start=${encodeURIComponent(v.id)}`}
                  className="group relative w-36 sm:w-44 aspect-[9/16] shrink-0 rounded-2xl overflow-hidden bg-black border border-gray-800 hover:border-[#FF9900] transition snap-start shadow-lg"
                >
                  <img
                    src={v.default_thumb.src}
                    alt={v.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <span className="absolute top-2 left-2 bg-black/75 text-[#FF9900] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#FF9900]/40">
                    🔥 MMS REEL
                  </span>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <p className="text-white text-xs font-bold line-clamp-2 leading-snug drop-shadow">
                      {v.title}
                    </p>
                    {v.views !== undefined && (
                      <p className="text-[10px] text-gray-300 mt-1">👁 {v.views}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse aspect-video" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20 text-yellow-500 text-xl">
              No results found for &ldquo;{urlQuery}&rdquo;. Try another keyword or page.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {videos.slice(0, 15).map((v) => (
                  <Link key={v.id} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                    <VideoCard video={v} />
                  </Link>
                ))}
              </div>

              {videos.length > 15 && (
                <>
                  {/* Mid-Grid Banner Ad */}
                  <div className="my-8">
                    <JuicyBanner />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {videos.slice(15).map((v) => (
                      <Link key={v.id} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                        <VideoCard video={v} />
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Crawlable Bottom Pagination */}
        <div className="mt-10">
          {renderPaginationBar()}
        </div>

        {/* Post-Pagination Ad */}
        <JuicyBanner adzone={1133788} width={308} height={286} />

        {!loading && recentHistory.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-2xl font-black text-[#FF9900] mb-6">
              Recently Watched
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {recentHistory.map((v) => (
                <Link key={`hist-${v.id}`} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Pre-Footer Banner Ad */}
        <div className="mt-10">
          <JuicyBanner />
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