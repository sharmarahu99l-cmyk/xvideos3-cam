'use client';

import { useEffect, useState } from 'react';
import VideoCard from '../VideoCard';

type Video = {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min: number;
  length_sec: number;
  embed: string;
  views?: string;
  keywords?: string;
};

export default function WatchPage({ params }: { params: { id: string } }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load main video
    fetch(`https://www.eporner.com/api/v2/video/id/${params.id}/`)
      .then(res => res.json())
      .then(data => {
        setVideo(data);
        
        // Load related videos
        const searchQuery = data.title ? data.title.split(' ').slice(0, 4).join(' ') : 'desi';
        fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchQuery)}&per_page=12&page=1`)
          .then(res => res.json())
          .then(relData => {
            const filtered = (relData.videos || []).filter((v: Video) => v.id !== params.id);
            setRelated(filtered.slice(0, 12));
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-red-600 text-2xl">
        Loading video...
      </div>
    );
  }

  if (!video) {
    return <div className="min-h-screen bg-[#0a0a0a] text-white p-10">Video not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="text-3xl font-black text-red-600">XVIDEOS3</a>
          <button 
            onClick={() => window.history.back()}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full font-bold ml-auto"
          >
            ← BACK TO HOME
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Video Player */}
          <div className="flex-1">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl">
              <iframe 
                src={video.embed} 
                className="w-full h-full" 
                allowFullScreen 
                allow="autoplay"
              />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
              {video.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-8">
              <span>HD • 60FPS</span>
              <span>{video.length_min} min</span>
              <span>{video.views || 'N/A'} views</span>
            </div>

            {/* SEO Description */}
            <div className="bg-[#111] p-6 rounded-xl border border-gray-800 mb-10">
              <h2 className="text-red-500 font-semibold mb-3">Video Description</h2>
              <p className="text-gray-300 leading-relaxed">
                Watch {video.title} in full HD. Hot desi bhabhi sex video with clear hindi audio. 
                Viral Indian MMS, aunty chudai, pakistani hardcore. Free desi porn tube.
                {video.keywords && ` Tags: ${video.keywords}`}
              </p>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="w-full lg:w-96">
            <h3 className="text-xl font-bold mb-5 text-red-500">More Like This</h3>
            <div className="space-y-4">
              {related.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#080808] py-10 text-center text-gray-500 text-sm">
        © 2026 XVideos3.cam • Free HD Desi & Indian Porn • 18+ Only
      </footer>
    </div>
  );
}