'use client';

import { useEffect, useState, use } from 'react';

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

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`https://www.eporner.com/api/v2/video/id/${id}/`)
      .then(res => res.json())
      .then(data => {
        setVideo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading || !video) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-2xl text-red-600">Loading premium xvideos content...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Floating Back Button */}
      <button 
        onClick={() => window.history.back()}
        className="fixed top-6 right-6 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold shadow-2xl z-50"
      >
        ← Back to XVIDEOS3
      </button>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{video.title}</h1>

        {/* Premium Video Player */}
        <div className="bg-black rounded-3xl overflow-hidden aspect-video mb-10 border border-gray-700 shadow-2xl">
          <div className="text-center px-10 py-16">
            <div className="text-7xl mb-8">▶️</div>
            <a 
              href={`https://www.eporner.com/embed/${id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-red-600 hover:bg-red-700 text-white text-2xl font-bold px-16 py-8 rounded-3xl transition"
            >
              ▶ PLAY FULL XVIDEOS
            </a>
            <p className="text-gray-400 mt-8">Free XVIDEOS • HD Quality • No Ads</p>
          </div>
        </div>

        {/* Rich SEO Description */}
        <div className="bg-[#111] p-8 rounded-2xl border border-gray-700">
          <h2 className="text-red-500 font-bold text-2xl mb-4">Video Description</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Watch {video.title} full video on XVIDEOS3. This is the best free xvideos platform for desi, indian and premium content. 
            Enjoy high quality xvideos streaming with hindi audio, viral mms and hardcore scenes. 
            XVIDEOS3 brings you the latest free xvideos every day. No registration needed - just pure xvideos entertainment. 
            Bookmark this xvideos page for daily updates.
          </p>
        </div>
      </div>

      <footer className="bg-[#080808] py-12 text-center text-gray-500 text-sm border-t border-gray-800">
        © 2026 XVideos3.cam • Free XVIDEOS • XVIDEOS.com • XVIDEOS3.com • 18+ Only
      </footer>
    </div>
  );
}