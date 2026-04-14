'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import VideoCard from '../../VideoCard';

type Video = {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min: number;
  length_sec: number;
  embed: string;
  views?: string;
};

export default function WatchPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ title?: string }> }) {
  const { id } = use(params);
  const { title: urlTitle } = use(searchParams);
  const router = useRouter();

  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");   // ← NEW: search bar input

  const loadVideoAndRelated = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.eporner.com/api/v2/video/id/${id}/`);
      const data = await res.json();
      setVideo(data);

      let query = (urlTitle || data.title || "").toLowerCase().trim();
      query = query.replace(/full hd|hd|xxx|porn|sex video|video/gi, '').trim() || "trending";
      setSearchQuery(query);

      // Fresh shuffle every time
      const randomPage = Math.floor(Math.random() * 80) + 1;
      await loadRelated(query, randomPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadRelated = async (query: string, page: number) => {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=50&page=${page}`
      );
      const data = await res.json();
      const freshVideos = data.videos || [];

      if (freshVideos.length < 10) {
        const fallbackRes = await fetch(
          `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=50&page=1`
        );
        const fallbackData = await fallbackRes.json();
        setRelated(fallbackData.videos.slice(0, 15));
      } else {
        setRelated(freshVideos.slice(0, 15));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreRelated = () => {
    const nextPage = Math.floor(Math.random() * 80) + 1;
    setLoadingMore(true);
    fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchQuery)}&per_page=30&page=${nextPage}`)
      .then(res => res.json())
      .then(data => {
        const fresh = data.videos || [];
        setRelated(prev => [...prev, ...fresh.slice(0, 15)]);
      })
      .finally(() => setLoadingMore(false));
  };

  // Search bar submit handler - works from watch page
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  useEffect(() => {
    loadVideoAndRelated();
  }, [id]);

  if (loading || !video) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-2xl text-red-600">Loading video...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Floating Back Button */}
      <button 
        onClick={() => router.back()}
        className="fixed bottom-8 right-8 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold shadow-2xl z-[100] flex items-center gap-2"
      >
        ← Back
      </button>

      {/* Sticky Header with WORKING SEARCH BAR */}
{/* Clean Single Header - Fixed Mobile */}
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

  {/* Single Navigation Bar */}
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
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{video.title}</h1>

        <div className="bg-black rounded-3xl overflow-hidden aspect-video mb-8 shadow-2xl border border-gray-700">
          <iframe 
            src={`https://www.eporner.com/embed/${id}/`}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          />
        </div>

        <div className="bg-[#111] p-8 rounded-2xl border border-gray-700 mb-10">
          <h2 className="text-red-500 font-bold text-2xl mb-4">Video Description</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Watch {video.title} full HD video on XVIDEOS3 - Free xvideos. 
            Best free xvideos platform with high quality streaming.
          </p>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-6 text-red-500">Recommended Videos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {related.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>

          <div className="text-center mt-10">
            <button 
              onClick={loadMoreRelated}
              disabled={loadingMore}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-12 py-4 rounded-full font-bold text-lg transition"
            >
              {loadingMore ? "Loading..." : "LOAD MORE SIMILAR VIDEOS"}
            </button>
          </div>
        </div>
      </div>

      <footer className="bg-[#080808] py-12 text-center text-gray-500 text-sm border-t border-gray-800">
        © 2026 XVideos3.cam • Free XVIDEOS • XVIDEOS.com • XVIDEOS3.com • 18+ Only
      </footer>
    </div>
  );
}