
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '../../VideoCard';
import JuicyBanner from '../../JuicyBanner';
import {
  recordWatchedVideo,
  getTopPreferences,
  resolveContentContext,
} from '../../lib/userPrefs';

export type WatchVideo = {
  id: string;
  title: string;
  default_thumb: { src: string };
  thumbs?: Array<{ src: string; width?: number; height?: number }>;
  length_min: number;
  length_sec: number;
  embed: string;
  views?: string;
  keywords?: string;
};

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
  const [forYou, setForYou] = useState<WatchVideo[]>([]);
  const [similarLabel, setSimilarLabel] = useState<string>('Similar Videos You May Also Like');
  const [pickedLabel, setPickedLabel] = useState<string>('Picked For You');
  const [loading, setLoading] = useState(true);
  const [relatedPage, setRelatedPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Immediately stop & blank out old video iframe when leaving or switching videos
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }
    };
  }, [id]);

  const fetchList = useCallback(async (query: string, pageNum: number, order: string): Promise<WatchVideo[]> => {
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&page=${pageNum}&per_page=25&order=${encodeURIComponent(order)}`
      );
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? (data as WatchVideo[]).filter(validThumb) : [];
      }
    } catch {
      // Ignore transient error
    }
    return [];
  }, []);

  const loadLogicalRecommendations = useCallback(
    async (v: WatchVideo | null, pageNum: number) => {
      setLoading(true);
      const ctx = resolveContentContext(v?.title || id, v?.keywords || '', pageNum);

      // Update section headings so they reflect what the user is actually watching
      if (ctx.type === 'pornstar') {
        setSimilarLabel(`More ${ctx.primarySubject} Videos`);
        setPickedLabel(`Picked For You • Featuring ${ctx.relatedPeerQuery}`);
      } else {
        setSimilarLabel(`Similar ${ctx.primarySubject} Videos`);
        setPickedLabel(`Picked For You • ${ctx.relatedPeerQuery}`);
      }

      const prefs = getTopPreferences(3);
      const secondaryQuery =
        pageNum % 2 === 1
          ? ctx.relatedPeerQuery
          : prefs.find((p) => p.toLowerCase() !== ctx.similarQuery.toLowerCase()) || ctx.relatedPeerQuery;

      const [simList, recList] = await Promise.all([
        fetchList(ctx.similarQuery, pageNum, 'most_viewed'),
        fetchList(secondaryQuery, pageNum, 'top-rated'),
      ]);

      const seen = new Set<string>([id]);
      const cleanSim = simList.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      const cleanRec = recList.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      setRelated(cleanSim.slice(0, 20));
      setForYou(cleanRec.slice(0, 10));
      setLoading(false);
    },
    [id, fetchList]
  );

  useEffect(() => {
    let active = true;
    scrollTopNow();
    setRelatedPage(1);
    setRelated([]);
    setForYou([]);

    const init = async () => {
      let current = initialVideo && initialVideo.id === id ? initialVideo : null;
      if (!current) {
        try {
          const res = await fetch(`/api/video/${encodeURIComponent(id)}`);
          if (res.ok) current = await res.json();
        } catch {
          // Ignore
        }
      }
      if (!active) return;
      if (current) {
        setVideo(current);
        recordWatchedVideo(current);
      }
      loadLogicalRecommendations(current, 1);
    };

    init();
    return () => {
      active = false;
    };
  }, [id, initialVideo, loadLogicalRecommendations]);

  const changeRelatedPage = (nextPage: number) => {
    const safePage = Math.max(1, nextPage);
    scrollTopNow();
    setRelatedPage(safePage);
    loadLogicalRecommendations(video, safePage);
  };

  const tagList = video?.keywords
    ? video.keywords.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12)
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] px-4 py-3 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" onClick={scrollTopNow} className="text-2xl md:text-3xl font-black shrink-0">
            <span className="text-[#FF9900]">H</span><span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span><span className="text-white">UBE</span>
          </Link>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              scrollTopNow();
              if (searchInput.trim()) router.push(`/?q=${encodeURIComponent(searchInput.trim())}`);
            }}
            className="relative flex-1 max-w-xl flex items-center"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search desi videos, pornstars, bhabhi..."
              className="w-full bg-[#222] border-2 border-[#FF9900] text-white pl-5 pr-12 py-2.5 rounded-full outline-none"
            />
            <button type="submit" className="absolute right-1.5 bg-[#FF9900] text-black font-bold rounded-full w-9 h-9 flex items-center justify-center">
              Go
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div key={`player-wrap-${id}`} className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
          <iframe
            key={`player-frame-${id}`}
            ref={iframeRef}
            src={`https://www.eporner.com/embed/${encodeURIComponent(id)}/`}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>

        <JuicyBanner />

        {video && (
          <div className="mt-6 bg-[#111] p-6 rounded-2xl border border-gray-800">
            <h1 className="text-white text-2xl md:text-3xl font-black mb-2">{video.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
              {video.views && <span>Views: {video.views}</span>}
              <span>Duration: {video.length_min || 0}:{String(video.length_sec || 0).padStart(2, '0')}</span>
            </div>
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tagList.map((tag) => (
                  <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} onClick={scrollTopNow} className="bg-[#222] hover:bg-[#FF9900] hover:text-black text-xs font-semibold px-3 py-1.5 rounded-full">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <JuicyBanner adzone={1133788} width={308} height={286} />

        {/* Section 1: Exact Same Pornstar or Exact Same Niche */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-[#FF9900] text-xl md:text-2xl font-bold capitalize">{similarLabel}</h2>
            <span className="text-sm text-gray-400">Page {relatedPage}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => <div key={i} className="bg-[#1a1a1a] rounded-2xl aspect-video animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {related.map((v) => (
                <Link key={v.id} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
                  <VideoCard video={v} />
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center items-center gap-3">
            <button
              onClick={() => changeRelatedPage(relatedPage - 1)}
              disabled={relatedPage <= 1}
              className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] hover:text-black rounded-full font-bold disabled:opacity-40"
            >
              Prev Page
            </button>
            <span className="px-4 py-2 bg-[#161616] rounded-full text-sm font-bold text-[#FF9900]">Page {relatedPage}</span>
            <button
              onClick={() => changeRelatedPage(relatedPage + 1)}
              className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] hover:text-black rounded-full font-bold"
            >
              Next Page
            </button>
          </div>
        </div>

        {/* Section 2: Related Peer Pornstars or Related Sub-Categories */}
        {forYou.length > 0 && (
          <section className="mt-14 pt-8 border-t border-gray-800">
            <h2 className="text-[#FF9900] text-xl md:text-2xl font-bold mb-6 capitalize">{pickedLabel}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {forYou.map((v) => (
                <Link key={`pref-${v.id}`} href={`/watch/${v.id}`} onClick={scrollTopNow} className="block">
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
