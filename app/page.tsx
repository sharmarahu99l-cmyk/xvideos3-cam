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

  const loadVideos = async (query: string, pageNum: number = 1, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const searchTerm = query.trim() || "";
      const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=12&page=${pageNum}&order=most_viewed`, { cache: 'no-store' });
      const data = await res.json();
      
      if (append) setVideos(prev => [...prev, ...(data.videos || [])]);
      else setVideos(data.videos || []);
      
      setCurrentSearch(query);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      loadVideos(q, 1);
    } else {
      loadVideos("", 1);
    }
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
      <header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-[52px] font-black text-red-600 leading-none">X</span>
            <span className="text-3xl font-black text-white tracking-[-2px]">VIDEOS3</span>
          </a>
          <form onSubmit={handleSearch} className="flex-1 max-w-3xl mx-8">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search xvideos, desi bhabhi, indian mms, pakistani sex, ava adams..." 
              className="w-full bg-[#222] border-2 border-gray-700 hover:border-red-500 focus:border-red-600 rounded-full px-8 py-5 text-xl focus:outline-none placeholder-gray-400 transition"
            />
          </form>
          <a href="/categories" className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-full font-bold text-sm transition">Categories</a>
        </div>
      </header>

      <div className="bg-[#111] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-8 text-sm font-medium py-4">
            <a href="/" className="hover:text-red-500 transition">Best Videos</a>
            <a href="/categories" className="hover:text-red-500 transition">Categories</a>
            <a href="/?q=pornstar" className="hover:text-red-500 transition">Pornstars</a>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-red-600 mb-8">🌍 Trending XVIDEOS Worldwide</h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {[...Array(12)].map((_, i) => <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse"><div className="aspect-video bg-gray-700"></div></div>)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {videos.map((video) => <VideoCard key={video.id} video={video} />)}
            </div>
            <div className="text-center mt-12">
              <button onClick={loadMore} disabled={loadingMore} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-12 py-4 rounded-full font-bold text-lg transition">
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