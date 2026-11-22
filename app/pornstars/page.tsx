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

interface WikiPage {
  title?: string;
  description?: string;
  thumbnail?: { source?: string };
}

interface WikiBatchResponse {
  query?: {
    normalized?: Array<{ from: string; to: string }>;
    redirects?: Array<{ from: string; to: string }>;
    pages?: Record<string, WikiPage>;
  };
}

// Fetch Wikipedia portraits in batches of 35 (only 2 total HTTP requests for all 63 stars)
async function fetchWikiPortraitsBatch(names: string[]): Promise<Record<string, string>> {
  const found: Record<string, string> = {};
  const chunkSize = 35;

  for (let i = 0; i < names.length; i += chunkSize) {
    const chunk = names.slice(i, i + chunkSize);
    const titles = chunk.join('|');
    try {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=pageimages|description&piprop=thumbnail&pithumbsize=400&redirects=1&format=json&origin=*`
      );
      if (!res.ok) continue;
      const data: WikiBatchResponse = await res.json();
      const pages = data.query?.pages || {};
      const redirectMap: Record<string, string> = {};

      (data.query?.redirects || []).forEach((r) => {
        redirectMap[r.to] = r.from;
      });

      Object.values(pages).forEach((page) => {
        const img = page.thumbnail?.source;
        if (!img || !page.title) return;

        const desc = (page.description || '').toLowerCase();
        const isPerformer =
          !desc ||
          desc.includes('porn') ||
          desc.includes('adult') ||
          desc.includes('erotic') ||
          desc.includes('actress') ||
          desc.includes('actor') ||
          desc.includes('model') ||
          desc.includes('media personality');

        if (!isPerformer) return;

        const originalName = redirectMap[page.title] || page.title;
        found[originalName.toLowerCase()] = img;
        found[page.title.toLowerCase()] = img;
      });
    } catch {
      // Ignore batch error and let fallback API handle missing ones
    }
  }

  return found;
}

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

    if (activeStarFetches < 5) {
      run();
    } else {
      starQueue.push(run);
    }
  });
}

async function fetchFallbackStarThumbs(name: string): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(`/api/thumb?q=${encodeURIComponent(name)}&type=star`, {
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data: { thumbs?: string[] } = await res.json();
    return Array.isArray(data.thumbs) ? data.thumbs : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function PornstarCard({
  star,
  wikiThumb,
  wikiReady,
}: {
  star: Pornstar;
  wikiThumb?: string;
  wikiReady: boolean;
}) {
  const [candidates, setCandidates] = useState<string[]>([]);
  const [idx, setIdx] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);
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
      { rootMargin: '300px' }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (wikiThumb) {
      setCandidates([wikiThumb]);
      setIdx(0);
      setDone(true);
    }
  }, [wikiThumb]);

  useEffect(() => {
    if (!isVisible || !wikiReady || wikiThumb) return;
    let active = true;

    const cacheKey = `star_thumb_v3_${star.name}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setCandidates([cached]);
        setDone(true);
        return;
      }
    } catch {
      // Ignore storage errors
    }

    enqueueStarFetch(() => fetchFallbackStarThumbs(star.name)).then((thumbs) => {
      if (!active) return;
      if (thumbs.length > 0) {
        setCandidates(thumbs);
        try {
          sessionStorage.setItem(cacheKey, thumbs[0]);
        } catch {
          // Ignore storage errors
        }
      }
      setDone(true);
    });

    return () => {
      active = false;
    };
  }, [isVisible, wikiReady, wikiThumb, star.name]);

  const currentImg = candidates[idx];

  return (
    <div ref={cardRef}>
      <Link href={`/?q=${encodeURIComponent(star.name)}`} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-[#1a1a1a]">
          {currentImg ? (
            <img
              src={currentImg}
              alt={star.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setIdx((prev) => prev + 1)}
              className="w-full aspect-[4/3] object-cover object-top group-hover:scale-105 transition"
            />
          ) : done ? (
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
  const [wikiMap, setWikiMap] = useState<Record<string, string>>({});
  const [wikiReady, setWikiReady] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const allNames = pornstarsList.map((s) => s.name);

    fetchWikiPortraitsBatch(allNames).then((result) => {
      if (!active) return;
      setWikiMap(result);
      setWikiReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-4xl font-bold text-[#FF9900] mb-8 text-center">PORNSTARS</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {pornstarsList.map((star) => (
          <PornstarCard
            key={star.name}
            star={star}
            wikiThumb={wikiMap[star.name.toLowerCase()]}
            wikiReady={wikiReady}
          />
        ))}
      </div>
    </div>
  );
}
