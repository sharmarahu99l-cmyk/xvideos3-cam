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

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadCategoryVideos = async (pageNum: number = 1, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(
        `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(slug)}&per_page=12&page=${pageNum}&order=most_viewed`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (append) {
        setVideos(prev => [...prev, ...(data.videos || [])]);
      } else {
        setVideos(data.videos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadCategoryVideos(1);
  }, [slug]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCategoryVideos(nextPage, true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Same header as other pages */}
      <header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-[52px] font-black text-red-600 leading-none">X</span>
            <span className="text-3xl font-black text-white tracking-[-2px]">VIDEOS3</span>
          </a>
          <a href="/" className="text-2xl font-bold text-red-500">← Back to Home</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-red-500 mb-2 capitalize">
          {slug.replace('-', ' ')} Videos
        </h1>
        <p className="text-gray-400 mb-8">Showing best {slug} videos on XVIDEOS3</p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-700"></div>
              </div>
            ))}
          </div>
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