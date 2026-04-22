'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [moreVideos, setMoreVideos] = useState<Video[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showVideoSub, setShowVideoSub] = useState(false);
  const [page, setPage] = useState(2);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetch(`https://www.eporner.com/api/v2/video/id/${id}/`)
      .then(res => res.json())
      .then(data => {
        setVideo(data);
        loadRandomRelated();
      });
  }, [id]);

  const loadRandomRelated = async () => {
    const randomPage = Math.floor(Math.random() * 80) + 1;
    const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=porn&per_page=60&page=${randomPage}&order=most_viewed`);
    const data = await res.json();
    setRelated(data.videos || []);
  };

  const loadMoreRelated = async () => {
    setLoadingMore(true);
    const randomPage = Math.floor(Math.random() * 80) + page;
    const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=porn&per_page=60&page=${randomPage}&order=most_viewed`);
    const data = await res.json();
    setMoreVideos(prev => [...prev, ...(data.videos || [])]);
    setPage(p => p + 1);
    setLoadingMore(false);
  };

  const handleSidebarClick = (term: string) => {
    router.push(`/?q=${encodeURIComponent(term)}`);
    setShowMenu(false);
    setShowVideoSub(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) router.push(`/?q=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      {/* HEADER */}
      <header className="bg-[#111] px-4 py-3 flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => setShowMenu(!showMenu)} className="text-4xl text-[#FF9900]">☰</button>
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search hubtube..."
              className="w-full bg-[#222] text-white px-5 py-3 rounded-full outline-none"
            />
          </form>
        </div>
        <Link href="/" className="text-3xl font-black tracking-tighter">
          <span className="text-[#FF9900]">H</span><span className="text-white">UB</span><span className="text-[#FF9900]">T</span><span className="text-white">UBE</span>
        </Link>
      </header>

      {/* SIDEBAR - same as HomeClient */}
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
          <button onClick={() => setShowVideoSub(!showVideoSub)} className="w-full px-6 py-4 text-yellow-400 text-lg font-medium flex items-center gap-3 border-b border-gray-700 text-left">▶ VIDEOS</button>
          
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

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {video && (
          <div className="relative">
            <iframe src={`https://www.eporner.com/embed/${id}/`} className="w-full aspect-video bg-black rounded-2xl" allowFullScreen />
            <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded-lg flex items-center gap-1 text-xl font-black z-10">
              <span className="text-[#FF9900]">H</span><span className="text-white">UB</span><span className="text-[#FF9900]">T</span><span className="text-white">UBE</span>
            </div>    {/* 4K PORN - clickable */}

          </div>
        )}

        {video && (
          <div className="mt-6 bg-[#111] p-6 rounded-2xl">
            <h2 className="text-[#FF9900] text-xl font-bold mb-3">Video Description</h2>
            <p className="text-gray-300 leading-relaxed">
              Watch {video.title} full HD video on Hubtube.<br />
              Free HD porn video streaming with hubtube quality.
            </p>
          </div>
        )}

        <button onClick={() => router.back()} className="fixed bottom-8 right-8 bg-[#FF9900] text-black w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl z-50">←</button>

        <div className="mt-8">
          <h2 className="text-[#FF9900] text-2xl font-bold mb-4">Similar Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {related.map(v => <Link key={v.id} href={`/watch/${v.id}`} className="block"><VideoCard video={v} /></Link>)}
          </div>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {moreVideos.map(v => <Link key={v.id} href={`/watch/${v.id}`} className="block"><VideoCard video={v} /></Link>)}
          </div>
          <div className="text-center mt-10">
            <button onClick={loadMoreRelated} disabled={loadingMore} className="bg-[#FF9900] hover:bg-orange-600 text-black px-12 py-4 rounded-full font-bold text-lg transition">
              {loadingMore ? "Loading..." : "MORE VIDEOS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}