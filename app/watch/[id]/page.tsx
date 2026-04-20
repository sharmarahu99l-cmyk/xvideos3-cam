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

const fetchWithFallback = async (query: string) => {
  try {
    const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=15&page=${Math.floor(Math.random()*80)+1}&order=most_viewed`, { cache: 'no-store' });
    const data = await res.json();
    if (data.videos && data.videos.length >= 5) return data.videos;
  } catch (e) {}

  try {
    const res = await fetch(`https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(query)}&page=${Math.floor(Math.random()*200)+1}`);
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

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [video, setVideo] = useState<any>(null);
  const [similarVideos, setSimilarVideos] = useState<any[]>([]);
  const [moreVideos, setMoreVideos] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadVideo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.eporner.com/api/v2/video/id/${id}/`);
      const data = await res.json();
      setVideo(data);

      const similarData = await fetchWithFallback(data.title || "porn");
      setSimilarVideos(similarData.slice(0, 20));
    } catch (e) {}
    finally { setLoading(false); }
  };

  const loadMoreVideos = async () => {
    setLoadingMore(true);
    const newVideos = await fetchWithFallback("porn");
    setMoreVideos(prev => [...prev, ...newVideos.slice(0, 15)]);
    setLoadingMore(false);
  };

  useEffect(() => { loadVideo(); }, [id]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const description = video ? `Watch ${video.title} full HD on Hubtube. Free German porn video streaming with hubtube quality.` : "Free HD porn videos on Hubtube.";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="bg-[#111] sticky top-0 z-50 p-4 flex items-center border-b border-gray-700">
        <a href="/" className="flex items-center gap-1">
          <span className="text-5xl font-black text-[#FF9900]">H</span>
          <span className="text-5xl font-black text-white">UB</span>
          <span className="text-5xl font-black text-[#FF9900]">T</span>
          <span className="text-5xl font-black text-white">UBE</span>
        </a>
        <div className="flex-1 max-w-2xl mx-6 relative">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search hubtube... (try gangbend)"
            className="w-full bg-[#222] border-2 border-[#FF9900] rounded-full px-8 py-5 text-xl focus:outline-none"
          />
        </div>
      </header>

      {video && (
        <div className="max-w-7xl mx-auto p-6">
          <iframe src={`https://www.eporner.com/embed/${id}/`} className="w-full aspect-video rounded-3xl" allowFullScreen />

          <div className="mt-8 bg-[#111] p-8 rounded-2xl">
            <p className="text-lg leading-relaxed">{description}</p>
          </div>

          <div className="mt-12">
            <h3 className="text-2xl font-bold text-[#FF9900] mb-6">Similar Videos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {similarVideos.map(v => <VideoCard key={v.id} video={v} />)}
            </div>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {moreVideos.map(v => <VideoCard key={v.id} video={v} />)}
            </div>
            <div className="text-center mt-10">
              <button onClick={loadMoreVideos} disabled={loadingMore} className="bg-[#FF9900] hover:bg-orange-600 text-black px-12 py-4 rounded-full font-bold text-lg transition">
                {loadingMore ? "Loading..." : "MORE VIDEOS"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => window.history.back()} className="fixed bottom-8 right-8 bg-[#FF9900] hover:bg-orange-600 text-black text-4xl w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center z-[9999]">←</button>
    </div>
  );
}