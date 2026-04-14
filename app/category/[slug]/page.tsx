'use client';

import { useEffect, useState, use } from 'react';
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

const categoryTitles: { [key: string]: string } = {
  desi: "Hot Desi Videos",
  bhabhi: "Desi Bhabhi Chudai",
  aunty: "Aunty Ki Chudai",
  pakistani: "Pakistani MMS & Sex",
  indian: "Indian Porn",
  hindi: "Hindi Audio Sex Videos",
  "viral-mms": "Viral MMS Leaks",
  "devar-bhabhi": "Devar Bhabhi Sex",
  college: "College Girl Sex",
  "4k": "4K HD Desi Videos",
  saree: "Saree Sex Videos",
  hijab: "Muslim Hijab Sex",
};

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const displayTitle = categoryTitles[slug] || slug.charAt(0).toUpperCase() + slug.slice(1) + " Videos";

  useEffect(() => {
    setLoading(true);

    let searchTerm = slug;
    if (slug === "hindi") searchTerm = "hindi audio";
    if (slug === "viral-mms") searchTerm = "viral mms";
    if (slug === "devar-bhabhi") searchTerm = "devar bhabhi";
    if (slug === "college") searchTerm = "college girl";

    fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=24&page=1`)
      .then(res => res.json())
      .then(data => {
        setVideos(data.videos || []);
        setLoading(false);
      })
      .catch(() => {
        setVideos([]);
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="text-3xl font-black text-red-600">XVIDEOS3</a>
          <a href="/" className="ml-auto text-sm text-gray-400 hover:text-white">← Back to Home</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-red-600 mb-3">{displayTitle}</h1>
        <p className="text-gray-400 mb-10">Free HD {displayTitle.toLowerCase()}</p>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-red-600 text-2xl animate-pulse">Loading {displayTitle}...</div>
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400 text-xl">
            No videos found for this category.<br />
            Try another category from the menu.
          </div>
        )}
      </div>

      <footer className="bg-[#080808] py-12 text-center text-gray-500 text-sm border-t border-gray-800">
        © 2026 XVideos3.cam • Free HD Desi & Indian Porn • 18+ Only
      </footer>
    </div>
  );
}