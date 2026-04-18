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

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const allKeywords = ["hubtube","redyube","hpornhub","porne hub","pornhoub","pornhubh","pornhunb","pornu hub","pornos","xhamers","xvnn","frreporn","youpoorn","youporb","youporen","yporn","sex videolar","sex vídeo","berazers","xhamster live","mature tube","pornohirsch","deutsche pornos","deutschepornos","redbtube","redtu be","redtubbe","redtubd","redtubu","xnxx om","pornofilme","lobstertube","gifporn","matureporn","hd pornos","melonstube","bangacams","vagosex","dino tube","dinotube","kostenlose pornofilme","pornzog","hamsterporn","aloha tube","alohatub","alohatube","blowj","tubegalore","4tube","pornoente","youporn c","transporn","kostenlose sexfilme","analporn","japanporno","lana rhoad","parisporn","pornohammer","liveporn","freesex","bestporn","pornoraum","tube8","pornh","voyeur house","comicsporn","freshporn","fuqcom","nudevista","tibe8","tikporn","porntn","omasex","grannyporn","sexfilme kostenlos","drporno","handjop","pornaq","pornhap","porn00","animexxx","hq porner","pornohimmel","feetporn","bestpornsites","porn300","sexbilder","cumshoot","deutsche pornofilme","facesiting","mein sex video","pornohup","scatporn","tubegals","woodmancasting","www youpor"];

  const getFuzzyQueries = (text: string): string[] => {
    const t = text.toLowerCase().trim();
    if (t.length < 2) return [t];
    const queries = [t];
    if (t.length > 3) queries.push(t.substring(0, t.length - 1));
    if (t.length > 4) queries.push(t.substring(0, t.length - 2));
    return queries;
  };

  const loadVideoAndRelated = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.eporner.com/api/v2/video/id/${id}/`);
      const data = await res.json();
      setVideo(data);
      const randomPage = Math.floor(Math.random() * 80) + 1;
      await loadRelated(data.title || "desi", randomPage);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const loadRelated = async (query: string, pageNum: number) => {
    try {
      const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=15&page=${pageNum}&order=most_viewed`);
      const data = await res.json();
      setRelated(data.videos || []);
    } catch (e) {}
  };

  const loadMoreRelated = async () => {
    setLoadingMore(true);
    const nextPage = Math.floor(Math.random() * 80) + 1;
    await loadRelated(video?.title || "desi", nextPage);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); return; }
    const fuzzy = getFuzzyQueries(searchQuery);
    const filtered = allKeywords.filter(s => fuzzy.some(f => s.includes(f)));
    setSuggestions(filtered);
  }, [searchQuery]);

  useEffect(() => { loadVideoAndRelated(); }, [id]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-2xl text-red-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] sticky top-0 z-50 p-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <a href="/" className="flex items-center gap-2">
            <span className="text-5xl font-black text-red-600">X</span>
            <span className="text-3xl font-black text-white">VIDEOS3</span>
          </a>
          <div className="flex-1 max-w-2xl relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search xvideos, desi, deutsche pornos..."
              className="w-full bg-[#222] border-2 border-gray-700 rounded-full px-8 py-5 text-xl focus:outline-none"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#222] border border-gray-700 rounded-2xl shadow-2xl z-50 max-h-80 overflow-auto">
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => { setSearchQuery(s); window.location.href = `/?q=${encodeURIComponent(s)}`; }} className="px-6 py-4 hover:bg-red-600 cursor-pointer">
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Your player + description + related videos here */}
        {video && (
          <>
            <div className="aspect-video bg-black rounded-3xl overflow-hidden mb-8">
              <iframe 
                src={`https://www.eporner.com/embed/${id}/`} 
                className="w-full h-full"
                allowFullScreen
              />
            </div>
            <div className="bg-[#111] p-8 rounded-2xl border border-gray-700 mb-10">
              <h2 className="text-red-500 font-bold text-2xl mb-4">Video Description</h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                Watch {video.title} full HD video on XVIDEOS3 - Free xvideos. 
              </p>
            </div>
          </>
        )}

        <div>
          <h3 className="text-2xl font-bold mb-6 text-red-500">Recommended Videos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {related.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
          <button onClick={loadMoreRelated} disabled={loadingMore} className="mt-10 mx-auto block bg-red-600 px-12 py-4 rounded-full font-bold">
            {loadingMore ? "Loading..." : "LOAD MORE SIMILAR VIDEOS"}
          </button>
        </div>
      </div>
    </div>
  );
}