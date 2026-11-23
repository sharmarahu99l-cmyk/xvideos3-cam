'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_CATEGORIES, toCategorySlug } from '../lib/seoData';

function cleanCategoryQuery(cat: string): string {
  return (
    cat
      .toLowerCase()
      .replace(/\b(videos|porn|ultra hd)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim() || cat.toLowerCase()
  );
}

async function fetchDirectCategoryThumb(cat: string): Promise<string> {
  const q = cleanCategoryQuery(cat);
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        q
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

export default function CategoriesPage() {
  const [filter, setFilter] = useState('');
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = 'All Porn Categories & Desi Video Tags | HubTube - XVideos3';
    let active = true;

    const loadAllThumbs = async () => {
      const chunkSize = 15;
      for (let i = 0; i < ALL_CATEGORIES.length; i += chunkSize) {
        if (!active) return;
        const batch = ALL_CATEGORIES.slice(i, i + chunkSize);
        let batchMap: Record<string, string> = {};

        try {
          const res = await fetch(`/api/thumbs?items=${encodeURIComponent(batch.join(','))}`);
          if (res.ok) {
            batchMap = await res.json();
          }
        } catch {}

        // Browser direct fallback for any category still missing a picture
        const missing = batch.filter((c) => !batchMap[c]);
        if (missing.length > 0 && active) {
          const directResults = await Promise.all(
            missing.map(async (c) => [c, await fetchDirectCategoryThumb(c)] as const)
          );
          for (const [c, url] of directResults) {
            if (url) batchMap[c] = url;
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

  const filteredCategories = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return ALL_CATEGORIES;
    return ALL_CATEGORIES.filter((c) => c.toLowerCase().includes(q));
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
            placeholder={`Filter ${ALL_CATEGORIES.length} categories...`}
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
            All Categories ({filteredCategories.length})
          </h1>
          <Link href="/pornstars" className="text-sm font-bold text-[#FF9900] hover:underline">
            Browse All Pornstars →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredCategories.map((cat, idx) => {
            const slug = toCategorySlug(cat);
            const imgSrc =
              thumbs[cat] ||
              (fallbackPool.length > 0 ? fallbackPool[idx % fallbackPool.length] : '');

            return (
              <Link
                key={cat}
                href={`/category/${slug}`}
                className="group relative aspect-video bg-[#181818] rounded-2xl overflow-hidden border border-gray-800 hover:border-[#FF9900] transition shadow-lg flex items-end"
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={`${cat} videos`}
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
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2a1d0a] via-[#181818] to-[#0f0f0f]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />

                <div className="relative z-10 p-3 w-full">
                  <span className="inline-block bg-[#FF9900] text-black text-[9px] font-black px-1.5 py-0.5 rounded mb-1">
                    HD
                  </span>
                  <h2 className="text-white group-hover:text-[#FF9900] font-black text-sm leading-tight line-clamp-1 transition">
                    {cat}
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