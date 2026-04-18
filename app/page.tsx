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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const isBackNavigation = useRef(false);

  // Top 5 keywords for ranking
  const topKeywords = ["hubtube", "redyube", "hpornhub", "porne hub", "pornhoub"];

  // Fuzzy search for broken words
  const getFuzzyQueries = (text) => {
    const t = text.toLowerCase().trim();
    if (t.length < 2) return [t];
    const queries = [t];
    if (t.length > 3) queries.push(t.substring(0, t.length - 1));
    if (t.length > 4) queries.push(t.substring(0, t.length - 2));
    return queries;
  };

  const loadVideos = async (query, pageNum = 1, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const searchTerm = query.trim() || "desi";
      const res = await fetch(
        `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=12&page=${pageNum}&order=most_viewed`,
        { cache: 'no-store' }
      );
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
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      loadVideos(q, 1);
    } else {
      loadVideos("", 1);
    }
  }, []);

  // Real-time suggestions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const fuzzy = getFuzzyQueries(searchQuery);
    const common = ["porn", "desi porn", "bhabhi", "indian sex", "desi mms", "aunty", "pakistani", "gangbang", "big boobs", "chudai", "groping", "groped", "group sex"];
    const filtered = common.filter(s => fuzzy.some(f => s.includes(f)));
    setSuggestions(filtered);
  }, [searchQuery]);

  const handleSearch = (e) => {
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
      {/* Title & Meta for ranking on top 5 keywords */}
      <title>hubtube redyube hpornhub porne hub pornhoub xvideos3 desi porn</title>

      <header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-[52px] font-black text-red-600 leading-none">X</span>
            <span className="text-3xl font-black text-white tracking-[-2px]">VIDEOS3</span>
          </a>
          
          <div className="flex-1 max-w-3xl mx-8 relative">
            <form onSubmit={handleSearch}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search xvideos, desi bhabhi..." 
                className="w-full bg-[#222] border-2 border-gray-700 hover:border-red-500 focus:border-red-600 rounded-full px-8 py-5 text-xl focus:outline-none placeholder-gray-400 transition"
              />
            </form>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#222] border border-gray-700 rounded-2xl shadow-2xl z-50 max-h-80 overflow-auto">
                {suggestions.map((s, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setSearchQuery(s);
                      loadVideos(s, 1);
                    }}
                    className="px-6 py-4 hover:bg-red-600 cursor-pointer text-white border-b border-gray-700 last:border-none"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-full font-bold text-sm transition flex items-center gap-2"
            >
              Categories ▼
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 bg-[#222] border border-gray-700 rounded-2xl shadow-2xl z-50 w-64 py-2">
                {/* Top 5 Keywords */}
                <div className="px-4 py-2 text-red-500 font-bold">Top Keywords</div>
                {topKeywords.map((kw, i) => (
                  <a key={i} href={`/?q=${encodeURIComponent(kw)}`} className="block px-6 py-3 hover:bg-red-600">
                    {kw}
                  </a>
                ))}
                
                <div className="border-t border-gray-700 my-2"></div>
                
                {/* Current Categories */}
                <a href="/" className="block px-6 py-3 hover:bg-red-600">Best Videos</a>
                <a href="/categories" className="block px-6 py-3 hover:bg-red-600">Categories</a>
                <a href="/?q=pornstar" className="block px-6 py-3 hover:bg-red-600">Pornstars</a>
                <a href="/?q=channels" className="block px-6 py-3 hover:bg-red-600">Channels</a>
                <a href="/?q=live" className="block px-6 py-3 hover:bg-red-600">Live Cams</a>
                <a href="/?q=games" className="block px-6 py-3 hover:bg-red-600">Games</a>
                <a href="/?q=dating" className="block px-6 py-3 hover:bg-red-600">Dating</a>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-red-600 mb-2">hubtube redyube hpornhub porne hub pornhoub xvideos3</h1>
        <h2 className="text-3xl font-bold text-red-600 mb-8">🌍 Trending XVIDEOS Worldwide</h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-700"></div>
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