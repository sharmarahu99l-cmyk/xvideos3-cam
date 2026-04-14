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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(100); // Eporner has many pages

  const loadVideos = async (query: string, page: number) => {
    setLoading(true);
    try {
      const searchTerm = query.trim() || "trending"; // global trending by default
      const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=30&page=${page}&order=most_viewed`);
      const data = await res.json();
      setVideos(data.videos || []);
      setCurrentPage(page);
      setCurrentSearch(query);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load global trending on first visit
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const p = parseInt(params.get('page') || "1");

    if (q) {
      setSearchQuery(q);
      loadVideos(q, p);
    } else {
      loadVideos("", 1); // global trending
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.history.replaceState({}, '', `?q=${encodeURIComponent(searchQuery.trim())}&page=1`);
      loadVideos(searchQuery.trim(), 1);
    }
  };

  const goToPage = (page: number) => {
    window.history.replaceState({}, '', `?q=${encodeURIComponent(currentSearch)}&page=${page}`);
    loadVideos(currentSearch, page);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      {/* Header */}
      <header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-4xl font-black text-red-600 tracking-tighter">XVIDEOS3</a>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
            <input 
              id="search-input"
              name="q"
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything... ava adams, gangbang, desi, etc." 
              className="w-full bg-[#222] border-2 border-gray-700 rounded-full px-6 py-3.5 text-lg focus:outline-none focus:border-red-600 placeholder-gray-400"
            />
          </form>

          <a href="/categories" className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-bold text-sm transition">
            All Categories ▼
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-red-600 mb-8">
          🌍 Global Trending XVIDEOS - Best Videos From All Over The World
        </h2>

        {loading ? (
          <div className="text-center py-20 text-red-600 text-2xl">Loading best xvideos worldwide...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {/* Pagination Numbers */}
        <div className="flex justify-center gap-2 mt-16 flex-wrap">
          {Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`px-5 py-3 rounded-xl font-bold transition ${p === currentPage ? 'bg-red-600 text-white' : 'bg-[#222] hover:bg-gray-700'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            className="px-5 py-3 rounded-xl font-bold bg-[#222] hover:bg-gray-700 transition"
          >
            Next →
          </button>
        </div>
      </div>

      <footer className="bg-[#080808] py-12 text-center text-gray-500 text-sm border-t border-gray-800">
        © 2026 XVideos3.cam • Free XVIDEOS • XVIDEOS.com • XVIDEOS3.com • 18+ Only
      </footer>
    </div>
  );
}