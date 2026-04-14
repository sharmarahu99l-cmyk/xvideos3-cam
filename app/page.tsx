'use client';

import { useEffect, useState, useRef } from 'react';
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

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSearch, setCurrentSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const isBackNavigation = useRef(false);

  const loadVideos = async (query: string, pageNum: number = 1, append = false) => {
    if (!append) {
      setLoading(true);
      setError(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const searchTerm = query.trim() || "";
      const res = await fetch(
        `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=12&page=${pageNum}&order=most_viewed`,
        { cache: 'no-store' }
      );

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      
      if (append) {
        setVideos(prev => [...prev, ...(data.videos || [])]);
      } else {
        setVideos(data.videos || []);
      }
      setCurrentSearch(query);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // Initial load
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      loadVideos(q, 1);
    } else {
      loadVideos("", 1);
    }

    // REAL FIX: Detect back button and FORCE full reload
    const handlePopState = () => {
      isBackNavigation.current = true;
      setVideos([]);           // clear old videos
      setPage(1);
      setLoading(true);

      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        setSearchQuery(q);
        loadVideos(q, 1);
      } else {
        loadVideos("", 1);
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {   // browser used back/forward cache
        handlePopState();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setPage(1);
      loadVideos(searchQuery.trim(), 1);
      window.history.replaceState({}, '', `?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadVideos(currentSearch, nextPage, true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      {/* Sticky Header */}
{/* Clean Mobile Header - No Double Categories */}
<header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800 shadow-lg">
  <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
    <a href="/" className="flex items-center gap-2">
      <span className="text-[42px] font-black text-red-600 leading-none">X</span>
      <span className="text-2xl font-black text-white tracking-[-1px]">VIDEOS3</span>
    </a>
    
    <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
      <input 
        type="text" 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search xvideos..." 
        className="w-full bg-[#222] border border-gray-700 focus:border-red-600 rounded-full px-5 py-3 text-base focus:outline-none"
      />
    </form>
  </div>

  {/* Single Navigation Bar - No Double */}
  <div className="bg-[#111] border-t border-gray-700 overflow-x-auto scrollbar-hide whitespace-nowrap">
    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 text-sm font-medium">
      <a href="/" className="hover:text-red-500 transition">Best Videos</a>
      <a href="/categories" className="hover:text-red-500 transition">Categories</a>
      <a href="/?q=pornstar" className="hover:text-red-500 transition">Pornstars</a>
      <a href="/?q=channels" className="hover:text-red-500 transition">Channels</a>
      <a href="/?q=live" className="hover:text-red-500 transition">Live Cams</a>
      <a href="/?q=games" className="hover:text-red-500 transition">Games</a>
      <a href="/?q=dating" className="hover:text-red-500 transition">Dating</a>
    </div>
  </div>
</header>

      {/* Scrollable Navigation */}
      <div className="bg-[#111] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-8 text-sm font-medium py-4">
            <a href="/" className="hover:text-red-500 transition">Best Videos</a>
            <a href="/categories" className="hover:text-red-500 transition">Categories</a>
            <a href="/?q=pornstar" className="hover:text-red-500 transition">Pornstars</a>
            <a href="/?q=channels" className="hover:text-red-500 transition">Channels</a>
            <a href="/?q=live" className="hover:text-red-500 transition">Live Cams</a>
            <a href="/?q=games" className="hover:text-red-500 transition">Games</a>
            <a href="/?q=dating" className="hover:text-red-500 transition">Dating</a>
          </nav>

          <div className="py-3 flex items-center gap-4 text-sm overflow-x-auto border-t border-gray-700">
            <span className="font-bold text-red-500 whitespace-nowrap">Popular Pornstars:</span>
            <a href="/?q=sunny leone" className="hover:text-red-400 transition whitespace-nowrap">Sunny Leone</a>
            <a href="/?q=ava adams" className="hover:text-red-400 transition whitespace-nowrap">Ava Adams</a>
            <a href="/?q=bhabhi" className="hover:text-red-400 transition whitespace-nowrap">Desi Bhabhi</a>
            <a href="/?q=aunty" className="hover:text-red-400 transition whitespace-nowrap">Indian Aunty</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-red-600 mb-8">🌍 Trending XVIDEOS Worldwide</h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-700 rounded mb-3 w-4/5"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">Failed to load videos. Please refresh.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            <div className="text-center mt-12">
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-12 py-4 rounded-full font-bold text-lg transition"
              >
                {loadingMore ? "Loading..." : "LOAD MORE VIDEOS"}
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="bg-[#080808] py-12 text-center text-gray-500 text-sm border-t border-gray-800">
        © 2026 XVideos3.cam • Free XVIDEOS • XVIDEOS.com • XVIDEOS3.com • 18+ Only
      </footer>
    </div>
  );
}