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

export default function WatchPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ title?: string }> }) {
  const { id } = use(params);
  const { title: urlTitle } = use(searchParams);

  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [recPage, setRecPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);

    fetch(`https://www.eporner.com/api/v2/video/id/${id}/`)
      .then(res => res.json())
      .then(data => {
        setVideo(data);

        let query = urlTitle || data.title || "desi";
        query = query.replace(/full hd|hd|xxx|porn|sex video|video/gi, '').trim();

        setSearchQuery(query);
        loadRelated(query, 1);
      })
      .catch(() => setLoading(false));
  }, [id, urlTitle]);

  const loadRelated = async (query: string, page: number) => {
    setLoadingMore(true);
    try {
      const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=15&page=${page}`);
      const data = await res.json();
      const newVideos = (data.videos || []).filter((v: Video) => v.id !== id);

      if (page === 1) setRelated(newVideos);
      else setRelated(prev => [...prev, ...newVideos]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  };

  const loadMoreRelated = () => {
    const nextPage = recPage + 1;
    setRecPage(nextPage);
    loadRelated(searchQuery, nextPage);
  };

  if (loading || !video) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-2xl text-red-600">Loading video...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      
      {/* FIXED CLICKABLE HEADER */}
      <header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-3 text-sm border-b border-gray-700">
            <div className="flex items-center gap-6">
              <a href="/" className="text-red-500 hover:text-red-400 font-bold">Straight</a>
              <a href="#" className="hover:text-red-400">Gay</a>
              <a href="#" className="hover:text-red-400">Trans</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="bg-red-600 hover:bg-red-700 px-6 py-1.5 rounded-full text-sm font-bold">Join for FREE</a>
              <a href="#" className="border border-red-600 hover:bg-red-600/10 px-6 py-1.5 rounded-full text-sm font-bold">Premium</a>
            </div>
          </div>

          {/* Logo + Search */}
          <div className="flex items-center justify-between py-5">
            <a href="/" className="text-4xl font-black text-red-600 tracking-tighter">XVIDEOS3</a>
            
            <form className="flex-1 max-w-3xl mx-8" onSubmit={(e) => { e.preventDefault(); }}>
              <input 
                type="text" 
                placeholder="Search xvideos, desi bhabhi, indian mms, pakistani sex, ava adams..." 
                className="w-full bg-[#222] border-2 border-gray-700 hover:border-red-500 focus:border-red-600 rounded-full px-8 py-5 text-xl focus:outline-none placeholder-gray-400 transition"
              />
            </form>

            <a href="/categories" className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-full font-bold text-sm transition">
              Categories
            </a>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8 text-sm font-medium pb-4 border-t border-gray-700 pt-4">
            <a href="/" className="hover:text-red-500 transition">Best Videos</a>
            <a href="/categories" className="hover:text-red-500 transition">Categories</a>
            <a href="/?q=pornstar" className="hover:text-red-500 transition">Pornstars</a>
            <a href="/?q=channels" className="hover:text-red-500 transition">Channels</a>
            <a href="/?q=live" className="hover:text-red-500 transition">Live Cams</a>
            <a href="/?q=games" className="hover:text-red-500 transition">Games</a>
            <a href="/?q=dating" className="hover:text-red-500 transition">Dating</a>
          </nav>

          {/* Popular Pornstars */}
          <div className="py-3 flex items-center gap-4 text-sm overflow-x-auto border-t border-gray-700">
            <span className="font-bold text-red-500 whitespace-nowrap">Popular Pornstars:</span>
            <a href="/?q=sunny leone" className="hover:text-red-400 transition whitespace-nowrap">Sunny Leone</a>
            <a href="/?q=ava adams" className="hover:text-red-400 transition whitespace-nowrap">Ava Adams</a>
            <a href="/?q=bhabhi" className="hover:text-red-400 transition whitespace-nowrap">Desi Bhabhi</a>
            <a href="/?q=aunty" className="hover:text-red-400 transition whitespace-nowrap">Indian Aunty</a>
            <a href="/?q=mia khalifa" className="hover:text-red-400 transition whitespace-nowrap">Mia Khalifa</a>
          </div>
        </div>
      </header>

      {/* Rest of the page (player + description + comments + more from uploader + recommended) */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-10">
          <div>
            <h1 className="text-3xl font-bold mb-6">{video.title}</h1>

            <div className="flex items-center gap-3 mb-6 text-sm">
              <span className="font-medium text-gray-300">BlazeRager10k</span>
              <span className="text-blue-400 text-2xl leading-none">✓</span>
              <span className="text-gray-400">• Verified Uploader</span>
            </div>

            <div className="bg-black rounded-3xl overflow-hidden aspect-video mb-8 shadow-2xl border border-gray-700">
              <iframe 
                src={`https://www.eporner.com/embed/${id}/`}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              <button className="flex items-center gap-2 bg-[#222] hover:bg-gray-700 px-6 py-3 rounded-2xl text-sm font-medium transition">💾 Download</button>
              <button className="flex items-center gap-2 bg-[#222] hover:bg-gray-700 px-6 py-3 rounded-2xl text-sm font-medium transition">🔗 Share</button>
              <button className="flex items-center gap-2 bg-[#222] hover:bg-gray-700 px-6 py-3 rounded-2xl text-sm font-medium transition">⭐ Save</button>
              <button className="flex items-center gap-2 bg-[#222] hover:bg-gray-700 px-6 py-3 rounded-2xl text-sm font-medium transition">⚠️ Report</button>
            </div>

            <div className="bg-[#111] p-8 rounded-2xl border border-gray-700 mb-10">
              <h2 className="text-red-500 font-bold text-2xl mb-4">Video Description</h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                Watch {video.title} full HD video on XVIDEOS3. 
                Best free xvideos platform with high quality streaming. 
                Enjoy this hot xvideos with no ads. New xvideos added daily. 
                This is the best place to watch free xvideos online. 
                XVIDEOS3 brings you the hottest xvideos, desi xvideos, indian xvideos and more.
              </p>
            </div>

            <div className="bg-[#111] p-8 rounded-2xl border border-gray-700 mb-10">
              <h2 className="text-red-500 font-bold text-2xl mb-6">182 Comments</h2>
              <div className="flex gap-4 mb-8">
                <input type="text" placeholder="Write a comment..." className="flex-1 bg-[#222] border border-gray-600 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-red-500" />
                <button className="bg-red-600 hover:bg-red-700 px-8 rounded-2xl font-bold">Post</button>
              </div>
              <div className="space-y-8 text-sm">
                <div><div className="font-medium">HotDesiLover • 2h ago</div><p className="text-gray-300 mt-1">Damn this bhabhi is fire 🔥 best xvideos I seen today</p></div>
                <div><div className="font-medium">PakiMMSKing • 5h ago</div><p className="text-gray-300 mt-1">Anyone got the full uncut version? This is too good</p></div>
              </div>
            </div>

            <div className="bg-[#111] p-8 rounded-2xl border border-gray-700">
              <h2 className="text-red-500 font-bold text-2xl mb-6">More from BlazeRager10k</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {related.slice(0, 5).map((v) => <VideoCard key={v.id} video={v} />)}
              </div>
            </div>
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
      </div>

      <footer className="bg-[#080808] py-12 text-center text-gray-500 text-sm border-t border-gray-800">
        © 2026 XVideos3.cam • Free XVIDEOS • XVIDEOS.com • XVIDEOS3.com • 18+ Only
      </footer>
    </div>
  );
}