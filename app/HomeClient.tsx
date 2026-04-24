'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

const PER_PAGE = 60;

const fetchWithFallback = async (query: string, pageNum: number = 1) => {
  const searchTerm = query.trim() || "Trending";
  try {
    const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=${PER_PAGE}&page=${pageNum}&order=most_viewed`, { cache: 'no-store' });
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

export default function HomeClient() {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [showMenu, setShowMenu] = useState(false);
  const [showVideoSub, setShowVideoSub] = useState(false);   // ← new state for sub panel
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const loadVideos = async (query: string = "", pageNum: number = 1) => {
    setLoading(true);
    const fetched = await fetchWithFallback(query, pageNum);
    setVideos(fetched);
    setPage(pageNum);
    setLoading(false);
  };

  useEffect(() => {
    const q = searchParams.get('q') || "";
    const p = Number(searchParams.get('page')) || 1;
    setSearchQuery(q);
    setPage(p);
    loadVideos(q, p);
  }, [searchParams]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    loadVideos(searchQuery, 1);
  };

  const handleSidebarClick = (term: string) => {
    setSearchQuery(term);
    loadVideos(term, 1);
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
      </header>

      {showMenu && (
        <div className="fixed top-0 left-0 h-full w-72 bg-[#1a1a1a] shadow-2xl z-[9999] pt-16 overflow-y-auto border-r border-gray-800">
      {/* Close Button */}
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
          {/* VIDEOS with sub-panel */}
       
          <button 
            onClick={() => setShowVideoSub(!showVideoSub)}
            className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left"
          >
            ▶ VIDEOS
          </button>

          {/* Sub panel appears ONLY when VIDEOS is clicked */}
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
    {/* 4K PORN - clickable */}
    <button onClick={() => handleSidebarClick("4k")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">4K PORN</button>

    {/* BEST VIDEOS - clickable */}
    <button onClick={() => handleSidebarClick("best videos")} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">BEST VIDEOS</button>
          <Link href="/categories" className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ CATEGORIES</Link>
          <Link href="/pornstars" className="px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700">▶ PORNSTARS</Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black text-[#FF9900] mb-8"></h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[...Array(15)].map((_, i) => <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse aspect-video" />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 text-yellow-500 text-xl">No results found.<br /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {videos.map(v => (
              <Link key={v.id} href={`/watch/${v.id}`} className="block">
                <VideoCard video={v} />
              </Link>
            ))}
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