'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoCard from './VideoCard';
import JuicyBanner from './JuicyBanner';
import {
  StoredVideo,
  trackUserInterest,
  getTopPreferences,
  getWatchHistory,
  resolveContentContext,
} from './lib/userPrefs';

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

const SEO_DESI_HUB_LINKS = [
  'Desi Videos', 'Desi Porn', 'Desi MMS', 'Viral Desi Videos', 'New Desi Videos',
  'Desi Bhabhi', 'Indian Bhabhi', 'Desi Aunty', 'Indian Aunty', 'Indian Porn',
  'Pakistani MMS', 'Pakistani Sex', 'Desi Chudai', 'Hindi Audio Sex', 'Punjabi Desi',
  'Punjabi Kudi', 'Desi Homemade', 'Indian Homemade', 'Desi Couple', 'Desi College Girl',
  'Desi Village Girl', 'Desi Saree Sex', 'Bhabhi Devar', 'South Indian Desi', 'Tamil Desi',
  'Telugu Desi', 'Bengali Bhabhi', 'Marathi Bhabhi', 'Gujarati Aunty', 'Mallu Aunty',
  'Bhojpuri Desi', 'Desi Leaked Scandal', 'Desi Hidden Cam', 'Desi Suhag Raat', 'Indian Wife',
];

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
  order: string = 'most_viewed'
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
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=${perPage}&page=${pageNum}&order=${encodeURIComponent(order)}&thumbsize=big&format=json`
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

  const urlQuery = searchParams?.get('q') ?? initialQuery;
  const urlPage = Math.min(MAX_PAGES, Math.max(1, Number(searchParams?.get('page')) || initialPage));

  const validInitial = initialVideos.filter(validThumb);
  const hasSSRMatch =
    validInitial.length > 0 && urlQuery === initialQuery && urlPage === initialPage;

  const [videos, setVideos] = useState<Video[]>(hasSSRMatch ? validInitial : []);
  const [similarVideos, setSimilarVideos] = useState<Video[]>([]);
  const [forYouVideos, setForYouVideos] = useState<Video[]>([]);
  const [recentHistory, setRecentHistory] = useState<Video[]>([]);
  const [recHeading, setRecHeading] = useState<string>('Picked For You');
  const [simHeading, setSimHeading] = useState<string>('Similar Videos You May Also Like');
  const [loading, setLoading] = useState<boolean>(!hasSSRMatch);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showVideoSub, setShowVideoSub] = useState<boolean>(false);
  const [page, setPage] = useState<number>(urlPage);
  const [loadedExtraPages, setLoadedExtraPages] = useState<number>(0);

  const [hints, setHints] = useState<SearchHint[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [activeHintIdx, setActiveHintIdx] = useState<number>(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      scrollTopNow();
      setSearchQuery(urlQuery);
      setPage(urlPage);
      setLoadedExtraPages(0);
      setSimilarVideos([]);
      setForYouVideos([]);

      if (urlQuery.trim()) {
        trackUserInterest([urlQuery.trim()]);
        document.title = `${urlQuery} Videos (Page ${urlPage}) | HubTube - XVideos3 HD`;
      } else if (urlPage > 1) {
        document.title = `Desi Videos & HD Porn - Page ${urlPage} | HubTube - XVideos3`;
      } else {
        document.title = 'Desi Videos, Desi Porn, Viral Desi MMS & Free HD Indian Videos | HubTube XVideos3';
      }

      const prefs = getTopPreferences(4);
      const activeSeed = urlQuery.trim() || prefs[0] || 'desi bhabhi';
      const ctx = resolveContentContext(activeSeed, '', urlPage);

      if (ctx.type === 'pornstar') {
        setSimHeading(`More ${ctx.primarySubject} Videos`);
        setRecHeading(`Picked For You • Other Top Pornstars (${ctx.peerQueries.slice(0, 2).join(', ')})`);
      } else {
        setSimHeading(`Similar ${ctx.primarySubject} Videos`);
        setRecHeading(`Picked For You • ${ctx.peerQueries.slice(0, 2).join(' & ')}`);
      }

      setRecentHistory(getWatchHistory(5).filter(validThumb));

      const usingSSRMain =
        validInitial.length > 0 && urlQuery === initialQuery && urlPage === initialPage;

      if (!usingSSRMain) {
        setLoading(true);
      }

      const peerList = ctx.peerQueries.length > 0 ? ctx.peerQueries : ['desi bhabhi', 'indian aunty'];

      const [fetchedMain, similar, ...peerBatches] = await Promise.all([
        usingSSRMain
          ? Promise.resolve(validInitial)
          : fetchVideos(urlQuery, urlPage, PER_PAGE, 'most_viewed'),
        fetchVideos(ctx.similarQuery, urlPage + 2, 18, 'top-rated'),
        ...peerList.slice(0, 2).map((peerTerm) => fetchVideos(peerTerm, urlPage, 12, 'most_viewed')),
      ]);

      if (!active) return;

      const seenIds = new Set<string>();
      const uniqueMain: Video[] = [];
      for (const v of fetchedMain) {
        if (validThumb(v) && !seenIds.has(v.id)) {
          seenIds.add(v.id);
          uniqueMain.push(v);
        }
      }

      const strictSim =
        ctx.type === 'pornstar'
          ? [
              ...similar.filter((v) =>
                `${v.title} ${v.keywords || ''}`.toLowerCase().includes(ctx.primarySubject.toLowerCase())
              ),
              ...similar,
            ]
          : similar;

      const uniqueSimilar: Video[] = [];
      for (const v of strictSim) {
        if (validThumb(v) && !seenIds.has(v.id)) {
          seenIds.add(v.id);
          uniqueSimilar.push(v);
        }
      }

      const interleavedPeers: Video[] = [];
      const maxLen = Math.max(0, ...peerBatches.map((b) => b.length));
      for (let i = 0; i < maxLen; i++) {
        for (const batch of peerBatches) {
          if (batch[i]) interleavedPeers.push(batch[i]);
        }
      }

      const primaryLower = ctx.primarySubject.toLowerCase();
      const uniqueForYou: Video[] = [];
      for (const v of interleavedPeers) {
        if (!validThumb(v) || seenIds.has(v.id)) continue;
        if (ctx.type === 'pornstar' && v.title.toLowerCase().includes(primaryLower)) continue;
        seenIds.add(v.id);
        uniqueForYou.push(v);
      }

      setVideos(uniqueMain);
      setSimilarVideos(uniqueSimilar.slice(0, 10));
      setForYouVideos(uniqueForYou.slice(0, 15));
      setLoading(false);
    };

    run();
    return () => {
      active = false;
    };
  }, [urlQuery, urlPage, initialQuery, initialPage]);

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
    const params = new URLSearchParams();
    if (term.trim()) params.set('q', term.trim());
    if (safePage > 1) params.set('page', String(safePage));
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : '/', { scroll: true });
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

  const handleSidebarClick = (term: string) => {
    setSearchQuery(term);
    navigateToSearch(term, 1);
  };

  const handlePageClick = (pageNum: number) => {
    navigateToSearch(urlQuery, pageNum);
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    const nextStep = loadedExtraPages + 1;
    const nextBatchPage = page + nextStep;
    const more = await fetchVideos(urlQuery, nextBatchPage, PER_PAGE, 'most_viewed');

    const existingIds = new Set(videos.map((v) => v.id));
    const uniqueNew = more.filter((v) => validThumb(v) && !existingIds.has(v.id));

    if (uniqueNew.length > 0) {
      setVideos((prev) => [...prev, ...uniqueNew]);
      setLoadedExtraPages(nextStep);
    }

    setLoadingMore(false);
  };

  const pageWindow = getPageWindow(page, MAX_PAGES);

  const renderPaginationBar = () => (
    <nav
      aria-label="Pagination"
      className="flex justify-center items-center gap-2 flex-wrap my-6"
    >
      <button
        type="button"
        onClick={() => handlePageClick(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold disabled:opacity-40 transition text-sm md:text-base"
      >
        ← Back
      </button>

      {pageWindow[0] > 1 && (
        <>
          <button
            type="button"
            onClick={() => handlePageClick(1)}
            className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold transition text-sm md:text-base"
          >
            1
          </button>
          {pageWindow[0] > 2 && <span className="px-1 text-gray-500 font-bold">…</span>}
        </>
      )}

      {pageWindow.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => handlePageClick(p)}
          className={`px-4 py-2.5 rounded-full font-bold transition text-sm md:text-base ${
            page === p
              ? 'bg-[#FF9900] text-black shadow-md'
              : 'bg-[#222] hover:bg-[#FF9900] hover:text-black text-white'
          }`}
        >
          {p}
        </button>
      ))}

      {pageWindow[pageWindow.length - 1] < MAX_PAGES && (
        <>
          {pageWindow[pageWindow.length - 1] < MAX_PAGES - 1 && (
            <span className="px-1 text-gray-500 font-bold">…</span>
          )}
          <button
            type="button"
            onClick={() => handlePageClick(MAX_PAGES)}
            className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold transition text-sm md:text-base"
          >
            {MAX_PAGES}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => handlePageClick(Math.min(MAX_PAGES, page + 1))}
        disabled={page >= MAX_PAGES}
        className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold disabled:opacity-40 transition text-sm md:text-base"
      >
        Next →
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] sticky top-0 z-50 p-3 border-b border-gray-800">
        <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
          <Link href="/" onClick={scrollTopNow} className="flex items-center gap-0.5 shrink-0">
            <span className="text-3xl md:text-4xl font-black text-[#FF9900]">H</span>
            <span className="text-3xl md:text-4xl font-black text-white">UB</span>
            <span className="text-3xl md:text-4xl font-black text-[#FF9900]">T</span>
            <span className="text-3xl md:text-4xl font-black text-white">UBE</span>
          </Link>

          <div ref={searchWrapRef} className="relative flex-1 max-w-xl mx-2">
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
                placeholder="Search desi videos, desi mms, bhabhi, pornstars..."
                autoComplete="off"
                className="w-full bg-[#222] border-2 border-[#FF9900] rounded-full pl-5 pr-20 py-2.5 text-base focus:outline-none text-white placeholder-gray-400"
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
                  className="absolute right-12 text-gray-400 hover:text-white px-2 text-lg"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 bg-[#FF9900] text-black font-bold rounded-full w-9 h-9 flex items-center justify-center hover:bg-[#ffaa33]"
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

          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Menu"
            className="text-4xl text-[#FF9900] px-2 shrink-0"
          >
            ☰
          </button>
        </div>
      </header>

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
          <button onClick={() => handleSidebarClick("viral desi")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">⚡ VIRAL DESI MMS</button>
          <button onClick={() => handleSidebarClick("4k")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">4K PORN</button>
          <button onClick={() => handleSidebarClick("best videos")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">BEST VIDEOS</button>
          <Link href="/categories" onClick={() => setShowMenu(false)} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ CATEGORIES</Link>
          <Link href="/pornstars" onClick={() => setShowMenu(false)} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ PORNSTARS</Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-black text-[#FF9900] capitalize">
            {urlQuery ? `${urlQuery} Videos` : 'Trending Desi Videos, Viral MMS & HD Porn'}
            {` — Page ${page} of ${MAX_PAGES}`}
          </h1>
          {urlQuery && (
            <button
              onClick={() => navigateToSearch('', 1)}
              className="text-sm bg-[#222] hover:bg-[#FF9900] hover:text-black px-4 py-2 rounded-full font-semibold transition"
            >
              Reset Filter
            </button>
          )}
        </div>

        <JuicyBanner />

        {renderPaginationBar()}

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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {videos.map((v) => (
              <Link key={v.id} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                <VideoCard video={v} />
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 space-y-4">
          {videos.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-10 py-3.5 bg-[#FF9900] text-black font-black rounded-full hover:bg-[#ffaa33] transition disabled:opacity-60 text-base shadow-lg"
              >
                {loadingMore ? 'Loading More Videos...' : 'LOAD MORE VIDEOS'}
              </button>
            </div>
          )}

          {renderPaginationBar()}
        </div>

        <JuicyBanner adzone={1133788} width={308} height={286} />

        {/* Section 1: Exact Match (e.g., Only Angela White if searching Angela White) */}
        {!loading && similarVideos.length > 0 && (
          <section className="mt-14 pt-8 border-t border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-black text-[#FF9900] capitalize">
                {simHeading}
              </h2>
              <button
                onClick={() => handlePageClick(Math.min(MAX_PAGES, page + 1))}
                className="text-sm font-bold text-[#FF9900] hover:underline"
              >
                Next Page →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {similarVideos.map((v) => (
                <Link key={`sim-${v.id}`} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Logically Related Other Pornstars / Sub-Categories */}
        {!loading && forYouVideos.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-black text-[#FF9900] capitalize">
                {recHeading}
              </h2>
              <button
                onClick={() => handlePageClick(Math.min(MAX_PAGES, page + 1))}
                className="text-sm font-bold text-[#FF9900] hover:underline"
              >
                Explore More →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {forYouVideos.map((v) => (
                <Link key={`foryou-${v.id}`} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          </section>
        )}

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

        {/* Desi SEO Tags Hub at the Bottom of the Page */}
        <footer className="mt-16 pt-8 border-t border-gray-800">
          <h2 className="text-lg font-black text-[#FF9900] mb-3">
            Popular Desi Videos, Viral MMS &amp; HD Categories
          </h2>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            HubTube (XVideos3.cam) indexes thousands of new Desi videos, viral Desi MMS, Indian bhabhi, aunty, Pakistani MMS, and 4K 60fps videos updated every hour.
          </p>
          <div className="flex flex-wrap gap-2">
            {SEO_DESI_HUB_LINKS.map((term) => (
              <Link
                key={term}
                href={`/?q=${encodeURIComponent(term.toLowerCase())}`}
                onClick={scrollTopNow}
                className="text-xs bg-[#161616] hover:bg-[#FF9900] hover:text-black text-gray-300 px-3 py-1.5 rounded-full border border-gray-800 transition"
              >
                {term}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
