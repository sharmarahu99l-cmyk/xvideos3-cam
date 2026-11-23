'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_PORNSTARS, toPornstarSlug } from '../lib/seoData';

const FIXED_STAR_THUMBS_KEY = 'hubtube_fixed_star_thumbs_v1';

export default function PornstarsClient({
  initialThumbs,
}: {
  initialThumbs: Record<string, string>;
}) {
  const [filter, setFilter] = useState('');
  const [thumbs, setThumbs] = useState<Record<string, string>>(initialThumbs);

  // Lock fixed thumbnails in localStorage so repeat visits render instantaneously without shifts
  useEffect(() => {
    try {
      const cachedRaw = localStorage.getItem(FIXED_STAR_THUMBS_KEY);
      const cached: Record<string, string> = cachedRaw ? JSON.parse(cachedRaw) : {};
      const merged = { ...cached, ...initialThumbs };

      // Enforce strict uniqueness across all stored pornstar portraits
      const used = new Set<string>();
      const cleanUnique: Record<string, string> = {};
      for (const star of ALL_PORNSTARS) {
        const url = merged[star];
        if (url && !used.has(url)) {
          used.add(url);
          cleanUnique[star] = url;
        }
      }

      setThumbs(cleanUnique);
      localStorage.setItem(FIXED_STAR_THUMBS_KEY, JSON.stringify(cleanUnique));
    } catch {}
  }, [initialThumbs]);

  const filteredStars = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return ALL_PORNSTARS;
    return ALL_PORNSTARS.filter((s) => s.toLowerCase().includes(q));
  }, [filter]);

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
            const imgSrc = thumbs[star] || '';

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
                    loading={idx < 25 ? 'eager' : 'lazy'}
                    decoding="async"
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