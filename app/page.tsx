'use client';

import { useEffect, useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSearch, setCurrentSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      loadVideos(q, 1);
    } else {
      loadVideos("", 1); // empty query = global trending
    }
  }, []);

  const loadVideos = async (query: string, pageNum: number = 1, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=30&page=${pageNum}&order=most_viewed`);
      const data = await res.json();
      
      if (append) {
        setVideos(prev => [...prev, ...(data.videos || [])]);
      } else {
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

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
 {/* FINAL PROFESSIONAL HEADER - Fix #5 */}
<header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800 shadow-lg">
  <div className="max-w-7xl mx-auto px-4">
    
    {/* Top Bar - Straight / Gay / Trans + Join / Premium */}
    <div className="flex items-center justify-between py-3 text-sm border-b border-gray-700">
      <div className="flex items-center gap-6">
        <a href="/" className="text-red-500 hover:text-red-400 font-bold flex items-center gap-1">
          Straight
        </a>
        <a href="#" className="hover:text-red-400">Gay</a>
        <a href="#" className="hover:text-red-400">Trans</a>
      </div>
      <div className="flex items-center gap-4">
        <a href="#" className="bg-red-600 hover:bg-red-700 px-6 py-1.5 rounded-full text-sm font-bold">Join for FREE</a>
        <a href="#" className="border border-red-600 hover:bg-red-600/10 px-6 py-1.5 rounded-full text-sm font-bold">Premium</a>
      </div>
    </div>

    {/* Main Header - Logo + Search */}
    <div className="flex items-center justify-between py-5">
      <a href="/" className="text-4xl font-black text-red-600 tracking-tighter">XVIDEOS3</a>
      
      <form onSubmit={handleSearch} className="flex-1 max-w-3xl mx-8">
        <input 
          id="search-input"
          name="q"
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search xvideos, desi bhabhi, indian mms, pakistani sex, ava adams..." 
          className="w-full bg-[#222] border-2 border-gray-700 hover:border-red-500 focus:border-red-600 rounded-full px-8 py-5 text-xl focus:outline-none placeholder-gray-400 transition"
        />
      </form>

      <a href="/categories" className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-full font-bold text-sm transition">
        Categories
      </a>
    </div>

    {/* Navigation Menu */}
    <nav className="flex items-center gap-8 text-sm font-medium pb-4 border-t border-gray-700 pt-4">
      <a href="#" className="hover:text-red-500 transition">Best Videos</a>
      <a href="/categories" className="hover:text-red-500 transition">Categories</a>
      <a href="#" className="hover:text-red-500 transition">Pornstars</a>
      <a href="#" className="hover:text-red-500 transition">Channels</a>
      <a href="#" className="hover:text-red-500 transition">Live Cams</a>
      <a href="#" className="hover:text-red-500 transition">Games</a>
      <a href="#" className="hover:text-red-500 transition">Dating</a>
    </nav>

    {/* NEW: Popular Pornstars Row (Fix #5) */}
    <div className="py-3 flex items-center gap-4 text-sm overflow-x-auto border-t border-gray-700">
      <span className="font-bold text-red-500 whitespace-nowrap">Popular Pornstars:</span>
      <a href="#" className="hover:text-red-400 transition whitespace-nowrap">Sunny Leone</a>
      <a href="#" className="hover:text-red-400 transition whitespace-nowrap">Ava Adams</a>
      <a href="#" className="hover:text-red-400 transition whitespace-nowrap">Mia Khalifa</a>
      <a href="#" className="hover:text-red-400 transition whitespace-nowrap">BlazeRager</a>
      <a href="#" className="hover:text-red-400 transition whitespace-nowrap">Desi Bhabhi</a>
      <a href="#" className="hover:text-red-400 transition whitespace-nowrap">Indian Aunty</a>
    </div>
  </div>
</header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-red-600 mb-8">Trending XVIDEOS </h2>

        {loading ? (
          <div className="text-center py-20 text-red-600 text-2xl">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <button 
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-12 py-4 rounded-full font-bold text-lg transition"
          >
            {loadingMore ? "Loading..." : "LOAD MORE VIDEOS"}
          </button>
        </div>
      </div>

      <footer className="bg-[#080808] py-12 text-center text-gray-500 text-sm border-t border-gray-800">
        © 2026 XVideos3.cam • Free XVIDEOS • XVIDEOS.com • XVIDEOS3.com • 18+ Only
      </footer>
    </div>
  );
}