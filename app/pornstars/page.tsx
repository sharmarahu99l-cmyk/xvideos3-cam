'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_PORNSTARS, toPornstarSlug } from '../lib/seoData';

async function fetchDirectStarThumb(star: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        star
      )}&per_page=3&page=1&order=most-popular&thumbsize=big&format=json`
    );
    if (!res.ok) return '';
    const data = await res.json();
    const videos = Array.isArray(data.videos) ? data.videos : [];
    for (const v of videos) {
      const src = v?.default_thumb?.src?.trim() || '';
      if (src.startsWith('http')) return src;
    }
  } catch {}
  return '';
}

export default function PornstarsPage() {
  const [filter, setFilter] = useState('');
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = 'Top Pornstars & Trending Models | HubTube - XVideos3';
    let active = true;

    const loadAllThumbs = async () => {
      const chunkSize = 15;
      for (let i = 0; i < ALL_PORNSTARS.length; i += chunkSize) {
        if (!active) return;
        const batch = ALL_PORNSTARS.slice(i, i + chunkSize);
        let batchMap: Record<string, string> = {};

        try {
          const res = await fetch(`/api/thumbs?items=${encodeURIComponent(batch.join(','))}`);
          if (res.ok) {
            batchMap = await res.json();
          }
        } catch {}

        // Browser direct fallback for any pornstar still missing a picture
        const missing = batch.filter((s) => !batchMap[s]);
        if (missing.length > 0 && active) {
          const directResults = await Promise.all(
            missing.map(async (s) => [s, await fetchDirectStarThumb(s)] as const)
          );
          for (const [s, url] of directResults) {
            if (url) batchMap[s] = url;
          }
        }

        if (active && Object.keys(batchMap).length > 0) {
          setThumbs((prev) => ({ ...prev, ...batchMap }));
        }
      }
    };

    loadAllThumbs();
    return () => {
      active = false;
    };
  }, []);

  const filteredStars = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return ALL_PORNSTARS;
    return ALL_PORNSTARS.filter((s) => s.toLowerCase().includes(q));
  }, [filter]);

  const fallbackPool = useMemo(() => Object.values(thumbs).filter(Boolean), [thumbs]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] px-4 py-3 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tighter shrink-0">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </Link>

          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Search ${ALL_PORNSTARS.length} pornstars...`}
            className="flex-1 max-w-md bg-[#222] border border-[#FF9900] rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 outline-none"
          />

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/reels"
              className="bg-[#FF9900] text-black font-black text-xs px-3.5 py-2 rounded-full"
            >
              ▶ REELS
            </Link>
            <Link
              href="/"
              className="text-xs sm:text-sm font-bold bg-[#222] hover:bg-[#FF9900] hover:text-black px-3.5 py-2 rounded-full transition"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-[#FF9900]">
            Top Pornstars &amp; Models ({filteredStars.length})
          </h1>
          <Link href="/categories" className="text-sm font-bold text-[#FF9900] hover:underline">
            Browse All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredStars.map((star, idx) => {
            const slug = toPornstarSlug(star);
            const imgSrc =
              thumbs[star] ||
              (fallbackPool.length > 0 ? fallbackPool[idx % fallbackPool.length] : '');

            return (
              <Link
                key={star}
                href={`/pornstar/${slug}`}
                className="group relative aspect-[4/3] bg-[#181818] rounded-2xl overflow-hidden border border-gray-800 hover:border-[#FF9900] transition shadow-lg flex items-end"
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={`${star} porn videos`}
                    loading="lazy"
                    onError={(e) => {
                      const backup = fallbackPool[(idx + 3) % fallbackPool.length];
                      if (backup && e.currentTarget.src !== backup) {
                        e.currentTarget.src = backup;
                      }
                    }}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2a1020] via-[#181818] to-[#0f0f0f]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

                <div className="relative z-10 p-3.5 w-full">
                  <span className="inline-block bg-pink-500/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded mb-1">
                    MODEL
                  </span>
                  <h2 className="text-white group-hover:text-[#FF9900] font-black text-sm sm:text-base leading-tight line-clamp-1 capitalize transition">
                    {star}
                  </h2>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}