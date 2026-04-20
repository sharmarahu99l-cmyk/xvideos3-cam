'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

const fetchWithFallback = async (query: string, pageNum: number = 1) => {
  const searchTerm = query.trim() || "porn";
  try {
    const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=15&page=${pageNum}&order=most_viewed`, { cache: 'no-store' });
    const data = await res.json();
    if (data.videos?.length >= 5) return data.videos;
  } catch (e) {}
  try {
    const res = await fetch(`https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(searchTerm)}&page=${pageNum}`);
    const data = await res.json();
    return (data.videos || []).map((v: any) => ({
      id: v.video_id,
      title: v.title,
      default_thumb: { src: v.thumb || '' },
      length_min: parseInt(v.duration?.split(':')[0] || '0'),
      length_sec: parseInt(v.duration?.split(':')[1] || '0'),
      embed: `https://embed.redtube.com/?id=${v.video_id}`,
      views: v.views || '0'
    }));
  } catch (e) {
    return [];
  }
};

const categories = ["Hentai", "MILF", "Pinay", "Lesbian", "Anal", "Big Ass", "Latina", "Anime", "Asian", "Femboy"];

export default function HomeClient() {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [showMenu, setShowMenu] = useState(false);
  const [page, setPage] = useState(1);

  const loadVideos = async (query: string = "", pageNum: number = 1) => {
    setLoading(true);
    const fetched = await fetchWithFallback(query, pageNum);
    setVideos(fetched);
    setPage(pageNum);
    setLoading(false);
  };

  useEffect(() => {
    const q = searchParams.get('q') || "";
    setSearchQuery(q);
    loadVideos(q, 1);
  }, [searchParams]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    loadVideos(searchQuery, 1);
  };

  const handleCategoryClick = (cat: string) => {
    setSearchQuery(cat);
    loadVideos(cat, 1);
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] sticky top-0 z-50 p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-1">
            <span className="text-4xl font-black text-[#FF9900]">H</span>
            <span className="text-4xl font-black text-white">UB</span>
            <span className="text-4xl font-black text-[#FF9900]">T</span>
            <span className="text-4xl font-black text-white">UBE</span>
          </a>
          <div className="flex-1 mx-3 max-w-xs">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search hubtube..."
              className="w-full bg-[#222] border-2 border-[#FF9900] rounded-full px-5 py-3 text-base focus:outline-none text-white"
            />
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="text-4xl text-[#FF9900] px-2">☰</button>
        </div>
        {showMenu && (
          <div className="mt-3 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-xl py-2 max-h-96 overflow-auto">
            {categories.map(cat => (
              <button key={cat} onClick={() => handleCategoryClick(cat)} className="w-full text-left px-6 py-3 hover:bg-[#FF9900] hover:text-black transition text-lg">
                {cat}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black text-[#FF9900] mb-8">Hubtube - Trending Worldwide</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {[...Array(15)].map((_, i) => <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse aspect-video" />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 text-red-500 text-xl">No results found.<br />Try something else</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {videos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        )}

        {videos.length > 0 && (
          <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
            <button onClick={() => loadVideos(searchQuery, Math.max(1, page - 1))} className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] rounded-full font-bold">Prev</button>
            {Array.from({ length: 10 }, (_, i) => {
              const p = page <= 5 ? i + 1 : page - 5 + i;
              if (p > 500) return null;
              return (
                <button key={p} onClick={() => loadVideos(searchQuery, p)} className={`px-5 py-3 rounded-full font-bold ${page === p ? 'bg-[#FF9900] text-black' : 'bg-[#222] hover:bg-[#FF9900]'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => loadVideos(searchQuery, page + 1)} className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] rounded-full font-bold">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}