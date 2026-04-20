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

const categories = ["Hentai", "MILF", "Pinay", "Lesbian", "Anal", "Big Ass", "Latina", "Anime", "Asian", "Femboy"];

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetch(`https://www.eporner.com/api/v2/video/id/${id}/`)
      .then(res => res.json())
      .then(data => {
        setVideo(data);
        loadRelated(data.title || "porn");
        setLoading(false);
      });
  }, [id]);

  const loadRelated = async (query: string) => {
    try {
      const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=20&page=1&order=most_viewed`);
      const data = await res.json();
      setRelated(data.videos || []);
    } catch (e) {}
  };

  const handleCategoryClick = (cat: string) => {
    router.push(`/?q=${encodeURIComponent(cat)}`);
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] sticky top-0 z-50 p-4 flex items-center border-b border-gray-700">
        <a href="/" className="flex items-center gap-1">
          <span className="text-5xl font-black text-[#FF9900]">H</span>
          <span className="text-5xl font-black text-white">UB</span>
          <span className="text-5xl font-black text-[#FF9900]">T</span>
          <span className="text-5xl font-black text-white">UBE</span>
        </a>
        <div className="flex-1 max-w-2xl mx-8 relative">
          <input placeholder="Search hubtube..." className="w-full bg-[#222] border-2 border-[#FF9900] rounded-full px-8 py-5 text-xl focus:outline-none text-white" />
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-4xl text-[#FF9900] px-4">☰</button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-xl py-2 z-50 max-h-96 overflow-auto">
              {categories.map(cat => (
                <button key={cat} onClick={() => handleCategoryClick(cat)} className="w-full text-left px-6 py-3 hover:bg-[#FF9900] hover:text-black transition text-lg">
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {video && (
          <div className="relative">
            <iframe
              src={`https://www.eporner.com/embed/${id}/`}
              className="w-full aspect-video bg-black rounded-2xl"
              allowFullScreen
            />
            {/* Hubtube logo exactly at red circle */}
            <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded-lg flex items-center gap-1 text-xl font-black z-10">
              <span className="text-[#FF9900]">H</span>
              <span className="text-white">UB</span>
              <span className="text-[#FF9900]">T</span>
              <span className="text-white">UBE</span>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-red-500 text-2xl font-bold mb-4">Similar Videos</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {related.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        </div>
      </div>
    </div>
  );
}