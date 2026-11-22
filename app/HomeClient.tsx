
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
type SearchHint = { label: string; type: 'category' | 'pornstar' | 'desi' | 'video' };

interface HomeClientProps {
  initialVideos?: Video[];
  initialQuery?: string;
  initialPage?: number;
}

const PER_PAGE = 30;
const MAX_PAGES = 200;

const SEO_LINKS = [
  'Desi Videos', 'Desi Porn', 'Desi MMS', 'Viral Desi Videos', 'New Desi Videos',
  'Desi Bhabhi', 'Indian Bhabhi', 'Desi Aunty', 'Indian Aunty', 'Indian Porn',
  'Pakistani MMS', 'Pakistani Sex', 'Desi Chudai', 'Hindi Audio Sex', 'Punjabi Desi',
  'Desi Homemade', 'Indian Homemade', 'Desi Couple', 'Desi College Girl', 'Desi Saree Sex',
  'Bhabhi Devar', 'South Indian Desi', 'Tamil Desi', 'Telugu Desi', 'Bengali Bhabhi',
  'Marathi Bhabhi', 'Gujarati Aunty', 'Mallu Aunty', 'Bhojpuri Desi', 'Indian Wife',
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

function getPageWindow(current: number): number[] {
  let start = Math.max(1, current - 4);
  const end = Math.min(MAX_PAGES, start + 8);
  start = Math.max(1, end - 8);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

async function fetchVideos(query: string, pageNum = 1, perPage = PER_PAGE, order = 'most_viewed'): Promise<Video[]> {
  const term = query.trim() || 'desi';
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(term)}&page=${pageNum}&per_page=${perPage}&order=${encodeURIComponent(order)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return (data as Video[]).filter(validThumb);
    }
  } catch {
    // Ignore transient network error
  }
  return [];
}

const BADGE: Record<SearchHint['type'], string> = {
  desi: 'bg-[#FF9900]/20 text-[#FF9900]',
  category: 'bg-blue-500/20 text-blue-300',
  pornstar: 'bg-pink-500/20 text-pink-300',
  video: 'bg-neutral-700 text-neutral-300',
};

export default function HomeClient({ initialVideos = [], initialQuery = '', initialPage = 1 }: HomeClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams?.get('q') ?? initialQuery;
  const urlPage = Math.min(MAX_PAGES, Math.max(1, Number(searchParams?.get('page')) || initialPage));
  const validInitial = initialVideos.filter(validThumb);
  const hasSSR = validInitial.length > 0 && urlQuery === initialQuery && urlPage === initialPage;

  const [videos, setVideos] = useState<Video[]>(hasSSR ? validInitial : []);
  const [similarVideos, setSimilarVideos] = useState<Video[]>([]);
  const [forYouVideos, setForYouVideos] = useState<Video[]>([]);
  const [recentHistory, setRecentHistory] = useState<Video[]>([]);
  const [recHeading, setRecHeading] = useState('Picked For You');
  const [simHeading, setSimHeading] = useState('Similar Videos You May Also Like');
  const [loading, setLoading] = useState(!hasSSR);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [showMenu, setShowMenu] = useState(false);
  const [page, setPage] = useState(urlPage);
  const [extraPages, setExtraPages] = useState(0);
  const [hints, setHints] = useState<SearchHint[]>([]);
  const [showHints, setShowHints] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    scrollTopNow();
    setSearchQuery(urlQuery);
    setPage(urlPage);
    setExtraPages(0);
    setSimilarVideos([]);
    setForYouVideos([]);

    if (urlQuery.trim()) trackUserInterest([urlQuery.trim()]);

    const prefs = getTopPreferences(4);
    const activeSeed = urlQuery.trim() || prefs[0] || 'desi bhabhi';
    const ctx = resolveContentContext(activeSeed, '', urlPage);

    if (ctx.type === 'pornstar') {
      setSimHeading(`More ${ctx.primarySubject} Videos`);
      setRecHeading(`Picked For You • ${ctx.relatedPeerQuery}`);
    } else {
      setSimHeading(`Similar ${ctx.primarySubject} Videos`);
      setRecHeading(`Picked For You • ${ctx.relatedPeerQuery}`);
    }

    setRecentHistory(getWatchHistory(5).filter(validThumb));

    const useSSR = validInitial.length > 0 && urlQuery === initialQuery && urlPage === initialPage;
    if (!useSSR) setLoading(true);

    Promise.all([
      useSSR ? Promise.resolve(validInitial) : fetchVideos(urlQuery, urlPage, PER_PAGE, 'most_viewed'),
      fetchVideos(ctx.similarQuery, urlPage + 2, 18, 'top-rated'),
      fetchVideos(ctx.relatedPeerQuery, urlPage, 18, 'most_viewed'),
    ]).then(([mainList, simList, recList]) => {
      if (!active) return;
      const seen = new Set<string>();
      const dedupe = (arr: Video[]) =>
        arr.filter((v) => {
          if (!validThumb(v) || seen.has(v.id)) return false;
          seen.add(v.id);
          return true;
        });

      setVideos(dedupe(mainList));
      setSimilarVideos(dedupe(simList).slice(0, 10));
      setForYouVideos(dedupe(recList).slice(0, 10));
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [urlQuery, urlPage, initialQuery, initialPage]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!showHints || !trimmed) {
      setHints([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data: { hints?: SearchHint[] } = await res.json();
          if (Array.isArray(data.hints)) setHints(data.hints);
        }
      } catch {
        // Ignore
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, showHints]);

  const goPage = (term: string, targetPage = 1) => {
    setShowHints(false);
    setShowMenu(false);
    scrollTopNow();
    const safePage = Math.min(MAX_PAGES, Math.max(1, targetPage));
    const params = new URLSearchParams();
    if (term.trim()) params.set('q', term.trim());
    if (safePage > 1) params.set('page', String(safePage));
    router.push(params.toString() ? `/?${params.toString()}` : '/', { scroll: true });
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextStep = extraPages + 1;
    const more = await fetchVideos(urlQuery, page + nextStep, PER_PAGE, 'most_viewed');
    const seen = new Set(videos.map((v) => v.id));
    const fresh = more.filter((v) => validThumb(v) && !seen.has(v.id));
    if (fresh.length > 0) {
      setVideos((prev) => [...prev, ...fresh]);
      setExtraPages(nextStep);
    }
    setLoadingMore(false);
  };

  const pageWindow = getPageWindow(page);

  const renderPagination = () => (
    <nav aria-label="Pagination" className="flex justify-center items-center gap-2 flex-wrap my-6">
      <button
        type="button"
        onClick={() => goPage(urlQuery, page - 1)}
        disabled={page <= 1}
        className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold disabled:opacity-40 transition text-sm"
      >
        Back
      </button>
      {pageWindow.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => goPage(urlQuery, p)}
          className={`px-4 py-2.5 rounded-full font-bold transition text-sm ${
            page === p ? 'bg-[#FF9900] text-black' : 'bg-[#222] hover:bg-[#FF9900] hover:text-black text-white'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => goPage(urlQuery, page + 1)}
        disabled={page >= MAX_PAGES}
        className="px-4 py-2.5 bg-[#222] hover:bg-[#FF9900] hover:text-black text-white rounded-full font-bold disabled:opacity-40 transition text-sm"
      >
        Next
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] sticky top-0 z-50 p-3 border-b border-gray-800">
        <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
          <Link href="/" onClick={scrollTopNow} className="flex items-center gap-0.5 shrink-0 text-3xl font-black">
            <span className="text-[#FF9900]">H</span><span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span><span className="text-white">UBE</span>
          </Link>

          <div ref={searchWrapRef} className="relative flex-1 max-w-xl mx-2">
            <form onSubmit={(e) => { e.preventDefault(); goPage(searchQuery, 1); }} className="relative flex items-center">
              <input
                value={searchQuery}
                onFocus={() => searchQuery.trim() && setShowHints(true)}
                onChange={(e) => { setSearchQuery(e.target.value); setShowHints(Boolean(e.target.value.trim())); }}
                placeholder="Search desi videos, pornstars, bhabhi..."
                className="w-full bg-[#222] border-2 border-[#FF9900] rounded-full pl-5 pr-12 py-2.5 text-base text-white outline-none"
              />
              <button type="submit" className="absolute right-1.5 bg-[#FF9900] text-black font-bold rounded-full w-9 h-9 flex items-center justify-center">
                Go
              </button>
            </form>

            {showHints && hints.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#161616] border border-gray-700 rounded-2xl shadow-2xl z-[10001] max-h-72 overflow-y-auto">
                {hints.map((h, i) => (
                  <button
                    key={`${h.label}-${i}`}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setSearchQuery(h.label); goPage(h.label, 1); }}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between border-b border-gray-800/60 hover:bg-[#222] text-gray-200"
                  >
                    <span className="truncate text-sm">{h.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE[h.type]}`}>{h.type.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setShowMenu(!showMenu)} className="text-4xl text-[#FF9900] px-2">☰</button>
        </div>
      </header>

      {showMenu && (
        <div className="fixed top-0 left-0 h-full w-72 bg-[#1a1a1a] shadow-2xl z-[9999] pt-14 overflow-y-auto border-r border-gray-800">
          <div className="flex justify-end px-6 py-3 border-b border-gray-700">
            <button onClick={() => setShowMenu(false)} className="text-3xl text-gray-400">✕</button>
          </div>
          {['desi', 'viral desi', '4k', '1080p', 'best videos', 'amateur'].map((item) => (
            <button key={item} onClick={() => goPage(item, 1)} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium border-b border-gray-700 text-left uppercase">
              {item}
            </button>
          ))}
          <Link href="/categories" onClick={() => setShowMenu(false)} className="block px-6 py-4 text-yellow-400 text-lg font-medium border-b border-gray-700">CATEGORIES</Link>
          <Link href="/pornstars" onClick={() => setShowMenu(false)} className="block px-6 py-4 text-yellow-400 text-lg font-medium border-b border-gray-700">PORNSTARS</Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-black text-[#FF9900] capitalize">
            {urlQuery ? `${urlQuery} Videos` : 'Trending Desi Videos, Viral MMS & HD Porn'} — Page {page}
          </h1>
          {urlQuery && (
            <button onClick={() => goPage('', 1)} className="text-sm bg-[#222] hover:bg-[#FF9900] hover:text-black px-4 py-2 rounded-full font-semibold">
              Reset Filter
            </button>
          )}
        </div>

        <JuicyBanner />
        {renderPagination()}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(15)].map((_, i) => <div key={i} className="bg-[#1a1a1a] rounded-2xl animate-pulse aspect-video" />)}
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
              <button onClick={handleLoadMore} disabled={loadingMore} className="px-10 py-3.5 bg-[#FF9900] text-black font-black rounded-full">
                {loadingMore ? 'Loading More...' : 'LOAD MORE VIDEOS'}
              </button>
            </div>
          )}
          {renderPagination()}
        </div>

        <JuicyBanner adzone={1133788} width={308} height={286} />

        {/* Logically Matched Similar Videos */}
        {!loading && similarVideos.length > 0 && (
          <section className="mt-14 pt-8 border-t border-gray-800">
            <h2 className="text-xl md:text-2xl font-black text-[#FF9900] mb-6 capitalize">{simHeading}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {similarVideos.map((v) => (
                <Link key={`sim-${v.id}`} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Logically Paired Peer Pornstars / Sub-Categories */}
        {!loading && forYouVideos.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-xl md:text-2xl font-black text-[#FF9900] mb-6 capitalize">{recHeading}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {forYouVideos.map((v) => (
                <Link key={`rec-${v.id}`} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && recentHistory.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-2xl font-black text-[#FF9900] mb-6">Recently Watched</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {recentHistory.map((v) => (
                <Link key={`hist-${v.id}`} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-16 pt-8 border-t border-gray-800">
          <h2 className="text-lg font-black text-[#FF9900] mb-3">Popular Desi Videos &amp; Viral MMS</h2>
          <div className="flex flex-wrap gap-2">
            {SEO_LINKS.map((term) => (
              <Link key={term} href={`/?q=${encodeURIComponent(term.toLowerCase())}`} onClick={scrollTopNow} className="text-xs bg-[#161616] hover:bg-[#FF9900] hover:text-black text-gray-300 px-3 py-1.5 rounded-full border border-gray-800">
                {term}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
