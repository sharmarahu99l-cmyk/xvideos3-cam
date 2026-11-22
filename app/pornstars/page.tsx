'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Pornstar {
  name: string;
  count: string;
}

const pornstarsList: Pornstar[] = [
  { name: "Angela White", count: "695 Videos" },
  { name: "Riley Reid", count: "962 Videos" },
  { name: "Violet Myers", count: "779 Videos" },
  { name: "Dani Daniels", count: "378 Videos" },
  { name: "Ava Addams", count: "241 Videos" },
  { name: "Lana Rhoades", count: "744 Videos" },
  { name: "Abella Danger", count: "866 Videos" },
  { name: "Lauren Phillips", count: "1555 Videos" },
  { name: "Cory Chase", count: "1414 Videos" },
  { name: "Mia Khalifa", count: "1214 Videos" },
  { name: "Lena Paul", count: "434 Videos" },
  { name: "Valentina Nappi", count: "199 Videos" },
  { name: "Brandi Love", count: "492 Videos" },
  { name: "Natasha Nice", count: "24 Videos" },
  { name: "Adriana Chechik", count: "1305 Videos" },
  { name: "Savannah Bond", count: "541 Videos" },
  { name: "Lisa Ann", count: "563 Videos" },
  { name: "Manuel Ferrara", count: "518 Videos" },
  { name: "Mia Malkova", count: "253 Videos" },
  { name: "Alexis Fawx", count: "594 Videos" },
  { name: "Sara Jay", count: "475 Videos" },
  { name: "Yorgelis Carrillo", count: "2047 Videos" },
  { name: "Aidra Fox", count: "3278 Videos" },
  { name: "Blake Blossom", count: "750 Videos" },
  { name: "Little Caprice", count: "172 Videos" },
  { name: "Nicole Aniston", count: "359 Videos" },
  { name: "Cherie DeVille", count: "615 Videos" },
  { name: "Alexis Texas", count: "388 Videos" },
  { name: "Melody Marks", count: "354 Videos" },
  { name: "Kendra Lust", count: "22 Videos" },
  { name: "Mandy Muse", count: "173 Videos" },
  { name: "Lulu Chu", count: "344 Videos" },
  { name: "Kenzie Reeves", count: "381 Videos" },
  { name: "Jennifer White", count: "412 Videos" },
  { name: "Abigaiil Morris", count: "327 Videos" },
  { name: "Emily Willis", count: "562 Videos" },
  { name: "Dee Williams", count: "604 Videos" },
  { name: "Jane Wilde", count: "351 Videos" },
  { name: "Alyx Star", count: "256 Videos" },
  { name: "Maria Nagai", count: "95 Videos" },
  { name: "Kelsi Monroe", count: "289 Videos" },
  { name: "Alex Coal", count: "61 Videos" },
  { name: "Lexi Luna", count: "27 Videos" },
  { name: "Payton Preslee", count: "431 Videos" },
  { name: "Syren De Mer", count: "364 Videos" },
  { name: "Johnny Love", count: "104 Videos" },
  { name: "Alexandra Cat", count: "1147 Videos" },
  { name: "Gabbie Carter", count: "362 Videos" },
  { name: "Hazel Moore", count: "240 Videos" },
  { name: "Skylar Vox", count: "763 Videos" },
  { name: "Bridgette B", count: "339 Videos" },
  { name: "Damion Dayski", count: "482 Videos" },
  { name: "Jada Stevens", count: "747 Videos" },
  { name: "Julia Ann", count: "337 Videos" },
  { name: "Phoenix Marie", count: "14 Videos" },
  { name: "Anissa Kate", count: "782 Videos" },
  { name: "Johnny Sins", count: "398 Videos" },
  { name: "Chanel Preston", count: "544 Videos" },
  { name: "Alura Jenson", count: "240 Videos" },
  { name: "Reagan Foxx", count: "609 Videos" },
  { name: "Eliza Ibarra", count: "313 Videos" },
  { name: "Ariella Ferrera", count: "263 Videos" },
  { name: "Mick Blue", count: "598 Videos" },
];

// Simple queue so we only run 3 requests at a time (prevents API rate-limiting)
let activeStarFetches = 0;
const starQueue: Array<() => void> = [];

function enqueueStarFetch<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeStarFetches++;
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeStarFetches--;
          const next = starQueue.shift();
          if (next) next();
        });
    };

    if (activeStarFetches < 3) {
      run();
    } else {
      starQueue.push(run);
    }
  });
}

async function fetchRealStarImage(name: string): Promise<string | null> {
  const cacheKey = `star_thumb_v2_${name}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {}

  let imgUrl: string | null = null;

  // 1. Try Wikipedia REST API for a verified performer portrait
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, '_'))}`
    );
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const bio = `${wikiData.description || ''} ${wikiData.extract || ''}`.toLowerCase();
      const isPerformer =
        bio.includes('porn') ||
        bio.includes('adult') ||
        bio.includes('erotic') ||
        bio.includes('actress') ||
        bio.includes('actor') ||
        bio.includes('model');

      if (wikiData.type === 'standard' && isPerformer && wikiData.thumbnail?.source) {
        imgUrl = wikiData.thumbnail.source as string;
      }
    }
  } catch {}

  // 2. Fallback to Eporner API matched specifically to this performer's name
  if (!imgUrl) {
    try {
      const epRes = await fetch(
        `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(name)}&per_page=5&thumbsize=big&format=json`
      );
      if (epRes.ok) {
        const epData = await epRes.json();
        if (Array.isArray(epData.videos) && epData.videos.length > 0) {
          const exactMatch = epData.videos.find((v: { title?: string }) =>
            v.title?.toLowerCase().includes(name.toLowerCase())
          );
          const chosen = exactMatch || epData.videos[0];
          imgUrl = chosen?.default_thumb?.src || null;
        }
      }
    } catch {}
  }

  if (imgUrl) {
    try {
      sessionStorage.setItem(cacheKey, imgUrl);
    } catch {}
  }

  return imgUrl;
}

function PornstarCard({ star }: { star: Pornstar }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let active = true;

    enqueueStarFetch(() => fetchRealStarImage(star.name)).then((url) => {
      if (!active) return;
      if (url) {
        setImgSrc(url);
      } else {
        setFailed(true);
      }
    });

    return () => {
      active = false;
    };
  }, [isVisible, star.name]);

  return (
    <div ref={cardRef}>
      <Link href={`/?q=${encodeURIComponent(star.name)}`} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-[#1a1a1a]">
          {imgSrc && !failed ? (
            <img
              src={imgSrc}
              alt={star.name}
              loading="lazy"
              onError={() => setFailed(true)}
              className="w-full aspect-[4/3] object-cover object-top group-hover:scale-105 transition"
            />
          ) : failed ? (
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#262626] to-[#111] flex items-center justify-center text-3xl font-bold text-[#FF9900]/70">
              {star.name.charAt(0)}
            </div>
          ) : (
            <div className="w-full aspect-[4/3] bg-[#222] animate-pulse" />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
            <p className="font-bold text-lg">{star.name}</p>
            <p className="text-[#FF9900] text-sm">{star.count}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function PornstarsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-4xl font-bold text-[#FF9900] mb-8 text-center">PORNSTARS</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {pornstarsList.map((star) => (
          <PornstarCard key={star.name} star={star} />
        ))}
      </div>
    </div>
  );
}
