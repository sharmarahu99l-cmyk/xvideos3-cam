'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Category {
  name: string;
  count: string;
  query?: string;
}

const categoriesList: Category[] = [
  { name: "Japanese", count: "20,000+" },
  { name: "Anal", count: "20,000+" },
  { name: "HD Porn 1080p", count: "20,000+", query: "1080p" },
  { name: "Teen", count: "20,000+" },
  { name: "VR Porn", count: "14,492", query: "vr" },
  { name: "Asian", count: "20,000+" },
  { name: "Big Tits", count: "20,000+" },
  { name: "Shemale", count: "10,875" },
  { name: "MILF", count: "20,000+" },
  { name: "Gay", count: "10,000+" },
  { name: "Ebony", count: "20,000+" },
  { name: "Homemade", count: "20,000+" },
  { name: "Indian", count: "20,000+" },
  { name: "Interracial", count: "20,000+" },
  { name: "Amateur", count: "20,000+" },
  { name: "Lesbian", count: "20,000+" },
  { name: "60 FPS", count: "20,000+", query: "60fps" },
  { name: "Big Ass", count: "20,000+" },
  { name: "POV", count: "20,000+" },
  { name: "Mature", count: "20,000+" },
  { name: "Creampie", count: "20,000+" },
  { name: "Hentai", count: "9,826" },
  { name: "BBW", count: "20,000+" },
  { name: "Hardcore", count: "20,000+" },
  { name: "Threesome", count: "20,000+" },
  { name: "Latina", count: "20,000+" },
  { name: "Big Dick", count: "20,000+" },
  { name: "Pornstar", count: "20,000+" },
  { name: "Double Penetration", count: "20,000+" },
  { name: "Vintage", count: "20,000+" },
  { name: "Group Sex", count: "20,000+" },
  { name: "Blowjob", count: "20,000+" },
  { name: "Cumshot", count: "20,000+" },
  { name: "Masturbation", count: "20,000+" },
  { name: "Students", count: "20,000+", query: "college student" },
  { name: "Blonde", count: "20,000+" },
  { name: "Petite", count: "20,000+" },
  { name: "Orgy", count: "20,000+" },
  { name: "Webcam", count: "20,000+" },
  { name: "Office", count: "20,000+" },
  { name: "BDSM", count: "16,802" },
  { name: "Public", count: "20,000+" },
  { name: "Brunette", count: "20,000+" },
  { name: "Older Men", count: "20,000+" },
  { name: "Massage", count: "20,000+" },
  { name: "Lingerie", count: "20,000+" },
  { name: "Toys", count: "20,000+", query: "sex toys" },
  { name: "Hotel", count: "20,000+" },
  { name: "Fat", count: "20,000+", query: "chubby" },
  { name: "Outdoor", count: "20,000+" },
  { name: "Squirt", count: "20,000+" },
  { name: "Fetish", count: "20,000+" },
  { name: "Redhead", count: "20,000+" },
  { name: "Housewives", count: "20,000+", query: "housewife" },
  { name: "Sleep", count: "20,000+", query: "sleeping" },
  { name: "Small Tits", count: "20,000+" },
  { name: "Swinger", count: "20,000+" },
  { name: "Bukkake", count: "15,680" },
  { name: "Uniform", count: "20,000+" },
  { name: "Striptease", count: "20,000+" },
  { name: "Bondage", count: "17,146" },
  { name: "For Women", count: "20,000+", query: "romantic passionate" },
  { name: "Nurses", count: "20,000+", query: "nurse" },
  { name: "Handjob", count: "14,981" },
  { name: "Fisting", count: "20,000+" },
  { name: "HQ Porn", count: "20,000+", query: "4k" },
  { name: "Bisexual", count: "20,000+" },
  { name: "HD Sex", count: "20,000+", query: "hd" },
  { name: "Footjob", count: "14,981" },
  { name: "ASMR", count: "20,000+" },
  { name: "Doctor", count: "12,580" },
];

const usedThumbs = new Set<string>();

async function fetchCategoryThumb(cat: Category): Promise<string | null> {
  const cacheKey = `cat_thumb_v1_${cat.name}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      usedThumbs.add(cached);
      return cached;
    }
  } catch {}

  const searchTerm = cat.query || cat.name;

  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=8&thumbsize=big&order=top-rated&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        // Pick a thumbnail not already used by another category card
        const uniqueVideo =
          data.videos.find(
            (v: { default_thumb?: { src?: string } }) =>
              v.default_thumb?.src && !usedThumbs.has(v.default_thumb.src)
          ) || data.videos[0];

        const imgUrl: string | null = uniqueVideo?.default_thumb?.src || null;
        if (imgUrl) {
          usedThumbs.add(imgUrl);
          try {
            sessionStorage.setItem(cacheKey, imgUrl);
          } catch {}
          return imgUrl;
        }
      }
    }
  } catch {}

  return null;
}

function CategoryCard({ cat }: { cat: Category }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px' }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let active = true;

    fetchCategoryThumb(cat).then((url) => {
      if (active && url) setImgSrc(url);
    });

    return () => {
      active = false;
    };
  }, [isVisible, cat]);

  return (
    <Link
      ref={cardRef}
      href={`/?q=${encodeURIComponent(cat.name)}`}
      className="block group"
    >
      <div className="relative rounded-3xl overflow-hidden aspect-square bg-[#1a1a1a]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={cat.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-[#222] animate-pulse flex items-center justify-center text-xs text-neutral-500">
            Loading...
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <p className="text-white text-center font-semibold text-lg">{cat.name}</p>
          <p className="text-[#FF9900] text-center text-sm mt-1">{cat.count} Videos</p>
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] p-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => window.history.back()} className="text-3xl text-[#FF9900]">←</button>
        <h1 className="text-2xl font-bold text-[#FF9900]">Categories</h1>
      </header>

      <div className="p-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categoriesList.map((cat) => (
            <CategoryCard key={cat.name} cat={cat} />
          ))}
        </div>
      </div>
    </div>
  );
}
