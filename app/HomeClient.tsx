'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoCard from './VideoCard';

type Video = {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min: number;
  length_sec: number;
  embed: string;
  views?: string;
};

type SearchHint = {
  label: string;
  type: 'category' | 'pornstar' | 'desi' | 'video';
};

const PER_PAGE = 60;

const INSTANT_DESI = [
  "Desi", "Desi Bhabhi", "Desi Aunty", "Desi MMS", "Desi Viral MMS", "Desi Sex",
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

function getInstantLocalHints(query: string): SearchHint[] {
  const lowerQ = query.trim().toLowerCase();
  if (!lowerQ) {
    return [
      ...INSTANT_DESI.slice(0, 12).map((label) => ({ label, type: 'desi' as const })),
      ...INSTANT_CATEGORIES.slice(0, 12).map((label) => ({ label, type: 'category' as const })),
      ...INSTANT_PORNSTARS.slice(0, 8).map((label) => ({ label, type: 'pornstar' as const })),
    ];
  }

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

async function fetchVideos(
  query: string,
  pageNum: number = 1,
  perPage: number = PER_PAGE,
  order: string = 'most_viewed'
): Promise<Video[]> {
  const searchTerm = query.trim() || 'desi';
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(searchTerm)}&page=${pageNum}&per_page=${perPage}&order=${encodeURIComponent(order)}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as Video[];
    }
  } catch {
    // Return empty list on network error
  }
  return [];
}

const HINT_BADGE: Record<SearchHint['type'], { text: string; cls: string }> = {
  desi: { text: 'DESI', cls: 'bg-[#FF9900]/20 text-[#FF9900]' },
  category: { text: 'CAT', cls: 'bg-blue-500/20 text-blue-300' },
  pornstar: { text: 'STAR', cls: 'bg-pink-500/20 text-pink-300' },
  video: { text: 'VIDEO', cls: 'bg-neutral-700 text-neutral-300' },
};

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams?.get('q') ?? '';
  const urlPage = Math.max(1, Number(searchParams?.get('page')) || 1);

  const [videos, setVideos] = useState<Video[]>([]);
  const [similarVideos, setSimilarVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
      setSearchQuery(urlQuery);
      setPage(urlPage);
      setLoading(true);
      setLoadedExtraPages(0);
      window.scrollTo(0, 0);

      if (urlQuery) {
        document.title = `${urlQuery} Videos (Page ${urlPage}) | HubTube - XVideos3 HD`;
      } else if (urlPage > 1) {
        document.title = `Desi & HD Porn Videos - Page ${urlPage} | HubTube - XVideos3`;
      } else {
        document.title = 'HubTube (XVideos3) - Free Desi, Indian & HD Porn Videos';
      }

      const [fetched, similar] = await Promise.all([
        fetchVideos(urlQuery, urlPage, PER_PAGE, 'most_viewed'),
        fetchVideos(urlQuery || 'desi bhabhi', urlPage + 1, 15, 'top-rated'),
      ]);

      if (!active) return;

      setVideos(fetched);
      const mainIds = new Set(fetched.map((v) => v.id));
      setSimilarVideos(similar.filter((v) => !mainIds.has(v.id)).slice(0, 10));
      setLoading(false);
    };

    run();
    return () => {
      active = false;
    };
  }, [urlQuery, urlPage]);

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
    if (!showHints) return;

    const local = getInstantLocalHints(searchQuery);
    setHints(local);
    setActiveHintIdx(-1);

    const timer = setTimeout(async () => {
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      const controller = new AbortController();
      suggestAbortRef.current = controller;

      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data: { hints?: SearchHint[] } = await res.json();
        if (Array.isArray(data.hints) && data.hints.length > 0) {
          setHints(data.hints);
        }
      } catch {
        // Keep instant local hints on abort
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, showHints]);

  const navigateToSearch = (term: string, targetPage: number = 1) => {
    setShowHints(false);
    setShowMenu(false);
    const params = new URLSearchParams();
    if (term.trim()) params.set('q', term.trim());
    if (targetPage > 1) params.set('page', String(targetPage));
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
    const nextBatchPage = page + loadedExtraPages + 1;
    const more = await fetchVideos(urlQuery, nextBatchPage, PER_PAGE, 'most_viewed');
    if (more.length > 0) {
      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.id));
        const uniqueNew = more.filter((v) => !existingIds.has(v.id));
        return [...prev, ...uniqueNew];
      });
      setLoadedExtraPages((prev) => prev + 1);
    }
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] sticky top-0 z-50 p-3 border-b border-gray-800">
        <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-0.5 shrink-0">
            <span className="text-3xl md:text-4xl font-black text-[#FF9900]">H</span>
            <span className="text-3xl md:text-4xl font-black text-white">UB</span>
            <span className="text-3xl md:text-4xl font-black text-[#FF9900]">T</span>
            <span className="text-3xl md:text-4xl font-black text-white">UBE</span>
          </Link>

          {/* Instant XVideos-Style Search Bar with Unlimited Hints */}
          <div ref={searchWrapRef} className="relative flex-1 max-w-xl mx-2">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                value={searchQuery}
                onFocus={() => setShowHints(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowHints(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search desi, bhabhi, pornstars, categories..."
                autoComplete="off"
                className="w-full bg-[#222] border-2 border-[#FF9900] rounded-full pl-5 pr-20 py-2.5 text-base focus:outline-none text-white placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowHints(true);
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

            {showHints && hints.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#161616] border border-gray-700 rounded-2xl shadow-2xl z-[10001] max-h-[65vh] overflow-y-auto">
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#161616]">
                  <span>{searchQuery.trim() ? `Suggestions (${hints.length})` : 'Trending & Categories'}</span>
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
          <button onClick={() => handleSidebarClick("4k")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">4K PORN</button>
          <button onClick={() => handleSidebarClick("best videos")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">BEST VIDEOS</button>
          <Link href="/categories" onClick={() => setShowMenu(false)} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ CATEGORIES</Link>
          <Link href="/pornstars" onClick={() => setShowMenu(false)} className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ PORNSTARS</Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-[#FF9900]">
            {urlQuery ? `Results for "${urlQuery}"` : 'Trending Desi & HD Videos'}
            {page > 1 ? ` — Page ${page}` : ''}
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse aspect-video" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 text-yellow-500 text-xl">
            No results found for &ldquo;{urlQuery}&rdquo;. Try another keyword.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {videos.map((v) => (
              <Link key={v.id} href={`/watch/${v.id}`} className="block">
                <VideoCard video={v} />
              </Link>
            ))}
          </div>
        )}

        {/* Load More + Full Pagination */}
        {videos.length > 0 && (
          <div className="mt-10 space-y-6">
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-10 py-3.5 bg-[#FF9900] text-black font-black rounded-full hover:bg-[#ffaa33] transition disabled:opacity-60 text-base shadow-lg"
              >
                {loadingMore ? 'Loading More Videos...' : 'LOAD MORE VIDEOS'}
              </button>
            </div>

            <div className="flex justify-center items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageClick(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] hover:text-black rounded-full font-bold disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: 10 }, (_, i) => {
                const p = page <= 5 ? i + 1 : page - 5 + i;
                if (p > 500) return null;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageClick(p)}
                    className={`px-5 py-3 rounded-full font-bold ${
                      page === p
                        ? 'bg-[#FF9900] text-black'
                        : 'bg-[#222] hover:bg-[#FF9900] hover:text-black'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageClick(page + 1)}
                className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] hover:text-black rounded-full font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Similar Videos You May Also Like */}
        {!loading && similarVideos.length > 0 && (
          <section className="mt-14 pt-8 border-t border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-[#FF9900]">
                Similar Videos You May Also Like
              </h2>
              <button
                onClick={() => handlePageClick(page + 1)}
                className="text-sm font-bold text-[#FF9900] hover:underline"
              >
                View More →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {similarVideos.map((v) => (
                <Link key={`sim-${v.id}`} href={`/watch/${v.id}`} className="block">
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
