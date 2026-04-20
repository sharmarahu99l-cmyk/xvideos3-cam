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
  const [moreVideos, setMoreVideos] = useState<Video[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [page, setPage] = useState(2);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);

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
    const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=porn&per_page=20&page=${randomPage}&order=most_viewed`);
    const data = await res.json();
    setRelated(data.videos || []);
  };

  const loadMoreRelated = async () => {
    setLoadingMore(true);
    const randomPage = Math.floor(Math.random() * 80) + page;
    const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=porn&per_page=15&page=${randomPage}&order=most_viewed`);
    const data = await res.json();
    setMoreVideos(prev => [...prev, ...(data.videos || [])]);
    setPage(p => p + 1);
    setLoadingMore(false);
  };

  const handleCategoryClick = (cat: string) => {
    router.push(`/?q=${encodeURIComponent(cat)}`);
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      {/* Persistent header with ☰ on ALL pages */}
      <header className="bg-[#111] sticky top-0 z-50 p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-1">
            <span className="text-4xl font-black text-[#FF9900]">H</span>
            <span className="text-4xl font-black text-white">UB</span>
            <span className="text-4xl font-black text-[#FF9900]">T</span>
            <span className="text-4xl font-black text-white">UBE</span>
          </a>
          <div className="flex-1 mx-3 max-w-xs">
            <input placeholder="Search hubtube..." className="w-full bg-[#222] border-2 border-[#FF9900] rounded-full px-5 py-3 text-base focus:outline-none text-white" />
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {video && (
          <div className="relative">
            <iframe 
              src={`https://www.eporner.com/embed/${id}/`} 
              className="w-full aspect-video bg-black rounded-2xl" 
              allowFullScreen 
            />
            {/* Hubtube logo inside player (bottom right) */}
            <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded-lg flex items-center gap-1 text-lg font-black z-10">
              <span className="text-[#FF9900]">H</span>
              <span className="text-white">UB</span>
              <span className="text-[#FF9900]">T</span>
              <span className="text-white">UBE</span>
            </div>
          </div>
        )}

        {/* Real video description with title */}
        {video && (
          <div className="mt-6 bg-[#111] p-6 rounded-2xl">
            <h2 className="text-[#FF9900] text-xl font-bold mb-3">Video Description</h2>
            <p className="text-gray-300 leading-relaxed">
              Watch {video.title} full HD video on Hubtube.<br />
              Free HD porn video streaming with hubtube quality.
            </p>
          </div>
        )}

        {/* Floating back button */}
        <button 
          onClick={() => router.back()} 
          className="fixed bottom-8 right-8 bg-[#FF9900] text-black w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl z-50"
        >
          ←
        </button>

        {/* Similar Videos - vertical single line */}
        <div className="mt-8">
          <h2 className="text-[#FF9900] text-2xl font-bold mb-4">Similar Videos</h2>
          <div className="space-y-8">
            {related.map(v => (
              <div key={v.id} className="cursor-pointer" onClick={() => setPreviewVideo(v)}>
                <VideoCard video={v} />
              </div>
            ))}
          </div>
        </div>

        {/* Inline preview player on soft tap */}
        {previewVideo && (
          <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4" onClick={() => setPreviewVideo(null)}>
            <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <iframe src={previewVideo.embed} className="w-full aspect-video" allowFullScreen allow="autoplay" />
            </div>
          </div>
        )}

        {/* MORE VIDEOS section */}
        <div className="mt-12">
          <div className="space-y-8">
            {moreVideos.map(v => (
              <div key={v.id} className="cursor-pointer" onClick={() => setPreviewVideo(v)}>
                <VideoCard video={v} />
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button 
              onClick={loadMoreRelated} 
              disabled={loadingMore} 
              className="bg-[#FF9900] hover:bg-orange-600 text-black px-12 py-4 rounded-full font-bold text-lg transition"
            >
              {loadingMore ? "Loading..." : "MORE VIDEOS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}